import type { ChannelConfig } from './wifiChannels'
import { getOccupiedRange } from './regulatory'

export type RegulatoryDeviceType = 'AP' | 'CLIENT' | 'VLP'
export type ApplicationType = 'GENERAL' | 'FIXED_PTP'

export type PowerRule = {
  id: string
  label: string
  minMHz: number
  maxMHz: number
  maxConductedDbm?: number
  maxEirpDbm?: number
  maxPsdDbmMHz?: number
  psdText?: string
  antennaThresholdDbi?: number
  antennaReductionMode?: 'ONE_TO_ONE' | 'NONE'
  fixedPtpExemption?: boolean
  indoorOnly?: boolean
  dfsRequired?: boolean
  note?: string
}

export type EffectivePowerLimits = {
  applicable: boolean
  rules: PowerRule[]
  baseMaxConductedDbm?: number
  adjustedMaxConductedDbm?: number
  maxEirpDbm?: number
  maxPsdDbmMHz?: number
  adjustedMaxPsdDbmMHz?: number
  psdText?: string
  antennaReductionDb: number
  antennaThresholdDbi?: number
  fixedPtpExemptionApplied: boolean
  indoorOnly: boolean
  dfsRequired: boolean
  mixedSubBands: boolean
  note?: string
}

function minDefined(values: Array<number | undefined>): number | undefined {
  const valid = values.filter((value): value is number => value !== undefined)
  return valid.length ? Math.min(...valid) : undefined
}

function overlaps(start: number, end: number, rule: PowerRule) {
  return end > rule.minMHz && start < rule.maxMHz
}

function standard5GHzRules(
  config: ChannelConfig,
  deviceType: RegulatoryDeviceType,
): PowerRule[] {
  const width = config.width
  const dynamicLimit = Math.min(24, 11 + 10 * Math.log10(width))

  return [
    deviceType === 'CLIENT'
      ? {
          id: 'ANATEL-11.1.3',
          label: '5.150–5.250 MHz · Client',
          minMHz: 5150,
          maxMHz: 5250,
          maxConductedDbm: 24,
          maxEirpDbm: 30,
          maxPsdDbmMHz: 11,
          antennaThresholdDbi: 6,
          antennaReductionMode: 'ONE_TO_ONE',
          note: 'Antenna Gain acima de 6 dBi exige redução equivalente de TX Power e PSD.',
        }
      : {
          id: 'ANATEL-11.1.1',
          label: '5.150–5.250 MHz · Access Point',
          minMHz: 5150,
          maxMHz: 5250,
          maxConductedDbm: 30,
          maxEirpDbm: 36,
          maxPsdDbmMHz: 17,
          antennaThresholdDbi: 6,
          antennaReductionMode: 'ONE_TO_ONE',
          note: 'Para Antenna Gain acima de 6 dBi, TX Power e PSD devem ser reduzidos pelo excesso de ganho.',
        },

    {
      id: 'ANATEL-11.1.4',
      label: '5.250–5.350 MHz',
      minMHz: 5250,
      maxMHz: 5350,
      maxConductedDbm: dynamicLimit,
      maxEirpDbm: dynamicLimit + 6,
      maxPsdDbmMHz: 11,
      antennaThresholdDbi: 6,
      antennaReductionMode: 'ONE_TO_ONE',
      dfsRequired: true,
      note: 'TX Power limitado ao menor valor entre 24 dBm e 11 + 10log(B). Ganho acima de 6 dBi reduz TX Power e PSD em 1 dB por dB excedente.',
    },

    {
      id: 'ANATEL-11.3',
      label: '5.470–5.725 MHz',
      minMHz: 5470,
      maxMHz: 5725,
      maxConductedDbm: dynamicLimit,
      maxEirpDbm: dynamicLimit + 6,
      maxPsdDbmMHz: 11,
      antennaThresholdDbi: 6,
      antennaReductionMode: 'ONE_TO_ONE',
      dfsRequired: true,
      note: 'TX Power limitado ao menor valor entre 24 dBm e 11 + 10log(B). Ganho acima de 6 dBi reduz TX Power e PSD em 1 dB por dB excedente.',
    },

    {
      id: 'ANATEL-10.3/10.5',
      label: '5.725–5.850 MHz · Modulação digital',
      minMHz: 5725,
      maxMHz: 5850,
      maxConductedDbm: 30,
      psdText: '8 dBm / 3 kHz',
      antennaThresholdDbi: 6,
      antennaReductionMode: 'ONE_TO_ONE',
      fixedPtpExemption: true,
      note: 'Potência conduzida base limitada a 30 dBm. Para aplicações gerais, ganho acima de 6 dBi reduz a potência permitida. Em Fixed Point-to-Point exclusivo do serviço fixo, a redução por ganho >6 dBi não é exigida.',
    },
  ]
}

