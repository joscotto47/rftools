import { useMemo, useState } from 'react'
import { BarChart3, Info, RotateCcw, Search, Waves } from 'lucide-react'
import {
  MATERIAL_CATEGORY_LABELS,
  MATERIAL_LOSSES,
  type MaterialCategory,
  type WifiLossBand,
} from '../../data/materialLosses'
import { formatNumber } from '../../calculations/rf'
import { useI18n } from '../../i18n'

const BANDS: WifiLossBand[] = ['2.4 GHz', '5 GHz', '6 GHz']
const ALL = 'all'

type Impact = 'very-high' | 'high' | 'moderate' | 'low'

// CSS classes predate the translation and stay in Portuguese.
const IMPACT_CLASS: Record<Impact, string> = { 'very-high': 'muito-alto', high: 'alto', moderate: 'moderado', low: 'baixo' }

function impactOf(lossDb: number): Impact {
  if (lossDb >= 20) return 'very-high'
  if (lossDb >= 10) return 'high'
  if (lossDb >= 5) return 'moderate'
  return 'low'
}

export default function RfAttenuationReference() {
  const { t, tl } = useI18n()
  const [band, setBand] = useState<WifiLossBand>('5 GHz')
  const [category, setCategory] = useState<MaterialCategory | typeof ALL>(ALL)
  const [query, setQuery] = useState('')

  const impactLabel: Record<Impact, string> = {
    'very-high': t('Muito alto', 'Very high'),
    high: t('Alto', 'High'),
    moderate: t('Moderado', 'Moderate'),
    low: t('Baixo', 'Low'),
  }

  const categories = useMemo(
    () => Array.from(new Set(MATERIAL_LOSSES.map(item => item.category))),
    [],
  )

  const filtered = MATERIAL_LOSSES.filter(item => {
    const categoryOk = category === ALL || item.category === category
    const q = query.trim().toLowerCase()
    // Search matches either language, so a term typed in PT still works in EN mode.
    const queryOk =
      !q ||
      [item.name.pt, item.name.en, MATERIAL_CATEGORY_LABELS[item.category].pt, MATERIAL_CATEGORY_LABELS[item.category].en]
        .some(text => text.toLowerCase().includes(q))
    return categoryOk && queryOk
  })

  const maxLoss = Math.max(
    1,
    ...filtered.map(item => item.lossDb[band]),
  )

  function reset() {
    setBand('5 GHz')
    setCategory(ALL)
    setQuery('')
  }

  return (
    <div>
      <div className="page-title">
        <div>
          <div className="eyebrow"><Waves size={14}/> {t('RF / REFERÊNCIA', 'RF / REFERENCE')}</div>
          <h1>{t('Referência de Atenuação de RF', 'RF Attenuation Reference')}</h1>
          <p>
            {t('Compare perdas típicas de materiais em 2.4 GHz, 5 GHz e 6 GHz.', 'Compare typical material losses at 2.4 GHz, 5 GHz and 6 GHz.')}
          </p>
        </div>
        <button className="ghost-btn" onClick={reset}>
          <RotateCcw size={15}/> {t('Redefinir', 'Reset')}
        </button>
      </div>

      <section className="panel attenuation-controls">
        <div>
          <label>{t('Banda', 'Band')}</label>
          <div className="segmented">
            {BANDS.map(item => (
              <button
                key={item}
                className={band === item ? 'selected' : ''}
                onClick={() => setBand(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label>{t('Categoria', 'Category')}</label>
          <select value={category} onChange={e => setCategory(e.target.value as MaterialCategory | typeof ALL)}>
            <option value={ALL}>{t('Todos', 'All')}</option>
            {categories.map(item => <option key={item} value={item}>{tl(MATERIAL_CATEGORY_LABELS[item])}</option>)}
          </select>
        </div>

        <div>
          <label>{t('Buscar', 'Search')}</label>
          <div className="attenuation-search">
            <Search size={14}/>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t('Drywall, concreto, vidro...', 'Drywall, concrete, glass...')}
            />
          </div>
        </div>
      </section>

      <section className="panel attenuation-chart-panel">
        <div className="panel-title"><BarChart3 size={13}/> {t('Comparativo', 'Comparison')} · {band}</div>

        <div className="attenuation-bars">
          {filtered.map(item => {
            const loss = item.lossDb[band]
            const width = Math.max(3, loss / maxLoss * 100)

            return (
              <div className="attenuation-bar-row" key={item.id}>
                <div className="attenuation-bar-label">
                  <strong>{tl(item.name)}</strong>
                  <span>{tl(MATERIAL_CATEGORY_LABELS[item.category])}</span>
                </div>

                <div className="attenuation-bar-track">
                  <div style={{ width: `${width}%` }}></div>
                </div>

                <div className="attenuation-bar-value">
                  {formatNumber(loss, 1)} dB
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="empty-channel">
            {t('Nenhum material corresponde aos filtros.', 'No material matches the filters.')}
          </div>
        )}
      </section>

      <section className="panel attenuation-table-panel">
        <div className="panel-title">{t('Tabela completa', 'Full table')}</div>

        <div className="attenuation-table-wrap">
          <table className="attenuation-table">
            <thead>
              <tr>
                <th>{t('Material', 'Material')}</th>
                <th>{t('Categoria', 'Category')}</th>
                <th>2.4 GHz</th>
                <th>5 GHz</th>
                <th>6 GHz</th>
                <th>{t('Impacto em', 'Impact at')} {band}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const impact = impactOf(item.lossDb[band])

                return (
                  <tr key={item.id}>
                    <td>
                      <strong>{tl(item.name)}</strong>
                      {item.note && <small>{tl(item.note)}</small>}
                    </td>
                    <td>{tl(MATERIAL_CATEGORY_LABELS[item.category])}</td>
                    <td>{formatNumber(item.lossDb['2.4 GHz'], 1)} dB</td>
                    <td>{formatNumber(item.lossDb['5 GHz'], 1)} dB</td>
                    <td>{formatNumber(item.lossDb['6 GHz'], 1)} dB</td>
                    <td><span className={`attenuation-impact ${IMPACT_CLASS[impact]}`}>{impactLabel[impact]}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="info-panel">
        <div className="eyebrow"><Info size={14}/> {t('NOTA DE ENGENHARIA', 'ENGINEERING NOTE')}</div>
        <h3>{t('Os valores são referências típicas, não constantes universais.', 'These values are typical references, not universal constants.')}</h3>
        <p>
          {t(
            'A atenuação real depende de espessura, composição, umidade, armadura, película metálica, ângulo de incidência e geometria do ambiente. Use esta tabela para planejamento preliminar e valide projetos críticos com medições ou site survey.',
            'Real attenuation depends on thickness, composition, moisture, rebar, metallic film, angle of incidence and room geometry. Use this table for preliminary planning and validate critical designs with measurements or a site survey.',
          )}
        </p>
      </section>
    </div>
  )
}
