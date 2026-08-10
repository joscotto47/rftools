import { useMemo, useState } from 'react'
import {
  BatteryCharging,
  Cable,
  Info,
  PlugZap,
  RotateCcw,
  Zap,
} from 'lucide-react'
import {
  POE_STANDARDS,
  calculatePoeBudget,
  getPoeStandardInfo,
  type PoeStandard,
} from '../../calculations/poe'
import { formatNumber } from '../../calculations/rf'

const CABLE_PRESETS = [
  { name: 'Cat5e / 24 AWG', resistance: 9.38 },
  { name: 'Cat6 / 23 AWG', resistance: 6.67 },
  { name: 'Cat6A / 23 AWG', resistance: 6.67 },
]

export default function PoeCalculator() {
  const [standard, setStandard] = useState<PoeStandard>('802.3at')
  const [cableLengthM, setCableLengthM] = useState(50)
  const [deviceConsumptionW, setDeviceConsumptionW] = useState(12.6)
  const [voltageV, setVoltageV] = useState(50)
  const [cableResistance, setCableResistance] = useState(6.67)

  const result = useMemo(
    () =>
      calculatePoeBudget({
        standard,
        cableLengthM,
        conductorResistanceOhmPer100m: cableResistance,
        deviceConsumptionW,
        voltageV,
      }),
    [
      standard,
      cableLengthM,
      cableResistance,
      deviceConsumptionW,
      voltageV,
    ],
  )

  function changeStandard(next: PoeStandard) {
    setStandard(next)
    setVoltageV(getPoeStandardInfo(next).nominalVoltageV)
  }

  function reset() {
    setStandard('802.3at')
    setCableLengthM(50)
    setDeviceConsumptionW(12.6)
    setVoltageV(50)
    setCableResistance(6.67)
  }

  return (
    <div>
      <div className="page-title">
        <div>
          <div className="eyebrow"><PlugZap size={14}/> NETWORKING / POWER</div>
          <h1>PoE Calculator</h1>
          <p>
            Estime potência disponível no PD, perdas no cabo e margem de potência
            para IEEE 802.3af / at / bt.
          </p>
        </div>
        <button className="ghost-btn" onClick={reset}>
          <RotateCcw size={15}/> Redefinir
        </button>
      </div>

      <div className="poe-layout">
        <section className="panel">
          <div className="panel-title">PoE / PSE</div>

          <div className="poe-standard-grid">
            {POE_STANDARDS.map(item => (
              <button
                key={item.standard}
                className={standard === item.standard ? 'selected' : ''}
                onClick={() => changeStandard(item.standard)}
              >
                <span>{item.type}</span>
                <strong>{item.standard}</strong>
                <small>{item.maxPsePowerW} W PSE</small>
              </button>
            ))}
          </div>

          <div className="poe-input-grid">
            <NumberField
              label="PSE Voltage"
              value={voltageV}
              onChange={setVoltageV}
              unit="V"
            />

            <NumberField
              label="Device Consumption"
              value={deviceConsumptionW}
              onChange={setDeviceConsumptionW}
              unit="W"
            />
          </div>

          <div className="poe-standard-summary">
            <Metric
              label="Max PSE Power"
              value={`${formatNumber(result.info.maxPsePowerW, 2)} W`}
            />
            <Metric
              label="Guaranteed PD Power"
              value={`${formatNumber(result.info.minPdPowerW, 2)} W`}
            />
            <Metric
              label="Powered Pairs"
              value={String(result.info.pairs)}
            />
          </div>
        </section>

        <section className="panel">
          <div className="panel-title"><Cable size={13}/> Cabo</div>

          <NumberField
            label="Cable Length"
            value={cableLengthM}
            onChange={setCableLengthM}
            unit="m"
          />

          <div className="poe-cable-presets">
            {CABLE_PRESETS.map(cable => (
              <button
                key={cable.name}
                className={Math.abs(cableResistance - cable.resistance) < 0.01 ? 'selected' : ''}
                onClick={() => setCableResistance(cable.resistance)}
              >
                <strong>{cable.name}</strong>
                <span>{cable.resistance} Ω / 100 m / cond.</span>
              </button>
            ))}
          </div>

          <NumberField
            label="Conductor Resistance"
            value={cableResistance}
            onChange={setCableResistance}
            unit="Ω/100m"
          />
        </section>
      </div>

      <section className={`panel poe-status-panel ${result.pass ? 'pass' : 'fail'}`}>
        <div className="poe-status-icon">
          {result.pass ? <BatteryCharging size={28}/> : <Zap size={28}/>}
        </div>

        <div>
          <span>Power Status</span>
          <strong>{result.pass ? 'PASS' : 'FAIL'}</strong>
          <p>
            {result.pass
              ? 'A potência estimada disponível no PD é maior que o consumo informado.'
              : 'O consumo informado excede a potência estimada disponível no PD.'}
          </p>
        </div>

        <div className="poe-margin-box">
          <span>Power Margin</span>
          <strong>
            {result.marginW >= 0 ? '+' : ''}
            {formatNumber(result.marginW, 2)} W
          </strong>
        </div>
      </section>

      <div className="poe-metrics-grid">
        <PoeCard
          icon={<Zap size={18}/>}
          label="Potência estimada no PD"
          value={`${formatNumber(result.estimatedAvailableAtPd, 2)} W`}
          note="PSE máximo menos perda resistiva estimada"
        />

        <PoeCard
          icon={<Cable size={18}/>}
          label="Perda estimada no cabo"
          value={`${formatNumber(result.deviceCableLoss, 3)} W`}
          note={`Para a carga informada em ${formatNumber(cableLengthM, 0)} m`}
        />

        <PoeCard
          icon={<PlugZap size={18}/>}
          label="Corrente estimada"
          value={`${formatNumber(result.currentA * 1000, 1)} mA`}
          note={`Aproximação em ${formatNumber(voltageV, 1)} V`}
        />

        <PoeCard
          icon={<BatteryCharging size={18}/>}
          label="Utilização da potência"
          value={`${formatNumber(result.utilizationPercent, 1)}%`}
          note={`${formatNumber(deviceConsumptionW, 2)} W consumidos`}
        />
      </div>

      <section className="panel poe-flow-panel">
        <div className="panel-title">Power Path</div>

        <div className="poe-flow">
          <div>
            <span>PSE</span>
            <strong>{formatNumber(result.info.maxPsePowerW, 2)} W</strong>
          </div>

          <b>→</b>

          <div>
            <span>Cable Loss</span>
            <strong>−{formatNumber(result.standardCableLoss, 2)} W</strong>
          </div>

          <b>→</b>

          <div className="highlight">
            <span>Estimated PD Available</span>
            <strong>{formatNumber(result.estimatedAvailableAtPd, 2)} W</strong>
          </div>

          <b>→</b>

          <div>
            <span>Device Load</span>
            <strong>{formatNumber(deviceConsumptionW, 2)} W</strong>
          </div>
        </div>
      </section>

      <section className="info-panel">
        <div className="eyebrow"><Info size={14}/> NOTA DE ENGENHARIA</div>
        <h3>O cálculo de perda no cabo é uma estimativa resistiva.</h3>
        <p>
          A potência garantida pelo padrão no PD já considera condições normativas
          de cabeamento. O cálculo adicional de I²R serve para análise de engenharia
          e comparação de comprimentos/bitolas, mas não substitui os limites e testes
          definidos pelo padrão IEEE nem a especificação real do PSE e do PD.
        </p>
      </section>
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
    <div className="poe-field">
      <label>{label}</label>
      <div className="field-with-unit">
        <input
          type="number"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
        />
        <span>{unit}</span>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="poe-standard-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function PoeCard({
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
    <div className="panel poe-metric-card">
      <div className="poe-metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </div>
  )
}
