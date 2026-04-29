import OpenAI from 'openai'
import supabaseAdmin from '@/lib/supabase'
import prisma from '@/lib/prisma'
import { ForbiddenError } from '@/errors/app-error'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScoringCriteria {
  accuracy: number
  vocabulary: number
  grammar: number
  fluency: number
}

export interface AnalysisIssue {
  category: 'omission' | 'addition' | 'morphology' | 'pronunciation' | 'substitution' | 'order'
  original: string // word(s) from reference text
  spoken: string // what was transcribed
  note: string // short explanation in Vietnamese
}

export interface AnalysisResult {
  score: number // 0–100
  criteria: ScoringCriteria
  issues: AnalysisIssue[]
  summary: string // 1-2 sentence feedback in Vietnamese
}

const ANALYSIS_PROMPT = `You are a TOEIC speaking coach. Compare the reference text and the student's transcript.

Reference text: {REFERENCE}
Student transcript: {TRANSCRIPT}{IMAGE_CONTEXT_BLOCK}

Return a JSON object (no markdown) with this exact shape:
{
  "score": <0-100 integer, overall reading accuracy>,
  "criteria": {
    "accuracy": <0-100, how many words were read exactly as written>,
    "vocabulary": <0-100, correct word choice, penalize substitutions>,
    "grammar": <0-100, correct word forms, penalize morphology and order errors>,
    "fluency": <0-100, completeness of reading, penalize omissions and additions>
  },
  "issues": [
    {
      "category": <"omission"|"addition"|"morphology"|"pronunciation"|"substitution"|"order">,
      "original": <word(s) from reference — copy verbatim>,
      "spoken": <word(s) as they appear in the transcript — copy verbatim>,
      "note": <short explanation in Vietnamese, max 12 words>
    }
  ],
  "summary": <1-2 sentences feedback in Vietnamese>
}

Category rules:
- omission: student skipped a word. "spoken" = the 2-3 word phrase from the transcript surrounding the gap (for UI anchoring).
- addition: student added a word not in reference. "spoken" = the extra word(s) verbatim from transcript.
- morphology: wrong word form (dollar→dollars, is→are, go→went). "spoken" = wrong word verbatim from transcript.
- pronunciation: number/symbol read differently (15→fifteen, $→dollar, &→and, 1st→first). "spoken" = wrong form verbatim from transcript.
- substitution: different word/phrase with different meaning. "spoken" = what was said verbatim from transcript.
- order: words said in wrong order (e.g. "Sunday and Saturday" instead of "Saturday and Sunday"). "original" = correct phrase from reference. "spoken" = swapped phrase verbatim from transcript.

Critical rules — ALWAYS obey:
1. IGNORE capitalization entirely. "city hall" and "City Hall" are IDENTICAL — do NOT flag this as an error. Ever.
2. IGNORE minor punctuation differences (commas, apostrophes in contractions like we'd vs we would).
3. "spoken" must be copied CHARACTER-FOR-CHARACTER from the transcript. Never rephrase or normalize.
4. "original" must be copied CHARACTER-FOR-CHARACTER from the reference text.
5. Detect word ORDER swaps — if the student said words in wrong sequence, flag as "order" category.

Only include real issues. If the student read perfectly, return empty issues array and score 100.`

const IMAGE_DESCRIPTION_PROMPT = `You are a TOEIC speaking coach. The student was asked to describe an image aloud.

Image content: {IMAGE_CONTEXT}
Student's spoken response: {TRANSCRIPT}

Evaluate how well the student described the image. Return a JSON object (no markdown) with this exact shape:
{
  "score": <0-100 integer, overall quality of the description>,
  "criteria": {
    "accuracy": <0-100, how accurately they described what is actually visible in the image>,
    "vocabulary": <0-100, appropriateness and richness of descriptive vocabulary>,
    "grammar": <0-100, grammatical correctness of sentences>,
    "fluency": <0-100, completeness and natural flow of the response>
  },
  "issues": [
    {
      "category": <"morphology"|"substitution"|"addition">,
      "original": <what should have been said or the correct form>,
      "spoken": <exact word(s) as spoken — copy verbatim from transcript>,
      "note": <short explanation in Vietnamese, max 12 words>
    }
  ],
  "summary": <1-2 sentences feedback in Vietnamese about the overall description quality>
}

Category rules:
- morphology: grammatical form error (wrong tense, missing plural, wrong article). "spoken" = the incorrect word verbatim from transcript.
- substitution: student described something inaccurately or used clearly wrong word for what is shown. "spoken" = exact word from transcript.
- addition: student mentioned something that is clearly NOT visible in the image. "spoken" = the invented word/phrase verbatim from transcript.

Critical rules:
1. Do NOT flag omissions — students are not expected to mention every single thing in the image.
2. Do NOT flag personal opinions or subjective interpretations as errors.
3. "spoken" must be copied CHARACTER-FOR-CHARACTER from the transcript. Never rephrase.
4. IGNORE capitalization.
5. Only flag clear, objective errors. Be lenient with paraphrasing.

If the description is good, return empty issues array and a high score.`

