import type { WifiGeneration } from '../calculations/phyRate'

export type McsSnrEntry = {
  mcs: number
  requiredSnrDb: number
}

export const MCS_REQUIRED_SNR: Record<WifiGeneration, McsSnrEntry[]> = {
  'Wi-Fi 5': [
    { mcs: 0, requiredSnrDb: 4 },
    { mcs: 1, requiredSnrDb: 7 },
    { mcs: 2, requiredSnrDb: 9 },
    { mcs: 3, requiredSnrDb: 12 },
    { mcs: 4, requiredSnrDb: 16 },
    { mcs: 5, requiredSnrDb: 20 },
    { mcs: 6, requiredSnrDb: 23 },
    { mcs: 7, requiredSnrDb: 25 },
    { mcs: 8, requiredSnrDb: 29 },
    { mcs: 9, requiredSnrDb: 32 },
  ],
  'Wi-Fi 6': [
    { mcs: 0, requiredSnrDb: 4 },
    { mcs: 1, requiredSnrDb: 7 },
    { mcs: 2, requiredSnrDb: 9 },
    { mcs: 3, requiredSnrDb: 12 },
    { mcs: 4, requiredSnrDb: 16 },
    { mcs: 5, requiredSnrDb: 20 },
    { mcs: 6, requiredSnrDb: 23 },
    { mcs: 7, requiredSnrDb: 25 },
    { mcs: 8, requiredSnrDb: 29 },
    { mcs: 9, requiredSnrDb: 32 },
    { mcs: 10, requiredSnrDb: 35 },
    { mcs: 11, requiredSnrDb: 38 },
  ],
  'Wi-Fi 7': [
    { mcs: 0, requiredSnrDb: 4 },
    { mcs: 1, requiredSnrDb: 7 },
    { mcs: 2, requiredSnrDb: 9 },
    { mcs: 3, requiredSnrDb: 12 },
    { mcs: 4, requiredSnrDb: 16 },
    { mcs: 5, requiredSnrDb: 20 },
    { mcs: 6, requiredSnrDb: 23 },
    { mcs: 7, requiredSnrDb: 25 },
    { mcs: 8, requiredSnrDb: 29 },
    { mcs: 9, requiredSnrDb: 32 },
    { mcs: 10, requiredSnrDb: 35 },
    { mcs: 11, requiredSnrDb: 38 },
    { mcs: 12, requiredSnrDb: 41 },
    { mcs: 13, requiredSnrDb: 44 },
  ],
}

export function requiredSnrForMcs(
  generation: WifiGeneration,
  mcs: number,
): number | undefined {
  return MCS_REQUIRED_SNR[generation].find(
    entry => entry.mcs === mcs,
  )?.requiredSnrDb
}
