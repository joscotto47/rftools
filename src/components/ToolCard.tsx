import { Link } from 'react-router-dom'
import { ArrowUpRight, Antenna, Radio, Network, Zap } from 'lucide-react'
import type { Tool, ToolCategory } from '../types'

const icons: Record<ToolCategory, typeof Antenna> = { RF: Antenna, 'Wi-Fi': Radio, Networking: Network, PoE: Zap }

export default function ToolCard({ tool }: { tool: Tool }) {
  const Icon = icons[tool.category]
  return (
    <Link to={tool.path} className="tool-card">
      <div className="tool-card-top">
        <div className="tool-icon"><Icon size={20} /></div>
        <ArrowUpRight size={17} className="arrow" />
      </div>
      <div className="tool-category">{tool.category}</div>
      <h3>{tool.title}</h3>
      <p>{tool.description}</p>
    </Link>
  )
}