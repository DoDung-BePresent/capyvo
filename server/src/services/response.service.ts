import OpenAI from 'openai'
import supabaseAdmin from '@/lib/supabase'
import prisma from '@/lib/prisma'
import { ForbiddenError } from '@/errors/app-error'
import { transcriptionAndAnalysisQueue } from '@/queues/transcription.queue'
import { env } from '@/config/env'

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  timeout: 30000, // 30 seconds timeout
  maxRetries: 2, // Retry up to 2 times on failure
})

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
6. IGNORE capitalization ENTIRELY in ALL comparisons. "city hall" = "City Hall" = "CITY HALL" = IDENTICAL.
7. IGNORE minor punctuation differences (commas, apostrophes).
8. "spoken" must be copied CHARACTER-FOR-CHARACTER from the transcript.
9. "original" must be copied CHARACTER-FOR-CHARACTER from the reference text.
10. NUMBERS AND SYMBOLS - Accept ALL natural spoken forms as CORRECT:
    - "$15" in text → "fifteen dollars" OR "15 dollars" OR "dollar 15" spoken = ALL CORRECT
    - "15" in text → "fifteen" spoken = CORRECT
    - "10%" in text → "ten percent" OR "10 percent" spoken = CORRECT
    - "1st" in text → "first" spoken = CORRECT
    - "&" in text → "and" spoken = CORRECT
    - ONLY flag if NUMBER VALUE is wrong (e.g., "fifty" when text says "15")
    - NEVER flag format differences (symbol vs word)
11. DATES AND TIME - Accept equivalent formats:
    - "Saturday and Sunday" = "Saturday, Sunday" = "Saturday & Sunday" = ALL CORRECT
    - Minor wording differences in dates/times are acceptable
12. CASE SENSITIVITY - IGNORE ALL capitalization differences:
    - "player of the year" = "Player of the Year" = "PLAYER OF THE YEAR" = IDENTICAL
    - "the fun event" = "The Fun Event" = IDENTICAL
    - Do NOT flag capitalization as substitution, morphology, or any error category

Category rules:
- omission: student skipped a word that IS in the reference. "spoken" = surrounding phrase from transcript for UI anchoring.
- addition: student added a word that is NOT in the reference. "spoken" = the extra word(s) verbatim from transcript.
- morphology: wrong word form (dollar→dollars, is→are). "spoken" = wrong word verbatim from transcript.
- pronunciation: ONLY for mispronounced words, NOT for number/symbol format differences. "spoken" = mispronounced word verbatim.
- substitution: different word with different meaning (NOT number/symbol format). "spoken" = what was said verbatim from transcript.
- order: words said in wrong order. "original" = correct phrase from reference. "spoken" = swapped phrase verbatim from transcript.

CRITICAL: Do NOT use "pronunciation" category for number/symbol format differences ($15 vs fifteen dollars). These are CORRECT variations.

Scoring guidelines for Part 1 (Official TOEIC criteria):
- Score 3: Pronunciation highly intelligible; stress, pausing, intonation appropriate
- Score 2: Pronunciation generally intelligible with some errors; stress/intonation generally appropriate
- Score 1: Pronunciation sometimes intelligible but heavily influenced by native language
- Score 0: No response or not in English

Apply these to {MAX_SCORE}-point scale proportionally.

EXAMPLES OF CORRECT READINGS (do NOT flag these):
Reference: "Tickets cost $15 at the gate."
Transcript: "Tickets cost fifteen dollars at the gate." → CORRECT (no errors)

Reference: "Saturday and Sunday"
Transcript: "Saturday & Sunday" → CORRECT (no errors)

Reference: "player of the year"
Transcript: "Player of the Year" → CORRECT (no errors, capitalization ignored)

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
6. IGNORE capitalization ENTIRELY. "city hall" = "City Hall" = IDENTICAL.
7. IGNORE number/symbol format differences. "$15" = "fifteen dollars" = CORRECT.
8. Only flag clear, objective errors. Be lenient with paraphrasing.
7. Only flag clear, objective errors. Be lenient with paraphrasing.
8. A concise, accurate description of main elements deserves a high score.

