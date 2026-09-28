import { useMemo, useState } from 'react'
import { Copy, Info, Network, RotateCcw } from 'lucide-react'
import { calculateSubnet, maskToPrefix, prefixToMask } from '../../calculations/subnet'
import { useI18n } from '../../i18n'

export default function SubnetCalculator() {
  const { t, lang } = useI18n()
  const [ip, setIp] = useState('192.168.1.100')
  const [prefix, setPrefix] = useState(24)
  const [maskInput, setMaskInput] = useState('255.255.255.0')
  const result = useMemo(() => calculateSubnet(ip, prefix), [ip, prefix])
  const locale = lang === 'pt' ? 'pt-BR' : 'en-US'
  const copy = t('Copiar', 'Copy')

  function changePrefix(next:number){ const p=Math.min(32,Math.max(0,next)); setPrefix(p); setMaskInput(prefixToMask(p)) }
  function applyMask(mask:string){ setMaskInput(mask); const p=maskToPrefix(mask); if(p!==null)setPrefix(p) }
  function reset(){ setIp('192.168.1.100'); setPrefix(24); setMaskInput('255.255.255.0') }

  return <div>
    <div className="page-title">
      <div>
        <div className="eyebrow"><Network size={14}/> {t('REDES / IPV4', 'NETWORKING / IPV4')}</div>
        <h1>{t('Calculadora de Sub-rede IPv4', 'IPv4 Subnet Calculator')}</h1>
        <p>{t('Calcule CIDR, máscara de sub-rede, rede, broadcast e faixa de hosts.', 'Calculate CIDR, subnet mask, network, broadcast and host range.')}</p>
      </div>
      <button className="ghost-btn" onClick={reset}><RotateCcw size={15}/> {t('Redefinir', 'Reset')}</button>
    </div>

    <div className="subnet-layout">
      <section className="panel">
        <div className="panel-title">{t('Entrada', 'Input')}</div>
        <label className="subnet-label">{t('Endereço IPv4', 'IPv4 Address')}</label>
        <input className="subnet-input" value={ip} onChange={e=>setIp(e.target.value)} placeholder="192.168.1.100"/>
        <div className="subnet-two-col">
          <div><label className="subnet-label">{t('Prefixo CIDR', 'CIDR Prefix')}</label><div className="field-with-unit"><input type="number" min="0" max="32" value={prefix} onChange={e=>changePrefix(Number(e.target.value))}/><span>/{prefix}</span></div></div>
          <div><label className="subnet-label">{t('Máscara de sub-rede', 'Subnet Mask')}</label><input className="subnet-input" value={maskInput} onChange={e=>applyMask(e.target.value)}/></div>
        </div>
        <div className="subnet-prefix-grid">{[8,16,20,21,22,23,24,25,26,27,28,29,30].map(p=><button key={p} className={prefix===p?'selected':''} onClick={()=>changePrefix(p)}>/{p}</button>)}</div>
      </section>

      <section className="panel">
        <div className="panel-title">{t('Resultado', 'Result')}</div>
        {!result ? <div className="subnet-error">{t('Informe um IPv4 e prefixo válidos.', 'Enter a valid IPv4 address and prefix.')}</div> : <>
          <Result label={t('Rede', 'Network')} value={`${result.network}/${result.prefix}`} copy={copy}/>
          <Result label={t('Máscara de sub-rede', 'Subnet Mask')} value={result.mask} copy={copy}/>
          <Result label="Wildcard Mask" value={result.wildcard} copy={copy}/>
          <Result label="Broadcast" value={result.broadcast} copy={copy}/>
          <Result label={t('Primeiro host', 'First Host')} value={result.firstHost} copy={copy}/>
          <Result label={t('Último host', 'Last Host')} value={result.lastHost} copy={copy}/>
        </>}
      </section>
    </div>

    {result && <>
      <div className="subnet-metrics">
        <Metric label={t('Total de endereços', 'Total Addresses')} value={result.totalAddresses.toLocaleString(locale)}/>
        <Metric label={t('Hosts utilizáveis', 'Usable Hosts')} value={result.usableHosts.toLocaleString(locale)}/>
        <Metric label={t('Bits de rede', 'Network Bits')} value={String(result.prefix)}/>
        <Metric label={t('Bits de host', 'Host Bits')} value={String(result.hostBits)}/>
      </div>
      <section className="panel subnet-range-panel"><div className="panel-title">{t('Faixa da sub-rede', 'Subnet range')}</div>
        <div className="subnet-range-flow">
          <div><span>{t('Rede', 'Network')}</span><strong>{result.network}</strong></div><b>→</b>
          <div><span>{t('Primeiro host', 'First host')}</span><strong>{result.firstHost}</strong></div><b>→</b>
          <div><span>{t('Último host', 'Last host')}</span><strong>{result.lastHost}</strong></div><b>→</b>
          <div><span>Broadcast</span><strong>{result.broadcast}</strong></div>
        </div>
      </section>
    </>}

    <section className="info-panel">
      <div className="eyebrow"><Info size={14}/> {t('NOTA DE ENGENHARIA', 'ENGINEERING NOTE')}</div>
      <h3>{t('/31 e /32 têm tratamento especial.', '/31 and /32 are special cases.')}</h3>
      <p>{t(
        'Em /31, os dois endereços podem ser usados em enlaces ponto-a-ponto conforme RFC 3021. Em /32, existe apenas um endereço. Para prefixos /30 ou menores, network e broadcast não fazem parte da faixa tradicional de hosts utilizáveis.',
        'On /31, both addresses can be used on point-to-point links per RFC 3021. A /32 holds a single address. For /30 and shorter prefixes, the network and broadcast addresses are not part of the usable host range.',
      )}</p>
    </section>
  </div>
}
function Result({label,value,copy}:{label:string;value:string;copy:string}){return <div className="subnet-result-row"><div><span>{label}</span><strong>{value}</strong></div><button onClick={()=>navigator.clipboard?.writeText(value)} title={copy}><Copy size={14}/></button></div>}
function Metric({label,value}:{label:string;value:string}){return <div className="panel subnet-metric"><span>{label}</span><strong>{value}</strong></div>}
