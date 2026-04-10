import { Modal, Typography } from 'antd'

const { Text } = Typography

export function SavingModal({ open }: { open: boolean }) {
  return (
    <Modal
      open={open}
      footer={null}
      closable={false}
      centered
      title={null}
      styles={{ body: { padding: 0, overflow: 'hidden' } }}
    >
      <div style={{ padding: '18px 24px', textAlign: 'center' }}>
        <Text style={{ fontSize: 20, fontWeight: 700 }}>Stop Talking</Text>
      </div>
      <div style={{ padding: '28px 32px', textAlign: 'center' }}>
        <Text style={{ fontSize: 15, display: 'block', marginBottom: 10 }}>
          Your response time has ended. Stop speaking now.
        </Text>
        <Text style={{ fontSize: 15, display: 'block', marginBottom: 10 }}>
          You will automatically proceed to the next question after your response has been saved.
        </Text>
        <Text style={{ fontSize: 15, display: 'block' }}>This may take several seconds.</Text>
      </div>
    </Modal>
  )
}
