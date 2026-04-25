import type { CSSProperties } from 'react'
import { Button, Divider, message, Skeleton, Space, Tag, Tooltip, Typography } from 'antd'
import {
  AudioOutlined,
  CheckCircleOutlined,
  ExperimentOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { useTranscribeAndAnalyze } from '@/features/exam/hooks/useTranscribeAndAnalyze'
import { useAnalyze } from '@/features/exam/hooks/useAnalyze'
import { useGetMe } from '@/features/auth/hooks/useAuth'
import { useSession } from '@/features/auth/hooks/useSession'
import type {
  AnalysisResult,
  AnalysisIssue,
  ScoringCriteria,
} from '@/features/exam/services/session.service'

const { Text } = Typography

// ─── Category metadata ────────────────────────────────────────────────────────

const CATEGORY_META: Record<
  AnalysisIssue['category'],
  { label: string; tagColor: string; description: string }
> = {
  omission: {
    label: 'Bỏ sót',
    tagColor: 'red',
    description: 'Từ trong văn bản nhưng bạn không đọc',
  },
  addition: {
    label: 'Thêm từ',
    tagColor: 'gold',
    description: 'Từ bạn đọc nhưng không có trong văn bản',
  },
  morphology: {
    label: 'Sai dạng từ',
    tagColor: 'orange',
    description: 'Dùng sai dạng: thiếu s, sai thì...',
  },
  pronunciation: {
    label: 'Phát âm ký hiệu',
    tagColor: 'blue',
    description: 'Ký hiệu/số đọc không đúng cách',
  },
  substitution: {
    label: 'Nhầm từ',
    tagColor: 'volcano',
    description: 'Dùng từ khác nghĩa với văn bản gốc',
  },
  order: {
    label: 'Sai thứ tự',
    tagColor: 'purple',
    description: 'Đọc các từ theo thứ tự sai',
  },
}

// Inline text styles per category — applied directly to the word span
const WORD_STYLES: Record<AnalysisIssue['category'], CSSProperties> = {
  omission: {}, // word not in transcript — handled separately
  addition: {
    background: '#fffbe6',
    color: '#ad6800',
    textDecoration: 'line-through',
    textDecorationColor: '#d4b106',
    borderRadius: 3,
    padding: '1px 3px',
  },
  morphology: {
    textDecoration: 'underline',
    textDecorationStyle: 'wavy',
    textDecorationColor: '#fa8c16',
    color: '#d46b08',
  },
  pronunciation: {
    textDecoration: 'underline',
    textDecorationStyle: 'dotted',
    textDecorationColor: '#1677ff',
    color: '#0958d9',
  },
  substitution: {
    background: '#fff1f0',
    color: '#cf1322',
    textDecoration: 'underline',
    textDecorationColor: '#ff7875',
    borderRadius: 3,
    padding: '1px 3px',
  },
  order: {
    background: '#f9f0ff',
    color: '#531dab',
    textDecoration: 'underline',
    textDecorationStyle: 'dashed' as const,
    textDecorationColor: '#9254de',
    borderRadius: 3,
    padding: '1px 3px',
  },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CreditBadge({ credits, cost = 1 }: { credits: number; cost?: number }) {
  if (credits < cost) return <Tag color="red">Hết credit</Tag>
  return (
    <Tooltip title={`Tốn ${cost} credit. Còn: ${credits}`}>
      <Tag color={credits <= cost ? 'orange' : 'blue'}>
        {credits} credit <InfoCircleOutlined style={{ marginLeft: 3 }} />
      </Tag>
    </Tooltip>
  )
}

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 85 ? '#52c41a' : score >= 65 ? '#faad14' : '#ff4d4f'
  return (
    <div
      style={{
        width: 75,
        height: 75,
        borderRadius: '50%',
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: `0 2px 8px ${color}55`,
      }}
    >
      <span style={{ color: '#fff', fontWeight: 700, fontSize: 24, lineHeight: 1 }}>{score}</span>
    </div>
  )
}

function CriteriaRow({ criteria }: { criteria: ScoringCriteria }) {
  const items = [
    { label: 'Độ chính xác', value: criteria.accuracy },
    { label: 'Từ vựng', value: criteria.vocabulary },
    { label: 'Ngữ pháp', value: criteria.grammar },
    { label: 'Trôi chảy', value: criteria.fluency },
  ]
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
      {items.map(({ label, value }) => (
        <div
          key={label}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'var(--ant-color-fill-secondary)',
            borderRadius: 12,
            padding: '2px 10px',
          }}
        >
          <Text type="secondary" style={{ fontSize: 11 }}>
            {label}
          </Text>
          <Text
            strong
            style={{
              fontSize: 12,
              color: value >= 80 ? '#52c41a' : value >= 60 ? '#faad14' : '#ff4d4f',
            }}
          >
            {value}
          </Text>
        </div>
      ))}
    </div>
  )
}

