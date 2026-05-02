/**
 * Chuyển hex color sang rgba với opacity
 * VD: hexToRgba('#4F46E5', 0.1) => 'rgba(79, 70, 229, 0.1)'
 */
export const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
