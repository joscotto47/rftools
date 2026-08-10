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
  MATERIAL_LOSSES,
  frequencyToLossBand,
  totalMaterialLossDb,
} from '../../data/materialLosses'

export default function WifiNetworkPlanner() {
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
          <div className="eyebrow"><LayoutGrid size={14}/> WI-FI / PLANNING</div>
          <h1>Wi-Fi Network Planner</h1>
          <p>
            Estime a quantidade de APs necessária por capacidade e cobertura,
            considerando usuários, demanda, concorrência e reutilização de canais.
          </p>
        </div>
        <button className="ghost-btn" onClick={reset}>
          <RotateCcw size={15}/> Redefinir
        </button>
      </div>

      <div className="planner-input-grid">
        <section className="panel">
          <div className="panel-title">Ambiente e usuários</div>

          <Field label="Tipo de ambiente">
            <select
              value={environment}
              onChange={e => changeEnvironment(e.target.value as EnvironmentType)}
            >
              <option value="OPEN">Área aberta</option>
              <option value="OFFICE">Escritório</option>
              <option value="DENSE_OFFICE">Escritório denso</option>
              <option value="WAREHOUSE">Galpão / Warehouse</option>
            </select>
          </Field>

          <NumberField
            label="Área total"
            value={areaM2}
            onChange={setAreaM2}
            unit="m²"
          />
          <NumberField
            label="Usuários"
            value={users}
            onChange={setUsers}
            unit=""
          />

          <Slider
            label="Concorrência média"
            value={concurrency}
            min={5}
            max={100}
            suffix="%"
            onChange={setConcurrency}
          />

          <NumberField
            label="Demanda por usuário ativo"
            value={demandPerUser}
            onChange={setDemandPerUser}
            unit="Mbps"
          />
        </section>

        <section className="panel">
          <div className="panel-title">Capacidade do AP</div>

          <NumberField
            label="Capacidade útil por AP"
            value={capacityPerAp}
            onChange={setCapacityPerAp}
            unit="Mbps"
          />

          <div className="coverage-mode-block">
            <label>Modelo de cobertura</label>
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
              label="Raio de cobertura estimado"
              value={coverageRadius}
              onChange={setCoverageRadius}
              unit="m"
            />
          ) : (
            <div className="rf-coverage-config">
              <div className="planner-field">
                <label>Coverage Model</label>
                <select
                  value={coverageModel}
                  onChange={e => setCoverageModel(e.target.value as CoverageModel)}
                >
                  <option value="FREE_SPACE">Free Space</option>
                  <option value="LOG_DISTANCE">Log-Distance</option>
                </select>
              </div>

              <div className="rf-coverage-grid">
                <NumberField label="Frequency" value={frequencyGHz} onChange={setFrequencyGHz} unit="GHz" />
                <NumberField label="TX Power" value={txPowerDbm} onChange={setTxPowerDbm} unit="dBm" />
                <NumberField label="AP Antenna Gain" value={txAntennaGainDbi} onChange={setTxAntennaGainDbi} unit="dBi" />
                <NumberField label="TX Loss" value={txLossDb} onChange={setTxLossDb} unit="dB" />
                <NumberField label="Client Antenna Gain" value={clientAntennaGainDbi} onChange={setClientAntennaGainDbi} unit="dBi" />
                <NumberField label="Target RSSI" value={targetRssiDbm} onChange={setTargetRssiDbm} unit="dBm" />
                <NumberField label="Fade Margin" value={fadeMarginDb} onChange={setFadeMarginDb} unit="dB" />
                <NumberField label="Extra Loss manual" value={manualExtraLossDb} onChange={setManualExtraLossDb} unit="dB" />
                {coverageModel === 'LOG_DISTANCE' && (
                  <NumberField label="Path Loss Exponent" value={pathLossExponent} onChange={setPathLossExponent} unit="n" />
                )}
              </div>

              <div className="material-loss-builder">
                <div className="material-loss-head">
                  <div>
                    <span>Obstáculos / materiais</span>
                    <strong>Perfil de atenuação · {lossBand}</strong>
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
                          <strong>{material.name}</strong>
                          <span>{material.category} · {formatNumber(perUnit, 1)} dB/un.</span>
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
                    <span>Materiais</span>
                    <strong>{formatNumber(materialLossDb, 1)} dB</strong>
                  </div>
                  <b>+</b>
                  <div>
                    <span>Extra manual</span>
                    <strong>{formatNumber(manualExtraLossDb, 1)} dB</strong>
                  </div>
                  <b>=</b>
                  <div className="highlight">
                    <span>Additional Loss</span>
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
                  <span>Max Path Loss</span>
                  <strong>{formatNumber(rfCoverage.maxPathLossDb, 1)} dB</strong>
                </div>
                <div>
                  <span>Additional Loss</span>
                  <strong>{formatNumber(totalAdditionalLossDb, 1)} dB</strong>
                </div>
                <div className="highlight">
                  <span>Raio RF estimado</span>
                  <strong>{formatNumber(rfCoverage.radiusMeters, 1)} m</strong>
                </div>
              </div>
            </div>
          )}

          <Slider
            label="Overlap planejado"
            value={overlapPercent}
            min={0}
            max={50}
            suffix="%"
            onChange={setOverlapPercent}
          />

          <div className="planner-select-field">
            <label>Channel Reuse Factor</label>
            <select
              value={channelReuseFactor}
              onChange={e => setChannelReuseFactor(Number(e.target.value))}
            >
              <option value={1}>1.00 · ideal</option>
              <option value={1.15}>1.15 · baixo impacto</option>
              <option value={1.25}>1.25 · moderado</option>
              <option value={1.5}>1.50 · alto</option>
              <option value={2}>2.00 · muito alto</option>
            </select>
          </div>
        </section>
      </div>

      <section className="panel planner-hero">
        <div>
          <span>APs recomendados</span>
          <strong>{result.recommendedAps}</strong>
          <small>
            Maior valor entre capacidade ({result.apsByCapacity}) e cobertura ({result.apsByCoverage})
          </small>
        </div>

        <div className={`planner-bottleneck ${bottleneck.toLowerCase()}`}>
          <span>Limitante principal</span>
          <strong>{bottleneck}</strong>
          <small>
            {bottleneck === 'CAPACITY'
              ? 'A densidade/demanda exige mais APs do que a cobertura.'
              : bottleneck === 'COVERAGE'
                ? 'A área física exige mais APs do que a demanda.'
                : 'Capacidade e cobertura estão próximas.'}
          </small>
        </div>
      </section>

      <div className="planner-metrics">
        <Metric
          icon={<Users size={18}/>}
          label="Usuários simultâneos"
          value={formatNumber(result.concurrentUsers, 1)}
          note={`${concurrency}% de ${users} usuários`}
        />
        <Metric
          icon={<Gauge size={18}/>}
          label="Demanda total"
          value={`${formatNumber(result.totalDemandMbps, 1)} Mbps`}
          note={`${demandPerUser} Mbps por usuário ativo`}
        />
        <Metric
          icon={<Wifi size={18}/>}
          label="Capacidade efetiva por AP"
          value={`${formatNumber(result.capacityPerApMbps, 1)} Mbps`}
          note={`Após Channel Reuse Factor ${channelReuseFactor}`}
        />
        <Metric
          icon={<Building2 size={18}/>}
          label="Cobertura estimada por AP"
          value={`${formatNumber(result.estimatedCoveragePerApM2, 0)} m²`}
          note={`Raio ${formatNumber(effectiveCoverageRadius, 1)} m com ${overlapPercent}% overlap`}
        />
      </div>

      <section className="panel planner-comparison-panel">
        <div className="panel-title">Capacity vs Coverage</div>

        <div className="planner-comparison-grid">
          <div className="planner-comparison-card">
            <span>Dimensionamento por capacidade</span>
            <strong>{result.apsByCapacity} APs</strong>
            <p>
              {formatNumber(result.totalDemandMbps, 1)} Mbps de demanda ÷{' '}
              {formatNumber(result.capacityPerApMbps, 1)} Mbps/AP
            </p>
          </div>

          <div className="planner-comparison-card">
            <span>Dimensionamento por cobertura</span>
            <strong>{result.apsByCoverage} APs</strong>
            <p>
              {formatNumber(areaM2, 0)} m² ÷{' '}
              {formatNumber(result.estimatedCoveragePerApM2, 0)} m²/AP
            </p>
          </div>

          <div className="planner-comparison-card highlight">
            <span>Projeto recomendado</span>
            <strong>{result.recommendedAps} APs</strong>
            <p>
              Aproximadamente {formatNumber(result.usersPerAp, 1)} usuários associados
              e {formatNumber(result.demandPerApMbps, 1)} Mbps de demanda por AP.
            </p>
          </div>
        </div>
      </section>

      <section className="panel planner-utilization-panel">
        <div className="panel-title">Utilização estimada</div>

        <div className="planner-utilization-row">
          <div>
            <span>Utilização média por AP</span>
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
        <div className="eyebrow"><Info size={14}/> NOTA DE ENGENHARIA</div>
        <h3>Este é um dimensionamento inicial por capacidade e cobertura.</h3>
        <p>
          No modo Link Budget, o raio é estimado por RF usando Free Space ou Log-Distance,
          target RSSI, margem e perdas adicionais. O cálculo não substitui site survey nem
          predictive RF planning. Paredes, materiais, alturas, potência, antenas, CCI/ACI,
          roaming, quantidade de canais,
          bandas utilizadas e requisitos mínimos de RSSI/SNR podem alterar bastante
          a quantidade e o posicionamento final dos APs.
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
