import { NavLink, Outlet } from 'react-router-dom'
import { ChevronDown, Gauge, Home } from 'lucide-react'
import { useState } from 'react'
import { TOOLS } from '../data/tools'
import type { ToolCategory } from '../types'
import { CATEGORY_ICONS, CATEGORY_LABELS } from './ToolCard'
import { useI18n, type Lang } from '../i18n'

const sections = (Object.keys(CATEGORY_ICONS) as ToolCategory[]).map((category) => ({
  category,
  icon: CATEGORY_ICONS[category],
  items: TOOLS.filter((tool) => tool.category === category),
}))

const LANGS: Array<{ id: Lang; label: string; title: string }> = [
  { id: 'pt', label: 'PT', title: 'Português' },
  { id: 'en', label: 'EN', title: 'English' },
]

export default function Layout() {
  const { t, tl, lang, setLang } = useI18n()
  const [open, setOpen] = useState<Record<string, boolean>>(Object.fromEntries(sections.map((s) => [s.category, true])))

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Gauge size={22} /></div>
          <div><div className="brand-name">RFTOOLS</div><div className="brand-sub">ENGINEERING SUITE</div></div>
        </div>

        <NavLink to="/" end className={({ isActive }) => `nav-home ${isActive ? 'active' : ''}`}><Home size={17} /> {t('Início', 'Dashboard')}</NavLink>
        <div className="sidebar-label">{t('FERRAMENTAS', 'TOOLS')}</div>

        {sections.map(({ category, icon: Icon, items }) => (
          <div className="nav-section" key={category}>
            <button className="section-toggle" onClick={() => setOpen((v) => ({ ...v, [category]: !v[category] }))}>
              <span><Icon size={16} /> {tl(CATEGORY_LABELS[category])}</span><ChevronDown size={15} className={open[category] ? '' : 'rotate'} />
            </button>
            {open[category] && <div className="section-items">{items.map((tool) => (
              <NavLink key={tool.path} to={tool.path} className={({ isActive }) => isActive ? 'tool-link active' : 'tool-link'}>{tl(tool.name)}</NavLink>
            ))}</div>}
          </div>
        ))}

        <div className="sidebar-bottom">
          <div className="version">RFTOOLS v2.5.2</div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="breadcrumb">{t('FERRAMENTAS DE REDES E RF', 'NETWORKING & RF TOOLS')}</div>
          <div className="top-actions">
            <span className="status-dot"></span>{t('Cálculos locais', 'Local calculations')}
            <div className="lang-switch" role="group" aria-label={t('Idioma', 'Language')}>
              {LANGS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  title={item.title}
                  aria-pressed={lang === item.id}
                  className={lang === item.id ? 'active' : ''}
                  onClick={() => setLang(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </header>
        <div className="content"><Outlet /></div>
      </main>
    </div>
  )
}
