import type { ChannelConfig, ChannelWidth, WifiBand } from './wifiChannels'

export type RegulatoryProfile = 'IEEE' | 'BR-ANATEL'

export type RegulatoryResult = {
  allowed: boolean
  status: 'technical' | 'allowed' | 'restricted'
  label: string
  note?: string
}

type AllowedMap = Partial<Record<ChannelWidth, number[]>>

const BRAZIL_ALLOWED_CHANNELS: Record<WifiBand, AllowedMap> = {
  '2.4 GHz': {
    20: [1,2,3,4,5,6,7,8,9,10,11,12,13],
    40: [3,4,5,6,7,8,9,10,11],
  },

  '5 GHz': {
    20: [
      36,40,44,48,
      52,56,60,64,
      100,104,108,112,116,120,124,128,132,136,140,144,
      149,153,157,161,165,
    ],
    40: [
      38,46,
      54,62,
      102,110,118,126,134,142,
      151,159,
    ],
    80: [42,58,106,122,138,155],
    160: [50,114],
  },

  '6 GHz': {
    20: Array.from({ length: 59 }, (_, i) => 1 + i * 4),
    40: Array.from({ length: 29 }, (_, i) => 3 + i * 8),
    80: Array.from({ length: 14 }, (_, i) => 7 + i * 16),
    160: Array.from({ length: 7 }, (_, i) => 15 + i * 32),
    320: [31,63,95,127,159,191],
  },
}

export function getOccupiedRange(config: ChannelConfig) {
  const halfWidth = config.width / 2
  return {
    startMHz: config.frequencyMHz - halfWidth,
    endMHz: config.frequencyMHz + halfWidth,
  }
}

export function checkRegulatory(
  config: ChannelConfig,
  profile: RegulatoryProfile,
): RegulatoryResult {
  if (profile === 'IEEE') {
    return {
      allowed: true,
      status: 'technical',
      label: 'Referência IEEE',
      note: 'Canalização técnica, sem aplicação de domínio regulatório.',
    }
  }

  const allowedForWidth = BRAZIL_ALLOWED_CHANNELS[config.band][config.width] ?? []
  const allowed = allowedForWidth.includes(config.channel)

  if (!allowed) {
    return {
      allowed: false,
      status: 'restricted',
      label: 'Fora do perfil ANATEL',
      note: `O Center Channel ${config.channel} não está listado como válido para ${config.width} MHz neste perfil.`,
    }
  }

  if (config.band === '6 GHz') {
    return {
      allowed: true,
      status: 'allowed',
      label: 'Permitido no perfil ANATEL',
      note: 'Canalização permitida no perfil de referência. Em 6 GHz, condições de operação dependem da categoria do equipamento e dos requisitos técnicos aplicáveis.',
    }
  }

  if (config.dfs) {
    return {
      allowed: true,
      status: 'allowed',
      label: 'Permitido no perfil ANATEL',
      note: 'Bloco permitido com DFS. A operação pode exigir CAC e detecção de radar.',
    }
  }

  return {
    allowed: true,
    status: 'allowed',
    label: 'Permitido no perfil ANATEL',
    note: 'Center Channel válido para a banda e Channel Width selecionados.',
  }
}
