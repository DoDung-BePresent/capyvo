import { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Form,
  InputNumber,
  Button,
  Space,
  Divider,
  Statistic,
  Alert,
  Skeleton,
} from 'antd'
import { CalculatorOutlined, DollarOutlined, TeamOutlined, RiseOutlined } from '@ant-design/icons'
import { PageHeader } from '@/shared/components'
import { usePricingCalculator } from '../hooks/usePricingCalculator'
import type { PricingInputs } from '../services/pricing-calculator.service'

export default function PricingCalculatorPage() {
  const [form] = Form.useForm<PricingInputs>()
  const { mutate: calculate, data: result, isPending } = usePricingCalculator()
  const [hasCalculated, setHasCalculated] = useState(false)

  const handleCalculate = (values: PricingInputs) => {
    calculate(values)
    setHasCalculated(true)
  }

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <PageHeader
        title="Pricing Calculator"
        description="Công cụ tính toán giá gói dựa trên chi phí và mục tiêu lợi nhuận"
        breadcrumbs={[
          { label: 'Admin Dashboard', href: '/admin' },
          { label: 'Pricing Calculator' },
        ]}
      />

      <Row gutter={[24, 24]}>
        {/* Input Form */}
        <Col xs={24} lg={10}>
          <Card title="Thông số đầu vào">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleCalculate}
              initialValues={{
                targetUsers: 100,
                profitMarginPercent: 30,
                infrastructureCostUsd: 50,
              }}
            >
              <Form.Item
                label="Số lượng user mục tiêu"
                name="targetUsers"
                rules={[{ required: true, message: 'Vui lòng nhập số user' }]}
              >
                <InputNumber
                  min={1}
                  style={{ width: '100%' }}
                  placeholder="Ví dụ: 100"
                  prefix={<TeamOutlined />}
                />
              </Form.Item>

              <Form.Item
                label="Tỷ lệ lợi nhuận mong muốn (%)"
                name="profitMarginPercent"
                rules={[{ required: true, message: 'Vui lòng nhập tỷ lệ lợi nhuận' }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  style={{ width: '100%' }}
                  placeholder="Ví dụ: 30"
                  prefix={<RiseOutlined />}
                  suffix="%"
                />
              </Form.Item>

              <Form.Item
                label="Chi phí infrastructure (USD/tháng)"
                name="infrastructureCostUsd"
                rules={[{ required: true, message: 'Vui lòng nhập chi phí infrastructure' }]}
                tooltip="Server, database, storage, v.v."
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="Ví dụ: 50"
                  prefix={<DollarOutlined />}
                  suffix="USD"
                />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                icon={<CalculatorOutlined />}
                size="large"
                block
                loading={isPending}
              >
                Tính toán
              </Button>
            </Form>
          </Card>

          {/* Current Metrics */}
          {result && (
            <Card title="Metrics hiện tại" style={{ marginTop: 24 }}>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Statistic
                  title="Số user hiện tại"
                  value={result.currentUsers}
                  prefix={<TeamOutlined />}
                />
                <Divider style={{ margin: '8px 0' }} />
                <Statistic
                  title="Chi phí OpenAI trung bình/user"
                  value={result.avgOpenAICostPerUser}
                  precision={4}
                  prefix="$"
                />
                <Divider style={{ margin: '8px 0' }} />
                <Statistic
                  title="Số session trung bình/user"
                  value={result.avgSessionsPerUser}
                  precision={1}
                />
                <Divider style={{ margin: '8px 0' }} />
                <Statistic
                  title="Tokens trung bình/user"
                  value={result.avgTokensPerUser}
                  precision={0}
                />
              </Space>
            </Card>
          )}
        </Col>

        {/* Results */}
        <Col xs={24} lg={14}>
          {!hasCalculated ? (
            <Card>
              <Alert
                message="Chưa có kết quả"
                description="Vui lòng nhập thông số và nhấn 'Tính toán' để xem kết quả."
                type="info"
                showIcon
              />
            </Card>
          ) : isPending ? (
            <Card>
              <Skeleton active paragraph={{ rows: 8 }} />
            </Card>
          ) : result ? (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {/* Cost Breakdown */}
              <Card title="Phân tích chi phí">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Statistic
                      title="Chi phí OpenAI"
                      value={result.totalOpenAICost}
                      precision={2}
                      prefix="$"
                    />
                  </Col>
                  <Col xs={24} sm={12}>
                    <Statistic
                      title="Chi phí Infrastructure"
                      value={result.totalInfrastructureCost}
                      precision={2}
                      prefix="$"
                    />
                  </Col>
                  <Col xs={24} sm={12}>
                    <Statistic
                      title="Tổng chi phí"
                      value={result.totalCost}
                      precision={2}
                      prefix="$"
                      valueStyle={{ color: '#cf1322' }}
                    />
                  </Col>
                  <Col xs={24} sm={12}>
                    <Statistic
                      title="Doanh thu mục tiêu"
                      value={result.targetRevenue}
                      precision={2}
                      prefix="$"
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Col>
                </Row>
              </Card>

              {/* Suggested Pricing */}
              <Card title="Giá đề xuất (VND)">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Card
                      style={{
                        backgroundColor: '#f0f5ff',
                        border: '1px solid #adc6ff',
                      }}
                    >
                      <Statistic
                        title="Gói Basic (100 tokens)"
                        value={result.suggestedPrices.basic}
                        suffix="₫"
                        valueStyle={{ color: '#1677ff', fontSize: 24 }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card
                      style={{
                        backgroundColor: '#f6ffed',
                        border: '1px solid #b7eb8f',
                      }}
                    >
                      <Statistic
                        title="Gói Standard (300 tokens)"
                        value={result.suggestedPrices.standard}
                        suffix="₫"
                        valueStyle={{ color: '#52c41a', fontSize: 24 }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card
                      style={{
                        backgroundColor: '#fff7e6',
                        border: '1px solid #ffd591',
                      }}
                    >
                      <Statistic
                        title="Gói Premium (500 tokens)"
                        value={result.suggestedPrices.premium}
                        suffix="₫"
                        valueStyle={{ color: '#fa8c16', fontSize: 24 }}
                      />
                    </Card>
                  </Col>
                </Row>
              </Card>

              {/* Break-even Analysis */}
              <Card title="Phân tích hòa vốn">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Statistic
                      title="Số user cần để hòa vốn"
                      value={result.breakEvenUsers}
                      prefix={<TeamOutlined />}
                    />
                  </Col>
                  <Col xs={24} sm={12}>
                    <Statistic
                      title="Lợi nhuận dự kiến"
                      value={result.profitAtTargetUsers}
                      precision={2}
                      prefix="$"
                      valueStyle={{
                        color: result.profitAtTargetUsers >= 0 ? '#3f8600' : '#cf1322',
                      }}
                    />
                  </Col>
                </Row>

                {result.profitAtTargetUsers < 0 && (
                  <Alert
                    message="Cảnh báo"
                    description="Với số user mục tiêu hiện tại, bạn sẽ bị lỗ. Hãy tăng số user hoặc tăng tỷ lệ lợi nhuận."
                    type="warning"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                )}
              </Card>
            </Space>
          ) : null}
        </Col>
      </Row>
    </Space>
  )
}
