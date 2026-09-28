import { type Localized } from '../i18n'
export function fsplDb(distanceKm: number, frequencyMHz: number): number {
  if (distanceKm <= 0 || frequencyMHz <= 0) return Number.NaN
  return 32.44 + 20 * Math.log10(distanceKm) + 20 * Math.log10(frequencyMHz)
}

export function receivedPowerDbm(
  txPowerDbm: number,
  txAntennaGainDbi: number,
  txLossDb: number,
  pathLossDb: number,
  rxAntennaGainDbi: number,
  rxLossDb: number,
): number {
  return txPowerDbm + txAntennaGainDbi - txLossDb - pathLossDb + rxAntennaGainDbi - rxLossDb
}

export function linkMarginDb(receivedPower: number, receiverSensitivityDbm: number): number {
  return receivedPower - receiverSensitivityDbm
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

export function fresnelMidpointMeters(
  frequencyGHz: number,
  totalDistanceKm: number,
): number {
  return fresnelRadiusMeters(frequencyGHz, totalDistanceKm / 2, totalDistanceKm / 2)
}

export function classifyLinkMargin(marginDb: number): {
  label: 'EXCELLENT' | 'GOOD' | 'MARGINAL' | 'FAIL'
  description: Localized
} {
  if (marginDb >= 20) {
    return { label: 'EXCELLENT', description: { pt: "Margem robusta para variações do enlace.", en: "Robust margin for link variations." } }
  }
  if (marginDb >= 10) {
    return { label: 'GOOD', description: { pt: "Margem adequada para um enlace estável.", en: "Adequate margin for a stable link." } }
  }
  if (marginDb >= 0) {
    return { label: 'MARGINAL', description: { pt: "O enlace pode funcionar, mas com pouca margem.", en: "The link may work, but with little margin." } }
  }
  return { label: 'FAIL', description: { pt: "A potência recebida está abaixo da sensibilidade informada.", en: "Received power is below the given sensitivity." } }
}
