import { useParams } from 'react-router-dom'
import { Typography, Button, Tag, Space, Popconfirm, Image, Empty, Form, Drawer } from 'antd'
import { DeleteOutlined, PlusOutlined, SoundOutlined } from '@ant-design/icons'
import { PageHeader, DataTable } from '@/shared/components'
import type { ColumnsType } from 'antd/es/table'
import { PART_META } from '../types'
import type { PartNumber, Question } from '../types'
import Part1Form from '../components/Part1Form'
import Part2Form from '../components/Part2Form'
import Part3Form from '../components/Part3Form'
import Part4Form from '../components/Part4Form'
import Part5Form from '../components/Part5Form'
import {
  useGetQuestions,
  useCreatePart1,
  useCreatePart2,
  useCreatePart3,
  useCreatePart4,
  useCreatePart5,
  useDeleteQuestion,
} from '../hooks/useQuestion'
import type {
  Part1FormValues,
  Part2FormValues,
  Part3FormValues,
  Part4FormValues,
  Part5FormValues,
} from '../types'
import { useState } from 'react'

const { Text } = Typography

// ─── Column definitions ────────────────────────────────────────────────────────

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
    {
      title: 'Câu',
      dataIndex: 'questionNumber',
      width: 80,
      render: (n: number) => <Tag color="blue">Câu {n}</Tag>,
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

// ─── Part form switcher ────────────────────────────────────────────────────────

function PartForm({ partNumber, onSuccess }: { partNumber: PartNumber; onSuccess: () => void }) {
  const [form] = Form.useForm()
  const createPart1 = useCreatePart1()
  const createPart2 = useCreatePart2()
  const createPart3 = useCreatePart3()
  const createPart4 = useCreatePart4()
  const createPart5 = useCreatePart5()

  const handleSuccess = () => {
    form.resetFields()
    onSuccess()
  }

  if (partNumber === 1)
    return (
      <Form.Provider onFormFinish={() => handleSuccess()}>
        <Part1Form
          onSubmit={(v: Part1FormValues) => createPart1.mutate(v, { onSuccess: handleSuccess })}
          loading={createPart1.isPending}
        />
      </Form.Provider>
    )
  if (partNumber === 2)
    return (
      <Part2Form
        onSubmit={(v: Part2FormValues) => createPart2.mutate(v, { onSuccess: handleSuccess })}
        loading={createPart2.isPending}
      />
    )
  if (partNumber === 3)
    return (
      <Part3Form
        onSubmit={(v: Part3FormValues) => createPart3.mutate(v, { onSuccess: handleSuccess })}
        loading={createPart3.isPending}
      />
    )
  if (partNumber === 4)
    return (
      <Part4Form
        onSubmit={(v: Part4FormValues) => createPart4.mutate(v, { onSuccess: handleSuccess })}
        loading={createPart4.isPending}
      />
    )

  return (
    <Part5Form
      onSubmit={(v: Part5FormValues) => createPart5.mutate(v, { onSuccess: handleSuccess })}
      loading={createPart5.isPending}
    />
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PartQuestionsPage() {
  const { partNumber: partParam } = useParams<{ partNumber: string }>()
  const partNumber = Number(partParam) as PartNumber

  const [drawerOpen, setDrawerOpen] = useState(false)

  const meta = PART_META[partNumber]
  const { data: questions = [], isLoading } = useGetQuestions(partNumber)
  const { mutate: deleteQuestion, isPending: deleting } = useDeleteQuestion(partNumber)

  if (!meta) {
    return <Empty description="Part không hợp lệ" />
  }

  const columns = getColumns(partNumber, deleteQuestion, deleting)

  const responseTimeText =
    'responseTimeOverride' in meta
      ? `${meta.responseTime}s (câu cuối ${Object.values(meta.responseTimeOverride as Record<number, number>)[0]}s)`
      : `${meta.responseTime}s`

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
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

      <DataTable
        dataSource={questions}
        columns={columns}
        rowKey="id"
        size="large"
        loading={isLoading}
        locale={{ emptyText: <Empty description="Chưa có câu hỏi nào" /> }}
      />

      <Drawer
        title="Thêm câu hỏi mới"
        placement="right"
        width={560}
        open={drawerOpen}
        closeIcon={null}
        onClose={() => setDrawerOpen(false)}
        destroyOnHidden
      >
        <PartForm partNumber={partNumber} onSuccess={() => setDrawerOpen(false)} />
      </Drawer>
    </Space>
  )
}
