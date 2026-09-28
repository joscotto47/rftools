import { Link } from 'react-router-dom'
import { ArrowUpRight, Antenna, Radio, Network, Zap } from 'lucide-react'
import type { Tool, ToolCategory } from '../types'
import { useI18n, type Localized } from '../i18n'

export const CATEGORY_ICONS: Record<ToolCategory, typeof Antenna> = { RF: Antenna, 'Wi-Fi': Radio, Networking: Network, PoE: Zap }

export const CATEGORY_LABELS: Record<ToolCategory, Localized> = {
  RF: { pt: 'RF', en: 'RF' },
  'Wi-Fi': { pt: 'Wi-Fi', en: 'Wi-Fi' },
  Networking: { pt: 'Redes', en: 'Networking' },
  PoE: { pt: 'PoE', en: 'PoE' },
}

export default function ToolCard({ tool }: { tool: Tool }) {
  const { tl } = useI18n()
  const Icon = CATEGORY_ICONS[tool.category]
  return (
    <Link to={tool.path} className="tool-card">
      <div className="tool-card-top">
        <div className="tool-icon"><Icon size={20} /></div>
        <ArrowUpRight size={17} className="arrow" />
      </div>
      <div className="tool-category">{tl(CATEGORY_LABELS[tool.category])}</div>
      <h3>{tl(tool.name)}</h3>
      <p>{tl(tool.description)}</p>
    </Link>
  )
}
