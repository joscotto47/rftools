import { useMemo, useState } from 'react'
import { Gauge, Info, RotateCcw, Wifi } from 'lucide-react'
import { MCS, WIDTHS, phyRate, type WifiGeneration } from '../../calculations/phyRate'
import { formatNumber } from '../../calculations/rf'
import { useI18n } from '../../i18n'

export default function PhyRateCalculator(){
  const { t } = useI18n()
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
    <div className="page-title"><div><div className="eyebrow"><Wifi size={14}/> {t('WI-FI / DESEMPENHO', 'WI-FI / PERFORMANCE')}</div>
      <h1>{t('Calculadora de MCS e PHY Rate', 'MCS & PHY Rate Calculator')}</h1>
      <p>{t(
        'Calcule a PHY Rate por tecnologia, MCS, largura de canal, spatial streams e guard interval.',
        'Calculate PHY rate by Wi-Fi generation, MCS, channel width, spatial streams and guard interval.',
      )}</p></div>
      <button className="ghost-btn" onClick={reset}><RotateCcw size={15}/> {t('Redefinir', 'Reset')}</button>
    </div>

    <div className="phy-layout">
      <section className="panel"><div className="panel-title">{t('Configuração PHY', 'PHY configuration')}</div>
        <div className="phy-input-grid">
          <F label={t('Geração Wi-Fi', 'Wi-Fi Generation')}><select value={gen} onChange={e=>changeGen(e.target.value as WifiGeneration)}>
            {(['Wi-Fi 5','Wi-Fi 6','Wi-Fi 7'] as WifiGeneration[]).map(x=><option key={x}>{x}</option>)}</select></F>
          <F label={t('Largura de canal', 'Channel Width')}><select value={width} onChange={e=>setWidth(+e.target.value)}>
            {WIDTHS[gen].map(x=><option key={x} value={x}>{x} MHz</option>)}</select></F>
          <F label={t('Índice MCS', 'MCS Index')}><select value={selected.mcs} onChange={e=>setMcs(+e.target.value)}>
            {list.map(x=><option key={x.mcs} value={x.mcs}>MCS {x.mcs}</option>)}</select></F>
          <F label="Spatial Streams (NSS)"><select value={nss} onChange={e=>setNss(+e.target.value)}>
            {[1,2,3,4,8].map(x=><option key={x} value={x}>{x} SS</option>)}</select></F>
          <F label="Guard Interval"><select value={gi} onChange={e=>setGi(+e.target.value)}>
            {(gen==='Wi-Fi 5'?[0.4,0.8]:[0.8,1.6,3.2]).map(x=><option key={x} value={x}>{x} µs</option>)}</select></F>
        </div>
        <div className="mcs-detail-strip">
          <D label={t('Modulação', 'Modulation')} value={selected.modulation}/><D label={t('Taxa de código', 'Coding Rate')} value={selected.codingRate}/>
          <D label={t('Bits / subportadora', 'Bits / Subcarrier')} value={String(selected.bits)}/><D label="Spatial Streams" value={`${nss} SS`}/>
        </div>
      </section>

      <section className="panel phy-result-panel"><div className="panel-title"><Gauge size={13}/> {t('Resultado', 'Result')}</div>
        <div className="phy-rate-hero"><span>PHY RATE</span><strong>{formatNumber(rate,1)}</strong><b>Mbps</b></div>
        <div className="throughput-estimate"><span>{t('Throughput estimado', 'Estimated throughput')}</span><strong>{formatNumber(throughput,1)} Mbps</strong>
          <div className="efficiency-control"><label>{t('Eficiência assumida', 'Assumed efficiency')}: {eff}%</label>
          <input type="range" min="30" max="85" value={eff} onChange={e=>setEff(+e.target.value)}/></div>
        </div>
      </section>
    </div>

    <section className="panel mcs-table-panel"><div className="panel-title">{t('Tabela MCS', 'MCS table')} · {gen} · {width} MHz · {nss} SS</div>
      <div className="mcs-table-wrap"><table className="mcs-table"><thead><tr>
        <th>MCS</th><th>{t('Modulação', 'Modulation')}</th><th>{t('Código', 'Coding')}</th><th>PHY Rate</th><th>{t('Throughput est.', 'Est. Throughput')}</th>
      </tr></thead><tbody>{list.map(x=>{const r=phyRate(gen,width,x,nss,gi);return <tr key={x.mcs} className={x.mcs===selected.mcs?'active':''} onClick={()=>setMcs(x.mcs)}>
        <td>MCS {x.mcs}</td><td>{x.modulation}</td><td>{x.codingRate}</td><td>{formatNumber(r,1)} Mbps</td><td>{formatNumber(r*eff/100,1)} Mbps</td>
      </tr>})}</tbody></table></div>
    </section>

    <section className="info-panel"><div className="eyebrow"><Info size={14}/> {t('NOTA DE ENGENHARIA', 'ENGINEERING NOTE')}</div>
      <h3>{t('PHY Rate não é throughput real.', 'PHY rate is not real throughput.')}</h3>
      <p>{t(
        'O throughput útil é menor devido a MAC overhead, preâmbulos, ACKs, contention, retransmissões, agregação e condições de RF. O percentual de eficiência é uma estimativa ajustável.',
        'Useful throughput is lower because of MAC overhead, preambles, ACKs, contention, retransmissions, aggregation and RF conditions. The efficiency percentage is an adjustable estimate.',
      )}</p>
    </section>
  </div>
}
function F({label,children}:{label:string;children:React.ReactNode}){return <div><label className="phy-label">{label}</label>{children}</div>}
function D({label,value}:{label:string;value:string}){return <div><span>{label}</span><strong>{value}</strong></div>}