Scoring guidelines (Official TOEIC Part 2 criteria):
- Score 3: Describes main features; generally understandable; appropriate vocabulary/structure
- Score 2: Relevant but meaning sometimes unclear; limited vocabulary/structure
- Score 1: May be relevant but very limited language ability; requires significant listener effort
- Score 0: No response or not in English

Apply these to {MAX_SCORE}-point scale proportionally.

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
11. IGNORE capitalization ENTIRELY. "new york" = "New York" = IDENTICAL.
12. IGNORE number/symbol format differences. "$20" = "twenty dollars" = CORRECT.

Category rules:
- morphology: grammatical form error (wrong tense, missing plural, wrong article, subject-verb agreement). "spoken" = incorrect phrase verbatim.
- grammar: sentence structure error (word order, missing words, run-on sentences, fragments). "spoken" = problematic phrase verbatim.
- vocabulary: inappropriate word choice, repetition, unclear expression, or unnatural phrasing. "spoken" = the word/phrase verbatim. "original" = better alternative.

Scoring guidelines (Official TOEIC Part 3/4 criteria):
- Score 3: Complete, relevant response; requires little listener effort; appropriate vocabulary/structure
- Score 2: Partially effective response; may require listener effort but mostly understandable; limited vocabulary/structure
- Score 1: Ineffective response; relevant information not conveyed; affects listener understanding
- Score 0: No response or not in English

For Part 5 (5-point scale):
- Score 5: Clear opinion with support (reasons/details/examples); clear speech with fluency; good control of simple/complex structures; effective vocabulary
- Score 4: Clear opinion with adequate support; some pronunciation difficulties; fairly effective grammar/vocabulary
- Score 3: Opinion stated but limited support; basically understandable but requires effort; limited grammar control (mostly simple sentences); limited vocabulary
- Score 2: Opinion stated but support unclear/incoherent; frequent pronunciation difficulties; grammar significantly affects communication; very limited vocabulary
- Score 1: Only reads prompt or cannot express understandable opinion; single words/phrases or mix of native language and English
- Score 0: No response or not in English

Apply these criteria to {MAX_SCORE}-point scale proportionally.

