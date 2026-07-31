interface Swatch {
  bgLight: string
  bgDark: string
  fgLight: string
  fgDark: string
}

// Validated categorical palette (8 hues, fixed order, CVD-safe adjacent pairs).
// Text color per swatch is picked from computed WCAG contrast against each
// background — black ink everywhere except violet, which needs white in
// light mode (black on violet-light measures ~2.3:1, well under the 3:1 floor).
const PALETTE: Swatch[] = [
  { bgLight: '#2a78d6', bgDark: '#3987e5', fgLight: '#0b0b0b', fgDark: '#0b0b0b' }, // blue
  { bgLight: '#eb6834', bgDark: '#d95926', fgLight: '#0b0b0b', fgDark: '#0b0b0b' }, // orange
  { bgLight: '#1baf7a', bgDark: '#199e70', fgLight: '#0b0b0b', fgDark: '#0b0b0b' }, // aqua
  { bgLight: '#eda100', bgDark: '#c98500', fgLight: '#0b0b0b', fgDark: '#0b0b0b' }, // yellow
  { bgLight: '#e87ba4', bgDark: '#d55181', fgLight: '#0b0b0b', fgDark: '#0b0b0b' }, // magenta
  { bgLight: '#008300', bgDark: '#008300', fgLight: '#0b0b0b', fgDark: '#0b0b0b' }, // green
  { bgLight: '#4a3aa7', bgDark: '#9085e9', fgLight: '#ffffff', fgDark: '#0b0b0b' }, // violet
  { bgLight: '#e34948', bgDark: '#e66767', fgLight: '#0b0b0b', fgDark: '#0b0b0b' }, // red
]

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

/**
 * Deterministic color per member id — stable regardless of rename, list
 * order, or how many other people exist (color follows the entity, not
 * its position, so removing/adding people never repaints survivors).
 */
export function getAvatarColor(id: string): Swatch {
  return PALETTE[hashString(id) % PALETTE.length]
}

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}