class ResponseService {
  async saveAudio(
    sessionId: string,
    questionId: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'webm'
    const filename = `${Date.now()}-${questionId}.${ext}`
    const storagePath = `responses/${filename}`

    const { error } = await supabaseAdmin.storage
      .from('audio')
      .upload(storagePath, buffer, { contentType: mimeType, upsert: false })

    if (error) throw new Error(`Storage upload failed: ${error.message}`)

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from('audio').getPublicUrl(storagePath)

    await prisma.userResponse.upsert({
      where: { sessionId_questionId: { sessionId, questionId } },
      create: { sessionId, questionId, audioUrl: publicUrl },
      update: { audioUrl: publicUrl },
    })

    return publicUrl
  }

  async transcribeResponse(responseId: string, userId: string): Promise<string> {
    // 1. Verify response belongs to this user and get audioUrl
    const response = await prisma.userResponse.findFirst({
      where: { id: responseId, session: { userId } },
      select: {
        id: true,
        audioUrl: true,
        transcript: true,
        session: { select: { userId: true } },
      },
    })
    if (!response?.audioUrl) throw new ForbiddenError('Response not found or has no audio')

    // If already transcribed, return cached result
    if (response.transcript) return response.transcript

    // 2. Check credits (server-side gate — no Whisper call if 0 credits)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { transcriptionCredits: true },
    })
    if (!user || user.transcriptionCredits <= 0) {
      throw new ForbiddenError('no_credits')
    }

    // 3. Download audio from Supabase Storage
    const urlPath = new URL(response.audioUrl).pathname
    // pathname is like /storage/v1/object/public/audio/responses/...
    const storagePath = urlPath.replace(/^.*\/audio\//, '')
    const { data: fileData, error } = await supabaseAdmin.storage
      .from('audio')
      .download(storagePath)
    if (error || !fileData) throw new Error(`Failed to download audio: ${error?.message}`)

    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const ext = response.audioUrl.split('.').pop() ?? 'webm'
    const file = new File([buffer], `audio.${ext}`, { type: `audio/${ext}` })

    // 4. Call Whisper
    const result = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file,
      language: 'en',
    })
    const transcript = result.text

    // 5. Atomic: decrement credit + save transcript
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { transcriptionCredits: { decrement: 1 } },
      }),
      prisma.userResponse.update({
        where: { id: responseId },
        data: { transcript },
      }),
    ])

    return transcript
  }

  async analyzeResponse(responseId: string, userId: string): Promise<AnalysisResult> {
    // 1. Verify + get transcript and reference text
    const response = await prisma.userResponse.findFirst({
      where: { id: responseId, session: { userId } },
      select: {
        id: true,
        transcript: true,
        pronunciationScore: true,
        question: {
          select: { contentText: true, questionText: true, imageContext: true },
        },
      },
    })
    if (!response) throw new ForbiddenError('Response not found')
    if (!response.transcript) throw new ForbiddenError('Transcribe the audio first')

    // Return cached analysis if exists
    if (response.pronunciationScore) {
      return response.pronunciationScore as unknown as AnalysisResult
    }

    const referenceText = response.question.contentText ?? response.question.questionText
    const { imageContext } = response.question
    if (!referenceText && !imageContext)
      throw new ForbiddenError('No reference text for this question type')

    // 2. Check credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { transcriptionCredits: true },
    })
    if (!user || user.transcriptionCredits <= 0) {
      throw new ForbiddenError('no_credits')
    }

    // 3. Build prompt — use image description mode when there is no script reference
    let prompt: string
    if (referenceText) {
      const imageContextBlock = imageContext ? `\nImage context: ${imageContext}` : ''
      prompt = ANALYSIS_PROMPT.replace('{REFERENCE}', referenceText)
        .replace('{TRANSCRIPT}', response.transcript)
        .replace('{IMAGE_CONTEXT_BLOCK}', imageContextBlock)
    } else {
      prompt = IMAGE_DESCRIPTION_PROMPT.replace('{IMAGE_CONTEXT}', imageContext!).replace(
        '{TRANSCRIPT}',
        response.transcript,
      )
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    const analysis = JSON.parse(raw) as AnalysisResult

    // 4. Atomic: decrement credit + save analysis
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { transcriptionCredits: { decrement: 1 } },
      }),
      prisma.userResponse.update({
        where: { id: responseId },
        data: { pronunciationScore: analysis as object },
      }),
    ])

    return analysis
  }

  async transcribeAndAnalyze(
    responseId: string,
    userId: string,
  ): Promise<{ transcript: string; analysis: AnalysisResult }> {
    // 1. Verify response and get audioUrl + reference text
    const response = await prisma.userResponse.findFirst({
      where: { id: responseId, session: { userId } },
      select: {
        id: true,
        audioUrl: true,
        transcript: true,
        pronunciationScore: true,
        question: { select: { contentText: true, questionText: true, imageContext: true } },
      },
    })
    if (!response?.audioUrl) throw new ForbiddenError('Response not found or has no audio')

    // Return both cached if already done
    if (response.transcript && response.pronunciationScore) {
      return {
        transcript: response.transcript,
        analysis: response.pronunciationScore as unknown as AnalysisResult,
      }
    }

    const referenceText = response.question.contentText ?? response.question.questionText
    const { imageContext } = response.question
    if (!referenceText && !imageContext)
      throw new ForbiddenError('No reference text for this question type')

    // 2. Check credits — only 1 needed for the combined action
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { transcriptionCredits: true },
    })
    if (!user || user.transcriptionCredits <= 0) throw new ForbiddenError('no_credits')

    // 3. Transcribe (use cached transcript if already exists)
    let transcript = response.transcript
    if (!transcript) {
      const urlPath = new URL(response.audioUrl).pathname
      const storagePath = urlPath.replace(/^.*\/audio\//, '')
      const { data: fileData, error } = await supabaseAdmin.storage
        .from('audio')
        .download(storagePath)
      if (error || !fileData) throw new Error(`Failed to download audio: ${error?.message}`)

      const arrayBuffer = await fileData.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const ext = response.audioUrl.split('.').pop() ?? 'webm'
      const file = new File([buffer], `audio.${ext}`, { type: `audio/${ext}` })

      const whisperResult = await openai.audio.transcriptions.create({
        model: 'whisper-1',
        file,
        language: 'en',
      })
      transcript = whisperResult.text
    }

    // 4. Analyze — switch prompt based on question type
    let prompt: string
    if (referenceText) {
      const imageContextBlock = imageContext ? `\nImage context: ${imageContext}` : ''
      prompt = ANALYSIS_PROMPT.replace('{REFERENCE}', referenceText)
        .replace('{TRANSCRIPT}', transcript)
        .replace('{IMAGE_CONTEXT_BLOCK}', imageContextBlock)
    } else {
      prompt = IMAGE_DESCRIPTION_PROMPT.replace('{IMAGE_CONTEXT}', imageContext!).replace(
        '{TRANSCRIPT}',
        transcript,
      )
    }
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      response_format: { type: 'json_object' },
    })
    const raw = completion.choices[0]?.message?.content ?? '{}'
    const analysis = JSON.parse(raw) as AnalysisResult

    // 5. Atomic: decrement 1 credit + save transcript + save analysis
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { transcriptionCredits: { decrement: 1 } },
      }),
      prisma.userResponse.update({
        where: { id: responseId },
        data: { transcript, pronunciationScore: analysis as object },
      }),
    ])

    return { transcript, analysis }
  }

  async getQuestionHistory(questionId: string, userId: string) {
    const responses = await prisma.userResponse.findMany({
      where: {
        questionId,
        session: { userId, status: 'COMPLETED' },
      },
      select: {
        id: true,
        audioUrl: true,
        transcript: true,
        pronunciationScore: true,
        createdAt: true,
        session: {
          select: {
            id: true,
            completedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10, // Limit to 10 most recent attempts
    })

    return responses.map((r) => ({
      id: r.id,
      sessionId: r.session.id,
      audioUrl: r.audioUrl,
      transcript: r.transcript,
      pronunciationScore: r.pronunciationScore as unknown as AnalysisResult | null,
      completedAt: r.session.completedAt,
      createdAt: r.createdAt,
    }))
  }
}

export const responseService = new ResponseService()
