// ============================================================
// MiauCV — Catálogo de temas de la interfaz (Capa A)
// ------------------------------------------------------------
// ⚠️ La tarjeta del CV (.cv-card) es la CAPA B y NO usa estos
// temas: permanece siempre clara e imprimible.
//
// Cada tema define 4 valores de acento + metadatos para el selector.
// Los valores deben coincidir con los bloques [data-theme="..."]
// de src/index.css (esa es la fuente de verdad visual).
// ============================================================

export const THEMES = [
  {
    id: 'indigo',
    label: 'Índigo',
    emoji: '🟣',
    description: 'El clásico de MiauCV',
    accent: '#5775D0',
    accentNight: '#8FA6F5',
    onAccent: '#FFFFFF'
  },
  {
    id: 'sunset',
    label: 'Sunset',
    emoji: '🌅',
    description: 'Atardecer cálido',
    accent: '#E8613C',
    accentNight: '#FF8A64',
    onAccent: '#FFFFFF'
  },
  {
    id: 'luigi',
    label: 'Luigi',
    emoji: '🟢',
    description: 'Verde primo',
    accent: '#3FA34D',
    accentNight: '#6FD07F',
    onAccent: '#FFFFFF'
  },
  {
    id: 'viola',
    label: 'Viola',
    emoji: '💜',
    description: 'Violeta premium',
    accent: '#7C4DFF',
    accentNight: '#A98BFF',
    onAccent: '#FFFFFF'
  },
  {
    id: 'aguacate',
    label: 'Aguacate',
    emoji: '🥑',
    description: 'Botánico cremoso',
    accent: '#7A9A3E',
    accentNight: '#A6C464',
    onAccent: '#FFFFFF'
  },
  {
    id: 'hibisco',
    label: 'Hibisco',
    emoji: '🌺',
    description: 'Rosa flor',
    accent: '#E75A7C',
    accentNight: '#FF8FAC',
    onAccent: '#FFFFFF'
  },
  {
    id: 'rosaroja',
    label: 'Rosa Roja',
    emoji: '🌹',
    description: 'Rojo intenso',
    accent: '#C0392B',
    accentNight: '#F07A66',
    onAccent: '#FFFFFF'
  },
  {
    id: 'celeste',
    label: 'Celeste',
    emoji: '🌤️',
    description: 'Cielo limpio',
    accent: '#2D9BD6',
    accentNight: '#6BC4F0',
    onAccent: '#FFFFFF'
  },
  {
    id: 'mango',
    label: 'Mango',
    emoji: '🥭',
    description: 'Tropical y luminoso',
    accent: '#F2A100',
    accentNight: '#FFC24D',
    onAccent: '#3A2600' // ⚠️ texto OSCURO: blanco no alcanza contraste AA
  },
  {
    id: 'otono',
    label: 'Otoño',
    emoji: '🍂',
    description: 'Terracota y ámbar',
    accent: '#B5651D',
    accentNight: '#E09A5A',
    onAccent: '#FFFFFF'
  }
]

export const MODES = [
  { id: 'light', label: 'Día', emoji: '☀️' },
  { id: 'dark', label: 'Noche', emoji: '🌙' },
  { id: 'auto', label: 'Auto', emoji: '🌗' }
]

export const DEFAULT_THEME = 'indigo'
export const DEFAULT_MODE = 'auto'

export const STORAGE_KEYS = {
  theme: 'miaucv_theme',
  mode: 'miaucv_mode'
}

export const isValidTheme = (id) => THEMES.some(t => t.id === id)
export const isValidMode = (id) => MODES.some(m => m.id === id)

export const getTheme = (id) =>
  THEMES.find(t => t.id === id) || THEMES.find(t => t.id === DEFAULT_THEME)
