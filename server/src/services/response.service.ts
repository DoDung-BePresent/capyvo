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

const PART1_READ_ALOUD_PROMPT = `You are a TOEIC speaking coach evaluating a read-aloud task (Part 1). The student must read the reference text exactly as written.

Reference text (what the student MUST read): {REFERENCE}
Student's actual reading (transcript): {TRANSCRIPT}

Return a JSON object (no markdown) with this exact shape:
{
  "score": <0-{MAX_SCORE} number with 1 decimal place, overall reading accuracy on the {MAX_SCORE}-point scale>,
  "criteria": {
    "accuracy": <0-100, percentage of words read exactly as written>,
    "vocabulary": <0-100, always 100 for Part 1 since vocabulary choice is not evaluated>,
    "grammar": <0-100, always 100 for Part 1 since grammar is not evaluated>,
    "fluency": <0-100, smoothness and natural pace of reading>
  },
  "issues": [
    {
      "category": <"omission"|"addition"|"morphology"|"pronunciation"|"substitution"|"order">,
      "original": <word(s) from reference text — copy verbatim>,
      "spoken": <word(s) as they appear in the transcript — copy verbatim>,
      "note": <short explanation in Vietnamese, max 12 words>
    }
  ],
  "summary": <1-2 sentences feedback in Vietnamese about reading accuracy>
}

CRITICAL RULES for Part 1 (Read Aloud):
1. The "score" field must be between 0 and {MAX_SCORE} (e.g., 2.5 for a 3-point scale). Do NOT return 0-100.
2. This is a READ ALOUD task — the student must read the reference text EXACTLY. Do NOT suggest improvements or additions.
3. ONLY flag errors where the student deviated from the reference text.
4. Do NOT flag omissions of words that are NOT in the reference text.
5. Do NOT suggest the student should have said something that is NOT in the reference text.
6. IGNORE capitalization entirely. "city hall" and "City Hall" are IDENTICAL.
7. IGNORE minor punctuation differences (commas, apostrophes).
8. "spoken" must be copied CHARACTER-FOR-CHARACTER from the transcript.
9. "original" must be copied CHARACTER-FOR-CHARACTER from the reference text.
10. NUMBERS AND SYMBOLS: Accept natural spoken forms. Examples:
    - "$15" can be read as "fifteen dollars" or "dollar fifteen" — BOTH ARE CORRECT
    - "15" can be read as "fifteen" — CORRECT
    - "1st" can be read as "first" — CORRECT
    - "&" can be read as "and" — CORRECT
    - "%" can be read as "percent" — CORRECT
    - Do NOT flag these as pronunciation errors unless the number itself is wrong (e.g., "fifteen" for "50")
11. DATES: Accept multiple formats:
    - "Saturday and Sunday" = "Saturday, Sunday" = "Saturday & Sunday" — ALL CORRECT
    - "next Saturday" = "this Saturday" if contextually equivalent — CORRECT

Category rules:
- omission: student skipped a word that IS in the reference. "spoken" = surrounding phrase from transcript for UI anchoring.
- addition: student added a word that is NOT in the reference. "spoken" = the extra word(s) verbatim from transcript.
- morphology: wrong word form (dollar→dollars, is→are). "spoken" = wrong word verbatim from transcript.
- pronunciation: number/symbol read differently (15→fifteen, $→dollar). "spoken" = wrong form verbatim from transcript.
- substitution: different word with different meaning. "spoken" = what was said verbatim from transcript.
- order: words said in wrong order. "original" = correct phrase from reference. "spoken" = swapped phrase verbatim from transcript.

Scoring guidelines for Part 1:
- Perfect reading (0-2 minor errors): {MAX_SCORE} points
- Good reading (3-5 errors): 70-80% of {MAX_SCORE}
- Fair reading (6-10 errors): 50-70% of {MAX_SCORE}
- Poor reading (>10 errors): below 50% of {MAX_SCORE}

If the student read perfectly, return empty issues array and score {MAX_SCORE}.`

const ANALYSIS_PROMPT = `You are a TOEIC speaking coach. Compare the reference text and the student's transcript.

Reference text: {REFERENCE}
Student transcript: {TRANSCRIPT}{IMAGE_CONTEXT_BLOCK}

Return a JSON object (no markdown) with this exact shape:
{
  "score": <0-{MAX_SCORE} number with 1 decimal place, overall score on the {MAX_SCORE}-point scale>,
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

CRITICAL: The "score" field must be a number between 0 and {MAX_SCORE} (e.g., 2.5 for a {MAX_SCORE}-point scale). Do NOT return a 0-100 score.

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

Only include real issues. If the student read perfectly, return empty issues array and score {MAX_SCORE}.`

