export type TrafficModel = 'BALANCED' | 'DOWNLOAD_HEAVY' | 'UPLOAD_HEAVY'

export function effectiveCapacityMbps(
  phyRateMbps: number,
  efficiencyPercent: number,
  airtimeUtilizationPercent: number,
): number {
  return phyRateMbps * (efficiencyPercent / 100) * (airtimeUtilizationPercent / 100)
}

export function perClientThroughputMbps(
  totalCapacityMbps: number,
  clients: number,
  concurrencyPercent: number,
): number {
  if (clients <= 0) return 0
  const activeClients = Math.max(1, clients * (concurrencyPercent / 100))
  return totalCapacityMbps / activeClients
}

export function totalAirtimeDemandPercent(
  clients: number,
  demandPerClientMbps: number,
  phyRateMbps: number,
  efficiencyPercent: number,
  concurrencyPercent: number,
): number {
  if (phyRateMbps <= 0 || efficiencyPercent <= 0) return Number.NaN
  const activeClients = clients * (concurrencyPercent / 100)
  const effectivePhy = phyRateMbps * (efficiencyPercent / 100)
  return (activeClients * demandPerClientMbps / effectivePhy) * 100
}

export function maxClientsForDemand(
  phyRateMbps: number,
  efficiencyPercent: number,
  airtimeUtilizationPercent: number,
  demandPerClientMbps: number,
  concurrencyPercent: number,
): number {
  if (demandPerClientMbps <= 0 || concurrencyPercent <= 0) return 0
  const capacity = effectiveCapacityMbps(
    phyRateMbps,
    efficiencyPercent,
    airtimeUtilizationPercent,
  )
  const activeClientCapacity = capacity / demandPerClientMbps
  return Math.floor(activeClientCapacity / (concurrencyPercent / 100))
}

export function classifyCapacity(
  airtimeDemandPercent: number,
  airtimeLimitPercent: number,
): {
  label: 'EXCELLENT' | 'GOOD' | 'BUSY' | 'OVERLOADED'
  description: string
} {
  const ratio = airtimeDemandPercent / airtimeLimitPercent

  if (ratio <= 0.5) {
    return {
      label: 'EXCELLENT',
      description: 'Há bastante folga de airtime para crescimento e retransmissões.',
    }
  }

  if (ratio <= 0.8) {
    return {
      label: 'GOOD',
      description: 'A carga estimada está dentro de uma faixa confortável.',
    }
  }

  if (ratio <= 1) {
    return {
      label: 'BUSY',
      description: 'O airtime está próximo do limite definido para operação.',
    }
  }

  return {
    label: 'OVERLOADED',
    description: 'A demanda estimada excede o airtime disponível.',
  }
}


export type McsMixEntry = {
  mcs: number
  sharePercent: number
  phyRateMbps: number
}

export function weightedAirtimeCapacityMbps(
  entries: McsMixEntry[],
  efficiencyPercent: number,
  airtimeUtilizationPercent: number,
): number {
  const valid = entries.filter(entry => entry.sharePercent > 0 && entry.phyRateMbps > 0)
  const totalShare = valid.reduce((sum, entry) => sum + entry.sharePercent, 0)
  if (totalShare <= 0) return 0

  // Harmonic-style aggregation because airtime cost is inversely proportional to PHY rate.
  const weightedInverseRate = valid.reduce(
    (sum, entry) =>
      sum + (entry.sharePercent / totalShare) * (1 / entry.phyRateMbps),
    0,
  )

  if (weightedInverseRate <= 0) return 0

  const effectivePhy = 1 / weightedInverseRate
  return effectivePhy * (efficiencyPercent / 100) * (airtimeUtilizationPercent / 100)
}

export function normalizedMcsShares(entries: McsMixEntry[]): McsMixEntry[] {
  const total = entries.reduce((sum, entry) => sum + Math.max(0, entry.sharePercent), 0)
  if (total <= 0) return entries.map(entry => ({ ...entry, sharePercent: 0 }))
  return entries.map(entry => ({
    ...entry,
    sharePercent: Math.max(0, entry.sharePercent) * 100 / total,
  }))
}
