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
import { useI18n } from '../../i18n'

const bands: WifiBand[] = ['2.4 GHz', '5 GHz', '6 GHz']

export default function Channels() {
  const { t, tl } = useI18n()
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
      ? getEffectivePowerLimits(selectedChannel, deviceType)
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
          <h1>{t("Mapa de Canais Wi-Fi", "Wi-Fi Channel Map")}</h1>
          <p>{t("Analise largura de canal, canal central, ocupação do espectro e domínio regulatório.", "Analyze channel width, center channel, spectrum occupancy and regulatory domain.")}</p>
        </div>
      </div>

      <section className="channel-controls panel regulatory-controls">
        <div>
          <label>{t("Banda", "Band")}</label>
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
          <label>{t("Largura de canal", "Channel width")}</label>
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
          <label>{t("Domínio regulatório", "Regulatory domain")}</label>
          <select
            value={regulatoryProfile}
            onChange={(e) => setRegulatoryProfile(e.target.value as RegulatoryProfile)}
          >
            <option value="IEEE">{t("IEEE / Técnico", "IEEE / Technical")}</option>
            <option value="BR-ANATEL">{t("Brasil / ANATEL", "Brazil / ANATEL")}</option>
          </select>
        </div>

        {regulatoryProfile === 'BR-ANATEL' && (
          <div>
            <label>{t("Tipo de equipamento", "Device type")}</label>
            <select
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value as RegulatoryDeviceType)}
            >
              <option value="AP">{t("Ponto de acesso", "Access point")}</option>
              <option value="CLIENT">{t("Cliente", "Client")}</option>
              {band === '6 GHz' && <option value="VLP">{t("Potência muito baixa (VLP)", "Very low power (VLP)")}</option>}
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
            <span>{t("Somente DFS", "DFS only")}</span>
          </label>
        )}
      </section>

      {regulatoryProfile === 'BR-ANATEL' && (
        <section className="regulatory-banner">
          <div>
            <strong>{t("Brasil / ANATEL", "Brazil / ANATEL")}</strong>
            <span>{t("Perfil de referência de frequência ativo", "Frequency reference profile active")}</span>
          </div>
          <p>
            {t("Esta camada valida canais e apresenta os limites de referência de potência de TX, EIRP e PSD aplicáveis ao bloco selecionado. Blocos que cruzam subfaixas usam o limite numérico mais restritivo.", "This layer validates channels and shows the reference limits for TX power, EIRP and PSD that apply to the selected block. Blocks that span sub-bands use the most restrictive numeric limit.")}
          </p>
        </section>
      )}

      <section className="panel spectrum-overview-panel">
        <div className="panel-title">{t("Visão geral do espectro", "Spectrum overview")} · {band} · {width} MHz</div>

        <div className="spectrum-legend">
          <span><i className="legend-normal"></i> {t("Sem DFS", "Non-DFS")}</span>
          {band === '5 GHz' && <span><i className="legend-dfs"></i> DFS</span>}
          {regulatoryProfile === 'BR-ANATEL' && <span><i className="legend-restricted"></i> {t("Fora do perfil", "Outside profile")}</span>}
          <span><i className="legend-selected"></i> {t("Selecionado", "Selected")}</span>
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
                title={`CH ${item.channel} · ${item.frequencyMHz} MHz · ${width} MHz · ${tl(regulatory.label)}`}
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
          <div className="panel-title">{t("Bloco selecionado", "Selected block")}</div>

          <div className="spectrum-header spectrum-header-four">
            <div>
              <span>{width === 20 ? t("Canal", "Channel") : t("Canal central", "Center channel")}</span>
              <strong>{selectedChannel.channel}</strong>
            </div>
            <div>
              <span>{t("Frequência central", "Center frequency")}</span>
              <strong>{selectedChannel.frequencyMHz} MHz</strong>
            </div>
            <div>
              <span>{t("Largura de canal", "Channel width")}</span>
              <strong>{selectedChannel.width} MHz</strong>
            </div>
            <div className={selectedRegulatory.allowed ? 'reg-ok' : 'reg-fail'}>
              <span>{t("Status regulatório", "Regulatory status")}</span>
              <strong>{tl(selectedRegulatory.label)}</strong>
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
              <span>{t("Canal central", "Center CH")} {selectedChannel.channel}</span>
              <strong>{selectedChannel.frequencyMHz} MHz</strong>
            </div>
          </div>

          <div className="spectrum-footer">
            <span>{t(`${selectedChannel.constituent20MHz.length} bloco(s) de 20 MHz`, `${selectedChannel.constituent20MHz.length} × 20 MHz block(s)`)}</span>
            <span>{selectedChannel.dfs ? t("Contém DFS", "Includes DFS") : t("Sem DFS", "No DFS")}</span>
          </div>
        </section>
      )}

      {regulatoryProfile === 'BR-ANATEL' && selectedChannel && powerLimits && (
        <section className="panel power-limits-panel">
          <div className="panel-title"><Zap size={13}/> {t("Limites regulatórios de potência", "Regulatory power limits")}</div>

          <div className="power-limit-grid">
            <PowerLimit
              label={t("Potência de TX máx. (total conduzido)", "Max TX power (total conducted)")}
              value={
                powerLimits.baseMaxConductedDbm !== undefined
                  ? `${powerLimits.baseMaxConductedDbm.toFixed(2)} dBm`
                  : powerLimits.applicable ? t("Regra por EIRP", "EIRP-based rule") : '—'
              }
            />
            <PowerLimit
              label={t("EIRP máxima", "Max EIRP")}
              value={
                powerLimits.maxEirpDbm !== undefined
                  ? `${powerLimits.maxEirpDbm.toFixed(2)} dBm`
                  : powerLimits.applicable ? t("Conduzida + ganho até 6 dBi", "Conducted + gain up to 6 dBi") : '—'
              }
            />
            <PowerLimit
              label={powerLimits.psdKind === 'EIRP' ? t("PSD máx. (EIRP)", "Max PSD (EIRP)") : t("PSD máx. (conduzida)", "Max PSD (conducted)")}
              value={
                powerLimits.maxPsdDbmMHz !== undefined
                  ? `${powerLimits.maxPsdDbmMHz.toFixed(2)} dBm/MHz`
                  : powerLimits.psdText ? tl(powerLimits.psdText) : '—'
              }
            />
            <PowerLimit
              label={t("Ambiente", "Environment")}
              value={powerLimits.indoorOnly ? 'Indoor' : t("Conforme regra aplicável", "Per applicable rule")}
            />
          </div>

          {!powerLimits.applicable && (
            <div className="mixed-band-warning">
              <ShieldAlert size={16}/>
              <div>
                <strong>{t("Fora das faixas permitidas", "Outside allowed bands")}</strong>
                <p>{powerLimits.note ? tl(powerLimits.note) : null}</p>
              </div>
            </div>
          )}

          {powerLimits.mixedSubBands && (
            <div className="mixed-band-warning">
              <ShieldAlert size={16}/>
              <div>
                <strong>{t("Bloco cruza múltiplas subfaixas", "Block spans multiple sub-bands")}</strong>
                <p>{powerLimits.note ? tl(powerLimits.note) : null}</p>
              </div>
            </div>
          )}

          <div className="rule-list">
            {powerLimits.rules.map(rule => (
              <div className="rule-item" key={rule.id}>
                <div>
                  <strong>{tl(rule.label)}</strong>
                  <span>{rule.id}</span>
                </div>
                <p>{rule.note ? tl(rule.note) : null}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="channel-layout">
        <section className="panel channel-panel">
          <div className="panel-title">{t("Canais centrais", "Center channels")} · {band} · {width} MHz</div>

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
                {!regulatory.allowed && <em>{t("Bloqueado", "Blocked")}</em>}
              </button>
            ))}
          </div>
        </section>

        <aside className="panel channel-details">
          <div className="panel-title">{t("Detalhes", "Details")}</div>

          {selectedChannel && selectedRegulatory ? (
            <>
              <div className="selected-channel">
                <span>{width === 20 ? t("Canal", "Channel") : t("Canal central", "Center channel")}</span>
                <strong>{selectedChannel.channel}</strong>
                <small>{selectedChannel.frequencyMHz} MHz</small>
              </div>

              <Detail label={t("Banda", "Band")} value={selectedChannel.band} />
              <Detail label={t("Largura de canal", "Channel width")} value={`${width} MHz`} />
              <Detail label={t("Frequência central", "Center frequency")} value={`${selectedChannel.frequencyMHz} MHz`} />
              <Detail label="DFS" value={selectedChannel.dfs ? t("Sim", "Yes") : t("Não", "No")} />

              {(() => {
                const occupied = getOccupiedRange(selectedChannel)
                return <Detail label={t("Faixa ocupada", "Occupied range")} value={`${occupied.startMHz}–${occupied.endMHz} MHz`} />
              })()}

              <div className={`reg-status-box ${selectedRegulatory.allowed ? 'allowed' : 'blocked'}`}>
                {selectedRegulatory.allowed ? <CheckCircle2 size={17}/> : <XCircle size={17}/>}
                <div>
                  <strong>{tl(selectedRegulatory.label)}</strong>
                  {selectedRegulatory.note && <p>{tl(selectedRegulatory.note)}</p>}
                </div>
              </div>

              <div className="constituent-box">
                <span>{t("Canais de 20 MHz que compõem o bloco", "20 MHz channels in this block")}</span>
                <div>
                  {selectedChannel.constituent20MHz.map((ch) => <b key={ch}>{ch}</b>)}
                </div>
              </div>

              {selectedChannel.dfs && (
                <div className="warning-box">
                  <ShieldAlert size={16}/>
                  <div>
                    <strong>{t("Bloco com DFS", "DFS block")}</strong>
                    <p>{t("O uso pode exigir CAC e mudança de canal caso radar seja detectado.", "Use may require CAC and a channel change if radar is detected.")}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="helper-text">{t("Selecione um canal no mapa.", "Select a channel on the map.")}</p>
          )}
        </aside>
      </div>

      <section className="info-panel">
        <div className="eyebrow"><Info size={14}/> {t("REFERÊNCIA REGULATÓRIA", "REGULATORY REFERENCE")}</div>
        <h3>{t("O perfil Brasil / ANATEL é uma camada independente da canalização IEEE.", "The Brazil / ANATEL profile is a layer independent of IEEE channelization.")}</h3>
        <p>
          {t("Referências principais: Regulamento sobre Equipamentos de Radiocomunicação de Radiação Restrita e requisitos técnicos consolidados do Ato nº 14.448/2017, com alterações posteriores (incluindo o Ato nº 10.400/2026 para 6 GHz). Este módulo não substitui a análise completa dos requisitos de certificação.", "Main references: ANATEL Restricted Radiation Radiocommunication Equipment Regulation and the consolidated technical requirements of Ato nº 14.448/2017 with later amendments (including Ato nº 10.400/2026 for 6 GHz). This module does not replace a full review of certification requirements.")}
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
