import { Radio, Calculator, ArrowRight, Activity, Wifi } from 'lucide-react'
import ToolCard from '../components/ToolCard'
import { TOOLS as tools } from '../data/tools'
import { useI18n } from '../i18n'

export default function Dashboard() {
  const { t } = useI18n()
  return (
    <>
      <section className="hero">
        <div>
          <div className="eyebrow"><Radio size={15} /> {t('FERRAMENTAS DE ENGENHARIA', 'ENGINEERING TOOLS')}</div>
          <h1>Network &amp; RF<br /><span>Engineering Suite</span></h1>
          <p>{t(
            'Calculadoras, referências e ferramentas visuais para engenharia de Wi-Fi, RF e redes.',
            'Calculators, references and visual tools for Wi-Fi, RF and network engineering.',
          )}</p>
        </div>
        <div className="hero-orbit"><div className="orbit-ring"></div><div className="orbit-core"><Wifi size={30}/></div></div>
      </section>

      <div className="section-heading">
        <div>
          <h2>{t('Ferramentas', 'Tools')}</h2>
          <p>{t('Comece por uma das ferramentas abaixo.', 'Start with one of the engineering utilities below.')}</p>
        </div>
        <div className="tool-count"><Calculator size={15}/> {tools.length} {t('ferramentas', 'tools')}</div>
      </div>

      <div className="tool-grid">
        {tools.map((tool) => <ToolCard key={tool.path} tool={tool} />)}
      </div>

      <section className="roadmap">
        <div className="roadmap-icon"><Activity size={20}/></div>
        <div>
          <div className="eyebrow">ROADMAP</div>
          <h3>{t('Feito para crescer até uma caixa de ferramentas de RF completa.', 'Built to grow into a complete RF toolbox.')}</h3>
          <p>{t(
            'Próximos módulos podem trazer tabelas de taxa 802.11ax/be, mapas de canais interativos, referências da ANATEL, padrões PoE e análise detalhada de enlace.',
            'Next modules can add 802.11ax/be rate tables, interactive channel maps, ANATEL references, PoE standards and detailed link analysis.',
          )}</p>
        </div>
        <ArrowRight size={20}/>
      </section>
    </>
  )
}
