export const SPEED_OF_LIGHT_M_S = 299_792_458

export function wavelengthMeters(frequencyGHz: number): number {
  if (frequencyGHz <= 0) return Number.NaN
  return SPEED_OF_LIGHT_M_S / (frequencyGHz * 1e9)
}

export function fraunhoferDistanceMeters(
  largestAntennaDimensionMeters: number,
  wavelengthM: number,
): number {
  if (largestAntennaDimensionMeters <= 0 || wavelengthM <= 0) return Number.NaN
  return 2 * Math.pow(largestAntennaDimensionMeters, 2) / wavelengthM
}

export function fresnelRadiusMeters(
  frequencyGHz: number,
  distance1Km: number,
  distance2Km: number,
): number {
  if (frequencyGHz <= 0 || distance1Km <= 0 || distance2Km <= 0) return Number.NaN
  return 17.32 * Math.sqrt(
    (distance1Km * distance2Km) /
    (frequencyGHz * (distance1Km + distance2Km)),
  )
}
