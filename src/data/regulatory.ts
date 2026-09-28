import { CHANNEL_CONFIGS, type ChannelConfig, type ChannelWidth, type WifiBand } from './wifiChannels'

/**
 * Upper edge of 6 GHz Wi-Fi in Brazil. Ato nº 10400/2026 reduced the band from 5.925–7.125 MHz
 * to 5.925–6.425 MHz (mandatory from 2027-03-01) to free the upper part for IMT.
 */
export const ANATEL_6GHZ_MAX_MHZ = 6425

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

  // Only blocks that fit entirely inside 5.925–6.425 MHz.
  '6 GHz': Object.fromEntries(
    ([20, 40, 80, 160, 320] as ChannelWidth[]).map(width => [
      width,
      CHANNEL_CONFIGS
        .filter(c => c.band === '6 GHz' && c.width === width)
        .filter(c => c.frequencyMHz + width / 2 <= ANATEL_6GHZ_MAX_MHZ)
        .map(c => c.channel),
    ]),
  ),
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
      note: config.band === '6 GHz'
        ? `O bloco do Center Channel ${config.channel} passa de ${ANATEL_6GHZ_MAX_MHZ} MHz. No Brasil, o Wi-Fi em 6 GHz fica restrito a 5.925–${ANATEL_6GHZ_MAX_MHZ} MHz (Ato nº 10400/2026, obrigatório a partir de 01/03/2027).`
        : `O Center Channel ${config.channel} não está listado como válido para ${config.width} MHz neste perfil.`,
    }
  }

  if (config.band === '6 GHz') {
    return {
      allowed: true,
      status: 'allowed',
      label: 'Permitido no perfil ANATEL',
      note: 'Dentro de 5.925–6.425 MHz (Ato nº 10400/2026). Uso indoor para pontos de acesso e clientes; limites dependem da categoria do equipamento.',
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
