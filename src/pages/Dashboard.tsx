import { Radio, Calculator, ArrowRight, Activity, Wifi } from 'lucide-react'
import ToolCard from '../components/ToolCard'
import type { Tool } from '../types'

const tools: Tool[] = [
  { title: 'dBm Converter', description: 'Convert dBm to mW/W and back with precision.', path: '/rf/dbm', category: 'RF', icon: 'antenna' },
  { title: 'EIRP Calculator', description: 'Calculate effective isotropic radiated power.', path: '/rf/eirp', category: 'RF', icon: 'antenna' },
  { title: 'FSPL Calculator', description: 'Estimate free-space path loss from distance and frequency.', path: '/rf/fspl', category: 'RF', icon: 'antenna' },
  { title: 'Link Budget', description: 'Build a complete RF link budget from TX to RX.', path: '/rf/link-budget', category: 'RF', icon: 'antenna' },
  { title: 'Wi-Fi Channel Map', description: 'Explore 2.4, 5 and 6 GHz channel allocation.', path: '/wifi/channels', category: 'Wi-Fi', icon: 'radio' },
  { title: 'PHY Rate Calculator', description: 'Estimate Wi-Fi PHY rate from MCS, NSS and bandwidth.', path: '/wifi/phy-rate', category: 'Wi-Fi', icon: 'radio' },
  { title: 'MCS Reference', description: 'Quick reference for Wi-Fi modulation and coding rates.', path: '/wifi/mcs', category: 'Wi-Fi', icon: 'radio' },
  { title: 'IPv4 Subnet Calculator', description: 'Calculate network, broadcast, hosts and masks.', path: '/networking/subnet', category: 'Networking', icon: 'network' },
  { title: 'TCP BDP Calculator', description: 'Calculate bandwidth-delay product and TCP window.', path: '/performance/bdp', category: 'Performance', icon: 'activity' },
  { title: 'PoE Calculator', description: 'Estimate PoE power budget and cable losses.', path: '/poe', category: 'PoE', icon: 'zap' },
]

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