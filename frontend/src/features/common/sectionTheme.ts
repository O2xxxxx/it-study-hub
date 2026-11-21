import { BookOpen, Code2, Coffee, Database, LayoutTemplate, Server, Sparkles, type LucideIcon } from 'lucide-react'

export interface SectionPalette {
  chip: string
  ring: string
  gradient: string
  bar: string
  text: string
}

const PALETTES: Record<string, SectionPalette> = {
  sky: {
    chip: 'bg-sky-500/12 text-sky-700 dark:text-sky-300',
    ring: 'ring-sky-500/25',
    gradient: 'from-sky-500/18 via-sky-500/6 to-transparent',
    bar: 'bg-sky-500',
    text: 'text-sky-600 dark:text-sky-400',
  },
  violet: {
    chip: 'bg-violet-500/12 text-violet-700 dark:text-violet-300',
    ring: 'ring-violet-500/25',
    gradient: 'from-violet-500/18 via-violet-500/6 to-transparent',
    bar: 'bg-violet-500',
    text: 'text-violet-600 dark:text-violet-400',
  },
  amber: {
    chip: 'bg-amber-500/14 text-amber-700 dark:text-amber-300',
    ring: 'ring-amber-500/25',
    gradient: 'from-amber-500/18 via-amber-500/6 to-transparent',
    bar: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
  },
  emerald: {
    chip: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
    ring: 'ring-emerald-500/25',
    gradient: 'from-emerald-500/18 via-emerald-500/6 to-transparent',
    bar: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  rose: {
    chip: 'bg-rose-500/12 text-rose-700 dark:text-rose-300',
    ring: 'ring-rose-500/25',
    gradient: 'from-rose-500/18 via-rose-500/6 to-transparent',
    bar: 'bg-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
  },
  slate: {
    chip: 'bg-slate-500/12 text-slate-700 dark:text-slate-300',
    ring: 'ring-slate-500/25',
    gradient: 'from-slate-500/18 via-slate-500/6 to-transparent',
    bar: 'bg-slate-500',
    text: 'text-slate-600 dark:text-slate-400',
  },
}

const ORDER = ['sky', 'violet', 'amber', 'emerald', 'rose', 'slate']

let cachedSections: { id: number; palette: SectionPalette }[] = []

export function paletteFor(accent?: string): SectionPalette {
  const key = (accent ?? '').toLowerCase()
  let name = ''
  if (/coffee|amber|orange|warm|trace/.test(key)) name = 'amber'
  else if (/violet|purple|indigo|front|layout/.test(key)) name = 'violet'
  else if (/emerald|green|java|spring/.test(key)) name = 'emerald'
  else if (/rose|red|pink|danger/.test(key)) name = 'rose'
  else if (/slate|gray|grey|neutral/.test(key)) name = 'slate'
  else if (/sky|blue|ocean|data|db|sql/.test(key)) name = 'sky'
  if (!name) {
    let sum = 0
    for (let i = 0; i < key.length; i += 1) sum += key.charCodeAt(i)
    name = ORDER[sum % ORDER.length]
  }
  return PALETTES[name]
}

const ICONS: Record<string, LucideIcon> = {
  java: Coffee,
  coffee: Coffee,
  database: Database,
  db: Database,
  sql: Database,
  frontend: LayoutTemplate,
  layout: LayoutTemplate,
  code: Code2,
  server: Server,
  book: BookOpen,
  sparkles: Sparkles,
}

export function sectionIcon(name?: string): LucideIcon {
  return ICONS[(name ?? '').toLowerCase()] ?? Sparkles
}

export const REASON_LABELS: Record<string, string> = {
  ARTICLE_PUBLISH: '文章奖励',
  ANSWER_REWARD: '回答奖励',
  RESOURCE_EXCHANGE: '资源兑换',
}

export function reasonLabel(reasonType: string): string {
  return REASON_LABELS[reasonType] ?? '积分变动'
}

export function rememberSectionPalette(id: number, palette: SectionPalette) {
  if (!cachedSections.some((item) => item.id === id)) cachedSections = [...cachedSections, { id, palette }]
}

export function paletteForSectionId(id: number): SectionPalette {
  return cachedSections.find((item) => item.id === id)?.palette ?? PALETTES.sky
}
