import { useMemo, useState } from 'react'
import {
  Activity,
  Info,
  RadioTower,
  RotateCcw,
  Signal,
  Waves,
} from 'lucide-react'
import {
  classifyLinkMargin,
  fresnelMidpointMeters,
  fsplDb,
  linkMarginDb,
  receivedPowerDbm,
} from '../../calculations/linkBudget'
import { formatNumber } from '../../calculations/rf'
import { MCS, phyRate, WIDTHS, type WifiGeneration } from '../../calculations/phyRate'
import {
  BUILTIN_SENSITIVITY_PROFILES,
  maxSupportedMcsFromProfile,
  sensitivityForWidthFromProfile,
  type SensitivityEntry,
  type SensitivityProfile,
} from '../../data/wifiSensitivity'

export default function LinkBudget() {
  const [frequencyGHz, setFrequencyGHz] = useState('5.8')
  const [distanceKm, setDistanceKm] = useState('5')

  const [txPowerDbm, setTxPowerDbm] = useState('23')
  const [txGainDbi, setTxGainDbi] = useState('18')
  const [txLossDb, setTxLossDb] = useState('1')

  const [rxGainDbi, setRxGainDbi] = useState('18')
  const [rxLossDb, setRxLossDb] = useState('1')
  const [sensitivityDbm, setSensitivityDbm] = useState('-75')
  const [wifiGeneration, setWifiGeneration] = useState<WifiGeneration>('Wi-Fi 6')
  const [wifiWidth, setWifiWidth] = useState(80)
  const [wifiNss, setWifiNss] = useState(2)
  const [wifiGi, setWifiGi] = useState(0.8)
  const [targetMcsMargin, setTargetMcsMargin] = useState(3)
  const [sensitivityMode, setSensitivityMode] = useState<'GENERIC' | 'CUSTOM'>('GENERIC')
  const [customProfileName, setCustomProfileName] = useState('Meu equipamento')
  const [customSensitivity, setCustomSensitivity] = useState<SensitivityEntry[]>(
    BUILTIN_SENSITIVITY_PROFILES.find(p => p.generation === 'Wi-Fi 6')!.base20MHz.map(x => ({ ...x }))
  )

  const values = useMemo(() => {
    const fGHz = Number(frequencyGHz)
    const dKm = Number(distanceKm)
    const txPower = Number(txPowerDbm)
    const txGain = Number(txGainDbi)
    const txLoss = Number(txLossDb)
    const rxGain = Number(rxGainDbi)
    const rxLoss = Number(rxLossDb)
    const sensitivity = Number(sensitivityDbm)

    if (![fGHz, dKm, txPower, txGain, txLoss, rxGain, rxLoss, sensitivity].every(Number.isFinite)) {
      return null
    }

    const frequencyMHz = fGHz * 1000
    const fspl = fsplDb(dKm, frequencyMHz)
    const eirp = txPower + txGain - txLoss
    const received = receivedPowerDbm(
      txPower,
      txGain,
      txLoss,
      fspl,
      rxGain,
      rxLoss,
    )
    const margin = linkMarginDb(received, sensitivity)
    const classification = classifyLinkMargin(margin)
    const fresnel = fresnelMidpointMeters(fGHz, dKm)

    return {
      fGHz,
      dKm,
      txPower,
      txGain,
      txLoss,
      rxGain,
      rxLoss,
      sensitivity,
      fspl,
      eirp,
      received,
      margin,
      classification,
      fresnel,
      fresnel60: fresnel * 0.6,
    }
  }, [
    frequencyGHz,
    distanceKm,
    txPowerDbm,
    txGainDbi,
    txLossDb,
    rxGainDbi,
    rxLossDb,
    sensitivityDbm,
  ])

  const activeSensitivityProfile = useMemo<SensitivityProfile>(() => {
    if (sensitivityMode === 'CUSTOM') {
      return {
        id: 'custom',
        name: customProfileName || 'Custom',
        generation: wifiGeneration,
        base20MHz: customSensitivity,
        description: 'Perfil de sensitivity personalizado pelo usuário.',
      }
    }

    return (
      BUILTIN_SENSITIVITY_PROFILES.find(
        profile => profile.generation === wifiGeneration,
      ) ?? BUILTIN_SENSITIVITY_PROFILES[0]
    )
  }, [sensitivityMode, customProfileName, customSensitivity, wifiGeneration])

  const wifiEstimate = useMemo(() => {
    if (!values) return null
    const supported = maxSupportedMcsFromProfile(
      activeSensitivityProfile,
      wifiWidth,
      values.received,
      targetMcsMargin,
    )
    if (!supported) return null

    const mcsInfo = MCS[wifiGeneration].find(item => item.mcs === supported.mcs)
    if (!mcsInfo) return null

    const phy = phyRate(wifiGeneration, wifiWidth, mcsInfo, wifiNss, wifiGi)
    return {
      mcs: supported.mcs,
      sensitivityDbm: supported.sensitivityDbm,
      marginDb: values.received - supported.sensitivityDbm,
      modulation: mcsInfo.modulation,
      codingRate: mcsInfo.codingRate,
      phy,
      throughput65: phy * 0.65,
    }
  }, [
    values,
    wifiGeneration,
    wifiWidth,
    wifiNss,
    wifiGi,
    targetMcsMargin,
    activeSensitivityProfile,
  ])

  const mcsRows = useMemo(() => {
    if (!values) return []
    const sens = sensitivityForWidthFromProfile(activeSensitivityProfile, wifiWidth)
    return MCS[wifiGeneration].map(info => {
      const s = sens.find(item => item.mcs === info.mcs)
      const rate = phyRate(wifiGeneration, wifiWidth, info, wifiNss, wifiGi)
      const margin = s ? values.received - s.sensitivityDbm : Number.NaN
      return {
        ...info,
        sensitivityDbm: s?.sensitivityDbm ?? Number.NaN,
        margin,
        supported: margin >= targetMcsMargin,
        rate,
      }
    })
  }, [
    values,
    wifiGeneration,
    wifiWidth,
    wifiNss,
    wifiGi,
    targetMcsMargin,
    activeSensitivityProfile,
  ])

  const reset = () => {
    setFrequencyGHz('5.8')
    setDistanceKm('5')
    setTxPowerDbm('23')
    setTxGainDbi('18')
    setTxLossDb('1')
    setRxGainDbi('18')
    setRxLossDb('1')
    setSensitivityDbm('-75')
    setWifiGeneration('Wi-Fi 6')
    setWifiWidth(80)
    setWifiNss(2)
    setWifiGi(0.8)
    setTargetMcsMargin(3)
    setSensitivityMode('GENERIC')
    setCustomProfileName('Meu equipamento')
    setCustomSensitivity(
      BUILTIN_SENSITIVITY_PROFILES.find(p => p.generation === 'Wi-Fi 6')!.base20MHz.map(x => ({ ...x }))
    )
  }

  return (
    <div>
      <div className="page-title">
        <div>
          <div className="eyebrow"><RadioTower size={14}/> RF / LINK</div>
          <h1>Link Budget Calculator</h1>
          <p>Calcule FSPL, potência recebida, Link Margin e Fresnel Zone para um enlace RF.</p>
        </div>
        <button className="ghost-btn" onClick={reset}>
          <RotateCcw size={15}/> Redefinir
        </button>
      </div>

      <section className="panel link-general-panel">
        <div className="panel-title">Parâmetros do enlace</div>
        <div className="link-general-grid">
          <Field
            label="Frequency"
            value={frequencyGHz}
            setValue={setFrequencyGHz}
            unit="GHz"
          />
          <Field
            label="Distance"
            value={distanceKm}
            setValue={setDistanceKm}
            unit="km"
          />
        </div>
      </section>

      <div className="link-budget-grid">
        <section className="panel">
          <div className="panel-title">TX Side</div>
          <Field label="TX Power" value={txPowerDbm} setValue={setTxPowerDbm} unit="dBm" />
          <Field label="TX Antenna Gain" value={txGainDbi} setValue={setTxGainDbi} unit="dBi" />
          <Field label="TX Cable / Path Loss" value={txLossDb} setValue={setTxLossDb} unit="dB" />

          <div className="link-summary-card">
            <span>EIRP</span>
            <strong>{values ? `${formatNumber(values.eirp, 2)} dBm` : '—'}</strong>
          </div>
        </section>

        <section className="panel path-panel">
          <div className="panel-title">Path</div>

          <div className="path-hero">
            <Waves size={22}/>
            <span>FSPL</span>
            <strong>{values ? `${formatNumber(values.fspl, 2)} dB` : '—'}</strong>
            <small>
              {values ? `${formatNumber(values.dKm, 2)} km @ ${formatNumber(values.fGHz, 3)} GHz` : '—'}
            </small>
          </div>

          <div className="rf-flow">
            <span>TX</span>
            <div className="rf-flow-line"></div>
            <b>{values ? `−${formatNumber(values.fspl, 1)} dB` : '—'}</b>
            <div className="rf-flow-line"></div>
            <span>RX</span>
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">RX Side</div>
          <Field label="RX Antenna Gain" value={rxGainDbi} setValue={setRxGainDbi} unit="dBi" />
          <Field label="RX Cable / Path Loss" value={rxLossDb} setValue={setRxLossDb} unit="dB" />
          <Field label="Receiver Sensitivity" value={sensitivityDbm} setValue={setSensitivityDbm} unit="dBm" />

          <div className="link-summary-card">
            <span>Received Power</span>
            <strong>{values ? `${formatNumber(values.received, 2)} dBm` : '—'}</strong>
          </div>
        </section>
      </div>

      {values && (
        <section className={`panel link-status-panel ${values.classification.label.toLowerCase()}`}>
          <div className="link-status-icon">
            <Signal size={28}/>
          </div>
          <div>
            <span>Link Status</span>
            <strong>{values.classification.label}</strong>
            <p>{values.classification.description}</p>
          </div>
          <div className="link-margin-box">
            <span>Link Margin</span>
            <strong>
              {values.margin >= 0 ? '+' : ''}
              {formatNumber(values.margin, 2)} dB
            </strong>
          </div>
        </section>
      )}

      <section className="panel link-wifi-panel">
        <div className="panel-title">Estimativa de MCS / PHY Rate</div>

        <div className="link-wifi-controls">
          <div>
            <label>Wi-Fi Generation</label>
            <select value={wifiGeneration} onChange={(e) => {
              const next = e.target.value as WifiGeneration
              setWifiGeneration(next)
              const widths = WIDTHS[next]
              if (!widths.includes(wifiWidth)) setWifiWidth(widths[widths.length - 1])
              setWifiGi(next === 'Wi-Fi 5' ? 0.8 : 0.8)
              if (sensitivityMode === 'CUSTOM') {
                const base = BUILTIN_SENSITIVITY_PROFILES.find(p => p.generation === next)
                if (base) setCustomSensitivity(base.base20MHz.map(x => ({ ...x })))
              }
            }}>
              <option>Wi-Fi 5</option>
              <option>Wi-Fi 6</option>
              <option>Wi-Fi 7</option>
            </select>
          </div>

          <div>
            <label>Channel Width</label>
            <select value={wifiWidth} onChange={(e) => setWifiWidth(Number(e.target.value))}>
              {WIDTHS[wifiGeneration].map(width => (
                <option key={width} value={width}>{width} MHz</option>
              ))}
            </select>
          </div>

          <div>
            <label>Spatial Streams</label>
            <select value={wifiNss} onChange={(e) => setWifiNss(Number(e.target.value))}>
              {[1,2,3,4,8].map(n => <option key={n} value={n}>{n} SS</option>)}
            </select>
          </div>

          <div>
            <label>Guard Interval</label>
            <select value={wifiGi} onChange={(e) => setWifiGi(Number(e.target.value))}>
              {(wifiGeneration === 'Wi-Fi 5' ? [0.4,0.8] : [0.8,1.6,3.2]).map(gi => (
                <option key={gi} value={gi}>{gi} µs</option>
              ))}
            </select>
          </div>

          <div>
            <label>Margem mínima por MCS</label>
            <select value={targetMcsMargin} onChange={(e) => setTargetMcsMargin(Number(e.target.value))}>
              {[0,3,6,10].map(m => <option key={m} value={m}>{m} dB</option>)}
            </select>
          </div>
        </div>

        <div className="sensitivity-profile-panel">
          <div className="sensitivity-profile-head">
            <div>
              <span>Receiver Sensitivity Profile</span>
              <strong>{activeSensitivityProfile.name}</strong>
            </div>
            <div className="sensitivity-mode-tabs">
              <button
                className={sensitivityMode === 'GENERIC' ? 'selected' : ''}
                onClick={() => setSensitivityMode('GENERIC')}
              >
                Generic
              </button>
              <button
                className={sensitivityMode === 'CUSTOM' ? 'selected' : ''}
                onClick={() => {
                  setSensitivityMode('CUSTOM')
                  const base = BUILTIN_SENSITIVITY_PROFILES.find(p => p.generation === wifiGeneration)
                  if (base) setCustomSensitivity(base.base20MHz.map(x => ({ ...x })))
                }}
              >
                Custom
              </button>
            </div>
          </div>

          {sensitivityMode === 'CUSTOM' && (
            <>
              <div className="custom-profile-name">
                <label>Nome do equipamento / perfil</label>
                <input
                  value={customProfileName}
                  onChange={(e) => setCustomProfileName(e.target.value)}
                />
              </div>

              <div className="custom-sensitivity-grid">
                {customSensitivity.map((entry, index) => (
                  <div className="custom-sensitivity-item" key={entry.mcs}>
                    <span>MCS {entry.mcs}</span>
                    <div className="field-with-unit">
                      <input
                        value={entry.sensitivityDbm}
                        onChange={(e) => {
                          const next = [...customSensitivity]
                          next[index] = {
                            ...entry,
                            sensitivityDbm: Number(e.target.value),
                          }
                          setCustomSensitivity(next)
                        }}
                        inputMode="decimal"
                      />
                      <span>dBm</span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="custom-profile-note">
                Valores informados como sensitivity de referência em 20 MHz. O RFTools aplica
                automaticamente o ajuste por Channel Width.
              </p>
            </>
          )}
        </div>

        {wifiEstimate ? (
          <>
            <div className="wifi-estimate-hero">
              <div>
                <span>MCS estimado</span>
                <strong>MCS {wifiEstimate.mcs}</strong>
                <small>{wifiEstimate.modulation} · {wifiEstimate.codingRate}</small>
              </div>
              <div>
                <span>PHY Rate</span>
                <strong>{formatNumber(wifiEstimate.phy, 1)} Mbps</strong>
                <small>Throughput ~{formatNumber(wifiEstimate.throughput65, 1)} Mbps @ 65%</small>
              </div>
              <div>
                <span>Margem nesse MCS</span>
                <strong>+{formatNumber(wifiEstimate.marginDb, 1)} dB</strong>
                <small>
                  Sensibilidade estimada: {formatNumber(wifiEstimate.sensitivityDbm, 1)} dBm
                  · {activeSensitivityProfile.name}
                </small>
              </div>
            </div>

            <div className="mcs-link-table-wrap">
              <table className="mcs-link-table">
                <thead>
                  <tr>
                    <th>MCS</th>
                    <th>Modulation</th>
                    <th>Sensitivity</th>
                    <th>Margin</th>
                    <th>PHY Rate</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mcsRows.map(row => (
                    <tr key={row.mcs} className={row.supported ? 'supported' : 'unsupported'}>
                      <td>MCS {row.mcs}</td>
                      <td>{row.modulation}</td>
                      <td>{formatNumber(row.sensitivityDbm, 1)} dBm</td>
                      <td>{row.margin >= 0 ? '+' : ''}{formatNumber(row.margin, 1)} dB</td>
                      <td>{formatNumber(row.rate, 1)} Mbps</td>
                      <td>{row.supported ? 'OK' : 'NO'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="wifi-estimate-fail">
            A potência recebida está abaixo da sensibilidade estimada necessária para o MCS mínimo com a margem selecionada.
          </div>
        )}
      </section>

      <section className="panel fresnel-panel">
        <div className="panel-title"><Activity size={13}/> Fresnel Zone</div>

        <div className="fresnel-grid">
          <div className="fresnel-visual">
            <div className="fresnel-endpoint">TX</div>
            <div className="fresnel-ellipse"></div>
            <div className="fresnel-center-line"></div>
            <div className="fresnel-endpoint">RX</div>
          </div>

          <div className="fresnel-metrics">
            <Metric
              label="F1 no ponto médio"
              value={values ? `${formatNumber(values.fresnel, 2)} m` : '—'}
            />
            <Metric
              label="Clearance recomendado (60%)"
              value={values ? `${formatNumber(values.fresnel60, 2)} m` : '—'}
            />
          </div>
        </div>
      </section>

      <section className="info-panel">
        <div className="eyebrow"><Info size={14}/> NOTA DE ENGENHARIA</div>
        <h3>FSPL representa apenas a perda ideal em espaço livre.</h3>
        <p>
          Obstáculos, vegetação, chuva, multipath, desalinhamento de antenas, interferência
          e obstrução da Fresnel Zone podem aumentar significativamente a perda real do enlace.
          A Link Margin deve ser interpretada como margem teórica antes dessas perdas adicionais.
        </p>
      </section>
    </div>
  )
}

function Field({
  label,
  value,
  setValue,
  unit,
}: {
  label: string
  value: string
  setValue: (value: string) => void
  unit: string
}) {
  return (
    <div className="link-field">
      <label>{label}</label>
      <div className="field-with-unit">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inputMode="decimal"
        />
        <span>{unit}</span>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="fresnel-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
