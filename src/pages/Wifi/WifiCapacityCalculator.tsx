import { useMemo, useState } from 'react'
import { Gauge, Info, RotateCcw, Users, Wifi } from 'lucide-react'
import {
  classifyCapacity,
  effectiveCapacityMbps,
  maxClientsForDemand,
  normalizedMcsShares,
  perClientThroughputMbps,
  totalAirtimeDemandPercent,
  weightedAirtimeCapacityMbps,
  type McsMixEntry,
} from '../../calculations/wifiCapacity'
import { MCS, WIDTHS, phyRate, type WifiGeneration } from '../../calculations/phyRate'
import { formatNumber } from '../../calculations/rf'


type RadioBand = '2.4 GHz' | '5 GHz' | '6 GHz'

type RadioConfig = {
  id: RadioBand
  enabled: boolean
  generation: WifiGeneration
  width: number
  mcs: number
  nss: number
  gi: number
  clientsPercent: number
}

const DEFAULT_RADIOS: RadioConfig[] = [
  { id: '2.4 GHz', enabled: true, generation: 'Wi-Fi 6', width: 20, mcs: 7, nss: 2, gi: 0.8, clientsPercent: 20 },
  { id: '5 GHz', enabled: true, generation: 'Wi-Fi 6', width: 80, mcs: 9, nss: 2, gi: 0.8, clientsPercent: 60 },
  { id: '6 GHz', enabled: true, generation: 'Wi-Fi 7', width: 160, mcs: 11, nss: 2, gi: 0.8, clientsPercent: 20 },
]

