import type { ThemeConfig } from 'antd'

export const antTheme: ThemeConfig = {
  cssVar: { key: '_,:root,css-var-my-theme-id' },
  token: {
    fontFamily: 'Nunito',
    borderRadius: 4,
  },
  components: {
    Typography: {
      titleMarginBottom: 0,
    },
    Form: {
      labelColor: 'var(--color-gray)',
    },
    Menu: {
      itemMarginInline: 0,
      itemMarginBlock: 0,
      itemBorderRadius: 0,
      itemHeight: 46,
    },
    Button: {
      fontSizeLG: 14,
    },
    Input: {
      fontSizeLG: 14,
    },
    InputNumber: {
      fontSizeLG: 14,
    },
    Select: {
      fontSizeLG: 14,
    },
    Card: {
      colorBorderSecondary: '#E6EBF1',
      headerFontSize: 14,
    },
    Tabs: {
      horizontalItemGutter: 0,
    },
    DatePicker: {
      fontSizeLG: 14,
    },
    Divider: {
      marginLG: 0,
    },
  },
}

export const SIDEBAR_WIDTHS = {
  width: 260,
  collapsedWidth: 64,
} as const

export const DRAWER_WIDTHS = {
  small: 480,
  medium: 720,
  large: 900,
  extraLarge: 1200,
} as const

export const MODAL_WIDTHS = {
  medium: 500,
  large: 720,
} as const

export const AVATAR_SIZE = {
  small: 36,
  medium: 48,
  large: 60,
  extraLarge: 80,
} as const