const IMAGE_DESCRIPTION_PROMPT = `You are a TOEIC speaking coach. The student was asked to describe an image aloud.

Image content: {IMAGE_CONTEXT}
Student's spoken response: {TRANSCRIPT}

Evaluate how well the student described the image. Return a JSON object (no markdown) with this exact shape:
{
  "score": <0-{MAX_SCORE} number with 1 decimal place, overall quality score on the {MAX_SCORE}-point scale>,
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

CRITICAL: The "score" field must be a number between 0 and {MAX_SCORE} (e.g., 2.5 for a {MAX_SCORE}-point scale). Do NOT return a 0-100 score.

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
  private async checkSubscriptionAccess(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true, premiumUntil: true },
    })

    if (!user) {
      throw new ForbiddenError('User not found')
    }

    const now = new Date()
    const hasAccess = user.isPremium && user.premiumUntil && user.premiumUntil > now

    if (!hasAccess) {
      throw new ForbiddenError('subscription_expired')
    }
  }

  async checkUserSubscription(userId: string): Promise<{
    hasAccess: boolean
    isPremium: boolean
    daysRemaining: number | null
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isPremium: true,
        premiumUntil: true,
      },
    })

    if (!user) {
      throw new ForbiddenError('User not found')
    }

    const now = new Date()
    const hasAccess = user.isPremium && user.premiumUntil && user.premiumUntil > now

    let daysRemaining = null
    if (user.premiumUntil) {
      const diff = user.premiumUntil.getTime() - now.getTime()
      daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24))
    }

    return {
      hasAccess: hasAccess || false,
      isPremium: user.isPremium,
      daysRemaining: daysRemaining,
    }
  }

  async saveAudio(
    sessionId: string,
    questionId: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<{ audioUrl: string; responseId: string }> {
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

    // Always create new response for each practice attempt
    const response = await prisma.userResponse.create({
      data: { sessionId, questionId, audioUrl: publicUrl },
    })

    return { audioUrl: publicUrl, responseId: response.id }
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

    // 2. Check subscription access
    await this.checkSubscriptionAccess(userId)

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

    // 5. Save transcript
    await prisma.userResponse.update({
      where: { id: responseId },
      data: { transcript },
    })

    return transcript
  }

  async analyzeResponse(
    responseId: string,
    userId: string,
    partNumber: number,
  ): Promise<AnalysisResult> {
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

    // 2. Check subscription access
    await this.checkSubscriptionAccess(userId)

    // 3. Determine score scale based on part number
    const maxScore = partNumber === 5 ? 5 : 3

    // 4. Build prompt — use Part 1 specific prompt for read-aloud, general prompt for others
    let prompt: string
    if (partNumber === 1 && referenceText) {
      // Part 1: Read aloud - strict comparison with reference
      prompt = PART1_READ_ALOUD_PROMPT.replace('{REFERENCE}', referenceText)
        .replace('{TRANSCRIPT}', response.transcript)
        .replace(/{MAX_SCORE}/g, maxScore.toString())
    } else if (referenceText) {
      // Other parts with reference text
      const imageContextBlock = imageContext ? `\nImage context: ${imageContext}` : ''
      prompt = ANALYSIS_PROMPT.replace('{REFERENCE}', referenceText)
        .replace('{TRANSCRIPT}', response.transcript)
        .replace('{IMAGE_CONTEXT_BLOCK}', imageContextBlock)
        .replace(/{MAX_SCORE}/g, maxScore.toString())
    } else {
      // Image description mode
      prompt = IMAGE_DESCRIPTION_PROMPT.replace('{IMAGE_CONTEXT}', imageContext!)
        .replace('{TRANSCRIPT}', response.transcript)
        .replace(/{MAX_SCORE}/g, maxScore.toString())
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    const analysis = JSON.parse(raw) as AnalysisResult

    // 5. Save analysis
    await prisma.userResponse.update({
      where: { id: responseId },
      data: { pronunciationScore: analysis as object },
    })

    return analysis
  }

  async transcribeAndAnalyze(
    responseId: string,
    userId: string,
    partNumber: number,
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

    // 2. Check subscription access FIRST — fail fast before doing any work
    await this.checkSubscriptionAccess(userId)

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

    // 4. Determine score scale based on part number
    const maxScore = partNumber === 5 ? 5 : 3

    // 5. Analyze — switch prompt based on question type and part number
    let prompt: string
    if (partNumber === 1 && referenceText) {
      // Part 1: Read aloud - strict comparison with reference
      prompt = PART1_READ_ALOUD_PROMPT.replace('{REFERENCE}', referenceText)
        .replace('{TRANSCRIPT}', transcript)
        .replace(/{MAX_SCORE}/g, maxScore.toString())
    } else if (referenceText) {
      // Other parts with reference text
      const imageContextBlock = imageContext ? `\nImage context: ${imageContext}` : ''
      prompt = ANALYSIS_PROMPT.replace('{REFERENCE}', referenceText)
        .replace('{TRANSCRIPT}', transcript)
        .replace('{IMAGE_CONTEXT_BLOCK}', imageContextBlock)
        .replace(/{MAX_SCORE}/g, maxScore.toString())
    } else {
      // Image description mode
      prompt = IMAGE_DESCRIPTION_PROMPT.replace('{IMAGE_CONTEXT}', imageContext!)
        .replace('{TRANSCRIPT}', transcript)
        .replace(/{MAX_SCORE}/g, maxScore.toString())
    }
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      response_format: { type: 'json_object' },
    })
    const raw = completion.choices[0]?.message?.content ?? '{}'
    const analysis = JSON.parse(raw) as AnalysisResult

    // 6. Save transcript + analysis
    await prisma.userResponse.update({
      where: { id: responseId },
      data: { transcript, pronunciationScore: analysis as object },
    })

    return { transcript, analysis }
  }

  async getQuestionHistory(questionId: string, userId: string) {
    const responses = await prisma.userResponse.findMany({
      where: {
        questionId,
        session: { userId },
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
