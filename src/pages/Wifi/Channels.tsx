import { useMemo, useState } from 'react'
import { CheckCircle2, Info, Radio, ShieldAlert, XCircle, Zap } from 'lucide-react'
import {
  getChannelConfigs,
  WIDTHS_BY_BAND,
  type ChannelWidth,
  type WifiBand,
} from '../../data/wifiChannels'
import {
  checkRegulatory,
  getOccupiedRange,
  type RegulatoryProfile,
} from '../../data/regulatory'
import {
  getEffectivePowerLimits,
  type RegulatoryDeviceType,
} from '../../data/regulatoryPower'

const bands: WifiBand[] = ['2.4 GHz', '5 GHz', '6 GHz']

export default function Channels() {
  const [band, setBand] = useState<WifiBand>('5 GHz')
  const [width, setWidth] = useState<ChannelWidth>(80)
  const [selected, setSelected] = useState<number | null>(42)
  const [showDfsOnly, setShowDfsOnly] = useState(false)
  const [regulatoryProfile, setRegulatoryProfile] = useState<RegulatoryProfile>('IEEE')
  const [deviceType, setDeviceType] = useState<RegulatoryDeviceType>('AP')

  const widths = WIDTHS_BY_BAND[band]
  const allChannels = useMemo(() => getChannelConfigs(band, width), [band, width])

  const evaluatedChannels = useMemo(
    () => allChannels.map(config => ({
      config,
      regulatory: checkRegulatory(config, regulatoryProfile),
    })),
    [allChannels, regulatoryProfile],
  )

  const channels = useMemo(
    () => showDfsOnly
      ? evaluatedChannels.filter(({ config }) => config.dfs)
      : evaluatedChannels,
    [evaluatedChannels, showDfsOnly],
  )

  const selectedEntry =
    evaluatedChannels.find(({ config }) => config.channel === selected) ?? null

  const selectedChannel = selectedEntry?.config ?? null
  const selectedRegulatory = selectedEntry?.regulatory ?? null
  const powerLimits = useMemo(
    () => selectedChannel && regulatoryProfile === 'BR-ANATEL'
      ? getEffectivePowerLimits(selectedChannel, deviceType, 0, 'GENERAL')
      : null,
    [selectedChannel, regulatoryProfile, deviceType],
  )

  const spectrumRange = useMemo(() => {
    if (allChannels.length === 0) return { min: 0, max: 1 }
    const half = width / 2
    return {
      min: Math.min(...allChannels.map(c => c.frequencyMHz - half)),
      max: Math.max(...allChannels.map(c => c.frequencyMHz + half)),
    }
  }, [allChannels, width])

  function selectFirst(nextBand: WifiBand, nextWidth: ChannelWidth) {
    const first = getChannelConfigs(nextBand, nextWidth)[0]
    setSelected(first?.channel ?? null)
  }

  function changeBand(next: WifiBand) {
    const supported = WIDTHS_BY_BAND[next]
    const nextWidth = supported.includes(width) ? width : supported[0]
    setBand(next)
    setWidth(nextWidth)
    setShowDfsOnly(false)
    selectFirst(next, nextWidth)
  }

  function changeWidth(nextWidth: ChannelWidth) {
    setWidth(nextWidth)
    setShowDfsOnly(false)
    selectFirst(band, nextWidth)
  }

  function position(freq: number) {
    const span = spectrumRange.max - spectrumRange.min
    return ((freq - spectrumRange.min) / span) * 100
  }

  function blockLeft(center: number) {
    return position(center - width / 2)
  }

  function blockWidth(center: number) {
    return position(center + width / 2) - position(center - width / 2)
  }

  return (
    <div>
      <div className="page-title">
        <div>
          <div className="eyebrow"><Radio size={14}/> WI-FI / RF</div>
          <h1>Mapa de Canais Wi-Fi</h1>
          <p>Analise Channel Width, Center Channel, ocupação do espectro e domínio regulatório.</p>
        </div>
      </div>

      <section className="channel-controls panel regulatory-controls">
        <div>
          <label>Banda</label>
          <div className="segmented">
            {bands.map((item) => (
              <button
                key={item}
                className={band === item ? 'selected' : ''}
                onClick={() => changeBand(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label>Channel Width</label>
          <select
            value={width}
            onChange={(e) => changeWidth(Number(e.target.value) as ChannelWidth)}
          >
            {widths.map((item) => (
              <option key={item} value={item}>{item} MHz</option>
            ))}
          </select>
        </div>

        <div>
          <label>Regulatory Domain</label>
          <select
            value={regulatoryProfile}
            onChange={(e) => setRegulatoryProfile(e.target.value as RegulatoryProfile)}
          >
            <option value="IEEE">IEEE / Técnico</option>
            <option value="BR-ANATEL">Brasil / ANATEL</option>
          </select>
        </div>

        {regulatoryProfile === 'BR-ANATEL' && (
          <div>
            <label>Tipo de equipamento</label>
            <select
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value as RegulatoryDeviceType)}
            >
              <option value="AP">Access Point</option>
              <option value="CLIENT">Client</option>
              {band === '6 GHz' && <option value="VLP">Very Low Power</option>}
            </select>
          </div>
        )}

        {band === '5 GHz' && (
          <label className="check-control">
            <input
              type="checkbox"
              checked={showDfsOnly}
              onChange={(e) => setShowDfsOnly(e.target.checked)}
            />
            <span>Somente DFS</span>
          </label>
        )}
      </section>

      {regulatoryProfile === 'BR-ANATEL' && (
        <section className="regulatory-banner">
          <div>
            <strong>Brasil / ANATEL</strong>
            <span>Perfil de referência de frequência ativo</span>
          </div>
          <p>
            Esta camada valida canais e apresenta os limites de referência de TX Power, EIRP e PSD
            aplicáveis ao bloco selecionado. Blocos que cruzam subfaixas usam o limite numérico mais restritivo.
          </p>
        </section>
      )}

      <section className="panel spectrum-overview-panel">
        <div className="panel-title">Visão geral do espectro · {band} · {width} MHz</div>

        <div className="spectrum-legend">
          <span><i className="legend-normal"></i> Non-DFS</span>
          {band === '5 GHz' && <span><i className="legend-dfs"></i> DFS</span>}
          {regulatoryProfile === 'BR-ANATEL' && <span><i className="legend-restricted"></i> Fora do perfil</span>}
          <span><i className="legend-selected"></i> Selecionado</span>
        </div>

        <div className="spectrum-overview">
          <div className="frequency-axis">
            <span>{Math.round(spectrumRange.min)} MHz</span>
            <span>{Math.round((spectrumRange.min + spectrumRange.max) / 2)} MHz</span>
            <span>{Math.round(spectrumRange.max)} MHz</span>
          </div>

          <div className="spectrum-track">
            <div className="track-baseline"></div>
            {evaluatedChannels.map(({ config: item, regulatory }, index) => (
              <button
                key={`${item.width}-${item.channel}-overview`}
                className={[
                  'spectrum-overview-block',
                  item.dfs ? 'dfs' : '',
                  !regulatory.allowed ? 'restricted' : '',
                  selected === item.channel ? 'selected' : '',
                ].join(' ')}
                style={{
                  left: `${blockLeft(item.frequencyMHz)}%`,
                  width: `${blockWidth(item.frequencyMHz)}%`,
                  top: `${16 + (index % 2) * 42}px`,
                }}
                onClick={() => setSelected(item.channel)}
                title={`CH ${item.channel} · ${item.frequencyMHz} MHz · ${width} MHz · ${regulatory.label}`}
              >
                <strong>{item.channel}</strong>
                <span>{item.frequencyMHz}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {selectedChannel && selectedRegulatory && (
        <section className="panel spectrum-panel">
          <div className="panel-title">Bloco selecionado</div>

          <div className="spectrum-header spectrum-header-four">
            <div>
              <span>{width === 20 ? 'Channel' : 'Center Channel'}</span>
              <strong>{selectedChannel.channel}</strong>
            </div>
            <div>
              <span>Center Frequency</span>
              <strong>{selectedChannel.frequencyMHz} MHz</strong>
            </div>
            <div>
              <span>Channel Width</span>
              <strong>{selectedChannel.width} MHz</strong>
            </div>
            <div className={selectedRegulatory.allowed ? 'reg-ok' : 'reg-fail'}>
              <span>Regulatory Status</span>
              <strong>{selectedRegulatory.label}</strong>
            </div>
          </div>

          <div className="spectrum-wrapper">
            <div className="spectrum-block">
              {selectedChannel.constituent20MHz.map((ch) => (
                <div key={ch} className="spectrum-segment">
                  <span className="segment-channel">CH {ch}</span>
                  <span className="segment-width">20 MHz</span>
                </div>
              ))}
            </div>

            <div className="center-marker">
              <div className="center-line"></div>
              <span>Center CH {selectedChannel.channel}</span>
              <strong>{selectedChannel.frequencyMHz} MHz</strong>
            </div>
          </div>

          <div className="spectrum-footer">
            <span>{selectedChannel.constituent20MHz.length} bloco(s) de 20 MHz</span>
            <span>{selectedChannel.dfs ? 'Contém DFS' : 'Sem DFS'}</span>
          </div>
        </section>
      )}

      {regulatoryProfile === 'BR-ANATEL' && selectedChannel && powerLimits && (
        <section className="panel power-limits-panel">
          <div className="panel-title"><Zap size={13}/> Limites regulatórios de potência</div>

          <div className="power-limit-grid">
            <PowerLimit
              label="Max TX Power"
              value={
                powerLimits.baseMaxConductedDbm !== undefined
                  ? `${powerLimits.baseMaxConductedDbm.toFixed(2)} dBm`
                  : 'Depende da categoria'
              }
            />
            <PowerLimit
              label="Max EIRP"
              value={powerLimits.maxEirpDbm !== undefined ? `${powerLimits.maxEirpDbm.toFixed(2)} dBm` : 'Não resumido'}
            />
            <PowerLimit
              label="Max PSD"
              value={
                powerLimits.maxPsdDbmMHz !== undefined
                  ? `${powerLimits.maxPsdDbmMHz.toFixed(2)} dBm/MHz`
                  : powerLimits.psdText ?? 'Não resumido'
              }
            />
            <PowerLimit
              label="Ambiente"
              value={powerLimits.indoorOnly ? 'Indoor' : 'Conforme regra aplicável'}
            />
          </div>

          {powerLimits.mixedSubBands && (
            <div className="mixed-band-warning">
              <ShieldAlert size={16}/>
              <div>
                <strong>Bloco cruza múltiplas subfaixas</strong>
                <p>{powerLimits.note}</p>
              </div>
            </div>
          )}

          <div className="rule-list">
            {powerLimits.rules.map(rule => (
              <div className="rule-item" key={rule.id}>
                <div>
                  <strong>{rule.label}</strong>
                  <span>{rule.id}</span>
                </div>
                <p>{rule.note}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="channel-layout">
        <section className="panel channel-panel">
          <div className="panel-title">Center Channels · {band} · {width} MHz</div>

          <div className="channel-grid">
            {channels.map(({ config: item, regulatory }) => (
              <button
                key={`${item.width}-${item.channel}`}
                className={`channel-cell ${selected === item.channel ? 'selected' : ''} ${item.dfs ? 'dfs' : ''} ${!regulatory.allowed ? 'restricted' : ''}`}
                onClick={() => setSelected(item.channel)}
              >
                <strong>{item.channel}</strong>
                <span>{item.frequencyMHz} MHz</span>
                {item.dfs && <small>DFS</small>}
                {!regulatory.allowed && <em>Bloqueado</em>}
              </button>
            ))}
          </div>
        </section>

        <aside className="panel channel-details">
          <div className="panel-title">Detalhes</div>

          {selectedChannel && selectedRegulatory ? (
            <>
              <div className="selected-channel">
                <span>{width === 20 ? 'Channel' : 'Center Channel'}</span>
                <strong>{selectedChannel.channel}</strong>
                <small>{selectedChannel.frequencyMHz} MHz</small>
              </div>

              <Detail label="Band" value={selectedChannel.band} />
              <Detail label="Channel Width" value={`${width} MHz`} />
              <Detail label="Center Frequency" value={`${selectedChannel.frequencyMHz} MHz`} />
              <Detail label="DFS" value={selectedChannel.dfs ? 'Sim' : 'Não'} />

              {(() => {
                const occupied = getOccupiedRange(selectedChannel)
                return <Detail label="Occupied Range" value={`${occupied.startMHz}–${occupied.endMHz} MHz`} />
              })()}

              <div className={`reg-status-box ${selectedRegulatory.allowed ? 'allowed' : 'blocked'}`}>
                {selectedRegulatory.allowed ? <CheckCircle2 size={17}/> : <XCircle size={17}/>}
                <div>
                  <strong>{selectedRegulatory.label}</strong>
                  {selectedRegulatory.note && <p>{selectedRegulatory.note}</p>}
                </div>
              </div>

              <div className="constituent-box">
                <span>Canais de 20 MHz que compõem o bloco</span>
                <div>
                  {selectedChannel.constituent20MHz.map((ch) => <b key={ch}>{ch}</b>)}
                </div>
              </div>

              {selectedChannel.dfs && (
                <div className="warning-box">
                  <ShieldAlert size={16}/>
                  <div>
                    <strong>Bloco com DFS</strong>
                    <p>O uso pode exigir CAC e mudança de canal caso radar seja detectado.</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="helper-text">Selecione um canal no mapa.</p>
          )}
        </aside>
      </div>

      <section className="info-panel">
        <div className="eyebrow"><Info size={14}/> REFERÊNCIA REGULATÓRIA</div>
        <h3>O perfil Brasil / ANATEL é uma camada independente da canalização IEEE.</h3>
        <p>
          Referências principais: Regulamento sobre Equipamentos de Radiocomunicação de Radiação Restrita
          e requisitos técnicos consolidados do Ato nº 14.448/2017, com alterações posteriores.
          Este módulo ainda não substitui a análise completa dos requisitos de certificação.
        </p>
      </section>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}


function PowerLimit({ label, value }: { label: string; value: string }) {
  return (
    <div className="power-limit-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
