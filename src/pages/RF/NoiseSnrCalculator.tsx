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
import { useI18n } from '../../i18n'

const ABSOLUTE_ZERO_C = 273.15
const DEFAULT_TEMPERATURE_C = '16.85'

export default function NoiseSnrCalculator() {
  const { t } = useI18n()
  const [generation, setGeneration] = useState<WifiGeneration>('Wi-Fi 6')
  const [widthMHz, setWidthMHz] = useState(80)
  const [noiseFigureDb, setNoiseFigureDb] = useState(7)
  // 290 K is the IEEE reference temperature for noise figure (T0).
  const [temperatureC, setTemperatureC] = useState(DEFAULT_TEMPERATURE_C)
  const [signalDbm, setSignalDbm] = useState('-58')
  const [mcs, setMcs] = useState(9)

  const requiredSnr =
    requiredSnrForMcs(generation, mcs) ??
    MCS_REQUIRED_SNR[generation][MCS_REQUIRED_SNR[generation].length - 1].requiredSnrDb

  const parsedTemperatureC = Number(temperatureC)
  const temperatureK = Number.isFinite(parsedTemperatureC) && parsedTemperatureC > -ABSOLUTE_ZERO_C
    ? parsedTemperatureC + ABSOLUTE_ZERO_C
    : Number.NaN

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
    setTemperatureC(DEFAULT_TEMPERATURE_C)
    setSignalDbm('-58')
    setMcs(9)
  }

  return (
    <div>
      <div className="page-title">
        <div>
          <div className="eyebrow"><Signal size={14}/> {t('RF / RUÍDO', 'RF / NOISE')}</div>
          <h1>{t('Calculadora de Piso de Ruído / SNR', 'Noise Floor / SNR Calculator')}</h1>
          <p>
            {t(
              'Calcule ruído térmico, piso de ruído do receptor, SNR e sensibilidade estimada do receptor por MCS.',
              'Calculate thermal noise, receiver noise floor, SNR and estimated receiver sensitivity per MCS.',
            )}
          </p>
        </div>
        <button className="ghost-btn" onClick={reset}>
          <RotateCcw size={15}/> {t('Redefinir', 'Reset')}
        </button>
      </div>

      <section className="panel noise-input-panel">
        <div className="panel-title">{t('Parâmetros', 'Parameters')}</div>

        <div className="noise-input-grid">
          <Field label={t('Geração Wi-Fi', 'Wi-Fi Generation')}>
            <select
              value={generation}
              onChange={e => changeGeneration(e.target.value as WifiGeneration)}
            >
              <option>Wi-Fi 5</option>
              <option>Wi-Fi 6</option>
              <option>Wi-Fi 7</option>
            </select>
          </Field>

          <Field label={t('Largura de canal', 'Channel Width')}>
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
            label={t('Figura de ruído', 'Noise Figure')}
            value={noiseFigureDb}
            onChange={setNoiseFigureDb}
            unit="dB"
          />

          <SignedNumberField
            label={t('Nível de sinal', 'Signal Level')}
            value={signalDbm}
            onChange={setSignalDbm}
            unit="dBm"
            placeholder="-58"
          />

          <SignedNumberField
            label={t('Temperatura', 'Temperature')}
            value={temperatureC}
            onChange={setTemperatureC}
            unit="°C"
            placeholder={DEFAULT_TEMPERATURE_C}
            fallback={DEFAULT_TEMPERATURE_C}
          />
        </div>
      </section>

      {!Number.isFinite(validSignalDbm) && (
        <div className="signal-input-warning">
          {t('Digite um nível de sinal válido, por exemplo', 'Enter a valid signal level, for example')} <strong>-58</strong> {t('ou', 'or')} <strong>-67.5 dBm</strong>.
        </div>
      )}

      {!Number.isFinite(temperatureK) && (
        <div className="signal-input-warning">
          {t('Digite uma temperatura acima de −273,15 °C (zero absoluto), por exemplo', 'Enter a temperature above −273.15 °C (absolute zero), for example')} <strong>25</strong>.
        </div>
      )}

      <div className="noise-metrics-grid">
        <Metric
          icon={<Waves size={18}/>}
          label={t('Ruído térmico', 'Thermal Noise')}
          value={`${formatNumber(result.thermal, 2)} dBm`}
          note={`${formatNumber(result.density, 2)} dBm/Hz @ ${formatNumber(parsedTemperatureC, 2)} °C (${formatNumber(temperatureK, 2)} K)`}
        />
        <Metric
          icon={<Activity size={18}/>}
          label={t('Piso de ruído do receptor', 'Receiver Noise Floor')}
          value={`${formatNumber(result.floor, 2)} dBm`}
          note={t(`Inclui figura de ruído de ${noiseFigureDb} dB`, `Includes a ${noiseFigureDb} dB noise figure`)}
        />
        <Metric
          icon={<Signal size={18}/>}
          label={t('SNR atual', 'Current SNR')}
          value={`${formatNumber(result.snr, 2)} dB`}
          note={`${validSignalDbm ? formatNumber(validSignalDbm, 1) : signalDbm} dBm − ${formatNumber(result.floor, 1)} dBm`}
        />
        <Metric
          icon={<Signal size={18}/>}
          label={t(`Sensibilidade estimada · MCS ${mcs}`, `Estimated sensitivity · MCS ${mcs}`)}
          value={`${formatNumber(result.sensitivity, 2)} dBm`}
          note={t(`SNR necessário ≈ ${requiredSnr} dB`, `Required SNR ≈ ${requiredSnr} dB`)}
        />
      </div>

      <section className={`panel snr-status-panel ${result.pass ? 'pass' : 'fail'}`}>
        <div className="snr-status-icon">
          <Signal size={28}/>
        </div>
        <div>
          <span>{t('Status do SNR', 'SNR Status')}</span>
          <strong>{result.pass ? 'PASS' : 'FAIL'}</strong>
          <p>
            {result.pass
              ? t('O SNR calculado atende a referência de SNR para o MCS selecionado.', 'The calculated SNR meets the SNR reference for the selected MCS.')
              : t('O SNR calculado está abaixo da referência necessária para o MCS selecionado.', 'The calculated SNR is below the reference required for the selected MCS.')}
          </p>
        </div>
        <div className="snr-margin-box">
          <span>{t('Margem de SNR', 'SNR Margin')}</span>
          <strong>
            {result.margin >= 0 ? '+' : ''}
            {formatNumber(result.margin, 2)} dB
          </strong>
        </div>
      </section>

      <section className="panel snr-table-panel">
        <div className="panel-title">{t('Referência MCS / SNR', 'MCS / SNR Reference')} · {generation}</div>

        <div className="snr-table-wrap">
          <table className="snr-table">
            <thead>
              <tr>
                <th>MCS</th>
                <th>{t('Modulação', 'Modulation')}</th>
                <th>{t('SNR necessário', 'Required SNR')}</th>
                <th>{t('Sensibilidade estimada', 'Estimated Sensitivity')}</th>
                <th>{t('Margem @ sinal', 'Margin @ Signal')}</th>
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
                    <td>{pass ? 'OK' : t('NÃO', 'NO')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="info-panel">
        <div className="eyebrow"><Info size={14}/> {t('NOTA DE ENGENHARIA', 'ENGINEERING NOTE')}</div>
        <h3>{t('Piso de ruído teórico e SNR real são conceitos diferentes.', 'Theoretical noise floor and real SNR are different things.')}</h3>
        <p>
          {t(
            'O ruído térmico parte de kTB e o piso de ruído do receptor soma a figura de ruído. Em uma WLAN real, interferência co-channel, adjacent-channel, dispositivos não Wi-Fi e ruído impulsivo podem elevar o piso de ruído muito acima do valor térmico calculado. Os SNR necessários por MCS usados aqui são referências práticas aproximadas e podem variar entre chipsets.',
            'Thermal noise comes from kTB and the receiver noise floor adds the noise figure. In a real WLAN, co-channel and adjacent-channel interference, non-Wi-Fi devices and impulsive noise can raise the noise floor far above the calculated thermal value. The required SNR per MCS used here are approximate practical references and vary between chipsets.',
          )}
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
  fallback = '-58',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  unit: string
  placeholder?: string
  fallback?: string
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
              onChange(fallback)
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
