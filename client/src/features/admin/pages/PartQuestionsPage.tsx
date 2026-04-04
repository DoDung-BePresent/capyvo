import { useParams, useNavigate } from 'react-router-dom'
import {
  Typography,
  Card,
  Row,
  Col,
  Table,
  Button,
  Tag,
  Space,
  Popconfirm,
  Image,
  Empty,
  Spin,
  Form,
} from 'antd'
import { ArrowLeftOutlined, DeleteOutlined, SoundOutlined } from '@ant-design/icons'
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

const { Title, Text } = Typography

// ─── Column definitions ────────────────────────────────────────────────────────

function getColumns(
  partNumber: PartNumber,
  onDelete: (id: string) => void,
  deleting: boolean,
): ColumnsType<Question> {
  const baseColumns: ColumnsType<Question> = [
    {
      title: 'Câu',
      dataIndex: 'questionNumber',
      width: 70,
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
        <Button type="text" danger size="small" icon={<DeleteOutlined />} loading={deleting} />
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
        width: 100,
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
        width: 80,
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
        width: 80,
      },
      deleteColumn,
    ]
  }

  // Part 5
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
      width: 80,
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
  const navigate = useNavigate()
  const partNumber = Number(partParam) as PartNumber

  const meta = PART_META[partNumber]
  const { data: questions = [], isLoading } = useGetQuestions(partNumber)
  const { mutate: deleteQuestion, isPending: deleting } = useDeleteQuestion(partNumber)

  if (!meta) {
    return <Empty description="Part không hợp lệ" />
  }

  const columns = getColumns(partNumber, deleteQuestion, deleting)

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      {/* Header */}
      <Space>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/admin/questions')}
        />
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {meta.label} — {meta.description}
          </Title>
          <Text type="secondary">
            Prep: {meta.prepTime}s | Response:{' '}
            {'responseTimeOverride' in meta
              ? `${meta.responseTime}s (câu cuối ${Object.values(meta.responseTimeOverride)[0]}s)`
              : `${meta.responseTime}s`}
          </Text>
        </div>
      </Space>

      <Row gutter={24}>
        {/* Add form */}
        <Col xs={24} xl={10}>
          <Card title="Thêm câu hỏi mới" size="small">
            <PartForm partNumber={partNumber} onSuccess={() => {}} />
          </Card>
        </Col>

        {/* Question list */}
        <Col xs={24} xl={14}>
          <Card
            title={
              <Space>
                Danh sách câu hỏi
                <Tag>{questions.length} câu</Tag>
              </Space>
            }
            size="small"
          >
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin />
              </div>
            ) : (
              <Table
                dataSource={questions}
                columns={columns}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 10, showSizeChanger: false }}
                locale={{ emptyText: <Empty description="Chưa có câu hỏi nào" /> }}
              />
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
