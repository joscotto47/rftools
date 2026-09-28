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
  checkCompliance,
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
  const [hasTpc, setHasTpc] = useState(true)

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
          { applicationType, hasTpc },
        )
      : null,
    [regulatoryEnabled, selectedConfig, deviceType, antennaGain, applicationType, hasTpc],
  )

  const regulatoryResult = useMemo(() => {
    if (!values || !limits || !selectedConfig) return null
    return checkCompliance({
      txPowerPerChainDbm: values.tx,
      txChains: values.spatialStreams,
      antennaGainDbi: values.gain,
      cableLossDb: values.loss,
      channelWidthMHz: selectedConfig.width,
    }, limits)
  }, [values, limits, selectedConfig])

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
    setHasTpc(true)
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

  const formula = 'EIRP = TX Power por cadeia + 10·log₁₀(cadeias) + Antenna Gain − Cable Loss'

  return (
    <div>
      <div className="page-title">
        <div>
          <div className="eyebrow">RF / POWER</div>
          <h1>Calculadora de EIRP</h1>
          <p>
            Calcule EIRP considerando TX Power, Antenna Gain, perdas e cadeias de transmissão,
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

          <label>TX Power por cadeia de TX</label>
          <div className="field-with-unit">
            <input value={txPower} onChange={(e) => setTxPower(e.target.value)} inputMode="decimal" />
            <span>dBm</span>
          </div>

          <label>Antenna Gain</label>
          <div className="field-with-unit">
            <input value={antennaGain} onChange={(e) => setAntennaGain(e.target.value)} inputMode="decimal" />
            <span>dBi</span>
          </div>

          <label>Cable Loss</label>
          <div className="field-with-unit">
            <input value={pathLoss} onChange={(e) => setPathLoss(e.target.value)} inputMode="decimal" />
            <span>dB</span>
          </div>

          <label>Cadeias de TX (antenas transmitindo)</label>
          <select
            className="full-select"
            value={spatialStreams}
            onChange={(e) => setSpatialStreams(Number(e.target.value))}
          >
            {STREAM_OPTIONS.map((streams) => (
              <option key={streams} value={streams}>
                {streams} {streams > 1 ? 'cadeias' : 'cadeia'}
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
              <span>TX Power por cadeia</span>
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
              <span>Potência conduzida total</span>
              <strong>{values ? `${formatNumber(values.tx + values.streamFactorDb, 3)} dBm` : '—'}</strong>
            </div>
          </div>

          <div className="result-row">
            <div>
              <span>Soma das {values?.spatialStreams ?? ''} cadeias</span>
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

              {band !== '6 GHz' && (
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

              {band === '5 GHz' && (
                <label className="reg-toggle">
                  <input type="checkbox" checked={hasTpc} onChange={(e) => setHasTpc(e.target.checked)} />
                  <span>Possui TPC</span>
                </label>
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
                      {!regulatoryResult.bandPass
                        ? 'O canal selecionado está fora das faixas permitidas para esta categoria.'
                        : regulatoryResult.pass
                          ? 'Os valores calculados estão dentro dos limites numéricos mapeados para esta configuração.'
                          : 'Um ou mais limites regulatórios numéricos foram excedidos.'}
                    </p>
                  </div>
                </div>

                <div className="compliance-grid">
                  <ComplianceMetric
                    title="EIRP calculado"
                    current={`${formatNumber(regulatoryResult.eirpDbm, 2)} dBm`}
                    limit={limits.maxEirpDbm !== undefined ? `${formatNumber(limits.maxEirpDbm, 2)} dBm` : 'sem limite direto de EIRP'}
                    margin={regulatoryResult.eirpMargin}
                    pass={regulatoryResult.eirpPass}
                  />

                  <ComplianceMetric
                    title="Potência conduzida total"
                    current={`${formatNumber(regulatoryResult.totalConductedDbm, 2)} dBm`}
                    limit={limits.adjustedMaxConductedDbm !== undefined ? `${formatNumber(limits.adjustedMaxConductedDbm, 2)} dBm` : 'sem limite conduzido (regra por EIRP)'}
                    margin={regulatoryResult.conductedMargin}
                    pass={regulatoryResult.conductedPass}
                  />

                  {limits.adjustedMaxPsdDbmMHz !== undefined ? (
                    <ComplianceMetric
                      title={limits.psdKind === 'EIRP' ? 'PSD EIRP estimada' : 'PSD conduzida estimada'}
                      current={`${formatNumber(limits.psdKind === 'EIRP' ? regulatoryResult.eirpPsdDbmMHz : regulatoryResult.conductedPsdDbmMHz, 2)} dBm/MHz`}
                      limit={`${formatNumber(limits.adjustedMaxPsdDbmMHz, 2)} dBm/MHz`}
                      margin={regulatoryResult.psdMargin}
                      pass={regulatoryResult.psdPass}
                    />
                  ) : (
                    <div className="compliance-card">
                      <span>Max PSD</span>
                      <strong>{limits.psdText ?? 'Não resumido'}</strong>
                      <small>Referência regulatória</small>
                    </div>
                  )}

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
              <span>TX Power necessário por cadeia</span>
              <strong>{values ? `${formatNumber(values.resultingTx, 3)} dBm` : '—'}</strong>
            </div>
          </div>
        ) : (
          <p className="helper-text">
            O cálculo considera que o TX Power informado é por cadeia de transmissão e que todas as
            cadeias transmitem com a mesma potência. Os limites de potência conduzida da ANATEL valem
            para a soma de todas as cadeias (item 10.3.4 do Ato nº 14448).
          </p>
        )}
      </section>

      <section className="info-panel">
        <div className="eyebrow"><Info size={14} /> NOTA DE ENGENHARIA</div>
        <h3>O PASS/FAIL compara os resultados com os limites regulatórios mapeados.</h3>
        <p>
          A verificação regulatória usa o Channel Width, Center Channel e tipo de equipamento
          selecionados. Potência conduzida, EIRP e PSD são comparados automaticamente. A PSD é
          estimada supondo potência distribuída de forma uniforme na largura do canal; a medição
          real usa a largura de 26 dB da emissão. Requisitos como DFS, ambiente indoor,
          características de antena e condições específicas aparecem como regras complementares
          e devem ser considerados na análise final.
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
