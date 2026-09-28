import { useMemo, useState } from 'react'
import {
  Building2,
  Gauge,
  Info,
  LayoutGrid,
  RotateCcw,
  Users,
  Wifi,
} from 'lucide-react'
import {
  DEFAULT_COVERAGE_RADIUS_M,
  estimatedCellRadiusMeters,
  planWifiNetwork,
  type CoverageModel,
  type EnvironmentType,
} from '../../calculations/wifiPlanner'
import { formatNumber } from '../../calculations/rf'
import {
  MATERIAL_CATEGORY_LABELS,
  MATERIAL_LOSSES,
  frequencyToLossBand,
  totalMaterialLossDb,
} from '../../data/materialLosses'
import { useI18n } from '../../i18n'

export default function WifiNetworkPlanner() {
  const { t, tl } = useI18n()
  const bottleneckLabel: Record<string, string> = {
    CAPACITY: t("CAPACIDADE", "CAPACITY"),
    COVERAGE: t("COBERTURA", "COVERAGE"),
    BALANCED: t("EQUILIBRADO", "BALANCED"),
  }
  const [environment, setEnvironment] = useState<EnvironmentType>('OFFICE')
  const [areaM2, setAreaM2] = useState(2000)
  const [users, setUsers] = useState(180)
  const [concurrency, setConcurrency] = useState(45)
  const [demandPerUser, setDemandPerUser] = useState(5)

  const [capacityPerAp, setCapacityPerAp] = useState(700)
  const [coverageRadius, setCoverageRadius] = useState(
    DEFAULT_COVERAGE_RADIUS_M.OFFICE,
  )
  const [coverageMode, setCoverageMode] = useState<'MANUAL' | 'RF'>('MANUAL')
  const [coverageModel, setCoverageModel] = useState<CoverageModel>('LOG_DISTANCE')
  const [frequencyGHz, setFrequencyGHz] = useState(5)
  const [txPowerDbm, setTxPowerDbm] = useState(20)
  const [txAntennaGainDbi, setTxAntennaGainDbi] = useState(4)
  const [txLossDb, setTxLossDb] = useState(0)
  const [clientAntennaGainDbi, setClientAntennaGainDbi] = useState(0)
  const [targetRssiDbm, setTargetRssiDbm] = useState(-67)
  const [fadeMarginDb, setFadeMarginDb] = useState(6)
  const [manualExtraLossDb, setManualExtraLossDb] = useState(0)
  const [materialQuantities, setMaterialQuantities] = useState<Record<string, number>>({
    drywall: 2,
    glass: 1,
  })
  const [pathLossExponent, setPathLossExponent] = useState(3)
  const [overlapPercent, setOverlapPercent] = useState(25)
  const [channelReuseFactor, setChannelReuseFactor] = useState(1.25)

  const lossBand = frequencyToLossBand(frequencyGHz)

  const materialLossDb = useMemo(
    () => totalMaterialLossDb(materialQuantities, lossBand),
    [materialQuantities, lossBand],
  )

  const totalAdditionalLossDb =
    materialLossDb + Math.max(0, manualExtraLossDb)

  const rfCoverage = useMemo(
    () =>
      estimatedCellRadiusMeters({
        frequencyGHz,
        txPowerDbm,
        txAntennaGainDbi,
        txLossDb,
        clientAntennaGainDbi,
        targetRssiDbm,
        fadeMarginDb,
        additionalLossDb: totalAdditionalLossDb,
        model: coverageModel,
        pathLossExponent,
      }),
    [
      frequencyGHz,
      txPowerDbm,
      txAntennaGainDbi,
      txLossDb,
      clientAntennaGainDbi,
      targetRssiDbm,
      fadeMarginDb,
      totalAdditionalLossDb,
      coverageModel,
      pathLossExponent,
    ],
  )

  const effectiveCoverageRadius =
    coverageMode === 'RF'
      ? Math.max(1, rfCoverage.radiusMeters)
      : coverageRadius

  const result = useMemo(
    () =>
      planWifiNetwork({
        areaM2,
        users,
        concurrencyPercent: concurrency,
        demandPerActiveUserMbps: demandPerUser,
        capacityPerApMbps: capacityPerAp,
        coverageRadiusMeters: effectiveCoverageRadius,
        overlapPercent,
        channelReuseFactor,
      }),
    [
      areaM2,
      users,
      concurrency,
      demandPerUser,
      capacityPerAp,
      effectiveCoverageRadius,
      overlapPercent,
      channelReuseFactor,
    ],
  )

  function changeEnvironment(next: EnvironmentType) {
    setEnvironment(next)
    setCoverageRadius(DEFAULT_COVERAGE_RADIUS_M[next])
  }

  function reset() {
    setEnvironment('OFFICE')
    setAreaM2(2000)
    setUsers(180)
    setConcurrency(45)
    setDemandPerUser(5)
    setCapacityPerAp(700)
    setCoverageRadius(DEFAULT_COVERAGE_RADIUS_M.OFFICE)
    setCoverageMode('MANUAL')
    setCoverageModel('LOG_DISTANCE')
    setFrequencyGHz(5)
    setTxPowerDbm(20)
    setTxAntennaGainDbi(4)
    setTxLossDb(0)
    setClientAntennaGainDbi(0)
    setTargetRssiDbm(-67)
    setFadeMarginDb(6)
    setManualExtraLossDb(0)
    setMaterialQuantities({ drywall: 2, glass: 1 })
    setPathLossExponent(3)
    setOverlapPercent(25)
    setChannelReuseFactor(1.25)
  }

  const bottleneck =
    result.apsByCapacity > result.apsByCoverage
      ? 'CAPACITY'
      : result.apsByCoverage > result.apsByCapacity
        ? 'COVERAGE'
        : 'BALANCED'

  return (
    <div>
      <div className="page-title">
        <div>
          <div className="eyebrow"><LayoutGrid size={14}/> {t("WI-FI / PLANEJAMENTO", "WI-FI / PLANNING")}</div>
          <h1>{t("Planejador de Rede Wi-Fi", "Wi-Fi Network Planner")}</h1>
          <p>
            {t("Estime a quantidade de APs necessária por capacidade e cobertura, considerando usuários, demanda, concorrência e reutilização de canais.", "Estimate how many APs you need by capacity and coverage, considering users, demand, concurrency and channel reuse.")}
          </p>
        </div>
        <button className="ghost-btn" onClick={reset}>
          <RotateCcw size={15}/> {t("Redefinir", "Reset")}
        </button>
      </div>

      <div className="planner-input-grid">
        <section className="panel">
          <div className="panel-title">{t("Ambiente e usuários", "Environment and users")}</div>

          <Field label={t("Tipo de ambiente", "Environment type")}>
            <select
              value={environment}
              onChange={e => changeEnvironment(e.target.value as EnvironmentType)}
            >
              <option value="OPEN">{t("Área aberta", "Open area")}</option>
              <option value="OFFICE">{t("Escritório", "Office")}</option>
              <option value="DENSE_OFFICE">{t("Escritório denso", "Dense office")}</option>
              <option value="WAREHOUSE">{t("Galpão", "Warehouse")}</option>
            </select>
          </Field>

          <NumberField
            label={t("Área total", "Total area")}
            value={areaM2}
            onChange={setAreaM2}
            unit="m²"
          />
          <NumberField
            label={t("Usuários", "Users")}
            value={users}
            onChange={setUsers}
            unit=""
          />

          <Slider
            label={t("Concorrência média", "Average concurrency")}
            value={concurrency}
            min={5}
            max={100}
            suffix="%"
            onChange={setConcurrency}
          />

          <NumberField
            label={t("Demanda por usuário ativo", "Demand per active user")}
            value={demandPerUser}
            onChange={setDemandPerUser}
            unit="Mbps"
          />
        </section>

        <section className="panel">
          <div className="panel-title">{t("Capacidade do AP", "AP capacity")}</div>

          <NumberField
            label={t("Capacidade útil por AP", "Usable capacity per AP")}
            value={capacityPerAp}
            onChange={setCapacityPerAp}
            unit="Mbps"
          />

          <div className="coverage-mode-block">
            <label>{t("Modelo de cobertura", "Coverage model")}</label>
            <div className="capacity-mode-tabs">
              <button
                className={coverageMode === 'MANUAL' ? 'selected' : ''}
                onClick={() => setCoverageMode('MANUAL')}
              >
                Manual
              </button>
              <button
                className={coverageMode === 'RF' ? 'selected' : ''}
                onClick={() => setCoverageMode('RF')}
              >
                Link Budget
              </button>
            </div>
          </div>

          {coverageMode === 'MANUAL' ? (
            <NumberField
              label={t("Raio de cobertura estimado", "Estimated coverage radius")}
              value={coverageRadius}
              onChange={setCoverageRadius}
              unit="m"
            />
          ) : (
            <div className="rf-coverage-config">
              <div className="planner-field">
                <label>{t("Modelo de propagação", "Propagation model")}</label>
                <select
                  value={coverageModel}
                  onChange={e => setCoverageModel(e.target.value as CoverageModel)}
                >
                  <option value="FREE_SPACE">{t("Espaço livre", "Free space")}</option>
                  <option value="LOG_DISTANCE">Log-Distance</option>
                </select>
              </div>

              <div className="rf-coverage-grid">
                <NumberField label={t("Frequência", "Frequency")} value={frequencyGHz} onChange={setFrequencyGHz} unit="GHz" />
                <NumberField label={t("Potência de TX", "TX power")} value={txPowerDbm} onChange={setTxPowerDbm} unit="dBm" />
                <NumberField label={t("Ganho da antena do AP", "AP antenna gain")} value={txAntennaGainDbi} onChange={setTxAntennaGainDbi} unit="dBi" />
                <NumberField label={t("Perda TX", "TX loss")} value={txLossDb} onChange={setTxLossDb} unit="dB" />
                <NumberField label={t("Ganho da antena do cliente", "Client antenna gain")} value={clientAntennaGainDbi} onChange={setClientAntennaGainDbi} unit="dBi" />
                <NumberField label={t("RSSI alvo", "Target RSSI")} value={targetRssiDbm} onChange={setTargetRssiDbm} unit="dBm" />
                <NumberField label={t("Margem de desvanecimento", "Fade margin")} value={fadeMarginDb} onChange={setFadeMarginDb} unit="dB" />
                <NumberField label={t("Perda extra manual", "Manual extra loss")} value={manualExtraLossDb} onChange={setManualExtraLossDb} unit="dB" />
                {coverageModel === 'LOG_DISTANCE' && (
                  <NumberField label={t("Expoente de perda", "Path loss exponent")} value={pathLossExponent} onChange={setPathLossExponent} unit="n" />
                )}
              </div>

              <div className="material-loss-builder">
                <div className="material-loss-head">
                  <div>
                    <span>{t("Obstáculos / materiais", "Obstacles / materials")}</span>
                    <strong>{t("Perfil de atenuação", "Attenuation profile")} · {lossBand}</strong>
                  </div>
                  <b>{formatNumber(materialLossDb, 1)} dB</b>
                </div>

                <div className="material-loss-grid">
                  {MATERIAL_LOSSES.map(material => {
                    const quantity = materialQuantities[material.id] ?? 0
                    const perUnit = material.lossDb[lossBand]

                    return (
                      <div
                        key={material.id}
                        className={`material-loss-item ${quantity > 0 ? 'active' : ''}`}
                      >
                        <div>
                          <strong>{tl(material.name)}</strong>
                          <span>{tl(MATERIAL_CATEGORY_LABELS[material.category])} · {formatNumber(perUnit, 1)} dB/{t('un.', 'unit')}</span>
                        </div>

                        <div className="material-qty-control">
                          <button
                            type="button"
                            onClick={() =>
                              setMaterialQuantities(current => ({
                                ...current,
                                [material.id]: Math.max(0, (current[material.id] ?? 0) - 1),
                              }))
                            }
                          >
                            −
                          </button>

                          <input
                            type="number"
                            min="0"
                            value={quantity}
                            onChange={e =>
                              setMaterialQuantities(current => ({
                                ...current,
                                [material.id]: Math.max(0, Number(e.target.value)),
                              }))
                            }
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setMaterialQuantities(current => ({
                                ...current,
                                [material.id]: (current[material.id] ?? 0) + 1,
                              }))
                            }
                          >
                            +
                          </button>
                        </div>

                        <small>
                          Total: {formatNumber(quantity * perUnit, 1)} dB
                        </small>
                      </div>
                    )
                  })}
                </div>

                <div className="material-loss-summary">
                  <div>
                    <span>{t("Materiais", "Materials")}</span>
                    <strong>{formatNumber(materialLossDb, 1)} dB</strong>
                  </div>
                  <b>+</b>
                  <div>
                    <span>{t("Extra manual", "Manual extra")}</span>
                    <strong>{formatNumber(manualExtraLossDb, 1)} dB</strong>
                  </div>
                  <b>=</b>
                  <div className="highlight">
                    <span>{t("Perda adicional", "Additional loss")}</span>
                    <strong>{formatNumber(totalAdditionalLossDb, 1)} dB</strong>
                  </div>
                </div>
              </div>

              <div className="rf-coverage-result">
                <div>
                  <span>EIRP</span>
                  <strong>{formatNumber(rfCoverage.eirpDbm, 1)} dBm</strong>
                </div>
                <div>
                  <span>{t("Perda de caminho máx.", "Max path loss")}</span>
                  <strong>{formatNumber(rfCoverage.maxPathLossDb, 1)} dB</strong>
                </div>
                <div>
                  <span>{t("Perda adicional", "Additional loss")}</span>
                  <strong>{formatNumber(totalAdditionalLossDb, 1)} dB</strong>
                </div>
                <div className="highlight">
                  <span>{t("Raio RF estimado", "Estimated RF radius")}</span>
                  <strong>{formatNumber(rfCoverage.radiusMeters, 1)} m</strong>
                </div>
              </div>
            </div>
          )}

          <Slider
            label={t("Sobreposição planejada", "Planned overlap")}
            value={overlapPercent}
            min={0}
            max={50}
            suffix="%"
            onChange={setOverlapPercent}
          />

          <div className="planner-select-field">
            <label>{t("Fator de reuso de canal", "Channel reuse factor")}</label>
            <select
              value={channelReuseFactor}
              onChange={e => setChannelReuseFactor(Number(e.target.value))}
            >
              <option value={1}>1.00 · ideal</option>
              <option value={1.15}>1.15 · {t("baixo impacto", "low impact")}</option>
              <option value={1.25}>1.25 · {t("moderado", "moderate")}</option>
              <option value={1.5}>1.50 · {t("alto", "high")}</option>
              <option value={2}>2.00 · {t("muito alto", "very high")}</option>
            </select>
          </div>
        </section>
      </div>

      <section className="panel planner-hero">
        <div>
          <span>{t("APs recomendados", "Recommended APs")}</span>
          <strong>{result.recommendedAps}</strong>
          <small>
            {t(`Maior valor entre capacidade (${result.apsByCapacity}) e cobertura (${result.apsByCoverage})`, `Larger of capacity (${result.apsByCapacity}) and coverage (${result.apsByCoverage})`)}
          </small>
        </div>

        <div className={`planner-bottleneck ${bottleneck.toLowerCase()}`}>
          <span>{t("Limitante principal", "Main constraint")}</span>
          <strong>{bottleneckLabel[bottleneck]}</strong>
          <small>
            {bottleneck === 'CAPACITY'
              ? t("A densidade/demanda exige mais APs do que a cobertura.", "Density/demand needs more APs than coverage.")
              : bottleneck === 'COVERAGE'
                ? t("A área física exige mais APs do que a demanda.", "The physical area needs more APs than demand.")
                : t("Capacidade e cobertura estão próximas.", "Capacity and coverage are about even.")}
          </small>
        </div>
      </section>

      <div className="planner-metrics">
        <Metric
          icon={<Users size={18}/>}
          label={t("Usuários simultâneos", "Concurrent users")}
          value={formatNumber(result.concurrentUsers, 1)}
          note={t(`${concurrency}% de ${users} usuários`, `${concurrency}% of ${users} users`)}
        />
        <Metric
          icon={<Gauge size={18}/>}
          label={t("Demanda total", "Total demand")}
          value={`${formatNumber(result.totalDemandMbps, 1)} Mbps`}
          note={t(`${demandPerUser} Mbps por usuário ativo`, `${demandPerUser} Mbps per active user`)}
        />
        <Metric
          icon={<Wifi size={18}/>}
          label={t("Capacidade efetiva por AP", "Effective capacity per AP")}
          value={`${formatNumber(result.capacityPerApMbps, 1)} Mbps`}
          note={t(`Após fator de reuso ${channelReuseFactor}`, `After channel reuse factor ${channelReuseFactor}`)}
        />
        <Metric
          icon={<Building2 size={18}/>}
          label={t("Cobertura estimada por AP", "Estimated coverage per AP")}
          value={`${formatNumber(result.estimatedCoveragePerApM2, 0)} m²`}
          note={t(`Raio ${formatNumber(effectiveCoverageRadius, 1)} m com ${overlapPercent}% de sobreposição`, `${formatNumber(effectiveCoverageRadius, 1)} m radius with ${overlapPercent}% overlap`)}
        />
      </div>

      <section className="panel planner-comparison-panel">
        <div className="panel-title">{t("Capacidade vs. cobertura", "Capacity vs coverage")}</div>

        <div className="planner-comparison-grid">
          <div className="planner-comparison-card">
            <span>{t("Dimensionamento por capacidade", "Sizing by capacity")}</span>
            <strong>{result.apsByCapacity} APs</strong>
            <p>
              {formatNumber(result.totalDemandMbps, 1)} Mbps {t("de demanda", "of demand")} ÷{' '}
              {formatNumber(result.capacityPerApMbps, 1)} Mbps/AP
            </p>
          </div>

          <div className="planner-comparison-card">
            <span>{t("Dimensionamento por cobertura", "Sizing by coverage")}</span>
            <strong>{result.apsByCoverage} APs</strong>
            <p>
              {formatNumber(areaM2, 0)} m² ÷{' '}
              {formatNumber(result.estimatedCoveragePerApM2, 0)} m²/AP
            </p>
          </div>

          <div className="planner-comparison-card highlight">
            <span>{t("Projeto recomendado", "Recommended design")}</span>
            <strong>{result.recommendedAps} APs</strong>
            <p>
              {t(
                `Aproximadamente ${formatNumber(result.usersPerAp, 1)} usuários associados e ${formatNumber(result.demandPerApMbps, 1)} Mbps de demanda por AP.`,
                `About ${formatNumber(result.usersPerAp, 1)} associated users and ${formatNumber(result.demandPerApMbps, 1)} Mbps of demand per AP.`,
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="panel planner-utilization-panel">
        <div className="panel-title">{t("Utilização estimada", "Estimated utilization")}</div>

        <div className="planner-utilization-row">
          <div>
            <span>{t("Utilização média por AP", "Average utilization per AP")}</span>
            <strong>{formatNumber(result.utilizationPercent, 1)}%</strong>
          </div>
          <div className="planner-utilization-bar">
            <div
              style={{
                width: `${Math.min(100, Math.max(0, result.utilizationPercent))}%`,
              }}
            />
          </div>
        </div>
      </section>

      <section className="info-panel">
        <div className="eyebrow"><Info size={14}/> {t("NOTA DE ENGENHARIA", "ENGINEERING NOTE")}</div>
        <h3>{t("Este é um dimensionamento inicial por capacidade e cobertura.", "This is an initial sizing by capacity and coverage.")}</h3>
        <p>
          {t("No modo Link Budget, o raio é estimado por RF usando espaço livre ou Log-Distance, RSSI alvo, margem e perdas adicionais. O cálculo não substitui site survey nem planejamento preditivo de RF. Paredes, materiais, alturas, potência, antenas, CCI/ACI, roaming, quantidade de canais, bandas utilizadas e requisitos mínimos de RSSI/SNR podem alterar bastante a quantidade e o posicionamento final dos APs.", "In Link Budget mode, the radius is estimated from RF using free space or log-distance, target RSSI, margin and extra losses. It does not replace a site survey or predictive RF planning. Walls, materials, heights, power, antennas, CCI/ACI, roaming, number of channels, bands in use and minimum RSSI/SNR requirements can change the final number and placement of APs a lot.")}
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
    <div className="planner-field">
      <label>{label}</label>
      {children}
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
  unit,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  unit: string
}) {
  return (
    <div className="planner-field">
      <label>{label}</label>
      <div className="field-with-unit">
        <input
          type="number"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
        />
        {unit && <span>{unit}</span>}
      </div>
    </div>
  )
}

function Slider({
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
    <div className="planner-slider">
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
    <div className="panel planner-metric-card">
      <div className="planner-metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </div>
  )
}
