import { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Typography,
  Button,
  Space,
  Popconfirm,
  Image,
  Empty,
  Form,
  Drawer,
  Input,
  Tabs,
} from 'antd'

/**
 * Icons
 */
import { DeleteOutlined, PlusOutlined, SoundOutlined } from '@ant-design/icons'

/**
 * Types
 */
import type { FormInstance } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PART_META } from '../types'
import type { PartNumber, Question } from '../types'
import type {
  Part1FormValues,
  Part2FormValues,
  Part3FormValues,
  Part4FormValues,
  Part5FormValues,
} from '../types'

/**
 * Components
 */
import { PageHeader, DataTable } from '@/shared/components'
import Part1Form from '../components/Part1Form'
import Part2Form from '../components/Part2Form'
import Part3Form from '../components/Part3Form'
import Part4Form from '../components/Part4Form'
import Part5Form from '../components/Part5Form'

/**
 * Hooks
 */
import {
  useGetQuestions,
  useCreatePart1,
  useCreatePart2,
  useCreatePart3,
  useCreatePart4,
  useCreatePart5,
  useDeleteQuestion,
} from '../hooks/useQuestion'

/**
 * Configs
 */
import { DRAWER_WIDTHS } from '@/config'

const { Text } = Typography

// ─── Column definitions ─── //
function getColumns(
  partNumber: PartNumber,
  onDelete: (id: string) => void,
  deleting: boolean,
): ColumnsType<Question> {
  const baseColumns: ColumnsType<Question> = [
    {
      title: 'No.',
      key: 'no',
      width: 60,
      render: (_: unknown, __: Question, index: number) => index + 1,
    },
  ]

  const deleteColumn: ColumnsType<Question>[number] = {
    title: '',
    key: 'actions',
    width: 60,
    render: (_: unknown, record: Question) => (
      <Popconfirm
        title="Xóa câu hỏi này?"
        okText="Xóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
        onConfirm={() => onDelete(record.id)}
      >
        <Button type="text" danger icon={<DeleteOutlined />} loading={deleting} />
      </Popconfirm>
    ),
  }

  if (partNumber === 1) {
    return [
      ...baseColumns,
      { title: 'Nội dung đọc', dataIndex: 'contentText', ellipsis: true },
      {
        title: 'Thời gian',
        render: (_, r) => (
          <Text type="secondary">
            {r.prepTimeSeconds}s / {r.responseTimeSeconds}s
          </Text>
        ),
        width: 120,
      },
      deleteColumn,
    ]
  }

  if (partNumber === 2) {
    return [
      ...baseColumns,
      {
        title: 'Hình ảnh',
        dataIndex: 'imageUrls',
        render: (urls: string[]) =>
          urls[0] ? <Image src={urls[0]} height={60} style={{ objectFit: 'cover' }} /> : '—',
        width: 100,
      },
      deleteColumn,
    ]
  }

  if (partNumber === 3) {
    return [
      ...baseColumns,
      { title: 'Bối cảnh', dataIndex: 'contextText', ellipsis: true },
      { title: 'Câu hỏi', dataIndex: 'questionText', ellipsis: true },
      {
        title: 'Audio',
        render: (_: unknown, r: Question) =>
          r.questionAudioUrl ? (
            <a href={r.questionAudioUrl} target="_blank" rel="noreferrer">
              <SoundOutlined /> Nghe
            </a>
          ) : (
            '—'
          ),
        width: 90,
      },
      deleteColumn,
    ]
  }

  if (partNumber === 4) {
    return [
      ...baseColumns,
      {
        title: 'Ảnh',
        dataIndex: 'imageUrls',
        render: (urls: string[]) =>
          urls[0] ? <Image src={urls[0]} height={50} style={{ objectFit: 'cover' }} /> : '—',
        width: 80,
      },
      { title: 'Câu hỏi', dataIndex: 'questionText', ellipsis: true },
      {
        title: 'Audio',
        render: (_: unknown, r: Question) =>
          r.questionAudioUrl ? (
            <a href={r.questionAudioUrl} target="_blank" rel="noreferrer">
              <SoundOutlined /> Nghe
            </a>
          ) : (
            '—'
          ),
        width: 90,
      },
      deleteColumn,
    ]
  }

  return [
    ...baseColumns,
    { title: 'Câu hỏi', dataIndex: 'questionText', ellipsis: true },
    {
      title: 'Audio',
      render: (_: unknown, r: Question) =>
        r.questionAudioUrl ? (
          <a href={r.questionAudioUrl} target="_blank" rel="noreferrer">
            <SoundOutlined /> Nghe
          </a>
        ) : (
          '—'
        ),
      width: 90,
    },
    deleteColumn,
  ]
}

// ─── Part form renderer (no mutations, no buttons) ─── //
function PartFormContent({
  partNumber,
  form,
  onSubmit,
}: {
  partNumber: PartNumber
  form: FormInstance
  onSubmit: (values: unknown) => void
}) {
  switch (partNumber) {
    case 1:
      return <Part1Form form={form} onSubmit={onSubmit as (v: Part1FormValues) => void} />
    case 2:
      return <Part2Form form={form} onSubmit={onSubmit as (v: Part2FormValues) => void} />
    case 3:
      return <Part3Form form={form} onSubmit={onSubmit as (v: Part3FormValues) => void} />
    case 4:
      return <Part4Form form={form} onSubmit={onSubmit as (v: Part4FormValues) => void} />
    default:
      return <Part5Form form={form} onSubmit={onSubmit as (v: Part5FormValues) => void} />
  }
}

