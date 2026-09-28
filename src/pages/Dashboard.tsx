import { Radio, Calculator, ArrowRight, Activity, Wifi } from 'lucide-react'
import ToolCard from '../components/ToolCard'
import { TOOLS as tools } from '../data/tools'

export default function Dashboard() {
  return (
    <>
      <section className="hero">
        <div>
          <div className="eyebrow"><Radio size={15} /> ENGINEERING TOOLS</div>
          <h1>Network &amp; RF<br /><span>Engineering Suite</span></h1>
          <p>Calculators, references and visual tools for Wi-Fi, RF and network engineering.</p>
        </div>
        <div className="hero-orbit"><div className="orbit-ring"></div><div className="orbit-core"><Wifi size={30}/></div></div>
      </section>

      <div className="section-heading">
        <div><h2>Tools</h2><p>Start with one of the engineering utilities below.</p></div>
        <div className="tool-count"><Calculator size={15}/> {tools.length} tools</div>
      </div>

      <div className="tool-grid">
        {tools.map((tool) => <ToolCard key={tool.path} tool={tool} />)}
      </div>

      <section className="roadmap">
        <div className="roadmap-icon"><Activity size={20}/></div>
        <div>
          <div className="eyebrow">ROADMAP</div>
          <h3>Built to grow into a complete RF toolbox.</h3>
          <p>Next modules can add 802.11ax/be rate tables, interactive channel maps, ANATEL references, PoE standards and detailed link analysis.</p>
        </div>
        <ArrowRight size={20}/>
      </section>
    </>
  )
}