import { useMemo, useState } from 'react'
import { Copy, Info, Network, RotateCcw } from 'lucide-react'
import { calculateSubnet, maskToPrefix, prefixToMask } from '../../calculations/subnet'

export default function SubnetCalculator() {
  const [ip, setIp] = useState('192.168.1.100')
  const [prefix, setPrefix] = useState(24)
  const [maskInput, setMaskInput] = useState('255.255.255.0')
  const result = useMemo(() => calculateSubnet(ip, prefix), [ip, prefix])

  function changePrefix(next:number){ const p=Math.min(32,Math.max(0,next)); setPrefix(p); setMaskInput(prefixToMask(p)) }
  function applyMask(mask:string){ setMaskInput(mask); const p=maskToPrefix(mask); if(p!==null)setPrefix(p) }
  function reset(){ setIp('192.168.1.100'); setPrefix(24); setMaskInput('255.255.255.0') }

  return <div>
    <div className="page-title">
      <div><div className="eyebrow"><Network size={14}/> NETWORKING / IPV4</div><h1>IPv4 Subnet Calculator</h1><p>Calcule CIDR, subnet mask, network, broadcast e faixa de hosts.</p></div>
      <button className="ghost-btn" onClick={reset}><RotateCcw size={15}/> Redefinir</button>
    </div>

    <div className="subnet-layout">
      <section className="panel">
        <div className="panel-title">Entrada</div>
        <label className="subnet-label">IPv4 Address</label>
        <input className="subnet-input" value={ip} onChange={e=>setIp(e.target.value)} placeholder="192.168.1.100"/>
        <div className="subnet-two-col">
          <div><label className="subnet-label">CIDR Prefix</label><div className="field-with-unit"><input type="number" min="0" max="32" value={prefix} onChange={e=>changePrefix(Number(e.target.value))}/><span>/{prefix}</span></div></div>
          <div><label className="subnet-label">Subnet Mask</label><input className="subnet-input" value={maskInput} onChange={e=>applyMask(e.target.value)}/></div>
        </div>
        <div className="subnet-prefix-grid">{[8,16,20,21,22,23,24,25,26,27,28,29,30].map(p=><button key={p} className={prefix===p?'selected':''} onClick={()=>changePrefix(p)}>/{p}</button>)}</div>
      </section>

      <section className="panel">
        <div className="panel-title">Resultado</div>
        {!result ? <div className="subnet-error">Informe um IPv4 e prefixo válidos.</div> : <>
          <Result label="Network" value={`${result.network}/${result.prefix}`}/><Result label="Subnet Mask" value={result.mask}/><Result label="Wildcard Mask" value={result.wildcard}/>
          <Result label="Broadcast" value={result.broadcast}/><Result label="First Host" value={result.firstHost}/><Result label="Last Host" value={result.lastHost}/>
        </>}
      </section>
    </div>

    {result && <>
      <div className="subnet-metrics">
        <Metric label="Total Addresses" value={result.totalAddresses.toLocaleString('pt-BR')}/>
        <Metric label="Usable Hosts" value={result.usableHosts.toLocaleString('pt-BR')}/>
        <Metric label="Network Bits" value={String(result.prefix)}/>
        <Metric label="Host Bits" value={String(result.hostBits)}/>
      </div>
      <section className="panel subnet-range-panel"><div className="panel-title">Faixa da sub-rede</div>
        <div className="subnet-range-flow"><div><span>Network</span><strong>{result.network}</strong></div><b>→</b><div><span>Primeiro host</span><strong>{result.firstHost}</strong></div><b>→</b><div><span>Último host</span><strong>{result.lastHost}</strong></div><b>→</b><div><span>Broadcast</span><strong>{result.broadcast}</strong></div></div>
      </section>
    </>}

    <section className="info-panel"><div className="eyebrow"><Info size={14}/> NOTA DE ENGENHARIA</div><h3>/31 e /32 têm tratamento especial.</h3><p>Em /31, os dois endereços podem ser usados em enlaces ponto-a-ponto conforme RFC 3021. Em /32, existe apenas um endereço. Para prefixos /30 ou menores, network e broadcast não fazem parte da faixa tradicional de hosts utilizáveis.</p></section>
  </div>
}
function Result({label,value}:{label:string;value:string}){return <div className="subnet-result-row"><div><span>{label}</span><strong>{value}</strong></div><button onClick={()=>navigator.clipboard?.writeText(value)} title="Copiar"><Copy size={14}/></button></div>}
function Metric({label,value}:{label:string;value:string}){return <div className="panel subnet-metric"><span>{label}</span><strong>{value}</strong></div>}