// ─── Submit label per part ─── //
const SUBMIT_LABEL: Record<PartNumber, string> = {
  1: 'Lưu câu hỏi',
  2: 'Lưu câu hỏi',
  3: 'Tạo 3 câu + Gen audio',
  4: 'Tạo 3 câu + Gen audio',
  5: 'Tạo câu + Gen audio',
}

// ─── Page ─── //
export default function PartQuestionsPage() {
  const { partNumber: partParam } = useParams<{ partNumber: string }>()
  const partNumber = Number(partParam) as PartNumber

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [drawerForm] = Form.useForm()
  const [activeQNum, setActiveQNum] = useState<number>(
    () => PART_META[partNumber]?.questionNumbers[0] ?? 1,
  )
  const [prevPartNumber, setPrevPartNumber] = useState(partNumber)

  if (prevPartNumber !== partNumber) {
    setPrevPartNumber(partNumber)
    setActiveQNum(PART_META[partNumber]?.questionNumbers[0] ?? 1)
    setSearch('')
  }

  const { data: questions = [], isLoading } = useGetQuestions(partNumber)
  const { mutate: deleteQuestion, isPending: deleting } = useDeleteQuestion(partNumber)

  const createPart1 = useCreatePart1()
  const createPart2 = useCreatePart2()
  const createPart3 = useCreatePart3()
  const createPart4 = useCreatePart4()
  const createPart5 = useCreatePart5()

  const isPendingMap: Record<PartNumber, boolean> = {
    1: createPart1.isPending,
    2: createPart2.isPending,
    3: createPart3.isPending,
    4: createPart4.isPending,
    5: createPart5.isPending,
  }

  const handleFormFinish = (values: unknown) => {
    const onSuccess = () => {
      drawerForm.resetFields()
      setDrawerOpen(false)
    }
    switch (partNumber) {
      case 1:
        createPart1.mutate(values as Part1FormValues, { onSuccess })
        break
      case 2:
        createPart2.mutate(values as Part2FormValues, { onSuccess })
        break
      case 3:
        createPart3.mutate(values as Part3FormValues, { onSuccess })
        break
      case 4:
        createPart4.mutate(values as Part4FormValues, { onSuccess })
        break
      case 5:
        createPart5.mutate(values as Part5FormValues, { onSuccess })
        break
    }
  }

  const meta = PART_META[partNumber]

  if (!meta) {
    return <Empty description="Part không hợp lệ" />
  }

  const questionNumbers = [...meta.questionNumbers]
  const columns = getColumns(partNumber, deleteQuestion, deleting)

  const responseTimeText =
    'responseTimeOverride' in meta
      ? `${meta.responseTime}s (câu cuối ${Object.values(meta.responseTimeOverride as Record<number, number>)[0]}s)`
      : `${meta.responseTime}s`

  const getFilteredData = (qNum: number): Question[] =>
    questions.filter((q) => {
      if (q.questionNumber !== qNum) return false
      if (!search) return true
      const s = search.toLowerCase()
      return (
        q.questionText?.toLowerCase().includes(s) ||
        q.contentText?.toLowerCase().includes(s) ||
        q.contextText?.toLowerCase().includes(s)
      )
    })

  const searchNode = (
    <Input.Search
      placeholder="Tìm kiếm câu hỏi..."
      allowClear
      size="large"
      style={{ width: 300 }}
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  )

  return (
    <Space vertical size={0} style={{ width: '100%' }}>
      <PageHeader
        title={`${meta.label} — ${meta.description}`}
        description={`Prep: ${meta.prepTime}s | Response: ${responseTimeText}`}
        breadcrumbs={[{ label: 'Câu hỏi', href: '/admin/questions' }, { label: meta.label }]}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setDrawerOpen(true)}
          >
            Thêm câu hỏi
          </Button>
        }
      />

      {questionNumbers.length > 1 ? (
        <Tabs
          type="card"
          size="large"
          activeKey={String(activeQNum)}
          onChange={(k) => setActiveQNum(Number(k))}
          tabBarExtraContent={searchNode}
          tabBarStyle={{ marginBottom: 0 }}
          items={questionNumbers.map((n) => ({
            key: String(n),
            label: `Câu ${n}`,
            children: (
              <DataTable
                noCard
                dataSource={getFilteredData(n)}
                columns={columns}
                rowKey="id"
                size="large"
                loading={isLoading}
                locale={{ emptyText: <Empty description="Chưa có câu hỏi nào" /> }}
              />
            ),
          }))}
        />
      ) : (
        <DataTable
          dataSource={getFilteredData(questionNumbers[0])}
          columns={columns}
          rowKey="id"
          size="large"
          loading={isLoading}
          locale={{ emptyText: <Empty description="Chưa có câu hỏi nào" /> }}
          filter={searchNode}
        />
      )}

      <Drawer
        title="Thêm câu hỏi mới"
        placement="right"
        width={DRAWER_WIDTHS.medium}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnHidden
        closeIcon={null}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button size="large" onClick={() => drawerForm.resetFields()}>
              Xóa
            </Button>
            <Button
              type="primary"
              size="large"
              loading={isPendingMap[partNumber]}
              onClick={() => drawerForm.submit()}
            >
              {SUBMIT_LABEL[partNumber]}
            </Button>
          </div>
        }
      >
        <PartFormContent partNumber={partNumber} form={drawerForm} onSubmit={handleFormFinish} />
      </Drawer>
    </Space>
  )
}
