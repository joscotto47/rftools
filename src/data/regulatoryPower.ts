import type { ChannelConfig } from './wifiChannels'
import { ANATEL_6GHZ_MAX_MHZ, getOccupiedRange } from './regulatory'

/**
 * Power limits from ANATEL Ato nº 14448/2017 (Requisitos Técnicos de Radiação Restrita),
 * as amended by Ato nº 14158/2025 (5 GHz, items 11.1–11.5), Ato nº 1306/2021 (6 GHz, item 11.7)
 * and Ato nº 10400/2026 (6 GHz Wi-Fi limited to 5.925–6.425 MHz, mandatory from 2027-03-01).
 *
 * Conducted power limits apply to the total output power delivered to all antennas
 * (item 10.3.4), so multi-chain devices must sum the power of every TX chain.
 */

export type RegulatoryDeviceType = 'AP' | 'CLIENT' | 'VLP'
export type ApplicationType = 'GENERAL' | 'FIXED_PTP'

/** How much conducted power must drop for each dB of antenna gain above the threshold. */
export type AntennaReductionMode = 'ONE_TO_ONE' | 'ONE_PER_THREE' | 'NONE'

/** Whether a PSD limit is measured at the transmitter output or as EIRP. */
export type PsdKind = 'CONDUCTED' | 'EIRP'

type AntennaRule = {
  thresholdDbi: number
  mode: AntennaReductionMode
}

export type PowerRule = {
  id: string
  label: string
  minMHz: number
  maxMHz: number
  maxConductedDbm?: number
  maxEirpDbm?: number
  maxPsdDbmMHz?: number
  psdKind?: PsdKind
  psdText?: string
  antenna?: AntennaRule
  /** Replaces `antenna` when the equipment is used exclusively for fixed point-to-point links. */
  fixedPtpAntenna?: AntennaRule
  /** EIRP cap for equipment without Transmit Power Control (item 11.5.1). */
  noTpcMaxEirpDbm?: number
  indoorOnly?: boolean
  dfsRequired?: boolean
  note?: string
}

export type PowerLimitOptions = {
  applicationType?: ApplicationType
  /** Transmit Power Control present. Defaults to true. */
  hasTpc?: boolean
}

export type EffectivePowerLimits = {
  applicable: boolean
  rules: PowerRule[]
  baseMaxConductedDbm?: number
  adjustedMaxConductedDbm?: number
  maxEirpDbm?: number
  maxPsdDbmMHz?: number
  adjustedMaxPsdDbmMHz?: number
  psdKind?: PsdKind
  psdText?: string
  antennaReductionDb: number
  antennaThresholdDbi?: number
  fixedPtpExemptionApplied: boolean
  noTpcLimitApplied: boolean
  indoorOnly: boolean
  dfsRequired: boolean
  mixedSubBands: boolean
  note?: string
}

const round2 = (value: number) => Math.round(value * 100) / 100

function minDefined(values: Array<number | undefined>): number | undefined {
  const valid = values.filter((value): value is number => value !== undefined)
  return valid.length ? Math.min(...valid) : undefined
}

function overlaps(start: number, end: number, rule: PowerRule) {
  return end > rule.minMHz && start < rule.maxMHz
}

/** dB reduction required by an antenna rule for a given antenna gain. */
export function antennaReductionDb(gainDbi: number, rule?: AntennaRule): number {
  if (!rule || gainDbi <= rule.thresholdDbi) return 0
  const excess = gainDbi - rule.thresholdDbi
  if (rule.mode === 'ONE_TO_ONE') return excess
  if (rule.mode === 'ONE_PER_THREE') return excess / 3
  return 0
}

const DIGITAL_MODULATION_PSD = '8 dBm / 3 kHz (item 10.3.3)'

function twoFourGHzRules(): PowerRule[] {
  return [{
    id: 'ANATEL 10.3 / 10.5.1',
    label: '2.400–2.483,5 MHz · Modulação digital',
    minMHz: 2400,
    maxMHz: 2483.5,
    maxConductedDbm: 30,
    psdText: DIGITAL_MODULATION_PSD,
    antenna: { thresholdDbi: 6, mode: 'ONE_TO_ONE' },
    fixedPtpAntenna: { thresholdDbi: 6, mode: 'ONE_PER_THREE' },
    note: 'Potência conduzida total limitada a 1 W (30 dBm). Ganho acima de 6 dBi reduz a potência 1 dB por dB excedente; em ponto-a-ponto exclusivo do serviço fixo, 1 dB a cada 3 dB excedentes (item 10.5.1).',
  }]
}

