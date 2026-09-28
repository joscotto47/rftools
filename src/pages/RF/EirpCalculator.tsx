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
import { useI18n } from '../../i18n'

const STREAM_OPTIONS = [1, 2, 3, 4, 8]
const BANDS: WifiBand[] = ['2.4 GHz', '5 GHz', '6 GHz']

export default function EirpCalculator() {
  const { t, tl } = useI18n()
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

  const formula = t("EIRP = TX Power por cadeia + 10·log₁₀(cadeias) + Ganho da antena − Perda no cabo", "EIRP = TX power per chain + 10·log₁₀(chains) + Antenna gain − Cable loss")

  return (
    <div>
      <div className="page-title">
        <div>
          <div className="eyebrow">{t("RF / POTÊNCIA", "RF / POWER")}</div>
          <h1>{t("Calculadora de EIRP", "EIRP Calculator")}</h1>
          <p>
            {t("Calcule a EIRP considerando potência de TX, ganho da antena, perdas e cadeias de transmissão, e compare o resultado com o perfil Brasil / ANATEL.", "Calculate EIRP from TX power, antenna gain, losses and transmit chains, and compare the result with the Brazil / ANATEL profile.")}
          </p>
        </div>
        <button className="ghost-btn" onClick={reset}>
          <RotateCcw size={15} /> {t("Redefinir", "Reset")}
        </button>
      </div>

      <div className="calculator-layout">
        <section className="panel input-panel">
          <div className="panel-title">{t("Parâmetros RF", "RF parameters")}</div>

          <label>{t("Potência de TX por cadeia", "TX power per chain")}</label>
          <div className="field-with-unit">
            <input value={txPower} onChange={(e) => setTxPower(e.target.value)} inputMode="decimal" />
            <span>dBm</span>
          </div>

          <label>{t("Ganho da antena", "Antenna gain")}</label>
          <div className="field-with-unit">
            <input value={antennaGain} onChange={(e) => setAntennaGain(e.target.value)} inputMode="decimal" />
            <span>dBi</span>
          </div>

          <label>{t("Perda no cabo", "Cable loss")}</label>
          <div className="field-with-unit">
            <input value={pathLoss} onChange={(e) => setPathLoss(e.target.value)} inputMode="decimal" />
            <span>dB</span>
          </div>

          <label>{t("Cadeias de TX (antenas transmitindo)", "TX chains (transmitting antennas)")}</label>
          <select
            className="full-select"
            value={spatialStreams}
            onChange={(e) => setSpatialStreams(Number(e.target.value))}
          >
            {STREAM_OPTIONS.map((streams) => (
              <option key={streams} value={streams}>
                {streams} {streams > 1 ? t("cadeias", "chains") : t("cadeia", "chain")}
              </option>
            ))}
          </select>

          <div className="formula-box">
            <span>{t("Fórmula", "Formula")}</span>
            <code>{formula}</code>
          </div>
        </section>

        <div className="conversion-arrow"></div>

        <section className="panel results-panel">
          <div className="panel-title">{t("Resultado", "Result")}</div>

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
              <span>{t("Potência de TX por cadeia", "TX power per chain")}</span>
              <strong>{values ? `${formatNumber(values.tx, 3)} dBm` : '—'}</strong>
            </div>
            <CopyButton value={values ? `${values.tx} dBm` : ''} />
          </div>

          <div className="result-row">
            <div>
              <span>{t("Ganho da antena", "Antenna gain")}</span>
              <strong>{values ? `${formatNumber(values.gain, 3)} dBi` : '—'}</strong>
            </div>
          </div>

          <div className="result-row">
            <div>
              <span>{t("Potência conduzida total", "Total conducted power")}</span>
              <strong>{values ? `${formatNumber(values.tx + values.streamFactorDb, 3)} dBm` : '—'}</strong>
            </div>
          </div>

          <div className="result-row">
            <div>
              <span>{t(`Soma das ${values?.spatialStreams ?? ''} cadeias`, `Sum of ${values?.spatialStreams ?? ''} chains`)}</span>
              <strong>{values ? `+${formatNumber(values.streamFactorDb, 3)} dB` : '—'}</strong>
            </div>
          </div>
        </section>
      </div>

      <section className="panel eirp-reg-panel">
        <div className="eirp-reg-title">
          <div>
            <div className="panel-title">{t("Verificação regulatória", "Regulatory check")}</div>
            <h3>{t("Brasil / ANATEL", "Brazil / ANATEL")}</h3>
          </div>
          <label className="reg-toggle">
            <input
              type="checkbox"
              checked={regulatoryEnabled}
              onChange={(e) => setRegulatoryEnabled(e.target.checked)}
            />
            <span>{t("Ativar verificação", "Enable check")}</span>
          </label>
        </div>

        {regulatoryEnabled && (
          <>
            <div className="eirp-reg-controls">
              <div>
                <label>{t("Banda", "Band")}</label>
                <select value={band} onChange={(e) => changeBand(e.target.value as WifiBand)}>
                  {BANDS.map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>

              <div>
                <label>{t("Largura de canal", "Channel width")}</label>
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
                <label>{width === 20 ? t("Canal", "Channel") : t("Canal central", "Center channel")}</label>
                <select value={selectedConfig?.channel ?? channel} onChange={(e) => setChannel(Number(e.target.value))}>
                  {channelConfigs.map((item) => (
                    <option key={item.channel} value={item.channel}>
                      {item.channel} · {item.frequencyMHz} MHz
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>{t("Tipo de equipamento", "Device type")}</label>
                <select
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value as RegulatoryDeviceType)}
                >
                  <option value="AP">{t("Ponto de acesso", "Access point")}</option>
                  <option value="CLIENT">{t("Cliente", "Client")}</option>
                  {band === '6 GHz' && <option value="VLP">{t("Potência muito baixa (VLP)", "Very low power (VLP)")}</option>}
                </select>
              </div>

              {band !== '6 GHz' && (
                <div>
                  <label>{t("Tipo de aplicação", "Application type")}</label>
                  <select
                    value={applicationType}
                    onChange={(e) => setApplicationType(e.target.value as ApplicationType)}
                  >
                    <option value="GENERAL">{t("Geral / AP / PtMP", "General / AP / PtMP")}</option>
                    <option value="FIXED_PTP">{t("Ponto-a-ponto fixo", "Fixed point-to-point")}</option>
                  </select>
                </div>
              )}

              {band === '5 GHz' && (
                <label className="reg-toggle">
                  <input type="checkbox" checked={hasTpc} onChange={(e) => setHasTpc(e.target.checked)} />
                  <span>{t("Possui TPC", "Has TPC")}</span>
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
                    <span>{t("Status regulatório", "Regulatory status")}</span>
                    <strong>{regulatoryResult.pass ? 'PASS' : 'FAIL'}</strong>
                    <p>
                      {!regulatoryResult.bandPass
                        ? t("O canal selecionado está fora das faixas permitidas para esta categoria.", "The selected channel is outside the bands allowed for this category.")
                        : regulatoryResult.pass
                          ? t("Os valores calculados estão dentro dos limites numéricos mapeados para esta configuração.", "The calculated values are within the numeric limits mapped for this configuration.")
                          : t("Um ou mais limites regulatórios numéricos foram excedidos.", "One or more numeric regulatory limits were exceeded.")}
                    </p>
                  </div>
                </div>

                <div className="compliance-grid">
                  <ComplianceMetric
                    title={t("EIRP calculada", "Calculated EIRP")}
                    current={`${formatNumber(regulatoryResult.eirpDbm, 2)} dBm`}
                    limit={limits.maxEirpDbm !== undefined ? `${formatNumber(limits.maxEirpDbm, 2)} dBm` : t("sem limite direto de EIRP", "no direct EIRP limit")}
                    margin={regulatoryResult.eirpMargin}
                    pass={regulatoryResult.eirpPass}
                  />

                  <ComplianceMetric
                    title={t("Potência conduzida total", "Total conducted power")}
                    current={`${formatNumber(regulatoryResult.totalConductedDbm, 2)} dBm`}
                    limit={limits.adjustedMaxConductedDbm !== undefined ? `${formatNumber(limits.adjustedMaxConductedDbm, 2)} dBm` : t("sem limite conduzido (regra por EIRP)", "no conducted limit (EIRP-based rule)")}
                    margin={regulatoryResult.conductedMargin}
                    pass={regulatoryResult.conductedPass}
                  />

                  {limits.adjustedMaxPsdDbmMHz !== undefined ? (
                    <ComplianceMetric
                      title={limits.psdKind === 'EIRP' ? t("PSD EIRP estimada", "Estimated EIRP PSD") : t("PSD conduzida estimada", "Estimated conducted PSD")}
                      current={`${formatNumber(limits.psdKind === 'EIRP' ? regulatoryResult.eirpPsdDbmMHz : regulatoryResult.conductedPsdDbmMHz, 2)} dBm/MHz`}
                      limit={`${formatNumber(limits.adjustedMaxPsdDbmMHz, 2)} dBm/MHz`}
                      margin={regulatoryResult.psdMargin}
                      pass={regulatoryResult.psdPass}
                    />
                  ) : (
                    <div className="compliance-card">
                      <span>{t("PSD máxima", "Max PSD")}</span>
                      <strong>{limits.psdText ? tl(limits.psdText) : t("Não resumido", "Not summarized")}</strong>
                      <small>{t("Referência regulatória", "Regulatory reference")}</small>
                    </div>
                  )}

                  <div className="compliance-card">
                    <span>{t("Condição", "Condition")}</span>
                    <strong>
                      {[
                        limits.indoorOnly ? 'Indoor' : null,
                        limits.dfsRequired ? 'DFS' : null,
                      ].filter(Boolean).join(' · ') || t("Conforme regra", "Per rule")}
                    </strong>
                    <small>{limits.mixedSubBands ? t("Bloco cruza subfaixas", "Block spans sub-bands") : t("Uma subfaixa principal", "Single sub-band")}</small>
                  </div>

                  <div className="compliance-card">
                    <span>{t("Ajuste por ganho de antena", "Antenna gain adjustment")}</span>
                    <strong>
                      {limits.fixedPtpExemptionApplied
                        ? t("Regra PtP aplicada", "PtP rule applied")
                        : limits.antennaReductionDb > 0
                          ? `−${formatNumber(limits.antennaReductionDb, 2)} dB`
                          : t("Sem redução", "No reduction")}
                    </strong>
                    <small>
                      {limits.antennaThresholdDbi !== undefined
                        ? `${t('Limiar', 'Threshold')}: ${formatNumber(limits.antennaThresholdDbi, 1)} dBi`
                        : t("Sem limiar nesta regra", "No threshold in this rule")}
                    </small>
                  </div>
                </div>

                {limits.note && (
                  <div className="regulatory-note-box">
                    <Info size={15}/>
                    <p>{tl(limits.note)}</p>
                  </div>
                )}

                <div className="eirp-rule-summary">
                  <div className="eyebrow"><ShieldCheck size={14}/> {t("REGRAS APLICADAS", "APPLIED RULES")}</div>
                  {limits.rules.map((rule) => (
                    <div className="eirp-rule-item" key={rule.id}>
                      <div>
                        <strong>{tl(rule.label)}</strong>
                        <span>{rule.id}</span>
                      </div>
                      <p>{rule.note ? tl(rule.note) : null}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </section>

      <section className="panel reverse-panel">
        <div className="panel-title">{t("Cálculo reverso", "Reverse calculation")}</div>
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
              <label>{t("EIRP desejada (dBm)", "Target EIRP (dBm)")}</label>
              <div className="field-with-unit">
                <input value={values ? formatNumber(values.eirp, 3) : ''} readOnly />
                <span>dBm</span>
              </div>
            </div>
            <div className="reverse-result">
              <span>{t("Potência de TX necessária por cadeia", "Required TX power per chain")}</span>
              <strong>{values ? `${formatNumber(values.resultingTx, 3)} dBm` : '—'}</strong>
            </div>
          </div>
        ) : (
          <p className="helper-text">
            {t("O cálculo considera que a potência de TX informada é por cadeia de transmissão e que todas as cadeias transmitem com a mesma potência. Os limites de potência conduzida da ANATEL valem para a soma de todas as cadeias (item 10.3.4 do Ato nº 14448).", "The calculation assumes the TX power entered is per transmit chain and that all chains transmit at the same power. ANATEL conducted power limits apply to the sum of all chains (item 10.3.4 of Ato nº 14448).")}
          </p>
        )}
      </section>

      <section className="info-panel">
        <div className="eyebrow"><Info size={14} /> {t("NOTA DE ENGENHARIA", "ENGINEERING NOTE")}</div>
        <h3>{t("O PASS/FAIL compara os resultados com os limites regulatórios mapeados.", "PASS/FAIL compares the results with the mapped regulatory limits.")}</h3>
        <p>
          {t("A verificação regulatória usa a largura de canal, o canal central e o tipo de equipamento selecionados. Potência conduzida, EIRP e PSD são comparados automaticamente. A PSD é estimada supondo potência distribuída de forma uniforme na largura do canal; a medição real usa a largura de 26 dB da emissão. Requisitos como DFS, ambiente indoor, características de antena e condições específicas aparecem como regras complementares e devem ser considerados na análise final.", "The regulatory check uses the selected channel width, center channel and device type. Conducted power, EIRP and PSD are compared automatically. PSD is estimated assuming power spread evenly across the channel; real measurements use the 26 dB emission bandwidth. Requirements such as DFS, indoor use, antenna characteristics and specific conditions appear as complementary rules and must be considered in the final analysis.")}
        </p>
      </section>
    </div>
  )
}

function CopyButton({ value }: { value: string }) {
  const { t } = useI18n()
  return (
    <button
      className="copy-btn"
      onClick={() => value && navigator.clipboard?.writeText(value)}
      title={t('Copiar', 'Copy')}
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
  const { t } = useI18n()
  return (
    <div className={`compliance-card ${pass ? 'ok' : 'bad'}`}>
      <span>{title}</span>
      <strong>{current}</strong>
      <small>{t('Limite', 'Limit')}: {limit}</small>
      {margin !== undefined && (
        <em>
          {t('Margem', 'Margin')}: {margin >= 0 ? '+' : ''}{formatNumber(margin, 2)} dB
        </em>
      )}
    </div>
  )
}