function sixGHzRules(deviceType: RegulatoryDeviceType): PowerRule[] {
  if (deviceType === 'CLIENT') {
    return [{
      id: 'ANATEL-11.7.2',
      label: '5.925–7.125 MHz · Client',
      minMHz: 5925,
      maxMHz: 7125,
      maxEirpDbm: 24,
      maxPsdDbmMHz: -1,
      indoorOnly: true,
      note: 'Equipamento Client deve operar sob controle de Access Point indoor ou subordinado.',
    }]
  }

  if (deviceType === 'VLP') {
    return [{
      id: 'ANATEL-11.7.3',
      label: '5.925–7.125 MHz · Very Low Power',
      minMHz: 5925,
      maxMHz: 7125,
      maxEirpDbm: 17,
      maxPsdDbmMHz: -5,
      note: 'Categoria Very Low Power.',
    }]
  }

  return [{
    id: 'ANATEL-11.7.1',
    label: '5.925–7.125 MHz · AP indoor/subordinado',
    minMHz: 5925,
    maxMHz: 7125,
    maxEirpDbm: 30,
    maxPsdDbmMHz: 5,
    indoorOnly: true,
    note: 'Access Points indoor e subordinados possuem requisitos adicionais.',
  }]
}

function twoFourGHzRules(): PowerRule[] {
  return [{
    id: 'ANATEL-10.3-2G',
    label: '2.400–2.483,5 MHz · Modulação digital',
    minMHz: 2400,
    maxMHz: 2483.5,
    maxConductedDbm: 30,
    psdText: '8 dBm / 3 kHz',
    antennaThresholdDbi: 6,
    antennaReductionMode: 'ONE_TO_ONE',
    note: 'Regra geral para modulação digital. Aplicações ponto-a-ponto têm tratamento específico de Antenna Gain.',
  }]
}

export function getEffectivePowerLimits(
  config: ChannelConfig,
  deviceType: RegulatoryDeviceType,
  antennaGainDbi = 0,
  applicationType: ApplicationType = 'GENERAL',
): EffectivePowerLimits {
  const { startMHz, endMHz } = getOccupiedRange(config)

  let rules: PowerRule[] = []
  if (config.band === '2.4 GHz') rules = twoFourGHzRules()
  if (config.band === '5 GHz') rules = standard5GHzRules(config, deviceType)
  if (config.band === '6 GHz') rules = sixGHzRules(deviceType)

  const applicableRules = rules.filter(rule => overlaps(startMHz, endMHz, rule))

  if (!applicableRules.length) {
    return {
      applicable: false,
      rules: [],
      antennaReductionDb: 0,
      fixedPtpExemptionApplied: false,
      indoorOnly: false,
      dfsRequired: false,
      mixedSubBands: false,
      note: 'Nenhuma regra de potência foi mapeada para este bloco.',
    }
  }

  const baseMaxConductedDbm = minDefined(applicableRules.map(rule => rule.maxConductedDbm))
  const maxEirpDbm = minDefined(applicableRules.map(rule => rule.maxEirpDbm))
  const maxPsdDbmMHz = minDefined(applicableRules.map(rule => rule.maxPsdDbmMHz))

  const thresholds = applicableRules
    .map(rule => rule.antennaThresholdDbi)
    .filter((value): value is number => value !== undefined)

  const antennaThresholdDbi = thresholds.length ? Math.min(...thresholds) : undefined

  const fixedPtpExemptionApplied =
    applicationType === 'FIXED_PTP' &&
    applicableRules.some(rule => rule.fixedPtpExemption)

  const antennaReductionDb =
    antennaThresholdDbi !== undefined &&
    antennaGainDbi > antennaThresholdDbi &&
    !fixedPtpExemptionApplied &&
    applicableRules.some(rule => rule.antennaReductionMode === 'ONE_TO_ONE')
      ? antennaGainDbi - antennaThresholdDbi
      : 0

  const adjustedMaxConductedDbm =
    baseMaxConductedDbm !== undefined
      ? baseMaxConductedDbm - antennaReductionDb
      : undefined

  const adjustedMaxPsdDbmMHz =
    maxPsdDbmMHz !== undefined
      ? maxPsdDbmMHz - antennaReductionDb
      : undefined

  const textualPsdRules = applicableRules.filter(rule => rule.psdText)
  const psdText = textualPsdRules.length
    ? textualPsdRules.map(rule => `${rule.label}: ${rule.psdText}`).join(' · ')
    : undefined

  let note =
    applicableRules.length > 1
      ? 'O bloco cruza mais de uma subfaixa. O resumo numérico usa o limite mais restritivo.'
      : applicableRules[0].note

  if (fixedPtpExemptionApplied) {
    note = `${note ?? ''} Exceção Fixed Point-to-Point aplicada: sem redução de TX Power por ganho de antena acima de 6 dBi na faixa 5.725–5.850 MHz.`.trim()
  } else if (antennaReductionDb > 0) {
    note = `${note ?? ''} Antenna Gain excede ${antennaThresholdDbi} dBi; limite conduzido reduzido em ${antennaReductionDb.toFixed(2)} dB.`.trim()
  }

  return {
    applicable: true,
    rules: applicableRules,
    baseMaxConductedDbm,
    adjustedMaxConductedDbm,
    maxEirpDbm,
    maxPsdDbmMHz,
    adjustedMaxPsdDbmMHz,
    psdText,
    antennaReductionDb,
    antennaThresholdDbi,
    fixedPtpExemptionApplied,
    indoorOnly: applicableRules.some(rule => rule.indoorOnly),
    dfsRequired: applicableRules.some(rule => rule.dfsRequired),
    mixedSubBands: applicableRules.length > 1,
    note,
  }
}
