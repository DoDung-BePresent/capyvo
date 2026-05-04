export type TestPhase =
  | 'intro' // Màn hình hướng dẫn ban đầu
  | 'part-instruction' // Hướng dẫn từng part
  | 'preparing' // Đang chuẩn bị
  | 'recording' // Đang ghi âm
  | 'saving' // Đang lưu câu trả lời
  | 'completed' // Hoàn thành toàn bộ test

export interface TestState {
  phase: TestPhase
  currentPartNumber: number // 1-5
  currentQuestionIndex: number // Index trong part hiện tại
  responses: Map<string, string> // questionId -> responseId
  startTime: Date | null
  endTime: Date | null
  overallAssessment?: {
    estimatedScore: number
    assessment: string
    partScores: Record<number, number>
  }
}

export interface PartInstruction {
  partNumber: number
  title: string
  directions: string
}

export const PART_INSTRUCTIONS: Record<number, PartInstruction> = {
  1: {
    partNumber: 1,
    title: 'Questions 1-2: Read a text aloud',
    directions:
      'In this part of the test, you will read aloud the text on the screen. You will have 45 seconds to prepare. Then you will have 45 seconds to read the text aloud.',
  },
  2: {
    partNumber: 2,
    title: 'Questions 3-4: Describe a picture',
    directions:
      'In this part of the test, you will describe the picture on your screen in as much detail as you can. You will have 45 seconds to prepare your response. Then you will have 30 seconds to speak about the picture.',
  },
  3: {
    partNumber: 3,
    title: 'Questions 5-7: Respond to questions',
    directions:
      'In this part of the test, you will answer three questions. You will have three seconds to prepare after you hear each question. You will have 15 seconds to respond to Questions 5 and 6, and 30 seconds to respond to Question 7.',
  },
  4: {
    partNumber: 4,
    title: 'Questions 8-10: Respond to questions using information provided',
    directions:
      'In this part of the test, you will answer three questions based on the information provided. You will have 45 seconds to read the information before the questions begin. You will have three seconds to prepare and 15 seconds to respond to Questions 8 and 9. You will hear Question 10 two times. You will have three seconds to prepare and 30 seconds to respond to Question 10.',
  },
  5: {
    partNumber: 5,
    title: 'Question 11: Express an opinion',
    directions:
      'In this part of the test, you will give your opinion about a specific topic. Be sure to say as much as you can in the time allowed. You will have 45 seconds to prepare. Then you will have 60 seconds to speak.',
  },
}

export const TEST_INTRO_TEXT = `This is the TOEIC Speaking test. This test includes 11 questions that measure different aspects of your speaking ability. The test lasts approximately 20 minutes.

For each type of question, you will be given specific directions, including the time allowed for preparation and speaking.

It is to your advantage to say as much as you can in the time allowed. It is also important that you speak clearly and that you answer each question according to the directions.`