function standard5GHzRules(config: ChannelConfig, deviceType: RegulatoryDeviceType): PowerRule[] {
  // Items 11.1.4.1 and 11.3.1: lesser of 24 dBm and 11 dBm + 10log(B).
  // B is the 26 dB emission bandwidth; the nominal channel width is used as an approximation.
  const dynamicLimit = Math.min(24, 11 + 10 * Math.log10(config.width))
  const general6 = { thresholdDbi: 6, mode: 'ONE_TO_ONE' } as const

  const lowBand: PowerRule = deviceType === 'CLIENT'
    ? {
        id: 'ANATEL 11.1.3',
        label: '5.150–5.250 MHz · Cliente',
        minMHz: 5150,
        maxMHz: 5250,
        maxConductedDbm: 24,
        maxPsdDbmMHz: 11,
        psdKind: 'CONDUCTED',
        antenna: general6,
        noTpcMaxEirpDbm: 27,
        note: 'Potência conduzida 24 dBm e PSD conduzida 11 dBm/MHz. Ganho acima de 6 dBi reduz ambos 1 dB por dB excedente.',
      }
    : {
        id: 'ANATEL 11.1.1 / 11.1.2',
        label: '5.150–5.250 MHz · Ponto de acesso',
        minMHz: 5150,
        maxMHz: 5250,
        maxConductedDbm: 30,
        maxPsdDbmMHz: 17,
        psdKind: 'CONDUCTED',
        antenna: general6,
        fixedPtpAntenna: { thresholdDbi: 23, mode: 'ONE_TO_ONE' },
        noTpcMaxEirpDbm: 27,
        note: 'Potência conduzida 30 dBm e PSD conduzida 17 dBm/MHz. Ganho acima de 6 dBi reduz ambos (23 dBi em ponto-a-ponto fixo, item 11.1.2). Em ambiente aberto, EIRP limitada a 21 dBm acima de 30° de elevação (item 11.1.1.4).',
      }

  return [
    lowBand,
    {
      id: 'ANATEL 11.1.4',
      label: '5.250–5.350 MHz',
      minMHz: 5250,
      maxMHz: 5350,
      maxConductedDbm: dynamicLimit,
      maxPsdDbmMHz: 11,
      psdKind: 'CONDUCTED',
      antenna: general6,
      noTpcMaxEirpDbm: 27,
      dfsRequired: true,
      note: 'Potência conduzida limitada ao menor valor entre 24 dBm e 11 + 10log(B); PSD conduzida 11 dBm/MHz. Ganho acima de 6 dBi reduz ambos. DFS obrigatório (item 11.6).',
    },
    {
      id: 'ANATEL 11.3',
      label: '5.470–5.725 MHz',
      minMHz: 5470,
      maxMHz: 5725,
      maxConductedDbm: dynamicLimit,
      maxPsdDbmMHz: 11,
      psdKind: 'CONDUCTED',
      antenna: general6,
      noTpcMaxEirpDbm: 27,
      dfsRequired: true,
      note: 'Potência conduzida limitada ao menor valor entre 24 dBm e 11 + 10log(B); PSD conduzida 11 dBm/MHz. Ganho acima de 6 dBi reduz ambos. DFS obrigatório (item 11.6).',
    },
    {
      id: 'ANATEL 10.3 / 10.5.2',
      label: '5.725–5.850 MHz · Modulação digital',
      minMHz: 5725,
      maxMHz: 5850,
      maxConductedDbm: 30,
      psdText: DIGITAL_MODULATION_PSD,
      antenna: general6,
      fixedPtpAntenna: { thresholdDbi: 6, mode: 'NONE' },
      note: 'Potência conduzida total limitada a 1 W (30 dBm). Ganho acima de 6 dBi reduz a potência; em ponto-a-ponto exclusivo do serviço fixo não há redução (item 10.5.2).',
    },
  ]
}

function sixGHzRules(deviceType: RegulatoryDeviceType): PowerRule[] {
  const band = { minMHz: 5925, maxMHz: ANATEL_6GHZ_MAX_MHZ }

  if (deviceType === 'CLIENT') {
    return [{
      id: 'ANATEL 11.7.2',
      label: '5.925–6.425 MHz · Cliente',
      ...band,
      maxEirpDbm: 24,
      maxPsdDbmMHz: -1,
      psdKind: 'EIRP',
      indoorOnly: true,
      note: 'EIRP 24 dBm e PSD EIRP −1 dBm/MHz. Opera somente sob controle de um ponto de acesso indoor ou subordinado.',
    }]
  }

  if (deviceType === 'VLP') {
    return [{
      id: 'ANATEL 11.7.3',
      label: '5.925–6.425 MHz · Potência muito baixa (VLP)',
      ...band,
      maxEirpDbm: 17,
      maxPsdDbmMHz: -5,
      psdKind: 'EIRP',
      note: 'EIRP 17 dBm e PSD EIRP −5 dBm/MHz. Antena integrada ao equipamento.',
    }]
  }

  return [{
    id: 'ANATEL 11.7.1',
    label: '5.925–6.425 MHz · Ponto de acesso indoor / subordinado',
    ...band,
    maxEirpDbm: 30,
    maxPsdDbmMHz: 5,
    psdKind: 'EIRP',
    indoorOnly: true,
    note: 'EIRP 30 dBm e PSD EIRP 5 dBm/MHz. Uso somente indoor, alimentação pela rede elétrica e antena integrada (itens 11.7.6 e 11.7.7).',
  }]
}