function IssueTooltip({ issue }: { issue: AnalysisIssue }) {
  const meta = CATEGORY_META[issue.category]
  return (
    <div style={{ maxWidth: 220 }}>
      <Tag color={meta.tagColor} style={{ marginBottom: 6 }}>
        {meta.label}
      </Tag>
      {issue.category === 'omission' ? (
        <div style={{ marginBottom: 4, fontSize: 12, color: '#fff' }}>
          Từ bị thiếu: <b>{issue.original}</b>
        </div>
      ) : issue.original && issue.spoken && issue.original !== issue.spoken ? (
        <div style={{ marginBottom: 4, fontSize: 12, color: '#fff' }}>
          Đúng hơn: <b>{issue.original}</b>
        </div>
      ) : null}
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>{issue.note}</div>
    </div>
  )
}

function norm(s: string) {
  return s
    .toLowerCase()
    .replace(/[.,!?;:'"()[\]-]/g, '')
    .trim()
}

function AnnotatedTranscript({
  transcript,
  issues,
}: {
  transcript: string
  issues: AnalysisIssue[]
}) {
  const wordTokens = transcript.match(/[^\s]+/g) ?? []
  const normedWords = wordTokens.map(norm)

  // Sort longest spoken phrase first so multi-word spans take priority
  const sortedIssues = [...issues]
    .filter((i) => i.category !== 'omission' && i.spoken)
    .sort((a, b) => b.spoken.split(/\s+/).length - a.spoken.split(/\s+/).length)

  const wordAnnotations = new Map<number, AnalysisIssue>()

  for (const issue of sortedIssues) {
    const spokenNormed = issue.spoken.split(/\s+/).map(norm).filter(Boolean)
    if (!spokenNormed.length) continue

    outer: for (let i = 0; i <= normedWords.length - spokenNormed.length; i++) {
      for (let j = 0; j < spokenNormed.length; j++) {
        if (normedWords[i + j] !== spokenNormed[j]) continue outer
      }
      for (let j = 0; j < spokenNormed.length; j++) {
        if (!wordAnnotations.has(i + j)) wordAnnotations.set(i + j, issue)
      }
      break
    }
  }

  // For omissions: "spoken" = context phrase surrounding the gap.
  // Insert ghost word AFTER the first word of that context span.
  // e.g. spoken="that fun", original="are" → renders "that [are] fun"
  const ghostsAfterWord = new Map<number, AnalysisIssue>()
  for (const issue of issues.filter((i) => i.category === 'omission' && i.spoken)) {
    const ctxNormed = issue.spoken.split(/\s+/).map(norm).filter(Boolean)
    if (!ctxNormed.length) continue
    outer: for (let i = 0; i <= normedWords.length - ctxNormed.length; i++) {
      for (let j = 0; j < ctxNormed.length; j++) {
        if (normedWords[i + j] !== ctxNormed[j]) continue outer
      }
      if (!ghostsAfterWord.has(i)) ghostsAfterWord.set(i, issue)
      break
    }
  }

  const renderTokens = transcript.split(/([^\s]+)/)
  let wordIdx = -1

  return (
    <div style={{ fontSize: 15, lineHeight: 2.2, fontStyle: 'italic' }}>
      &ldquo;
      {renderTokens.map((token, idx) => {
        const isWhitespace = !token || /^\s+$/.test(token)
        if (isWhitespace) return <span key={idx}>{token}</span>
        wordIdx++
        const issue = wordAnnotations.get(wordIdx)
        const ghost = ghostsAfterWord.get(wordIdx)
        return (
          <span key={idx}>
            {issue ? (
              <Tooltip title={<IssueTooltip issue={issue} />}>
                <span style={{ ...WORD_STYLES[issue.category], cursor: 'help' }}>{token}</span>
              </Tooltip>
            ) : (
              token
            )}
            {ghost && (
              <>
                {' '}
                <Tooltip title={<IssueTooltip issue={ghost} />}>
                  <span
                    style={{
                      color: '#ff4d4f',
                      background: 'rgba(255,77,79,0.08)',
                      border: '1px dashed #ffaaa7',
                      borderRadius: 4,
                      padding: '0 3px',
                      fontSize: 13,
                      cursor: 'help',
                      fontStyle: 'normal',
                      margin: '0 2px',
                    }}
                  >
                    [{ghost.original}]
                  </span>
                </Tooltip>
              </>
            )}
          </span>
        )
      })}
      &rdquo;
    </div>
  )
}
// ─── Main component ───────────────────────────────────────────────────────────

interface TranscriptPanelProps {
  responseId: string
  sessionId: string
  transcript: string | null
  analysis: AnalysisResult | null
  hasReferenceText: boolean
}

export function TranscriptPanel({
  responseId,
  sessionId,
  transcript,
  analysis,
  hasReferenceText,
}: TranscriptPanelProps) {
  const { session } = useSession()
  const { data: user } = useGetMe(session)
  const { mutate: transcribeAndAnalyze, isPending: isCombinedPending } =
    useTranscribeAndAnalyze(sessionId)
  const { mutate: analyze, isPending: isAnalyzing } = useAnalyze(sessionId)

  const credits = user?.transcriptionCredits ?? 0
  const creditCost = 1
  const isPending = isCombinedPending || isAnalyzing

  function handleAnalyze() {
    if (credits < creditCost) {
      message.warning('Bạn hết credit. Vui lòng nâng cấp để tiếp tục.')
      return
    }
    if (!transcript) {
      transcribeAndAnalyze(responseId, {
        onError: (err: unknown) => {
          const reason = (err as { response?: { data?: { error?: { message?: string } } } })
            ?.response?.data?.error?.message
          message.error(
            reason === 'no_credits' ? 'Bạn hết credit phân tích.' : 'Không thể phân tích audio.',
          )
        },
      })
    } else {
      analyze(responseId, {
        onError: (err: unknown) => {
          const reason = (err as { response?: { data?: { error?: { message?: string } } } })
            ?.response?.data?.error?.message
          if (reason === 'no_credits') message.warning('Bạn hết credit phân tích.')
          else message.error('Không thể phân tích. Vui lòng thử lại.')
        },
      })
    }
  }

  const panelBase = {
    marginTop: 16,
    padding: '12px 16px',
    borderRadius: 8,
    background: 'var(--ant-color-fill-quaternary)',
  }

  // ── No transcript yet ──
  if (!transcript) {
    return (
      <div style={{ ...panelBase, border: '1px dashed var(--ant-color-border)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <Text type="secondary" style={{ fontSize: 13 }}>
            <AudioOutlined style={{ marginRight: 6 }} />
            Chưa có bản phân tích giọng
          </Text>
          <Space>
            <CreditBadge credits={credits} cost={creditCost} />
            <Button
              size="small"
              type="primary"
              ghost
              icon={<ExperimentOutlined />}
              loading={isPending}
              disabled={credits < creditCost}
              onClick={handleAnalyze}
            >
              Phân tích
            </Button>
          </Space>
        </div>
        {isPending && <Skeleton active paragraph={{ rows: 2 }} style={{ marginTop: 12 }} />}
      </div>
    )
  }

  // ── Has transcript ──
  return (
    <div style={{ ...panelBase, border: '1px solid var(--ant-color-border)' }}>
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <Text strong style={{ fontSize: 13 }}>
          <AudioOutlined style={{ marginRight: 6 }} />
          Bạn đã nói
        </Text>
        {!analysis && hasReferenceText && (
          <Space>
            <CreditBadge credits={credits} cost={creditCost} />
            <Button
              size="small"
              icon={<ExperimentOutlined />}
              loading={isAnalyzing}
              disabled={credits < creditCost}
              onClick={handleAnalyze}
            >
              Phân tích
            </Button>
          </Space>
        )}
      </div>

      {/* Annotated transcript or plain text */}
      {analysis ? (
        <div style={{ display: 'flex', alignItems: 'start', gap: 24 }}>
          <div style={{ flex: 1 }}>
            <AnnotatedTranscript transcript={transcript} issues={analysis.issues} />
          </div>
          <ScoreCircle score={analysis.score} />
        </div>
      ) : (
        <div style={{ fontSize: 15, lineHeight: 2, fontStyle: 'italic' }}>
          &ldquo;{transcript}&rdquo;
        </div>
      )}

      {/* Loading skeleton while analyzing */}
      {isAnalyzing && (
        <div style={{ marginTop: 12 }}>
          <Skeleton active paragraph={{ rows: 3 }} />
        </div>
      )}

      {/* Summary + criteria */}
      {analysis && (
        <>
          <Divider style={{ margin: '14px 0' }} />

          {analysis.issues.length === 0 ? (
            <Text style={{ color: '#52c41a', fontSize: 13 }}>
              <CheckCircleOutlined style={{ marginRight: 6 }} />
              Tuyệt vời! Không có lỗi nào được phát hiện.
            </Text>
          ) : (
            <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
              {analysis.summary}
            </Text>
          )}

          {analysis.criteria && <CriteriaRow criteria={analysis.criteria} />}
        </>
      )}
    </div>
  )
}
