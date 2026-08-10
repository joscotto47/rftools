import { useMemo, useState } from 'react'
import { Gauge, Info, RotateCcw, Wifi } from 'lucide-react'
import { MCS, WIDTHS, phyRate, type WifiGeneration } from '../../calculations/phyRate'
import { formatNumber } from '../../calculations/rf'

export default function PhyRateCalculator(){
  const [gen,setGen]=useState<WifiGeneration>('Wi-Fi 6')
  const [width,setWidth]=useState(80)
  const [mcs,setMcs]=useState(11)
  const [nss,setNss]=useState(2)
  const [gi,setGi]=useState(0.8)
  const [eff,setEff]=useState(65)
  const list=MCS[gen]
  const selected=list.find(x=>x.mcs===mcs) ?? list[list.length-1]
  const rate=useMemo(()=>phyRate(gen,width,selected,nss,gi),[gen,width,selected,nss,gi])
  const throughput=rate*eff/100

  function changeGen(v:WifiGeneration){
    setGen(v)
    const ws=WIDTHS[v]; if(!ws.includes(width)) setWidth(ws[ws.length-1])
    const max=MCS[v][MCS[v].length-1].mcs; if(mcs>max)setMcs(max)
    setGi(v==='Wi-Fi 5'?0.8:0.8)
  }
  function reset(){setGen('Wi-Fi 6');setWidth(80);setMcs(11);setNss(2);setGi(0.8);setEff(65)}

  return <div>
    <div className="page-title"><div><div className="eyebrow"><Wifi size={14}/> WI-FI / PERFORMANCE</div>
      <h1>MCS & PHY Rate Calculator</h1>
      <p>Calcule PHY Rate por tecnologia, MCS, Channel Width, Spatial Streams e Guard Interval.</p></div>
      <button className="ghost-btn" onClick={reset}><RotateCcw size={15}/> Redefinir</button>
    </div>

    <div className="phy-layout">
      <section className="panel"><div className="panel-title">Configuração PHY</div>
        <div className="phy-input-grid">
          <F label="Wi-Fi Generation"><select value={gen} onChange={e=>changeGen(e.target.value as WifiGeneration)}>
            {(['Wi-Fi 5','Wi-Fi 6','Wi-Fi 7'] as WifiGeneration[]).map(x=><option key={x}>{x}</option>)}</select></F>
          <F label="Channel Width"><select value={width} onChange={e=>setWidth(+e.target.value)}>
            {WIDTHS[gen].map(x=><option key={x} value={x}>{x} MHz</option>)}</select></F>
          <F label="MCS Index"><select value={selected.mcs} onChange={e=>setMcs(+e.target.value)}>
            {list.map(x=><option key={x.mcs} value={x.mcs}>MCS {x.mcs}</option>)}</select></F>
          <F label="Spatial Streams (NSS)"><select value={nss} onChange={e=>setNss(+e.target.value)}>
            {[1,2,3,4,8].map(x=><option key={x} value={x}>{x} SS</option>)}</select></F>
          <F label="Guard Interval"><select value={gi} onChange={e=>setGi(+e.target.value)}>
            {(gen==='Wi-Fi 5'?[0.4,0.8]:[0.8,1.6,3.2]).map(x=><option key={x} value={x}>{x} µs</option>)}</select></F>
        </div>
        <div className="mcs-detail-strip">
          <D label="Modulation" value={selected.modulation}/><D label="Coding Rate" value={selected.codingRate}/>
          <D label="Bits / Subcarrier" value={String(selected.bits)}/><D label="Spatial Streams" value={`${nss} SS`}/>
        </div>
      </section>

      <section className="panel phy-result-panel"><div className="panel-title"><Gauge size={13}/> Resultado</div>
        <div className="phy-rate-hero"><span>PHY RATE</span><strong>{formatNumber(rate,1)}</strong><b>Mbps</b></div>
        <div className="throughput-estimate"><span>Throughput estimado</span><strong>{formatNumber(throughput,1)} Mbps</strong>
          <div className="efficiency-control"><label>Eficiência assumida: {eff}%</label>
          <input type="range" min="30" max="85" value={eff} onChange={e=>setEff(+e.target.value)}/></div>
        </div>
      </section>
    </div>

    <section className="panel mcs-table-panel"><div className="panel-title">Tabela MCS · {gen} · {width} MHz · {nss} SS</div>
      <div className="mcs-table-wrap"><table className="mcs-table"><thead><tr>
        <th>MCS</th><th>Modulation</th><th>Coding</th><th>PHY Rate</th><th>Est. Throughput</th>
      </tr></thead><tbody>{list.map(x=>{const r=phyRate(gen,width,x,nss,gi);return <tr key={x.mcs} className={x.mcs===selected.mcs?'active':''} onClick={()=>setMcs(x.mcs)}>
        <td>MCS {x.mcs}</td><td>{x.modulation}</td><td>{x.codingRate}</td><td>{formatNumber(r,1)} Mbps</td><td>{formatNumber(r*eff/100,1)} Mbps</td>
      </tr>})}</tbody></table></div>
    </section>

    <section className="info-panel"><div className="eyebrow"><Info size={14}/> NOTA DE ENGENHARIA</div>
      <h3>PHY Rate não é throughput real.</h3><p>O throughput útil é menor devido a MAC overhead, preâmbulos, ACKs, contention, retransmissões, agregação e condições de RF. O percentual de eficiência é uma estimativa ajustável.</p>
    </section>
  </div>
}
function F({label,children}:{label:string;children:React.ReactNode}){return <div><label className="phy-label">{label}</label>{children}</div>}
function D({label,value}:{label:string;value:string}){return <div><span>{label}</span><strong>{value}</strong></div>}