export default function WifiCapacityCalculator() {
  const [generation, setGeneration] = useState<WifiGeneration>('Wi-Fi 6')
  const [width, setWidth] = useState(80)
  const [mcs, setMcs] = useState(9)
  const [nss, setNss] = useState(2)
  const [gi, setGi] = useState(0.8)

  const [clients, setClients] = useState(30)
  const [concurrency, setConcurrency] = useState(40)
  const [efficiency, setEfficiency] = useState(65)
  const [airtimeLimit, setAirtimeLimit] = useState(70)
  const [demandPerClient, setDemandPerClient] = useState(5)
  const [capacityMode, setCapacityMode] = useState<'SIMPLE' | 'MIX'>('SIMPLE')
  const [apMode, setApMode] = useState<'SINGLE' | 'MULTI'>('SINGLE')
  const [radios, setRadios] = useState<RadioConfig[]>(DEFAULT_RADIOS)
  const [mcsMix, setMcsMix] = useState<Record<number, number>>({
    4: 20,
    7: 50,
    9: 30,
  })

  const mcsInfo =
    MCS[generation].find(item => item.mcs === mcs) ??
    MCS[generation][MCS[generation].length - 1]

  const mixEntries = useMemo<McsMixEntry[]>(() => {
    return normalizedMcsShares(
      MCS[generation]
        .filter(info => (mcsMix[info.mcs] ?? 0) > 0)
        .map(info => ({
          mcs: info.mcs,
          sharePercent: mcsMix[info.mcs] ?? 0,
          phyRateMbps: phyRate(generation, width, info, nss, gi),
        })),
    )
  }, [generation, width, nss, gi, mcsMix])

  const result = useMemo(() => {
    const phy = phyRate(generation, width, mcsInfo, nss, gi)

    const usableCapacity =
      capacityMode === 'MIX'
        ? weightedAirtimeCapacityMbps(mixEntries, efficiency, airtimeLimit)
        : effectiveCapacityMbps(phy, efficiency, airtimeLimit)

    const averagePhy =
      capacityMode === 'MIX' && mixEntries.length
        ? 100 / mixEntries.reduce(
            (sum, entry) => sum + entry.sharePercent / entry.phyRateMbps,
            0,
          )
        : phy

    const perClient = perClientThroughputMbps(
      usableCapacity,
      clients,
      concurrency,
    )

    const airtimeDemand = totalAirtimeDemandPercent(
      clients,
      demandPerClient,
      averagePhy,
      efficiency,
      concurrency,
    )

    const maxClients = maxClientsForDemand(
      averagePhy,
      efficiency,
      airtimeLimit,
      demandPerClient,
      concurrency,
    )

    const classification = classifyCapacity(airtimeDemand, airtimeLimit)

    return {
      phy,
      averagePhy,
      usableCapacity,
      perClient,
      airtimeDemand,
      maxClients,
      classification,
      activeClients: clients * concurrency / 100,
    }
  }, [
    generation,
    width,
    mcsInfo,
    nss,
    gi,
    clients,
    concurrency,
    efficiency,
    airtimeLimit,
    demandPerClient,
    capacityMode,
    mixEntries,
  ])

  const enabledRadios = useMemo(
    () => radios.filter(radio => radio.enabled),
    [radios],
  )

  const totalClientShare = useMemo(
    () => enabledRadios.reduce((sum, radio) => sum + Math.max(0, radio.clientsPercent), 0),
    [enabledRadios],
  )

  const multiRadioResult = useMemo(() => {
    if (apMode !== 'MULTI') return null

    const perRadio = enabledRadios.map(radio => {
      const info =
        MCS[radio.generation].find(item => item.mcs === radio.mcs) ??
        MCS[radio.generation][MCS[radio.generation].length - 1]

      const phy = phyRate(
        radio.generation,
        radio.width,
        info,
        radio.nss,
        radio.gi,
      )

      const normalizedShare =
        totalClientShare > 0
          ? Math.max(0, radio.clientsPercent) * 100 / totalClientShare
          : 0

      const associatedClients = clients * normalizedShare / 100
      const activeClients = associatedClients * concurrency / 100

      const usableCapacity = effectiveCapacityMbps(
        phy,
        efficiency,
        airtimeLimit,
      )

      const perClient = activeClients > 0
        ? usableCapacity / activeClients
        : usableCapacity

      const airtimeDemand = totalAirtimeDemandPercent(
        associatedClients,
        demandPerClient,
        phy,
        efficiency,
        concurrency,
      )

      return {
        ...radio,
        info,
        phy,
        normalizedShare,
        associatedClients,
        activeClients,
        usableCapacity,
        perClient,
        airtimeDemand,
        classification: classifyCapacity(airtimeDemand, airtimeLimit),
      }
    })

    const totalCapacity = perRadio.reduce((sum, radio) => sum + radio.usableCapacity, 0)
    const totalActive = perRadio.reduce((sum, radio) => sum + radio.activeClients, 0)
    const weightedPerClient =
      totalActive > 0 ? totalCapacity / totalActive : totalCapacity

    return {
      perRadio,
      totalCapacity,
      totalActive,
      weightedPerClient,
    }
  }, [
    apMode,
    enabledRadios,
    totalClientShare,
    clients,
    concurrency,
    efficiency,
    airtimeLimit,
    demandPerClient,
  ])

  function updateRadio(
    id: RadioBand,
    patch: Partial<RadioConfig>,
  ) {
    setRadios(current =>
      current.map(radio =>
        radio.id === id ? { ...radio, ...patch } : radio,
      ),
    )
  }

  function changeGeneration(next: WifiGeneration) {
    setGeneration(next)
    const widths = WIDTHS[next]
    if (!widths.includes(width)) setWidth(widths[widths.length - 1])
    const maxMcs = MCS[next][MCS[next].length - 1].mcs
    if (mcs > maxMcs) setMcs(maxMcs)
    setGi(next === 'Wi-Fi 5' ? 0.8 : 0.8)
  }

  function reset() {
    setGeneration('Wi-Fi 6')
    setWidth(80)
    setMcs(9)
    setNss(2)
    setGi(0.8)
    setClients(30)
    setConcurrency(40)
    setEfficiency(65)
    setAirtimeLimit(70)
    setDemandPerClient(5)
    setCapacityMode('SIMPLE')
    setApMode('SINGLE')
    setRadios(DEFAULT_RADIOS)
    setMcsMix({ 4: 20, 7: 50, 9: 30 })
  }

  return (
    <div>
      <div className="page-title">
        <div>
          <div className="eyebrow"><Wifi size={14}/> WI-FI / CAPACITY</div>
          <h1>Wi-Fi Capacity Calculator</h1>
          <p>
            Estime airtime, capacidade útil, throughput por cliente e quantidade
            de clientes suportados por rádio/AP.
          </p>
        </div>
        <button className="ghost-btn" onClick={reset}>
          <RotateCcw size={15}/> Redefinir
        </button>
      </div>

      <section className="capacity-mode-bar multi-mode-bar">
        <div>
          <span>Topologia do AP</span>
          <strong>
            {apMode === 'SINGLE'
              ? 'Single Radio'
              : 'Multi-Radio AP'}
          </strong>
        </div>

        <div className="capacity-mode-tabs">
          <button
            className={apMode === 'SINGLE' ? 'selected' : ''}
            onClick={() => setApMode('SINGLE')}
          >
            Single Radio
          </button>
          <button
            className={apMode === 'MULTI' ? 'selected' : ''}
            onClick={() => setApMode('MULTI')}
          >
            Multi-Radio
          </button>
        </div>

        {apMode === 'SINGLE' && (
          <>
            <div>
              <span>Modelo de capacidade</span>
              <strong>
                {capacityMode === 'SIMPLE'
                  ? 'PHY Rate único'
                  : 'Mix de clientes por MCS'}
              </strong>
            </div>
            <div className="capacity-mode-tabs">
              <button
                className={capacityMode === 'SIMPLE' ? 'selected' : ''}
                onClick={() => setCapacityMode('SIMPLE')}
              >
                Simple
              </button>
              <button
                className={capacityMode === 'MIX' ? 'selected' : ''}
                onClick={() => setCapacityMode('MIX')}
              >
                MCS Mix
              </button>
            </div>
          </>
        )}
      </section>

      {apMode === 'SINGLE' && (
      <>
      <div className="capacity-top-grid">
        <section className="panel">
          <div className="panel-title">Configuração PHY</div>

          <div className="capacity-input-grid">
            <Field label="Wi-Fi Generation">
              <select value={generation} onChange={e => changeGeneration(e.target.value as WifiGeneration)}>
                <option>Wi-Fi 5</option>
                <option>Wi-Fi 6</option>
                <option>Wi-Fi 7</option>
              </select>
            </Field>

            <Field label="Channel Width">
              <select value={width} onChange={e => setWidth(Number(e.target.value))}>
                {WIDTHS[generation].map(v => <option key={v} value={v}>{v} MHz</option>)}
              </select>
            </Field>

            {capacityMode === 'SIMPLE' && (
              <Field label="MCS">
                <select value={mcsInfo.mcs} onChange={e => setMcs(Number(e.target.value))}>
                  {MCS[generation].map(item => (
                    <option key={item.mcs} value={item.mcs}>
                      MCS {item.mcs} · {item.modulation}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <Field label="Spatial Streams">
              <select value={nss} onChange={e => setNss(Number(e.target.value))}>
                {[1,2,3,4,8].map(v => <option key={v} value={v}>{v} SS</option>)}
              </select>
            </Field>

            <Field label="Guard Interval">
              <select value={gi} onChange={e => setGi(Number(e.target.value))}>
                {(generation === 'Wi-Fi 5' ? [0.4,0.8] : [0.8,1.6,3.2]).map(v => (
                  <option key={v} value={v}>{v} µs</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="capacity-phy-strip">
            <div>
              <span>{capacityMode === 'MIX' ? 'PHY médio por airtime' : 'PHY Rate'}</span>
              <strong>{formatNumber(capacityMode === 'MIX' ? result.averagePhy : result.phy, 1)} Mbps</strong>
            </div>
            <div>
              <span>Modelo</span>
              <strong>{capacityMode === 'MIX' ? 'MCS Mix' : mcsInfo.modulation}</strong>
            </div>
            <div>
              <span>{capacityMode === 'MIX' ? 'Perfis ativos' : 'Coding Rate'}</span>
              <strong>{capacityMode === 'MIX' ? `${mixEntries.length} MCS` : mcsInfo.codingRate}</strong>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">Modelo de carga</div>

          <SliderField
            label="Clientes associados"
            value={clients}
            min={1}
            max={200}
            suffix=""
            onChange={setClients}
          />
          <SliderField
            label="Concorrência média"
            value={concurrency}
            min={5}
            max={100}
            suffix="%"
            onChange={setConcurrency}
          />
          <SliderField
            label="Eficiência MAC/PHY"
            value={efficiency}
            min={30}
            max={85}
            suffix="%"
            onChange={setEfficiency}
          />
          <SliderField
            label="Airtime utilizável alvo"
            value={airtimeLimit}
            min={40}
            max={90}
            suffix="%"
            onChange={setAirtimeLimit}
          />
          <SliderField
            label="Demanda por cliente ativo"
            value={demandPerClient}
            min={1}
            max={50}
            suffix=" Mbps"
            onChange={setDemandPerClient}
          />
        </section>
      </div>

      {capacityMode === 'MIX' && (
        <section className="panel mcs-mix-panel">
          <div className="panel-title">Distribuição de clientes por MCS</div>

          <div className="mcs-mix-summary">
            <span>
              Informe a distribuição percentual aproximada dos clientes ativos.
              Os valores são normalizados automaticamente para 100%.
            </span>
            <strong>
              {formatNumber(
                Object.values(mcsMix).reduce((sum, value) => sum + Math.max(0, value), 0),
                0,
              )}% informado
            </strong>
          </div>

          <div className="mcs-mix-grid">
            {MCS[generation].map(info => {
              const rate = phyRate(generation, width, info, nss, gi)
              const normalized =
                mixEntries.find(entry => entry.mcs === info.mcs)?.sharePercent ?? 0

              return (
                <div
                  key={info.mcs}
                  className={`mcs-mix-item ${(mcsMix[info.mcs] ?? 0) > 0 ? 'active' : ''}`}
                >
                  <div className="mcs-mix-item-head">
                    <div>
                      <strong>MCS {info.mcs}</strong>
                      <span>{info.modulation}</span>
                    </div>
                    <b>{formatNumber(rate, 0)} Mbps</b>
                  </div>

                  <div className="mcs-mix-input">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={mcsMix[info.mcs] ?? 0}
                      onChange={e =>
                        setMcsMix(current => ({
                          ...current,
                          [info.mcs]: Math.max(0, Number(e.target.value)),
                        }))
                      }
                    />
                    <span>%</span>
                  </div>

                  <small>
                    Normalizado: {formatNumber(normalized, 1)}%
                  </small>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section className={`panel capacity-status-panel ${result.classification.label.toLowerCase()}`}>
        <div className="capacity-status-icon">
          <Gauge size={28}/>
        </div>
        <div>
          <span>Capacity Status</span>
          <strong>{result.classification.label}</strong>
          <p>{result.classification.description}</p>
        </div>
        <div className="capacity-status-airtime">
          <span>Airtime Demand</span>
          <strong>{formatNumber(result.airtimeDemand, 1)}%</strong>
          <small>Limite alvo: {airtimeLimit}%</small>
        </div>
      </section>

      <div className="capacity-metrics-grid">
        <Metric
          icon={<Wifi size={18}/>}
          label="Capacidade útil estimada"
          value={`${formatNumber(result.usableCapacity, 1)} Mbps`}
          note={`PHY × ${efficiency}% eficiência × ${airtimeLimit}% airtime`}
        />
        <Metric
          icon={<Users size={18}/>}
          label="Clientes ativos estimados"
          value={formatNumber(result.activeClients, 1)}
          note={`${clients} associados × ${concurrency}% concorrência`}
        />
        <Metric
          icon={<Gauge size={18}/>}
          label="Throughput por cliente ativo"
          value={`${formatNumber(result.perClient, 1)} Mbps`}
          note="Divisão simples da capacidade útil entre clientes ativos"
        />
        <Metric
          icon={<Users size={18}/>}
          label="Máx. clientes para essa demanda"
          value={String(result.maxClients)}
          note={`${demandPerClient} Mbps por cliente ativo`}
        />
      </div>

      <section className="panel capacity-scenario-panel">
        <div className="panel-title">Cenário resumido</div>
        <div className="capacity-scenario-flow">
          <div>
            <span>{capacityMode === 'MIX' ? 'PHY médio airtime' : 'PHY Rate'}</span>
            <strong>{formatNumber(capacityMode === 'MIX' ? result.averagePhy : result.phy, 1)} Mbps</strong>
          </div>
          <b>×</b>
          <div>
            <span>Eficiência</span>
            <strong>{efficiency}%</strong>
          </div>
          <b>×</b>
          <div>
            <span>Airtime alvo</span>
            <strong>{airtimeLimit}%</strong>
          </div>
          <b>=</b>
          <div className="highlight">
            <span>Capacidade útil</span>
            <strong>{formatNumber(result.usableCapacity, 1)} Mbps</strong>
          </div>
        </div>
      </section>

      </>
      )}

      {apMode === 'MULTI' && multiRadioResult && (
        <>
          <section className="panel multi-radio-config-panel">
            <div className="panel-title">Rádios do AP</div>

            <div className="radio-config-grid">
              {radios.map(radio => {
                const currentMcs =
                  MCS[radio.generation].find(item => item.mcs === radio.mcs) ??
                  MCS[radio.generation][MCS[radio.generation].length - 1]

                return (
                  <div
                    key={radio.id}
                    className={`radio-config-card ${radio.enabled ? 'enabled' : 'disabled'}`}
                  >
                    <div className="radio-config-head">
                      <div>
                        <strong>{radio.id}</strong>
                        <span>{radio.enabled ? 'Ativo' : 'Desativado'}</span>
                      </div>
                      <label className="radio-toggle">
                        <input
                          type="checkbox"
                          checked={radio.enabled}
                          onChange={e =>
                            updateRadio(radio.id, { enabled: e.target.checked })
                          }
                        />
                        <span></span>
                      </label>
                    </div>

                    <Field label="Wi-Fi Generation">
                      <select
                        value={radio.generation}
                        disabled={!radio.enabled}
                        onChange={e => {
                          const next = e.target.value as WifiGeneration
                          const widths = WIDTHS[next]
                          const maxMcs = MCS[next][MCS[next].length - 1].mcs
                          updateRadio(radio.id, {
                            generation: next,
                            width: widths.includes(radio.width)
                              ? radio.width
                              : widths[widths.length - 1],
                            mcs: Math.min(radio.mcs, maxMcs),
                            gi: next === 'Wi-Fi 5' ? 0.8 : 0.8,
                          })
                        }}
                      >
                        <option>Wi-Fi 5</option>
                        <option>Wi-Fi 6</option>
                        <option>Wi-Fi 7</option>
                      </select>
                    </Field>

                    <div className="radio-config-row">
                      <Field label="Channel Width">
                        <select
                          value={radio.width}
                          disabled={!radio.enabled}
                          onChange={e =>
                            updateRadio(radio.id, { width: Number(e.target.value) })
                          }
                        >
                          {WIDTHS[radio.generation].map(value => (
                            <option key={value} value={value}>{value} MHz</option>
                          ))}
                        </select>
                      </Field>

                      <Field label="MCS">
                        <select
                          value={currentMcs.mcs}
                          disabled={!radio.enabled}
                          onChange={e =>
                            updateRadio(radio.id, { mcs: Number(e.target.value) })
                          }
                        >
                          {MCS[radio.generation].map(info => (
                            <option key={info.mcs} value={info.mcs}>
                              MCS {info.mcs}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    <div className="radio-config-row">
                      <Field label="Spatial Streams">
                        <select
                          value={radio.nss}
                          disabled={!radio.enabled}
                          onChange={e =>
                            updateRadio(radio.id, { nss: Number(e.target.value) })
                          }
                        >
                          {[1,2,3,4,8].map(value => (
                            <option key={value} value={value}>{value} SS</option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Guard Interval">
                        <select
                          value={radio.gi}
                          disabled={!radio.enabled}
                          onChange={e =>
                            updateRadio(radio.id, { gi: Number(e.target.value) })
                          }
                        >
                          {(radio.generation === 'Wi-Fi 5'
                            ? [0.4,0.8]
                            : [0.8,1.6,3.2]
                          ).map(value => (
                            <option key={value} value={value}>{value} µs</option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    <div className="radio-client-share">
                      <label>Distribuição de clientes</label>
                      <div>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={radio.clientsPercent}
                          disabled={!radio.enabled}
                          onChange={e =>
                            updateRadio(radio.id, {
                              clientsPercent: Math.max(0, Number(e.target.value)),
                            })
                          }
                        />
                        <span>%</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="multi-radio-note">
              Distribuição informada: {formatNumber(totalClientShare, 0)}%.
              O RFTools normaliza automaticamente os rádios ativos para 100%.
            </div>
          </section>

          <section className="panel multi-radio-summary-panel">
            <div className="panel-title">Capacidade total do AP</div>

            <div className="multi-radio-total-grid">
              <Metric
                icon={<Wifi size={18}/>}
                label="Capacidade útil total"
                value={`${formatNumber(multiRadioResult.totalCapacity, 1)} Mbps`}
                note="Soma da capacidade útil dos rádios ativos"
              />
              <Metric
                icon={<Users size={18}/>}
                label="Clientes ativos estimados"
                value={formatNumber(multiRadioResult.totalActive, 1)}
                note={`${clients} associados × ${concurrency}% concorrência`}
              />
              <Metric
                icon={<Gauge size={18}/>}
                label="Throughput médio por cliente"
                value={`${formatNumber(multiRadioResult.weightedPerClient, 1)} Mbps`}
                note="Capacidade total dividida pelos clientes ativos"
              />
            </div>

            <div className="radio-result-grid">
              {multiRadioResult.perRadio.map(radio => (
                <div
                  className={`radio-result-card ${radio.classification.label.toLowerCase()}`}
                  key={radio.id}
                >
                  <div className="radio-result-head">
                    <div>
                      <span>{radio.id}</span>
                      <strong>{radio.classification.label}</strong>
                    </div>
                    <b>{formatNumber(radio.normalizedShare, 1)}% clientes</b>
                  </div>

                  <div className="radio-result-metrics">
                    <div><span>PHY Rate</span><strong>{formatNumber(radio.phy, 1)} Mbps</strong></div>
                    <div><span>Capacidade útil</span><strong>{formatNumber(radio.usableCapacity, 1)} Mbps</strong></div>
                    <div><span>Airtime</span><strong>{formatNumber(radio.airtimeDemand, 1)}%</strong></div>
                    <div><span>Clientes ativos</span><strong>{formatNumber(radio.activeClients, 1)}</strong></div>
                    <div><span>Mbps / cliente</span><strong>{formatNumber(radio.perClient, 1)}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <section className="info-panel">
        <div className="eyebrow"><Info size={14}/> NOTA DE ENGENHARIA</div>
        <h3>Capacidade Wi-Fi depende de airtime, não apenas de PHY Rate.</h3>
        <p>
          Em Single Radio, o modelo usa PHY único ou MCS Mix. Em Multi-Radio, a capacidade
          é calculada por rádio e somada no AP, com distribuição de clientes normalizada.
          Redes reais sofrem impacto de clientes lentos,
          retransmissões, interferência co-channel, roaming, QoS, OFDMA, MU-MIMO,
          tamanho de frame, direção do tráfego e overhead de gerenciamento.
        </p>
      </section>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="capacity-label">{label}</label>
      {children}
    </div>
  )
}

function SliderField({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  suffix: string
  onChange: (value: number) => void
}) {
  return (
    <div className="capacity-slider">
      <div>
        <label>{label}</label>
        <strong>{value}{suffix}</strong>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
    </div>
  )
}

function Metric({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode
  label: string
  value: string
  note: string
}) {
  return (
    <div className="panel capacity-metric-card">
      <div className="capacity-metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </div>
  )
}
