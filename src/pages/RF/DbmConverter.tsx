import { useMemo, useState } from 'react'
import { ArrowDown, Copy, RotateCcw } from 'lucide-react'
import { dbmToMw, dbmToW, mwToDbm, mwToW, wToDbm, wToMw, formatNumber } from '../../calculations/rf'
import { useI18n } from '../../i18n'

type Unit = 'dBm' | 'mW' | 'W'

export default function DbmConverter() {
  const { t } = useI18n()
  const [value, setValue] = useState('23')
  const [unit, setUnit] = useState<Unit>('dBm')

  const result = useMemo(() => {
    const n = Number(value.replace(',', '.'))
    if (!Number.isFinite(n)) return null
    if (unit === 'dBm') return { dbm: n, mw: dbmToMw(n), w: dbmToW(n) }
    if (unit === 'mW') return { dbm: mwToDbm(n), mw: n, w: mwToW(n) }
    return { dbm: wToDbm(n), mw: wToMw(n), w: n }
  }, [value, unit])

  const reset = () => { setValue('23'); setUnit('dBm') }

  return (
    <div>
      <div className="page-title">
        <div>
          <div className="eyebrow">{t('RF / POTÊNCIA', 'RF / POWER')}</div>
          <h1>{t('Conversor dBm', 'dBm Converter')}</h1>
          <p>{t('Converta entre unidades de potência de RF logarítmicas e lineares.', 'Convert between logarithmic and linear RF power units.')}</p>
        </div>
        <button className="ghost-btn" onClick={reset}><RotateCcw size={15}/> {t('Redefinir', 'Reset')}</button>
      </div>

      <div className="calculator-layout">
        <section className="panel input-panel">
          <div className="panel-title">{t('Entrada', 'Input')}</div>
          <label>{t('Valor de potência', 'Power value')}</label>
          <div className="input-row">
            <input value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" />
            <select value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
              <option>dBm</option><option>mW</option><option>W</option>
            </select>
          </div>
          <div className="formula-box">
            <span>{t('Referência', 'Reference')}</span>
            <code>0 dBm = 1 mW</code>
          </div>
        </section>

        <div className="conversion-arrow"><ArrowDown size={20}/></div>

        <section className="panel results-panel">
          <div className="panel-title">{t('Resultados', 'Results')}</div>
          <Result label="dBm" value={result ? `${formatNumber(result.dbm, 4)} dBm` : '—'} copyTitle={t('Copiar', 'Copy')} />
          <Result label="mW" value={result ? `${formatNumber(result.mw, 4)} mW` : '—'} copyTitle={t('Copiar', 'Copy')} />
          <Result label="W" value={result ? `${formatNumber(result.w, 6)} W` : '—'} copyTitle={t('Copiar', 'Copy')} />
        </section>
      </div>

      <section className="info-panel">
        <div className="eyebrow">{t('NOTA DE ENGENHARIA', 'ENGINEERING NOTE')}</div>
        <h3>{t('dBm é potência logarítmica referenciada a 1 mW.', 'dBm is logarithmic power referenced to 1 mW.')}</h3>
        <p>{t(
          'Use dBm para equipamentos de RF, sensibilidade de receptor, potência de TX e link budgets. Unidades lineares são úteis para somar potências reais.',
          'Use dBm when working with RF equipment, receiver sensitivity, TX power and link budgets. Linear units are useful when adding actual power values.',
        )}</p>
      </section>
    </div>
  )
}

function Result({ label, value, copyTitle }: { label: string; value: string; copyTitle: string }) {
  return <div className="result-row"><div><span>{label}</span><strong>{value}</strong></div><button className="copy-btn" onClick={() => navigator.clipboard?.writeText(value)} title={copyTitle}><Copy size={15}/></button></div>
}
