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

const IMAGE_DESCRIPTION_PROMPT = `You are a TOEIC speaking coach. The student was asked to describe an image aloud.

Image content: {IMAGE_CONTEXT}
Student's spoken response: {TRANSCRIPT}

IMPORTANT CONTEXT:
- Part 2: 30 seconds response time (approximately 80-100 words maximum)
- Part 4: 15 seconds response time (approximately 40-60 words maximum)
- Students CANNOT say more due to strict time limits
- Evaluate based on what they CAN achieve in the given time, not ideal length

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
1. Do NOT flag omissions — students are not expected to mention every single thing in the image due to time limits.
2. Do NOT penalize for brevity or lack of detail if the description covers key elements.
3. Do NOT suggest "adding more details" — time limits prevent this.
4. Do NOT flag personal opinions or subjective interpretations as errors.
5. "spoken" must be copied CHARACTER-FOR-CHARACTER from the transcript. Never rephrase.
6. IGNORE capitalization.
7. Only flag clear, objective errors. Be lenient with paraphrasing.
8. A concise, accurate description of main elements deserves a high score.

If the description accurately covers the main visible elements with good grammar, return high score even if brief.`

const PART35_QUESTION_RESPONSE_PROMPT = `You are a TOEIC speaking coach evaluating a Part 3 or Part 5 response. The student was asked to answer a question or express their opinion.

Question: {REFERENCE}
Student's spoken response: {TRANSCRIPT}

IMPORTANT CONTEXT - Time limits:
- Part 3 (Questions 1-6): 15 seconds response time (approximately 40-60 words maximum)
- Part 3 (Question 7): 30 seconds response time (approximately 80-100 words maximum)
- Part 5: 30 seconds response time (approximately 80-100 words maximum)
- Students CANNOT say more due to strict time limits
- Evaluate based on the actual length of the transcript and what is achievable in the time given

Evaluate the quality of the response. Return a JSON object (no markdown) with this exact shape:
{
  "score": <0-{MAX_SCORE} number with 1 decimal place, overall quality score on the {MAX_SCORE}-point scale>,
  "criteria": {
    "accuracy": <0-100, how well the response addresses the question and stays on topic>,
    "vocabulary": <0-100, range and appropriateness of vocabulary used>,
    "grammar": <0-100, grammatical correctness and sentence structure>,
    "fluency": <0-100, coherence, organization, and natural flow of ideas>
  },
  "issues": [
    {
      "category": <"morphology"|"grammar"|"vocabulary">,
      "original": <suggested correction or better alternative>,
      "spoken": <exact word(s)/phrase as spoken — copy verbatim from transcript>,
      "note": <short explanation in Vietnamese, max 12 words>
    }
  ],
  "summary": <1-2 sentences feedback in Vietnamese about the overall response quality>
}

CRITICAL RULES for Part 3 & 5 (Question Response):
1. The "score" field must be between 0 and {MAX_SCORE} (e.g., 2.5 for a 3-point scale, 3.5 for a 5-point scale). Do NOT return 0-100.
2. This is a QUESTION RESPONSE task — evaluate content quality, NOT whether they match a reference text.
3. Do NOT compare word-by-word with the question. The question is just the prompt, not a text to read or match.
4. JUDGE APPROPRIATENESS based on transcript length:
   - If transcript is 40-60 words: This is likely a 15-second response. Do NOT penalize for brevity.
   - If transcript is 80-100+ words: This is likely a 30-second response. Can expect more detail.
5. Do NOT suggest "expanding" or "adding more information" for short responses (40-60 words).
6. Focus on: relevance to question, vocabulary appropriateness, grammar accuracy, coherence within the given time.
7. "spoken" must be copied CHARACTER-FOR-CHARACTER from the transcript.
8. "original" should be a suggested improvement, not a "correct answer" (there is no single correct answer).
9. Be lenient with paraphrasing and different ways of expressing ideas.
10. A concise, clear, grammatically correct response that directly answers the question deserves a high score.

Category rules:
- morphology: grammatical form error (wrong tense, missing plural, wrong article, subject-verb agreement). "spoken" = incorrect phrase verbatim.
- grammar: sentence structure error (word order, missing words, run-on sentences, fragments). "spoken" = problematic phrase verbatim.
- vocabulary: inappropriate word choice, repetition, unclear expression, or unnatural phrasing. "spoken" = the word/phrase verbatim. "original" = better alternative.

Scoring guidelines (adjusted for time constraints):
- Excellent (90-100% of MAX_SCORE): Directly answers question, clear and grammatically correct, appropriate vocabulary, good flow. Length is appropriate for time limit.
- Good (70-89% of MAX_SCORE): Answers question, mostly clear, few minor errors, adequate vocabulary. May be brief but complete.
- Fair (50-69% of MAX_SCORE): Partially addresses question, some errors that don't prevent understanding, basic vocabulary.
- Poor (<50% of MAX_SCORE): Doesn't address question well, many errors that impede understanding, very limited vocabulary.

Be encouraging and realistic. A short but accurate, grammatically correct response is BETTER than a long response with many errors. Only flag significant errors that impact communication or clarity.`

export class ResponseService {
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

