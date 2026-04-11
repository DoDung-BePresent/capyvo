import { Image } from 'antd'

import type { Question } from '@/features/admin/types'

export function ContextAudioScreen({
  question,
  showQuestion,
}: {
  question: Question
  showQuestion: boolean
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '60px 80px',
      }}
    >
      <div style={{ maxWidth: 820, width: '100%' }}>
        {question.imageUrls?.[0] && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <Image
              src={question.imageUrls[0]}
              style={{ maxHeight: 380, objectFit: 'contain' }}
              preview={false}
            />
          </div>
        )}
        {question.contextText && (
          <p
            style={{
              fontSize: 18,
              lineHeight: 2.1,
              color: '#1a1a1a',
              marginBottom: showQuestion && question.questionText ? 24 : 0,
            }}
          >
            {question.contextText}
          </p>
        )}
        {showQuestion && question.questionText && (
          <p style={{ fontSize: 18, lineHeight: 2.1, color: '#1a1a1a', margin: 0 }}>
            {question.questionText}
          </p>
        )}
      </div>
    </div>
  )
}
