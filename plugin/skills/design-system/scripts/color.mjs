// Color conversion. Dependency free, round-trippable.
// sRGB <-> OKLCH via OKLab (Björn Ottosson).

export const parseHex = (v) => {
  if (typeof v !== 'string') return null
  let h = v.trim()
  if (!h.startsWith('#')) return null
  h = h.slice(1)
  if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('')
  if (h.length !== 6 && h.length !== 8) return null
  const int = Number.parseInt(h.slice(0, 6), 16)
  if (Number.isNaN(int)) return null
  return {
    r: ((int >> 16) & 255) / 255,
    g: ((int >> 8) & 255) / 255,
    b: (int & 255) / 255,
    a: h.length === 8 ? Number.parseInt(h.slice(6, 8), 16) / 255 : 1,
  }
}

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toGamma = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055)
const round = (x, d) => Number.parseFloat(x.toFixed(d))
const clamp01 = (x) => Math.min(1, Math.max(0, x))

export const hexToOklch = (hex) => {
  const rgb = parseHex(hex)
  if (!rgb) return null
  const r = toLinear(rgb.r), g = toLinear(rgb.g), b = toLinear(rgb.b)

  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_

  const C = Math.sqrt(A * A + B * B)
  let H = (Math.atan2(B, A) * 180) / Math.PI
  if (H < 0) H += 360

  return { l: round(L, 4), c: round(C, 4), h: C < 0.0001 ? 0 : round(H, 2), alpha: round(rgb.a, 3) }
}

export const oklchToRgb = ({ l: L, c: C, h: H }) => {
  const hRad = (H * Math.PI) / 180
  const A = C * Math.cos(hRad)
  const B = C * Math.sin(hRad)

  const l_ = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m_ = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s_ = (L - 0.0894841775 * A - 1.291485548 * B) ** 3

  return {
    r: clamp01(toGamma(+4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_)),
    g: clamp01(toGamma(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_)),
    b: clamp01(toGamma(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_)),
  }
}

export const oklchToHex = (oklch) => {
  const { r, g, b } = oklchToRgb(oklch)
  const to = (x) => Math.round(x * 255).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

export const formatOklch = ({ l, c, h, alpha = 1 }) =>
  alpha < 1 ? `oklch(${l} ${c} ${h} / ${alpha})` : `oklch(${l} ${c} ${h})`

// hex -> CSS string in the requested format. Unparseable input passes through
// unchanged so non-color values in a theme are never corrupted.
export const convert = (value, format) => {
  if (format === 'hex') return value
  const oklch = hexToOklch(value)
  if (!oklch) return value
  if (format === 'oklch') return formatOklch(oklch)
  if (format === 'rgb') {
    const p = parseHex(value)
    const c = (x) => Math.round(x * 255)
    return p.a < 1
      ? `rgb(${c(p.r)} ${c(p.g)} ${c(p.b)} / ${round(p.a, 3)})`
      : `rgb(${c(p.r)} ${c(p.g)} ${c(p.b)})`
  }
  throw new Error(`unknown format: ${format}`)
}

// DTCG 2025.10 color value object.
// colorSpace and components are required; alpha and hex are optional.
// hex is a 6-digit fallback for tools without wide-gamut support.
export const toDtcgColor = (value, colorSpace = 'oklch') => {
  const p = parseHex(value)
  if (!p) return null
  if (colorSpace === 'srgb') {
    const v = { colorSpace: 'srgb', components: [round(p.r, 4), round(p.g, 4), round(p.b, 4)] }
    if (p.a < 1) v.alpha = round(p.a, 3)
    v.hex = value.slice(0, 7).toLowerCase()
    return v
  }
  const o = hexToOklch(value)
  const v = { colorSpace: 'oklch', components: [o.l, o.c, o.h] }
  if (o.alpha < 1) v.alpha = o.alpha
  v.hex = oklchToHex(o)
  return v
}