export function getPowerRules(config: ChannelConfig, deviceType: RegulatoryDeviceType): PowerRule[] {
  if (config.band === '2.4 GHz') return twoFourGHzRules()
  if (config.band === '5 GHz') return standard5GHzRules(config, deviceType)
  return sixGHzRules(deviceType)
}

export function getEffectivePowerLimits(
  config: ChannelConfig,
  deviceType: RegulatoryDeviceType,
  antennaGainDbi = 0,
  options: PowerLimitOptions = {},
): EffectivePowerLimits {
  const applicationType = options.applicationType ?? 'GENERAL'
  const hasTpc = options.hasTpc ?? true
  const { startMHz, endMHz } = getOccupiedRange(config)

  const allRules = getPowerRules(config, deviceType)
  const applicableRules = allRules.filter(rule => overlaps(startMHz, endMHz, rule))
  const outsideBand = applicableRules.length === 0 ||
    startMHz < Math.min(...applicableRules.map(r => r.minMHz)) ||
    endMHz > Math.max(...applicableRules.map(r => r.maxMHz))

  const empty: EffectivePowerLimits = {
    applicable: false,
    rules: applicableRules,
    antennaReductionDb: 0,
    fixedPtpExemptionApplied: false,
    noTpcLimitApplied: false,
    indoorOnly: false,
    dfsRequired: false,
    mixedSubBands: false,
  }

  if (!applicableRules.length) {
    return {
      ...empty,
      note: config.band === '6 GHz'
        ? `O bloco (${startMHz}–${endMHz} MHz) está fora da faixa de Wi-Fi em 6 GHz permitida no Brasil (5.925–${ANATEL_6GHZ_MAX_MHZ} MHz, Ato nº 10400/2026).`
        : 'Nenhuma regra de potência foi mapeada para este bloco.',
    }
  }

  // Only 5 GHz has gaps between sub-bands (5.350–5.470 MHz); 6 GHz ends at 6.425 MHz.
  const coversGap = config.band === '5 GHz' && startMHz < 5470 && endMHz > 5350
  if (outsideBand || coversGap) {
    return {
      ...empty,
      note: `O bloco (${startMHz}–${endMHz} MHz) ultrapassa as faixas permitidas para esta categoria.`,
    }
  }

  // Per-rule antenna reduction, then keep the most restrictive result.
  const perRule = applicableRules.map(rule => {
    const usePtp = applicationType === 'FIXED_PTP' && rule.fixedPtpAntenna !== undefined
    const antennaRule = usePtp ? rule.fixedPtpAntenna : rule.antenna
    const reduction = antennaReductionDb(antennaGainDbi, antennaRule)
    return {
      rule,
      usePtp,
      antennaRule,
      reduction,
      conducted: rule.maxConductedDbm !== undefined ? rule.maxConductedDbm - reduction : undefined,
      psd: rule.maxPsdDbmMHz !== undefined
        ? rule.maxPsdDbmMHz - (rule.psdKind === 'CONDUCTED' ? reduction : 0)
        : undefined,
    }
  })

  const adjustedMaxConductedDbm = minDefined(perRule.map(r => r.conducted))
  const baseMaxConductedDbm = minDefined(applicableRules.map(r => r.maxConductedDbm))
  const maxPsdDbmMHz = minDefined(applicableRules.map(r => r.maxPsdDbmMHz))
  const adjustedMaxPsdDbmMHz = minDefined(perRule.map(r => r.psd))
  const psdKind = applicableRules.find(r => r.maxPsdDbmMHz !== undefined)?.psdKind
  const antennaReduction = Math.max(0, ...perRule.map(r => r.reduction))
  const binding = perRule.find(r => r.reduction === antennaReduction && r.antennaRule)

  const explicitEirp = minDefined(applicableRules.map(r => r.maxEirpDbm))
  const noTpcEirp = hasTpc ? undefined : minDefined(applicableRules.map(r => r.noTpcMaxEirpDbm))
  const maxEirpDbm = minDefined([explicitEirp, noTpcEirp])
  const noTpcLimitApplied = noTpcEirp !== undefined && noTpcEirp === maxEirpDbm

  const fixedPtpExemptionApplied = perRule.some(r => r.usePtp && antennaGainDbi > 6 && r.reduction < antennaGainDbi - 6)

  const textualPsd = applicableRules.filter(rule => rule.psdText)
  const psdText = textualPsd.length
    ? [...new Set(textualPsd.map(rule => rule.psdText))].join(' · ')
    : undefined

  const notes: string[] = []
  notes.push(applicableRules.length > 1
    ? 'O bloco cruza mais de uma subfaixa. Os limites mostrados são os mais restritivos entre elas.'
    : applicableRules[0].note ?? '')
  if (antennaReduction > 0 && binding?.antennaRule) {
    notes.push(`Ganho de antena acima de ${binding.antennaRule.thresholdDbi} dBi: limite conduzido reduzido em ${round2(antennaReduction)} dB.`)
  }
  if (fixedPtpExemptionApplied) {
    notes.push('Regra de ponto-a-ponto fixo aplicada ao ganho de antena.')
  }
  if (noTpcLimitApplied) {
    notes.push('Sem TPC, a EIRP média fica limitada a 27 dBm (item 11.5.1).')
  }

  return {
    applicable: true,
    rules: applicableRules,
    baseMaxConductedDbm,
    adjustedMaxConductedDbm: adjustedMaxConductedDbm !== undefined ? round2(adjustedMaxConductedDbm) : undefined,
    maxEirpDbm,
    maxPsdDbmMHz,
    adjustedMaxPsdDbmMHz: adjustedMaxPsdDbmMHz !== undefined ? round2(adjustedMaxPsdDbmMHz) : undefined,
    psdKind,
    psdText,
    antennaReductionDb: round2(antennaReduction),
    antennaThresholdDbi: binding?.antennaRule?.thresholdDbi,
    fixedPtpExemptionApplied,
    noTpcLimitApplied,
    indoorOnly: applicableRules.some(rule => rule.indoorOnly),
    dfsRequired: applicableRules.some(rule => rule.dfsRequired),
    mixedSubBands: applicableRules.length > 1,
    note: notes.filter(Boolean).join(' '),
  }
}

