import { NavLink, Outlet } from 'react-router-dom'
import {
  Activity, Antenna, ChevronDown, Gauge, Home, Network, Radio,
  Settings, Zap
} from 'lucide-react'
import { useState } from 'react'
import { TOOLS } from '../data/tools'
import type { ToolCategory } from '../types'

const SECTION_ICONS: Record<ToolCategory, typeof Antenna> = { RF: Antenna, 'Wi-Fi': Radio, Networking: Network, PoE: Zap }

const sections = (Object.keys(SECTION_ICONS) as ToolCategory[]).map((label) => ({
  label,
  icon: SECTION_ICONS[label],
  items: TOOLS.filter((tool) => tool.category === label).map((tool) => [tool.name, tool.path] as const),
}))

export default function Layout() {
  const [open, setOpen] = useState<Record<string, boolean>>(Object.fromEntries(sections.map((s) => [s.label, true])))

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Gauge size={22} /></div>
          <div><div className="brand-name">RFTOOLS</div><div className="brand-sub">ENGINEERING SUITE</div></div>
        </div>

        <NavLink to="/" end className={({ isActive }) => `nav-home ${isActive ? 'active' : ''}`}><Home size={17} /> Dashboard</NavLink>
        <div className="sidebar-label">FERRAMENTAS</div>

        {sections.map(({ label, icon: Icon, items }) => (
          <div className="nav-section" key={label}>
            <button className="section-toggle" onClick={() => setOpen((v) => ({ ...v, [label]: !v[label] }))}>
              <span><Icon size={16} /> {label}</span><ChevronDown size={15} className={open[label] ? '' : 'rotate'} />
            </button>
            {open[label] && <div className="section-items">{items.map(([title, path]) => (
              <NavLink key={path} to={path} className={({ isActive }) => isActive ? 'tool-link active' : 'tool-link'}>{title}</NavLink>
            ))}</div>}
          </div>
        ))}

        <div className="sidebar-bottom">
          <button className="settings"><Settings size={16} /> Configurações</button>
          <div className="version">RFTOOLS v2.5.2</div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="breadcrumb">FERRAMENTAS DE NETWORKING &amp; RF</div>
          <div className="top-actions"><span className="status-dot"></span>Cálculos locais</div>
        </header>
        <div className="content"><Outlet /></div>
      </main>
    </div>
  )
}
