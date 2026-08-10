export type EnvironmentType = 'OPEN' | 'OFFICE' | 'DENSE_OFFICE' | 'WAREHOUSE'

export type PlannerResult = {
  totalDemandMbps: number
  concurrentUsers: number
  capacityPerApMbps: number
  apsByCapacity: number
  estimatedCoveragePerApM2: number
  apsByCoverage: number
  recommendedAps: number
  usersPerAp: number
  demandPerApMbps: number
  utilizationPercent: number
  channelReuseFactor: number
}

export const DEFAULT_COVERAGE_RADIUS_M: Record<EnvironmentType, number> = {
  OPEN: 22,
  OFFICE: 16,
  DENSE_OFFICE: 11,
  WAREHOUSE: 20,
}

export function estimateCoveragePerApM2(
  radiusMeters: number,
  overlapPercent: number,
): number {
  const rawArea = Math.PI * radiusMeters * radiusMeters
  return rawArea * (1 - overlapPercent / 100)
}

export function planWifiNetwork({
  areaM2,
  users,
  concurrencyPercent,
  demandPerActiveUserMbps,
  capacityPerApMbps,
  coverageRadiusMeters,
  overlapPercent,
  channelReuseFactor,
}: {
  areaM2: number
  users: number
  concurrencyPercent: number
  demandPerActiveUserMbps: number
  capacityPerApMbps: number
  coverageRadiusMeters: number
  overlapPercent: number
  channelReuseFactor: number
}): PlannerResult {
  const concurrentUsers = users * concurrencyPercent / 100
  const totalDemandMbps = concurrentUsers * demandPerActiveUserMbps

  const effectiveCapacityPerAp =
    capacityPerApMbps / Math.max(1, channelReuseFactor)

  const apsByCapacity =
    effectiveCapacityPerAp > 0
      ? Math.ceil(totalDemandMbps / effectiveCapacityPerAp)
      : 0

  const coveragePerAp = estimateCoveragePerApM2(
    coverageRadiusMeters,
    overlapPercent,
  )

  const apsByCoverage =
    coveragePerAp > 0
      ? Math.ceil(areaM2 / coveragePerAp)
      : 0

  const recommendedAps = Math.max(apsByCapacity, apsByCoverage, 1)
  const usersPerAp = users / recommendedAps
  const demandPerApMbps = totalDemandMbps / recommendedAps
  const utilizationPercent =
    effectiveCapacityPerAp > 0
      ? demandPerApMbps / effectiveCapacityPerAp * 100
      : 0

  return {
    totalDemandMbps,
    concurrentUsers,
    capacityPerApMbps: effectiveCapacityPerAp,
    apsByCapacity,
    estimatedCoveragePerApM2: coveragePerAp,
    apsByCoverage,
    recommendedAps,
    usersPerAp,
    demandPerApMbps,
    utilizationPercent,
    channelReuseFactor,
  }
}


export type CoverageModel = 'FREE_SPACE' | 'LOG_DISTANCE'

export function maxDistanceFromFsplKm(
  maxPathLossDb: number,
  frequencyMHz: number,
): number {
  if (frequencyMHz <= 0) return Number.NaN
  return Math.pow(
    10,
    (maxPathLossDb - 32.44 - 20 * Math.log10(frequencyMHz)) / 20,
  )
}

export function maxDistanceLogDistanceMeters(
  maxPathLossDb: number,
  frequencyMHz: number,
  pathLossExponent: number,
  referenceDistanceMeters = 1,
): number {
  if (
    frequencyMHz <= 0 ||
    pathLossExponent <= 0 ||
    referenceDistanceMeters <= 0
  ) return Number.NaN

  const fsplAt1mDb =
    32.44 +
    20 * Math.log10(0.001) +
    20 * Math.log10(frequencyMHz)

  const distanceRatio = Math.pow(
    10,
    (maxPathLossDb - fsplAt1mDb) / (10 * pathLossExponent),
  )

  return referenceDistanceMeters * distanceRatio
}

export function estimatedCellRadiusMeters({
  frequencyGHz,
  txPowerDbm,
  txAntennaGainDbi,
  txLossDb,
  clientAntennaGainDbi,
  targetRssiDbm,
  fadeMarginDb,
  additionalLossDb,
  model,
  pathLossExponent,
}: {
  frequencyGHz: number
  txPowerDbm: number
  txAntennaGainDbi: number
  txLossDb: number
  clientAntennaGainDbi: number
  targetRssiDbm: number
  fadeMarginDb: number
  additionalLossDb: number
  model: CoverageModel
  pathLossExponent: number
}): {
  eirpDbm: number
  maxPathLossDb: number
  radiusMeters: number
} {
  const eirpDbm = txPowerDbm + txAntennaGainDbi - txLossDb

  const maxPathLossDb =
    eirpDbm +
    clientAntennaGainDbi -
    targetRssiDbm -
    fadeMarginDb -
    additionalLossDb

  const frequencyMHz = frequencyGHz * 1000

  const radiusMeters =
    model === 'FREE_SPACE'
      ? maxDistanceFromFsplKm(maxPathLossDb, frequencyMHz) * 1000
      : maxDistanceLogDistanceMeters(
          maxPathLossDb,
          frequencyMHz,
          pathLossExponent,
        )

  return {
    eirpDbm,
    maxPathLossDb,
    radiusMeters,
  }
}