export type ComplianceInput = {
  /** Power per TX chain at the transmitter output, before cable loss. */
  txPowerPerChainDbm: number
  txChains: number
  antennaGainDbi: number
  cableLossDb: number
  channelWidthMHz: number
}

export type ComplianceCheck = {
  totalConductedDbm: number
  eirpDbm: number
  /** Estimated assuming power spread evenly across the channel width. */
  conductedPsdDbmMHz: number
  eirpPsdDbmMHz: number
  conductedPass: boolean
  eirpPass: boolean
  psdPass: boolean
  bandPass: boolean
  pass: boolean
  conductedMargin?: number
  eirpMargin?: number
  psdMargin?: number
}

export function checkCompliance(input: ComplianceInput, limits: EffectivePowerLimits): ComplianceCheck {
  const chainGain = 10 * Math.log10(input.txChains)
  const totalConductedDbm = input.txPowerPerChainDbm + chainGain
  const eirpDbm = totalConductedDbm + input.antennaGainDbi - input.cableLossDb
  const bandwidthDb = 10 * Math.log10(input.channelWidthMHz)
  const conductedPsdDbmMHz = totalConductedDbm - bandwidthDb
  const eirpPsdDbmMHz = eirpDbm - bandwidthDb

  const conductedMargin = limits.adjustedMaxConductedDbm !== undefined
    ? limits.adjustedMaxConductedDbm - totalConductedDbm : undefined
  const eirpMargin = limits.maxEirpDbm !== undefined ? limits.maxEirpDbm - eirpDbm : undefined
  const psdValue = limits.psdKind === 'EIRP' ? eirpPsdDbmMHz : conductedPsdDbmMHz
  const psdMargin = limits.adjustedMaxPsdDbmMHz !== undefined ? limits.adjustedMaxPsdDbmMHz - psdValue : undefined

  // Small tolerance so values shown rounded to 2 decimals don't fail on float noise.
  const ok = (margin?: number) => margin === undefined || margin >= -1e-9
  const conductedPass = ok(conductedMargin)
  const eirpPass = ok(eirpMargin)
  const psdPass = ok(psdMargin)
  const bandPass = limits.applicable

  return {
    totalConductedDbm,
    eirpDbm,
    conductedPsdDbmMHz,
    eirpPsdDbmMHz,
    conductedPass,
    eirpPass,
    psdPass,
    bandPass,
    pass: bandPass && conductedPass && eirpPass && psdPass,
    conductedMargin,
    eirpMargin,
    psdMargin,
  }
}
