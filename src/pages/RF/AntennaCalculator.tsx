import { useMemo, useState } from 'react'
import { Antenna, Info, RotateCcw, Ruler, Waves } from 'lucide-react'
import {
  fraunhoferDistanceMeters,
  fresnelRadiusMeters,
  wavelengthMeters,
} from '../../calculations/antenna'
import { formatNumber } from '../../calculations/rf'

export default function AntennaCalculator() {
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
          <div className="eyebrow"><Antenna size={14}/> RF / ANTENNA</div>
          <h1>Wavelength / Fresnel / Antenna Calculator</h1>
          <p>
            Calcule comprimento de onda, dimensões fracionárias, Fresnel Zone
            e distância de Fraunhofer.
          </p>
        </div>
        <button className="ghost-btn" onClick={reset}>
          <RotateCcw size={15}/> Redefinir
        </button>
      </div>

      <section className="panel antenna-input-panel">
        <div className="panel-title">Parâmetros</div>

        <div className="antenna-input-grid">
          <NumberField
            label="Frequency"
            value={frequencyGHz}
            onChange={setFrequencyGHz}
            unit="GHz"
          />
          <NumberField
            label="Link Distance"
            value={distanceKm}
            onChange={setDistanceKm}
            unit="km"
          />
          <NumberField
            label="Maior dimensão da antena"
            value={antennaDimensionCm}
            onChange={setAntennaDimensionCm}
            unit="cm"
          />
        </div>
      </section>

      <div className="antenna-metrics-grid">
        <Metric
          icon={<Waves size={18}/>}
          label="Wavelength λ"
          value={`${formatNumber(result.wavelengthCm, 3)} cm`}
          note={`${formatNumber(result.wavelength, 5)} m`}
        />
        <Metric
          icon={<Ruler size={18}/>}
          label="1/2 λ"
          value={`${formatNumber(result.halfWaveCm, 3)} cm`}
          note="Referência comum para elementos ressonantes"
        />
        <Metric
          icon={<Ruler size={18}/>}
          label="1/4 λ"
          value={`${formatNumber(result.quarterWaveCm, 3)} cm`}
          note="Referência comum para monopolos"
        />
        <Metric
          icon={<Antenna size={18}/>}
          label="Fraunhofer Distance"
          value={`${formatNumber(result.fraunhofer, 2)} m`}
          note="Limite aproximado de início do far-field"
        />
      </div>

      <section className="panel antenna-fresnel-panel">
        <div className="panel-title">Fresnel Zone · ponto médio</div>

        <div className="antenna-fresnel-grid">
          <div className="antenna-fresnel-visual">
            <div className="fresnel-endpoint">TX</div>
            <div className="antenna-fresnel-ellipse"></div>
            <div className="antenna-fresnel-axis"></div>
            <div className="fresnel-endpoint">RX</div>
          </div>

          <div className="antenna-fresnel-values">
            <div>
              <span>F1 radius</span>
              <strong>{formatNumber(result.fresnel, 2)} m</strong>
            </div>
            <div>
              <span>60% clearance</span>
              <strong>{formatNumber(result.fresnel60, 2)} m</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="panel antenna-formulas-panel">
        <div className="panel-title">Referências</div>

        <div className="antenna-formula-grid">
          <div>
            <span>Wavelength</span>
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
        <div className="eyebrow"><Info size={14}/> NOTA DE ENGENHARIA</div>
        <h3>Far-field e Fresnel respondem a perguntas diferentes.</h3>
        <p>
          Fraunhofer indica aproximadamente a partir de que distância o padrão
          de radiação pode ser tratado como far-field. Fresnel descreve o volume
          ao redor da linha de visada que deve permanecer suficientemente livre
          de obstáculos para reduzir difração e perdas adicionais.
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
