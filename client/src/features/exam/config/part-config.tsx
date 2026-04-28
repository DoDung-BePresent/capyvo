import { RecordVoiceOver, Image, QuestionAnswer, Info, Campaign } from '@mui/icons-material'
import type { PartNumber } from '@/features/admin/types'

export interface PartConfig {
  partNumber: PartNumber
  label: string
  title: string
  description: string
  color: string
  icon: React.ReactNode
  questionCount: number
  questionRange: string
  progress?: number // 0-100, tiến độ hoàn thành (optional)
}

export const PART_CONFIGS: Record<PartNumber, PartConfig> = {
  1: {
    partNumber: 1,
    label: 'Part 1',
    title: 'Read a text aloud',
    description: 'Đánh giá khả năng phát âm, ngữ điệu và nhấn nhá khi đọc văn bản tiếng Anh.',
    color: '#4F46E5',
    icon: <RecordVoiceOver style={{ fontSize: 25 }} />,
    questionCount: 2,
    questionRange: 'Câu 1–2',
  },
  2: {
    partNumber: 2,
    label: 'Part 2',
    title: 'Describe a picture',
    description: 'Kiểm tra vốn từ vựng và cấu trúc câu khi mô tả thông tin hình ảnh.',
    color: '#7C3AED',
    icon: <Image style={{ fontSize: 25 }} />,
    questionCount: 2,
    questionRange: 'Câu 3–4',
  },
  3: {
    partNumber: 3,
    label: 'Part 3',
    title: 'Respond to questions',
    description: 'Trả lời các câu hỏi hàng ngày một cách nhanh chóng mà không cần chuẩn bị.',
    color: '#0891B2',
    icon: <QuestionAnswer style={{ fontSize: 25 }} />,
    questionCount: 3,
    questionRange: 'Câu 5–7',
  },
  4: {
    partNumber: 4,
    label: 'Part 4',
    title: 'Respond using information',
    description: 'Trả lời câu hỏi dựa trên thông tin được cung cấp từ hình ảnh hoặc văn bản.',
    color: '#059669',
    icon: <Info style={{ fontSize: 25 }} />,
    questionCount: 3,
    questionRange: 'Câu 8–10',
  },
  5: {
    partNumber: 5,
    label: 'Part 5',
    title: 'Express an opinion',
    description: 'Bày tỏ ý kiến cá nhân về một chủ đề với lập luận rõ ràng và mạch lạc.',
    color: '#DC2626',
    icon: <Campaign style={{ fontSize: 25 }} />,
    questionCount: 1,
    questionRange: 'Câu 11',
  },
}
