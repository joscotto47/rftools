import { useMemo, useState } from 'react'
import { Activity, Info, RotateCcw, Signal, Waves } from 'lucide-react'
import {
  noiseDensityDbmHz,
  receiverNoiseFloorDbm,
  receiverSensitivityDbm,
  signalToNoiseRatioDb,
  thermalNoiseDbm,
} from '../../calculations/noiseSnr'
import {
  MCS,
  WIDTHS,
  type WifiGeneration,
} from '../../calculations/phyRate'
import {
  MCS_REQUIRED_SNR,
  requiredSnrForMcs,
} from '../../data/wifiSnr'
import { formatNumber } from '../../calculations/rf'

export default function NoiseSnrCalculator() {
  const [generation, setGeneration] = useState<WifiGeneration>('Wi-Fi 6')
  const [widthMHz, setWidthMHz] = useState(80)
  const [noiseFigureDb, setNoiseFigureDb] = useState(7)
  const [temperatureK, setTemperatureK] = useState(290)
  const [signalDbm, setSignalDbm] = useState('-58')
  const [mcs, setMcs] = useState(9)

  const requiredSnr =
    requiredSnrForMcs(generation, mcs) ??
    MCS_REQUIRED_SNR[generation][MCS_REQUIRED_SNR[generation].length - 1].requiredSnrDb

  const parsedSignalDbm = Number(signalDbm)
  const validSignalDbm = Number.isFinite(parsedSignalDbm)
    ? parsedSignalDbm
    : Number.NaN

  const result = useMemo(() => {
    const bandwidthHz = widthMHz * 1e6
    const thermal = thermalNoiseDbm(bandwidthHz, temperatureK)
    const floor = receiverNoiseFloorDbm(
      bandwidthHz,
      noiseFigureDb,
      temperatureK,
    )
    const sensitivity = receiverSensitivityDbm(
      bandwidthHz,
      noiseFigureDb,
      requiredSnr,
      temperatureK,
    )
    const snr = signalToNoiseRatioDb(validSignalDbm, floor)
    const margin = snr - requiredSnr

    return {
      bandwidthHz,
      thermal,
      floor,
      sensitivity,
      snr,
      margin,
      density: noiseDensityDbmHz(temperatureK),
      pass: margin >= 0,
    }
  }, [
    widthMHz,
    noiseFigureDb,
    temperatureK,
    validSignalDbm,
    requiredSnr,
  ])

  function changeGeneration(next: WifiGeneration) {
    setGeneration(next)
    const widths = WIDTHS[next]
    if (!widths.includes(widthMHz)) {
      setWidthMHz(widths[widths.length - 1])
    }

    const maxMcs = MCS[next][MCS[next].length - 1].mcs
    if (mcs > maxMcs) setMcs(maxMcs)
  }

  function reset() {
    setGeneration('Wi-Fi 6')
    setWidthMHz(80)
    setNoiseFigureDb(7)
    setTemperatureK(290)
    setSignalDbm('-58')
    setMcs(9)
  }

  return (
    <div>
      <div className="page-title">
        <div>
          <div className="eyebrow"><Signal size={14}/> RF / NOISE</div>
          <h1>Noise Floor / SNR Calculator</h1>
          <p>
            Calcule Thermal Noise, Receiver Noise Floor, SNR e receiver sensitivity
            estimada por MCS.
          </p>
        </div>
        <button className="ghost-btn" onClick={reset}>
          <RotateCcw size={15}/> Redefinir
        </button>
      </div>

      <section className="panel noise-input-panel">
        <div className="panel-title">Parâmetros</div>

        <div className="noise-input-grid">
          <Field label="Wi-Fi Generation">
            <select
              value={generation}
              onChange={e => changeGeneration(e.target.value as WifiGeneration)}
            >
              <option>Wi-Fi 5</option>
              <option>Wi-Fi 6</option>
              <option>Wi-Fi 7</option>
            </select>
          </Field>

          <Field label="Channel Width">
            <select
              value={widthMHz}
              onChange={e => setWidthMHz(Number(e.target.value))}
            >
              {WIDTHS[generation].map(width => (
                <option key={width} value={width}>{width} MHz</option>
              ))}
            </select>
          </Field>

          <Field label="MCS">
            <select
              value={mcs}
              onChange={e => setMcs(Number(e.target.value))}
            >
              {MCS[generation].map(item => (
                <option key={item.mcs} value={item.mcs}>
                  MCS {item.mcs} · {item.modulation}
                </option>
              ))}
            </select>
          </Field>

          <NumberField
            label="Noise Figure"
            value={noiseFigureDb}
            onChange={setNoiseFigureDb}
            unit="dB"
          />

          <SignedNumberField
            label="Signal Level"
            value={signalDbm}
            onChange={setSignalDbm}
            unit="dBm"
            placeholder="-58"
          />

          <NumberField
            label="Temperature"
            value={temperatureK}
            onChange={setTemperatureK}
            unit="K"
          />
        </div>
      </section>

      {!Number.isFinite(validSignalDbm) && (
        <div className="signal-input-warning">
          Digite um nível de sinal válido, por exemplo <strong>-58</strong> ou <strong>-67.5 dBm</strong>.
        </div>
      )}

      <div className="noise-metrics-grid">
        <Metric
          icon={<Waves size={18}/>}
          label="Thermal Noise"
          value={`${formatNumber(result.thermal, 2)} dBm`}
          note={`${formatNumber(result.density, 2)} dBm/Hz @ ${temperatureK} K`}
        />
        <Metric
          icon={<Activity size={18}/>}
          label="Receiver Noise Floor"
          value={`${formatNumber(result.floor, 2)} dBm`}
          note={`Inclui Noise Figure de ${noiseFigureDb} dB`}
        />
        <Metric
          icon={<Signal size={18}/>}
          label="SNR atual"
          value={`${formatNumber(result.snr, 2)} dB`}
          note={`${validSignalDbm ? formatNumber(validSignalDbm, 1) : signalDbm} dBm − ${formatNumber(result.floor, 1)} dBm`}
        />
        <Metric
          icon={<Signal size={18}/>}
          label={`Sensitivity estimada · MCS ${mcs}`}
          value={`${formatNumber(result.sensitivity, 2)} dBm`}
          note={`Required SNR ≈ ${requiredSnr} dB`}
        />
      </div>

      <section className={`panel snr-status-panel ${result.pass ? 'pass' : 'fail'}`}>
        <div className="snr-status-icon">
          <Signal size={28}/>
        </div>
        <div>
          <span>SNR Status</span>
          <strong>{result.pass ? 'PASS' : 'FAIL'}</strong>
          <p>
            {result.pass
              ? 'O SNR calculado atende a referência de SNR para o MCS selecionado.'
              : 'O SNR calculado está abaixo da referência necessária para o MCS selecionado.'}
          </p>
        </div>
        <div className="snr-margin-box">
          <span>SNR Margin</span>
          <strong>
            {result.margin >= 0 ? '+' : ''}
            {formatNumber(result.margin, 2)} dB
          </strong>
        </div>
      </section>

      <section className="panel snr-table-panel">
        <div className="panel-title">MCS / SNR Reference · {generation}</div>

        <div className="snr-table-wrap">
          <table className="snr-table">
            <thead>
              <tr>
                <th>MCS</th>
                <th>Modulation</th>
                <th>Required SNR</th>
                <th>Estimated Sensitivity</th>
                <th>Margin @ Signal</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {MCS[generation].map(info => {
                const snrRef =
                  requiredSnrForMcs(generation, info.mcs) ?? 0

                const sensitivity = receiverSensitivityDbm(
                  widthMHz * 1e6,
                  noiseFigureDb,
                  snrRef,
                  temperatureK,
                )

                const margin = validSignalDbm - sensitivity
                const pass = margin >= 0

                return (
                  <tr
                    key={info.mcs}
                    className={info.mcs === mcs ? 'active' : ''}
                    onClick={() => setMcs(info.mcs)}
                  >
                    <td>MCS {info.mcs}</td>
                    <td>{info.modulation}</td>
                    <td>{snrRef} dB</td>
                    <td>{formatNumber(sensitivity, 1)} dBm</td>
                    <td>{margin >= 0 ? '+' : ''}{formatNumber(margin, 1)} dB</td>
                    <td>{pass ? 'OK' : 'NO'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="info-panel">
        <div className="eyebrow"><Info size={14}/> NOTA DE ENGENHARIA</div>
        <h3>Noise Floor teórico e SNR real são conceitos diferentes.</h3>
        <p>
          O Thermal Noise parte de kTB e o Receiver Noise Floor adiciona o Noise Figure
          do receptor. Em uma WLAN real, interferência co-channel, adjacent-channel,
          dispositivos não Wi-Fi e ruído impulsivo podem elevar o noise floor muito acima
          do valor térmico calculado. Os Required SNR por MCS usados aqui são referências
          práticas aproximadas e podem variar entre chipsets.
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
    <div className="noise-field">
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
    <div className="noise-field">
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

function SignedNumberField({
  label,
  value,
  onChange,
  unit,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  unit: string
  placeholder?: string
}) {
  return (
    <div className="noise-field">
      <label>{label}</label>
      <div className="field-with-unit">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          onChange={e => {
            const next = e.target.value.replace(',', '.')
            if (
              next === '' ||
              next === '-' ||
              /^-?\d*\.?\d*$/.test(next)
            ) {
              onChange(next)
            }
          }}
          onBlur={() => {
            if (value === '' || value === '-' || !Number.isFinite(Number(value))) {
              onChange('-58')
            }
          }}
        />
        <span>{unit}</span>
      </div>
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
    <div className="panel noise-metric-card">
      <div className="noise-metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </div>
  )
}