Be encouraging and realistic. A short but accurate, grammatically correct response is BETTER than a long response with many errors. Only flag significant errors that impact communication or clarity.`

export class ResponseService {
  private async checkPlanAccess(userId: string): Promise<{
    plan: 'FREE' | 'TRIAL' | 'PREMIUM' | null
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
    const isPremium = user.isPremium && user.premiumUntil && user.premiumUntil >= now

    let daysRemaining = null
    if (user.premiumUntil) {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const diffTime = user.premiumUntil.getTime() - today.getTime()
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    // Get current active subscription (priority: latest endDate)
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { gte: now },
      },
      orderBy: { endDate: 'desc' },
      include: { plan: true },
    })

    // Determine plan (priority: PREMIUM/CLASSROOM > TRIAL > FREE)
    let plan: 'FREE' | 'TRIAL' | 'PREMIUM'
    if (subscription) {
      if (subscription.planId === 'PREMIUM' || subscription.planId === 'CLASSROOM') {
        plan = 'PREMIUM'
      } else if (subscription.planId === 'TRIAL') {
        plan = 'TRIAL'
      } else {
        plan = 'FREE'
      }
    } else {
      plan = 'FREE'
    }

    return {
      plan,
      hasAccess: true, // Everyone has access (FREE or PREMIUM)
      isPremium: isPremium || false,
      daysRemaining,
    }
  }

  private async checkSubscriptionAccess(userId: string, requirePremium = false): Promise<void> {
    const access = await this.checkPlanAccess(userId)

    // Everyone has basic access (FREE plan)
    // Only check premium if required
    if (requirePremium && !access.isPremium) {
      throw new ForbiddenError('premium_required')
    }
  }

  async checkUserSubscription(userId: string): Promise<{
    hasAccess: boolean
    isPremium: boolean
    plan: 'FREE' | 'TRIAL' | 'PREMIUM' | null
    daysRemaining: number | null
  }> {
    const access = await this.checkPlanAccess(userId)

    return {
      hasAccess: access.hasAccess,
      isPremium: access.isPremium,
      plan: access.plan,
      daysRemaining: access.daysRemaining,
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

    // 2. Check subscription access (BASIC or PREMIUM can transcribe)
    await this.checkSubscriptionAccess(userId, false)

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

    // 2. Check PREMIUM access (analysis requires PREMIUM)
    await this.checkSubscriptionAccess(userId, true)

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
      model: 'gpt-4o',
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

    // 2. Check PREMIUM access FIRST (transcribeAndAnalyze requires PREMIUM)
    await this.checkSubscriptionAccess(userId, true)

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
      model: 'gpt-4o',
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

  /**
   * Queue version: Add job to queue and return immediately
   * Used for Full Test mode to avoid blocking
   * Falls back to synchronous processing if queue is unavailable
   */
  async transcribeAndAnalyzeAsync(
    responseId: string,
    userId: string,
    partNumber: number,
  ): Promise<
    { jobId: string; status: 'queued' } | { transcript: string; analysis: AnalysisResult }
  > {
    // 1. Verify response exists and user has access
    const response = await prisma.userResponse.findFirst({
      where: { id: responseId, session: { userId } },
      select: { id: true, audioUrl: true },
    })
    if (!response?.audioUrl) throw new ForbiddenError('Response not found or has no audio')

    // 2. Check PREMIUM access
    await this.checkSubscriptionAccess(userId, true)

    // 3. Try to add job to queue, fallback to sync if queue unavailable
    if (!transcriptionAndAnalysisQueue) {
      console.warn('⚠️  Queue not available, processing synchronously')
      const result = await this.transcribeAndAnalyze(responseId, userId, partNumber)
      return result
    }

    try {
      const job = await transcriptionAndAnalysisQueue.add('process', {
        responseId,
        userId,
        partNumber,
      })

      console.log(`✅ Job ${job.id} queued for response ${responseId}`)
      return { jobId: job.id!, status: 'queued' }
    } catch (error) {
      console.warn('⚠️  Failed to queue job, falling back to synchronous processing:', error)
      // Fallback: Process synchronously
      const result = await this.transcribeAndAnalyze(responseId, userId, partNumber)
      return result
    }
  }

  /**
   * Get result of queued job
   */
  async getQueuedResult(
    responseId: string,
    userId: string,
  ): Promise<
    | { status: 'completed'; transcript: string; analysis: AnalysisResult }
    | { status: 'processing' | 'failed'; error?: string }
  > {
    // Verify access
    const response = await prisma.userResponse.findFirst({
      where: { id: responseId, session: { userId } },
      select: {
        id: true,
        transcript: true,
        pronunciationScore: true,
      },
    })

    if (!response) throw new ForbiddenError('Response not found')

    // Check if result is ready
    if (response.transcript && response.pronunciationScore) {
      return {
        status: 'completed',
        transcript: response.transcript,
        analysis: response.pronunciationScore as unknown as AnalysisResult,
      }
    }

    // Still processing
    return { status: 'processing' }
  }

  async getQuestionHistory(questionId: string, userId: string) {
    const responses = await prisma.userResponse.findMany({
      where: {
        questionId,
        session: {
          userId,
          partNumber: { not: null }, // Only get responses from practice sessions (not full test)
        },
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

  /**
   * Calculate TOEIC Speaking score (0-200) using weighted formula
   * Based on TOEIC Speaking structure with non-linear curve
   */
  private calculateTOEICScore(scoresByPart: Record<number, number[]>): number {
    // Part weights based on TOEIC Speaking structure
    const weights = {
      1: 0.15, // Part 1: 2 questions (Read aloud) - 15%
      2: 0.15, // Part 2: 2 questions (Describe picture) - 15%
      3: 0.25, // Part 3: 3 questions (Respond to questions) - 25%
      4: 0.25, // Part 4: 3 questions (Respond using info) - 25%
      5: 0.2, // Part 5: 1 question (Express opinion) - 20%
    }

    let weightedSum = 0
    let totalWeight = 0

    for (const [part, scores] of Object.entries(scoresByPart)) {
      const partNum = Number(part)
      const weight = weights[partNum as keyof typeof weights] || 0
      const maxScore = partNum === 5 ? 5 : 3
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
      const normalized = avgScore / maxScore // 0-1 range

      weightedSum += normalized * weight
      totalWeight += weight
    }

    if (totalWeight === 0) return 0

    const normalizedScore = weightedSum / totalWeight // 0-1

    // Apply curve (similar to TOEIC scoring - non-linear)
    let scaledScore: number
    if (normalizedScore < 0.3) {
      // 0-30% → 0-40 points (struggling)
      scaledScore = normalizedScore * 133
    } else if (normalizedScore < 0.6) {
      // 30-60% → 40-110 points (developing)
      scaledScore = 40 + (normalizedScore - 0.3) * 233
    } else if (normalizedScore < 0.85) {
      // 60-85% → 110-160 points (competent)
      scaledScore = 110 + (normalizedScore - 0.6) * 200
    } else {
      // 85-100% → 160-200 points (proficient)
      scaledScore = 160 + (normalizedScore - 0.85) * 267
    }

    return Math.round(Math.min(200, Math.max(0, scaledScore)))
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

    // Return cached assessment if exists
    if (session.overallAssessment) {
      return session.overallAssessment as {
        estimatedScore: number
        assessment: string
        partScores: Record<number, number>
      }
    }

    // Collect all scores by part
    const scoresByPart: Record<number, number[]> = {}

    for (const response of session.userResponses) {
      if (response.pronunciationScore) {
        const analysis = response.pronunciationScore as unknown as AnalysisResult
        const partNumber = response.question.partNumber
        if (!scoresByPart[partNumber]) scoresByPart[partNumber] = []
        scoresByPart[partNumber].push(analysis.score)
      }
    }

    if (Object.keys(scoresByPart).length === 0) {
      return {
        estimatedScore: 0,
        assessment: 'Chưa có dữ liệu để đánh giá.',
        partScores: {},
      }
    }

    // Calculate part averages for display (convert to 0-100 scale)
    const partAverages: Record<number, number> = {}
    for (const [part, scores] of Object.entries(scoresByPart)) {
      const partNum = Number(part)
      const maxScore = partNum === 5 ? 5 : 3
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
      // Convert to 0-100 scale and round to 1 decimal
      partAverages[partNum] = Math.round((avgScore / maxScore) * 1000) / 10
    }

    // Calculate TOEIC score using weighted formula
    const estimatedScore = this.calculateTOEICScore(scoresByPart)

    // Use AI to generate assessment text only (not score)
    const prompt = `You are a TOEIC Speaking test evaluator. The student received a TOEIC Speaking score of ${estimatedScore}/200.

