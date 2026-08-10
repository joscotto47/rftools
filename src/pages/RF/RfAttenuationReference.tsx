import { useMemo, useState } from 'react'
import { BarChart3, Info, RotateCcw, Search, Waves } from 'lucide-react'
import {
  MATERIAL_LOSSES,
  type WifiLossBand,
} from '../../data/materialLosses'
import { formatNumber } from '../../calculations/rf'

const BANDS: WifiLossBand[] = ['2.4 GHz', '5 GHz', '6 GHz']

export default function RfAttenuationReference() {
  const [band, setBand] = useState<WifiLossBand>('5 GHz')
  const [category, setCategory] = useState('Todos')
  const [query, setQuery] = useState('')

  const categories = useMemo(
    () => ['Todos', ...Array.from(new Set(MATERIAL_LOSSES.map(item => item.category)))],
    [],
  )

  const filtered = useMemo(
    () =>
      MATERIAL_LOSSES.filter(item => {
        const categoryOk = category === 'Todos' || item.category === category
        const queryOk =
          !query.trim() ||
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
        return categoryOk && queryOk
      }),
    [category, query],
  )

  const maxLoss = Math.max(
    1,
    ...filtered.map(item => item.lossDb[band]),
  )

  function reset() {
    setBand('5 GHz')
    setCategory('Todos')
    setQuery('')
  }

  return (
    <div>
      <div className="page-title">
        <div>
          <div className="eyebrow"><Waves size={14}/> RF / REFERENCE</div>
          <h1>RF Attenuation Reference</h1>
          <p>
            Compare perdas típicas de materiais em 2.4 GHz, 5 GHz e 6 GHz.
          </p>
        </div>
        <button className="ghost-btn" onClick={reset}>
          <RotateCcw size={15}/> Redefinir
        </button>
      </div>

      <section className="panel attenuation-controls">
        <div>
          <label>Banda</label>
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
          <label>Categoria</label>
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {categories.map(item => <option key={item}>{item}</option>)}
          </select>
        </div>

        <div>
          <label>Buscar</label>
          <div className="attenuation-search">
            <Search size={14}/>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Drywall, concreto, vidro..."
            />
          </div>
        </div>
      </section>

      <section className="panel attenuation-chart-panel">
        <div className="panel-title"><BarChart3 size={13}/> Comparativo · {band}</div>

        <div className="attenuation-bars">
          {filtered.map(item => {
            const loss = item.lossDb[band]
            const width = Math.max(3, loss / maxLoss * 100)

            return (
              <div className="attenuation-bar-row" key={item.id}>
                <div className="attenuation-bar-label">
                  <strong>{item.name}</strong>
                  <span>{item.category}</span>
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
            Nenhum material corresponde aos filtros.
          </div>
        )}
      </section>

      <section className="panel attenuation-table-panel">
        <div className="panel-title">Tabela completa</div>

        <div className="attenuation-table-wrap">
          <table className="attenuation-table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Categoria</th>
                <th>2.4 GHz</th>
                <th>5 GHz</th>
                <th>6 GHz</th>
                <th>Impacto em {band}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const selectedLoss = item.lossDb[band]
                const level =
                  selectedLoss >= 20 ? 'Muito alto'
                  : selectedLoss >= 10 ? 'Alto'
                  : selectedLoss >= 5 ? 'Moderado'
                  : 'Baixo'

                return (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                      {item.note && <small>{item.note}</small>}
                    </td>
                    <td>{item.category}</td>
                    <td>{formatNumber(item.lossDb['2.4 GHz'], 1)} dB</td>
                    <td>{formatNumber(item.lossDb['5 GHz'], 1)} dB</td>
                    <td>{formatNumber(item.lossDb['6 GHz'], 1)} dB</td>
                    <td><span className={`attenuation-impact ${level.toLowerCase().replace(' ', '-')}`}>{level}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="info-panel">
        <div className="eyebrow"><Info size={14}/> NOTA DE ENGENHARIA</div>
        <h3>Os valores são referências típicas, não constantes universais.</h3>
        <p>
          A atenuação real depende de espessura, composição, umidade, armadura,
          película metálica, ângulo de incidência e geometria do ambiente.
          Use esta tabela para planejamento preliminar e valide projetos críticos
          com medições ou site survey.
        </p>
      </section>
    </div>
  )
}
