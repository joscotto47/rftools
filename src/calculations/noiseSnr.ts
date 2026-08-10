export function thermalNoiseDbm(
  bandwidthHz: number,
  temperatureK = 290,
): number {
  if (bandwidthHz <= 0 || temperatureK <= 0) return Number.NaN

  const k = 1.380649e-23
  const noiseWatts = k * temperatureK * bandwidthHz
  return 10 * Math.log10(noiseWatts * 1000)
}

export function receiverNoiseFloorDbm(
  bandwidthHz: number,
  noiseFigureDb: number,
  temperatureK = 290,
): number {
  return thermalNoiseDbm(bandwidthHz, temperatureK) + noiseFigureDb
}

export function receiverSensitivityDbm(
  bandwidthHz: number,
  noiseFigureDb: number,
  requiredSnrDb: number,
  temperatureK = 290,
): number {
  return receiverNoiseFloorDbm(
    bandwidthHz,
    noiseFigureDb,
    temperatureK,
  ) + requiredSnrDb
}

export function signalToNoiseRatioDb(
  signalDbm: number,
  noiseFloorDbm: number,
): number {
  return signalDbm - noiseFloorDbm
}

export function noiseDensityDbmHz(
  temperatureK = 290,
): number {
  return thermalNoiseDbm(1, temperatureK)
}
