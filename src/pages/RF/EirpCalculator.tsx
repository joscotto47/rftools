import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  Copy,
  Info,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import {
  calculateEirp,
  calculateTxPowerFromEirp,
  dbmToMw,
  dbmToW,
  formatNumber,
} from '../../calculations/rf'
import {
  getChannelConfigs,
  WIDTHS_BY_BAND,
  type ChannelWidth,
  type WifiBand,
} from '../../data/wifiChannels'
import {
  getEffectivePowerLimits,
  type ApplicationType,
  type RegulatoryDeviceType,
} from '../../data/regulatoryPower'

const STREAM_OPTIONS = [1, 2, 3, 4, 8]
const BANDS: WifiBand[] = ['2.4 GHz', '5 GHz', '6 GHz']

export default function EirpCalculator() {
  const [txPower, setTxPower] = useState('23')
  const [antennaGain, setAntennaGain] = useState('5')
  const [pathLoss, setPathLoss] = useState('1')
  const [spatialStreams, setSpatialStreams] = useState(2)
  const [mode, setMode] = useState<'eirp' | 'tx'>('eirp')

  const [regulatoryEnabled, setRegulatoryEnabled] = useState(true)
  const [band, setBand] = useState<WifiBand>('5 GHz')
  const [width, setWidth] = useState<ChannelWidth>(80)
  const [channel, setChannel] = useState(42)
  const [deviceType, setDeviceType] = useState<RegulatoryDeviceType>('AP')
  const [applicationType, setApplicationType] = useState<ApplicationType>('GENERAL')

  const channelConfigs = useMemo(
    () => getChannelConfigs(band, width),
    [band, width],
  )

  const selectedConfig =
    channelConfigs.find((item) => item.channel === channel) ?? channelConfigs[0] ?? null

  const values = useMemo(() => {
    const tx = Number(txPower)
    const gain = Number(antennaGain)
    const loss = Number(pathLoss)

    if (![tx, gain, loss].every(Number.isFinite)) return null

    const streamFactorDb = 10 * Math.log10(spatialStreams)
    const eirp = calculateEirp(tx, gain, loss, spatialStreams)
    const resultingTx = calculateTxPowerFromEirp(eirp, gain, loss, spatialStreams)

    return {
      tx,
      gain,
      loss,
      spatialStreams,
      streamFactorDb,
      eirp,
      resultingTx,
      mw: dbmToMw(eirp),
      watts: dbmToW(eirp),
    }
  }, [txPower, antennaGain, pathLoss, spatialStreams])

  const limits = useMemo(
    () => regulatoryEnabled && selectedConfig
      ? getEffectivePowerLimits(
          selectedConfig,
          deviceType,
          Number(antennaGain) || 0,
          applicationType,
        )
      : null,
    [regulatoryEnabled, selectedConfig, deviceType, antennaGain, applicationType],
  )

  const regulatoryResult = useMemo(() => {
    if (!values || !limits) return null

    const eirpPass =
      limits.maxEirpDbm === undefined || values.eirp <= limits.maxEirpDbm

    const txPass =
      limits.adjustedMaxConductedDbm === undefined || values.tx <= limits.adjustedMaxConductedDbm

    const eirpMargin =
      limits.maxEirpDbm !== undefined ? limits.maxEirpDbm - values.eirp : undefined

    const txMargin =
      limits.adjustedMaxConductedDbm !== undefined ? limits.adjustedMaxConductedDbm - values.tx : undefined

    return {
      pass: eirpPass && txPass,
      eirpPass,
      txPass,
      eirpMargin,
      txMargin,
    }
  }, [values, limits])

  const reset = () => {
    setTxPower('23')
    setAntennaGain('5')
    setPathLoss('1')
    setSpatialStreams(2)
    setMode('eirp')
    setRegulatoryEnabled(true)
    setBand('5 GHz')
    setWidth(80)
    setChannel(42)
    setDeviceType('AP')
    setApplicationType('GENERAL')
  }

  function changeBand(nextBand: WifiBand) {
    const supported = WIDTHS_BY_BAND[nextBand]
    const nextWidth = supported.includes(width) ? width : supported[0]
    setBand(nextBand)
    setWidth(nextWidth)

    const first = getChannelConfigs(nextBand, nextWidth)[0]
    setChannel(first?.channel ?? 1)

    if (nextBand !== '6 GHz' && deviceType === 'VLP') {
      setDeviceType('AP')
    }
  }

  function changeWidth(nextWidth: ChannelWidth) {
    setWidth(nextWidth)
    const first = getChannelConfigs(band, nextWidth)[0]
    setChannel(first?.channel ?? 1)
  }

  const formula = 'EIRP = TX Power + Antenna Gain − Path Loss + 10·log₁₀(NSS)'

  return (
    <div>
      <div className="page-title">
        <div>
          <div className="eyebrow">RF / POWER</div>
          <h1>Calculadora de EIRP</h1>
          <p>
            Calcule EIRP considerando TX Power, Antenna Gain, perdas, Spatial Streams
            e compare o resultado com o perfil Brasil / ANATEL.
          </p>
        </div>
        <button className="ghost-btn" onClick={reset}>
          <RotateCcw size={15} /> Redefinir
        </button>
      </div>

      <div className="calculator-layout">
        <section className="panel input-panel">
          <div className="panel-title">Parâmetros RF</div>

          <label>TX Power por Spatial Stream</label>
          <div className="field-with-unit">
            <input value={txPower} onChange={(e) => setTxPower(e.target.value)} inputMode="decimal" />
            <span>dBm</span>
          </div>

          <label>Antenna Gain</label>
          <div className="field-with-unit">
            <input value={antennaGain} onChange={(e) => setAntennaGain(e.target.value)} inputMode="decimal" />
            <span>dBi</span>
          </div>

          <label>Path / Cable Loss</label>
          <div className="field-with-unit">
            <input value={pathLoss} onChange={(e) => setPathLoss(e.target.value)} inputMode="decimal" />
            <span>dB</span>
          </div>

          <label>Spatial Streams (NSS)</label>
          <select
            className="full-select"
            value={spatialStreams}
            onChange={(e) => setSpatialStreams(Number(e.target.value))}
          >
            {STREAM_OPTIONS.map((streams) => (
              <option key={streams} value={streams}>
                {streams} Spatial Stream{streams > 1 ? 's' : ''}
              </option>
            ))}
          </select>

          <div className="formula-box">
            <span>Fórmula</span>
            <code>{formula}</code>
          </div>
        </section>

        <div className="conversion-arrow"></div>

        <section className="panel results-panel">
          <div className="panel-title">Resultado</div>

          <div className="eirp-hero">
            <span>EIRP</span>
            <strong>{values ? `${formatNumber(values.eirp, 3)} dBm` : '—'}</strong>
            <small>
              {values
                ? `${formatNumber(values.mw, 3)} mW · ${formatNumber(values.watts, 6)} W`
                : '—'}
            </small>
          </div>

          <div className="result-row">
            <div>
              <span>TX Power / Spatial Stream</span>
              <strong>{values ? `${formatNumber(values.tx, 3)} dBm` : '—'}</strong>
            </div>
            <CopyButton value={values ? `${values.tx} dBm` : ''} />
          </div>

          <div className="result-row">
            <div>
              <span>Antenna Gain</span>
              <strong>{values ? `${formatNumber(values.gain, 3)} dBi` : '—'}</strong>
            </div>
          </div>

          <div className="result-row">
            <div>
              <span>Spatial Streams</span>
              <strong>{values ? values.spatialStreams : '—'}</strong>
            </div>
          </div>

          <div className="result-row">
            <div>
              <span>Ganho equivalente de NSS</span>
              <strong>{values ? `+${formatNumber(values.streamFactorDb, 3)} dB` : '—'}</strong>
            </div>
          </div>
        </section>
      </div>

      <section className="panel eirp-reg-panel">
        <div className="eirp-reg-title">
          <div>
            <div className="panel-title">Regulatory Check</div>
            <h3>Brasil / ANATEL</h3>
          </div>
          <label className="reg-toggle">
            <input
              type="checkbox"
              checked={regulatoryEnabled}
              onChange={(e) => setRegulatoryEnabled(e.target.checked)}
            />
            <span>Ativar verificação</span>
          </label>
        </div>

        {regulatoryEnabled && (
          <>
            <div className="eirp-reg-controls">
              <div>
                <label>Band</label>
                <select value={band} onChange={(e) => changeBand(e.target.value as WifiBand)}>
                  {BANDS.map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>

              <div>
                <label>Channel Width</label>
                <select
                  value={width}
                  onChange={(e) => changeWidth(Number(e.target.value) as ChannelWidth)}
                >
                  {WIDTHS_BY_BAND[band].map((item) => (
                    <option key={item} value={item}>{item} MHz</option>
                  ))}
                </select>
              </div>

              <div>
                <label>{width === 20 ? 'Channel' : 'Center Channel'}</label>
                <select value={selectedConfig?.channel ?? channel} onChange={(e) => setChannel(Number(e.target.value))}>
                  {channelConfigs.map((item) => (
                    <option key={item.channel} value={item.channel}>
                      {item.channel} · {item.frequencyMHz} MHz
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Tipo de equipamento</label>
                <select
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value as RegulatoryDeviceType)}
                >
                  <option value="AP">Access Point</option>
                  <option value="CLIENT">Client</option>
                  {band === '6 GHz' && <option value="VLP">Very Low Power</option>}
                </select>
              </div>

              {band === '5 GHz' && (
                <div>
                  <label>Application Type</label>
                  <select
                    value={applicationType}
                    onChange={(e) => setApplicationType(e.target.value as ApplicationType)}
                  >
                    <option value="GENERAL">General / AP / PtMP</option>
                    <option value="FIXED_PTP">Fixed Point-to-Point</option>
                  </select>
                </div>
              )}
            </div>

            {limits && regulatoryResult && (
              <>
                <div className={`compliance-banner ${regulatoryResult.pass ? 'pass' : 'fail'}`}>
                  {regulatoryResult.pass
                    ? <CheckCircle2 size={25} />
                    : <XCircle size={25} />}
                  <div>
                    <span>Regulatory Status</span>
                    <strong>{regulatoryResult.pass ? 'PASS' : 'FAIL'}</strong>
                    <p>
                      {regulatoryResult.pass
                        ? 'Os valores calculados estão dentro dos limites numéricos mapeados para esta configuração.'
                        : 'Um ou mais limites regulatórios numéricos foram excedidos.'}
                    </p>
                  </div>
                </div>

                <div className="compliance-grid">
                  <ComplianceMetric
                    title="EIRP calculado"
                    current={values ? `${formatNumber(values.eirp, 2)} dBm` : '—'}
                    limit={limits.maxEirpDbm !== undefined ? `${formatNumber(limits.maxEirpDbm, 2)} dBm` : 'Não resumido'}
                    margin={regulatoryResult.eirpMargin}
                    pass={regulatoryResult.eirpPass}
                  />

                  <ComplianceMetric
                    title="TX Power informado"
                    current={values ? `${formatNumber(values.tx, 2)} dBm` : '—'}
                    limit={limits.adjustedMaxConductedDbm !== undefined ? `${formatNumber(limits.adjustedMaxConductedDbm, 2)} dBm` : 'Não resumido'}
                    margin={regulatoryResult.txMargin}
                    pass={regulatoryResult.txPass}
                  />

                  <div className="compliance-card">
                    <span>Max PSD</span>
                    <strong>
                      {limits.adjustedMaxPsdDbmMHz !== undefined
                        ? `${formatNumber(limits.adjustedMaxPsdDbmMHz, 2)} dBm/MHz`
                        : limits.psdText ?? 'Não resumido'}
                    </strong>
                    <small>Referência regulatória</small>
                  </div>

                  <div className="compliance-card">
                    <span>Condição</span>
                    <strong>
                      {[
                        limits.indoorOnly ? 'Indoor' : null,
                        limits.dfsRequired ? 'DFS' : null,
                      ].filter(Boolean).join(' · ') || 'Conforme regra'}
                    </strong>
                    <small>{limits.mixedSubBands ? 'Bloco cruza subfaixas' : 'Uma subfaixa principal'}</small>
                  </div>

                  <div className="compliance-card">
                    <span>Antenna Gain Adjustment</span>
                    <strong>
                      {limits.fixedPtpExemptionApplied
                        ? 'Exceção PTP aplicada'
                        : limits.antennaReductionDb > 0
                          ? `−${formatNumber(limits.antennaReductionDb, 2)} dB`
                          : 'Sem redução'}
                    </strong>
                    <small>
                      {limits.antennaThresholdDbi !== undefined
                        ? `Threshold: ${formatNumber(limits.antennaThresholdDbi, 1)} dBi`
                        : 'Sem threshold nesta regra'}
                    </small>
                  </div>
                </div>

                {limits.note && (
                  <div className="regulatory-note-box">
                    <Info size={15}/>
                    <p>{limits.note}</p>
                  </div>
                )}

                <div className="eirp-rule-summary">
                  <div className="eyebrow"><ShieldCheck size={14}/> REGRAS APLICADAS</div>
                  {limits.rules.map((rule) => (
                    <div className="eirp-rule-item" key={rule.id}>
                      <div>
                        <strong>{rule.label}</strong>
                        <span>{rule.id}</span>
                      </div>
                      <p>{rule.note}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </section>

      <section className="panel reverse-panel">
        <div className="panel-title">Cálculo reverso</div>
        <div className="mode-tabs">
          <button className={mode === 'eirp' ? 'selected' : ''} onClick={() => setMode('eirp')}>
            TX Power → EIRP
          </button>
          <button className={mode === 'tx' ? 'selected' : ''} onClick={() => setMode('tx')}>
            EIRP → TX Power
          </button>
        </div>

        {mode === 'tx' ? (
          <div className="reverse-grid">
            <div>
              <label>Target EIRP (dBm)</label>
              <div className="field-with-unit">
                <input value={values ? formatNumber(values.eirp, 3) : ''} readOnly />
                <span>dBm</span>
              </div>
            </div>
            <div className="reverse-result">
              <span>TX Power necessário por Spatial Stream</span>
              <strong>{values ? `${formatNumber(values.resultingTx, 3)} dBm` : '—'}</strong>
            </div>
          </div>
        ) : (
          <p className="helper-text">
            O cálculo considera que o TX Power informado é por Spatial Stream e que todos os streams
            transmitem com a mesma potência.
          </p>
        )}
      </section>

      <section className="info-panel">
        <div className="eyebrow"><Info size={14} /> NOTA DE ENGENHARIA</div>
        <h3>O PASS/FAIL compara os resultados com os limites regulatórios mapeados.</h3>
        <p>
          A verificação regulatória usa o Channel Width, Center Channel e tipo de equipamento
          selecionados. Limites numéricos são comparados automaticamente; requisitos adicionais
          como DFS, ambiente indoor, características de antena e condições específicas continuam
          exibidos como regras complementares e devem ser considerados na análise final.
        </p>
      </section>
    </div>
  )
}

function CopyButton({ value }: { value: string }) {
  return (
    <button
      className="copy-btn"
      onClick={() => value && navigator.clipboard?.writeText(value)}
      title="Copiar"
    >
      <Copy size={15} />
    </button>
  )
}

function ComplianceMetric({
  title,
  current,
  limit,
  margin,
  pass,
}: {
  title: string
  current: string
  limit: string
  margin?: number
  pass: boolean
}) {
  return (
    <div className={`compliance-card ${pass ? 'ok' : 'bad'}`}>
      <span>{title}</span>
      <strong>{current}</strong>
      <small>Limite: {limit}</small>
      {margin !== undefined && (
        <em>
          Margem: {margin >= 0 ? '+' : ''}{formatNumber(margin, 2)} dB
        </em>
      )}
    </div>
  )
}
