import type { WifiGeneration } from '../calculations/phyRate'

export type SensitivityEntry = {
  mcs: number
  sensitivityDbm: number
}

// Engineering reference values for 1 spatial stream.
// These are practical baseline estimates for 20 MHz and are adjusted by
// approximately +3 dB noise floor per bandwidth doubling.
export const BASE_SENSITIVITY_20MHZ: Record<WifiGeneration, SensitivityEntry[]> = {
  'Wi-Fi 5': [
    { mcs: 0, sensitivityDbm: -82 },
    { mcs: 1, sensitivityDbm: -79 },
    { mcs: 2, sensitivityDbm: -77 },
    { mcs: 3, sensitivityDbm: -74 },
    { mcs: 4, sensitivityDbm: -70 },
    { mcs: 5, sensitivityDbm: -66 },
    { mcs: 6, sensitivityDbm: -65 },
    { mcs: 7, sensitivityDbm: -64 },
    { mcs: 8, sensitivityDbm: -59 },
    { mcs: 9, sensitivityDbm: -57 },
  ],
  'Wi-Fi 6': [
    { mcs: 0, sensitivityDbm: -82 },
    { mcs: 1, sensitivityDbm: -79 },
    { mcs: 2, sensitivityDbm: -77 },
    { mcs: 3, sensitivityDbm: -74 },
    { mcs: 4, sensitivityDbm: -70 },
    { mcs: 5, sensitivityDbm: -66 },
    { mcs: 6, sensitivityDbm: -65 },
    { mcs: 7, sensitivityDbm: -64 },
    { mcs: 8, sensitivityDbm: -59 },
    { mcs: 9, sensitivityDbm: -57 },
    { mcs: 10, sensitivityDbm: -54 },
    { mcs: 11, sensitivityDbm: -52 },
  ],
  'Wi-Fi 7': [
    { mcs: 0, sensitivityDbm: -82 },
    { mcs: 1, sensitivityDbm: -79 },
    { mcs: 2, sensitivityDbm: -77 },
    { mcs: 3, sensitivityDbm: -74 },
    { mcs: 4, sensitivityDbm: -70 },
    { mcs: 5, sensitivityDbm: -66 },
    { mcs: 6, sensitivityDbm: -65 },
    { mcs: 7, sensitivityDbm: -64 },
    { mcs: 8, sensitivityDbm: -59 },
    { mcs: 9, sensitivityDbm: -57 },
    { mcs: 10, sensitivityDbm: -54 },
    { mcs: 11, sensitivityDbm: -52 },
    { mcs: 12, sensitivityDbm: -49 },
    { mcs: 13, sensitivityDbm: -47 },
  ],
}

export function sensitivityForWidth(
  generation: WifiGeneration,
  widthMHz: number,
): SensitivityEntry[] {
  const widthPenaltyDb = 10 * Math.log10(widthMHz / 20)
  return BASE_SENSITIVITY_20MHZ[generation].map(entry => ({
    mcs: entry.mcs,
    sensitivityDbm: entry.sensitivityDbm + widthPenaltyDb,
  }))
}

export function maxSupportedMcs(
  generation: WifiGeneration,
  widthMHz: number,
  receivedPowerDbm: number,
  targetMarginDb = 3,
): SensitivityEntry | null {
  const entries = sensitivityForWidth(generation, widthMHz)
  const supported = entries.filter(
    entry => receivedPowerDbm - entry.sensitivityDbm >= targetMarginDb,
  )
  return supported.length ? supported[supported.length - 1] : null
}


export type SensitivityProfile = {
  id: string
  name: string
  generation: WifiGeneration
  base20MHz: SensitivityEntry[]
  description?: string
}

export const BUILTIN_SENSITIVITY_PROFILES: SensitivityProfile[] = [
  {
    id: 'generic-wifi5',
    name: 'Generic Wi-Fi 5',
    generation: 'Wi-Fi 5',
    base20MHz: BASE_SENSITIVITY_20MHZ['Wi-Fi 5'],
    description: 'Perfil genérico de referência para 802.11ac.',
  },
  {
    id: 'generic-wifi6',
    name: 'Generic Wi-Fi 6',
    generation: 'Wi-Fi 6',
    base20MHz: BASE_SENSITIVITY_20MHZ['Wi-Fi 6'],
    description: 'Perfil genérico de referência para 802.11ax.',
  },
  {
    id: 'generic-wifi7',
    name: 'Generic Wi-Fi 7',
    generation: 'Wi-Fi 7',
    base20MHz: BASE_SENSITIVITY_20MHZ['Wi-Fi 7'],
    description: 'Perfil genérico de referência para 802.11be.',
  },
]

export function sensitivityForWidthFromProfile(
  profile: SensitivityProfile,
  widthMHz: number,
): SensitivityEntry[] {
  const widthPenaltyDb = 10 * Math.log10(widthMHz / 20)
  return profile.base20MHz.map(entry => ({
    mcs: entry.mcs,
    sensitivityDbm: entry.sensitivityDbm + widthPenaltyDb,
  }))
}

export function maxSupportedMcsFromProfile(
  profile: SensitivityProfile,
  widthMHz: number,
  receivedPowerDbm: number,
  targetMarginDb = 3,
): SensitivityEntry | null {
  const entries = sensitivityForWidthFromProfile(profile, widthMHz)
  const supported = entries.filter(
    entry => receivedPowerDbm - entry.sensitivityDbm >= targetMarginDb,
  )
  return supported.length ? supported[supported.length - 1] : null
}
