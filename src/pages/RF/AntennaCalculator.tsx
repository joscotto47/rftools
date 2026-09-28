import { useMemo, useState } from 'react'
import { Antenna, Info, RotateCcw, Ruler, Waves } from 'lucide-react'
import {
  fraunhoferDistanceMeters,
  fresnelRadiusMeters,
  wavelengthMeters,
} from '../../calculations/antenna'
import { formatNumber } from '../../calculations/rf'
import { useI18n } from '../../i18n'

export default function AntennaCalculator() {
  const { t } = useI18n()
  const [frequencyGHz, setFrequencyGHz] = useState(5.8)
  const [distanceKm, setDistanceKm] = useState(5)
  const [antennaDimensionCm, setAntennaDimensionCm] = useState(30)

  const result = useMemo(() => {
    const wavelength = wavelengthMeters(frequencyGHz)
    const antennaDimensionM = antennaDimensionCm / 100
    const fraunhofer = fraunhoferDistanceMeters(antennaDimensionM, wavelength)
    const fresnel = fresnelRadiusMeters(
      frequencyGHz,
      distanceKm / 2,
      distanceKm / 2,
    )

    return {
      wavelength,
      wavelengthCm: wavelength * 100,
      halfWaveCm: wavelength * 50,
      quarterWaveCm: wavelength * 25,
      fraunhofer,
      fresnel,
      fresnel60: fresnel * 0.6,
    }
  }, [frequencyGHz, distanceKm, antennaDimensionCm])

  function reset() {
    setFrequencyGHz(5.8)
    setDistanceKm(5)
    setAntennaDimensionCm(30)
  }

  return (
    <div>
      <div className="page-title">
        <div>
          <div className="eyebrow"><Antenna size={14}/> {t('RF / ANTENA', 'RF / ANTENNA')}</div>
          <h1>{t('Comprimento de Onda / Fresnel / Antena', 'Wavelength / Fresnel / Antenna Calculator')}</h1>
          <p>
            {t(
              'Calcule comprimento de onda, dimensões fracionárias, zona de Fresnel e distância de Fraunhofer.',
              'Calculate wavelength, fractional dimensions, Fresnel zone and Fraunhofer distance.',
            )}
          </p>
        </div>
        <button className="ghost-btn" onClick={reset}>
          <RotateCcw size={15}/> {t('Redefinir', 'Reset')}
        </button>
      </div>

      <section className="panel antenna-input-panel">
        <div className="panel-title">{t('Parâmetros', 'Parameters')}</div>

        <div className="antenna-input-grid">
          <NumberField
            label={t('Frequência', 'Frequency')}
            value={frequencyGHz}
            onChange={setFrequencyGHz}
            unit="GHz"
          />
          <NumberField
            label={t('Distância do enlace', 'Link Distance')}
            value={distanceKm}
            onChange={setDistanceKm}
            unit="km"
          />
          <NumberField
            label={t('Maior dimensão da antena', 'Largest antenna dimension')}
            value={antennaDimensionCm}
            onChange={setAntennaDimensionCm}
            unit="cm"
          />
        </div>
      </section>

      <div className="antenna-metrics-grid">
        <Metric
          icon={<Waves size={18}/>}
          label={t('Comprimento de onda λ', 'Wavelength λ')}
          value={`${formatNumber(result.wavelengthCm, 3)} cm`}
          note={`${formatNumber(result.wavelength, 5)} m`}
        />
        <Metric
          icon={<Ruler size={18}/>}
          label="1/2 λ"
          value={`${formatNumber(result.halfWaveCm, 3)} cm`}
          note={t('Referência comum para elementos ressonantes', 'Common reference for resonant elements')}
        />
        <Metric
          icon={<Ruler size={18}/>}
          label="1/4 λ"
          value={`${formatNumber(result.quarterWaveCm, 3)} cm`}
          note={t('Referência comum para monopolos', 'Common reference for monopoles')}
        />
        <Metric
          icon={<Antenna size={18}/>}
          label={t('Distância de Fraunhofer', 'Fraunhofer Distance')}
          value={`${formatNumber(result.fraunhofer, 2)} m`}
          note={t('Limite aproximado de início do far-field', 'Approximate start of the far field')}
        />
      </div>

      <section className="panel antenna-fresnel-panel">
        <div className="panel-title">{t('Zona de Fresnel · ponto médio', 'Fresnel Zone · midpoint')}</div>

        <div className="antenna-fresnel-grid">
          <div className="antenna-fresnel-visual">
            <div className="fresnel-endpoint">TX</div>
            <div className="antenna-fresnel-ellipse"></div>
            <div className="antenna-fresnel-axis"></div>
            <div className="fresnel-endpoint">RX</div>
          </div>

          <div className="antenna-fresnel-values">
            <div>
              <span>{t('Raio F1', 'F1 radius')}</span>
              <strong>{formatNumber(result.fresnel, 2)} m</strong>
            </div>
            <div>
              <span>{t('Desobstrução de 60%', '60% clearance')}</span>
              <strong>{formatNumber(result.fresnel60, 2)} m</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="panel antenna-formulas-panel">
        <div className="panel-title">{t('Referências', 'References')}</div>

        <div className="antenna-formula-grid">
          <div>
            <span>{t('Comprimento de onda', 'Wavelength')}</span>
            <code>λ = c / f</code>
          </div>
          <div>
            <span>Fraunhofer</span>
            <code>d = 2D² / λ</code>
          </div>
          <div>
            <span>Fresnel F1</span>
            <code>r = 17.32 × √(d₁d₂ / f(d₁+d₂))</code>
          </div>
        </div>
      </section>

      <section className="info-panel">
        <div className="eyebrow"><Info size={14}/> {t('NOTA DE ENGENHARIA', 'ENGINEERING NOTE')}</div>
        <h3>{t('Far-field e Fresnel respondem a perguntas diferentes.', 'Far field and Fresnel zone answer different questions.')}</h3>
        <p>
          {t(
            'Fraunhofer indica aproximadamente a partir de que distância o padrão de radiação pode ser tratado como far-field. Fresnel descreve o volume ao redor da linha de visada que deve permanecer suficientemente livre de obstáculos para reduzir difração e perdas adicionais.',
            'Fraunhofer distance tells roughly from where the radiation pattern can be treated as far field. The Fresnel zone describes the volume around the line of sight that must stay clear enough of obstacles to limit diffraction and extra loss.',
          )}
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
    <div className="antenna-field">
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
    <div className="panel antenna-metric-card">
      <div className="antenna-metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </div>
  )
}