    // 4. Build prompt — select based on part number and question type
    let prompt: string
    if (partNumber === 1 && referenceText) {
      // Part 1: Read aloud - strict comparison with reference
      prompt = PART1_READ_ALOUD_PROMPT.replace('{REFERENCE}', referenceText)
        .replace('{TRANSCRIPT}', response.transcript)
        .replace(/{MAX_SCORE}/g, maxScore.toString())
    } else if ((partNumber === 3 || partNumber === 5) && referenceText) {
      // Part 3 & 5: Question/Opinion response - evaluate content quality
      prompt = PART35_QUESTION_RESPONSE_PROMPT.replace('{REFERENCE}', referenceText)
        .replace('{TRANSCRIPT}', response.transcript)
        .replace(/{MAX_SCORE}/g, maxScore.toString())
    } else if (imageContext) {
      // Image description mode (Part 2, 4)
      prompt = IMAGE_DESCRIPTION_PROMPT.replace('{IMAGE_CONTEXT}', imageContext)
        .replace('{TRANSCRIPT}', response.transcript)
        .replace(/{MAX_SCORE}/g, maxScore.toString())
    } else {
      throw new ForbiddenError('No reference text or image context for this question type')
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
    } else if ((partNumber === 3 || partNumber === 5) && referenceText) {
      // Part 3 & 5: Question/Opinion response - evaluate content quality
      prompt = PART35_QUESTION_RESPONSE_PROMPT.replace('{REFERENCE}', referenceText)
        .replace('{TRANSCRIPT}', transcript)
        .replace(/{MAX_SCORE}/g, maxScore.toString())
    } else if (imageContext) {
      // Image description mode (Part 2, 4)
      prompt = IMAGE_DESCRIPTION_PROMPT.replace('{IMAGE_CONTEXT}', imageContext)
        .replace('{TRANSCRIPT}', transcript)
        .replace(/{MAX_SCORE}/g, maxScore.toString())
    } else {
      throw new ForbiddenError('No reference text or image context for this question type')
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

  async generateOverallAssessment(sessionId: string, userId: string) {
    // Get session with all responses
    const session = await prisma.practiceSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        userResponses: {
          include: {
            question: {
              select: {
                partNumber: true,
                questionNumber: true,
              },
            },
          },
        },
      },
    })

    if (!session) throw new ForbiddenError('Session not found or access denied')

    // Collect all scores by part
    const scoresByPart: Record<number, number[]> = {}
    let totalScore = 0
    let totalResponses = 0

    for (const response of session.userResponses) {
      if (response.pronunciationScore) {
        const analysis = response.pronunciationScore as unknown as AnalysisResult
        const partNumber = response.question.partNumber
        if (!scoresByPart[partNumber]) scoresByPart[partNumber] = []
        scoresByPart[partNumber].push(analysis.score)
        totalScore += analysis.score
        totalResponses++
      }
    }

    if (totalResponses === 0) {
      return {
        estimatedScore: 0,
        assessment: 'Chưa có dữ liệu để đánh giá.',
        partScores: {},
      }
    }

    // Calculate average score (0-100)
    const averageScore = totalScore / totalResponses

    // Calculate part averages
    const partAverages: Record<number, number> = {}
    for (const [part, scores] of Object.entries(scoresByPart)) {
      partAverages[Number(part)] = scores.reduce((a, b) => a + b, 0) / scores.length
    }

    // Use AI to generate overall assessment and estimate TOEIC score
    const prompt = `You are a TOEIC Speaking test evaluator. Based on the following performance data, provide an overall assessment and estimate the TOEIC Speaking score (0-200).

Performance Data:
- Average Score: ${averageScore.toFixed(1)}/100
- Part 1 (Read Aloud): ${partAverages[1]?.toFixed(1) || 'N/A'}/100 (${scoresByPart[1]?.length || 0} questions)
- Part 2 (Describe Picture): ${partAverages[2]?.toFixed(1) || 'N/A'}/100 (${scoresByPart[2]?.length || 0} questions)
- Part 3 (Respond to Questions): ${partAverages[3]?.toFixed(1) || 'N/A'}/100 (${scoresByPart[3]?.length || 0} questions)
- Part 4 (Respond Using Information): ${partAverages[4]?.toFixed(1) || 'N/A'}/100 (${scoresByPart[4]?.length || 0} questions)
- Part 5 (Express Opinion): ${partAverages[5]?.toFixed(1) || 'N/A'}/100 (${scoresByPart[5]?.length || 0} questions)

Return a JSON object (no markdown) with this exact shape:
{
  "estimatedScore": <0-200 integer, estimated TOEIC Speaking score>,
  "assessment": <2-3 sentences in Vietnamese summarizing overall performance, strengths, and areas for improvement>
}

Scoring guidelines:
- 0-30: Very limited ability (0-30 TOEIC)
- 31-50: Limited ability (40-80 TOEIC)
- 51-70: Fair ability (90-130 TOEIC)
- 71-85: Good ability (140-170 TOEIC)
- 86-100: Excellent ability (180-200 TOEIC)`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    })

    const content = completion.choices[0]?.message?.content?.trim() || '{}'
    const result = JSON.parse(content)

    return {
      estimatedScore: result.estimatedScore || 0,
      assessment: result.assessment || 'Không thể tạo đánh giá.',
      partScores: partAverages,
    }
  }
}
