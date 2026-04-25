import logo from '@/assets/logo.png'

interface LogoProps {
  collapsed?: boolean
  size?: number
}

export function Logo({ collapsed = false, size = 32 }: LogoProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
      <img
        src={logo}
        alt="Capyvo"
        style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
      />
      {!collapsed && (
        <span
          style={{
            fontWeight: 700,
            fontSize: 20,
            letterSpacing: 0.4,
            whiteSpace: 'nowrap',
            lineHeight: 1,
          }}
        >
          Capyvo
        </span>
      )}
    </div>
  )
}