Performance by part (0-100 scale):
- Part 1 (Read Aloud): ${partAverages[1]?.toFixed(1) || 'N/A'}/100 (${scoresByPart[1]?.length || 0} questions)
- Part 2 (Describe Picture): ${partAverages[2]?.toFixed(1) || 'N/A'}/100 (${scoresByPart[2]?.length || 0} questions)
- Part 3 (Respond to Questions): ${partAverages[3]?.toFixed(1) || 'N/A'}/100 (${scoresByPart[3]?.length || 0} questions)
- Part 4 (Respond Using Information): ${partAverages[4]?.toFixed(1) || 'N/A'}/100 (${scoresByPart[4]?.length || 0} questions)
- Part 5 (Express Opinion): ${partAverages[5]?.toFixed(1) || 'N/A'}/100 (${scoresByPart[5]?.length || 0} questions)

Provide 2-3 sentences in Vietnamese summarizing:
1. Overall performance level
2. Strongest part(s)
3. Area(s) for improvement

Return ONLY the assessment text (no JSON, no markdown, just plain Vietnamese text).`

    let assessment: string
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      })

      assessment = completion.choices[0]?.message?.content?.trim() || 'Không thể tạo đánh giá.'
    } catch (_error) {
      // Fallback if AI fails
      assessment = `Điểm TOEIC Speaking ước tính: ${estimatedScore}/200. Hãy tiếp tục luyện tập để cải thiện kỹ năng nói của bạn.`
    }

    const result = {
      estimatedScore,
      assessment,
      partScores: partAverages,
    }

    // Save assessment to database to avoid recalculating
    await prisma.practiceSession.update({
      where: { id: sessionId },
      data: { overallAssessment: result as object },
    })

    return result
  }
}
