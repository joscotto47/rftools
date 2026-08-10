export function dbmToMw(dbm: number): number {
  return Math.pow(10, dbm / 10)
}

export function mwToDbm(mw: number): number {
  if (mw <= 0) return Number.NaN
  return 10 * Math.log10(mw)
}

export function mwToW(mw: number): number {
  return mw / 1000
}

export function wToMw(watts: number): number {
  return watts * 1000
}

export function dbmToW(dbm: number): number {
  return dbmToMw(dbm) / 1000
}

export function wToDbm(watts: number): number {
  return mwToDbm(wToMw(watts))
}

/**
 * Calculates total EIRP assuming TX Power is specified per spatial stream/chain.
 * Equal power is assumed on each stream.
 *
 * EIRP = TX Power per stream + Antenna Gain - Path Loss + 10*log10(NSS)
 */
export function calculateEirp(
  txPowerDbm: number,
  antennaGainDbi: number,
  pathLossDb = 0,
  spatialStreams = 1,
): number {
  if (spatialStreams < 1) return Number.NaN
  return txPowerDbm + antennaGainDbi - pathLossDb + 10 * Math.log10(spatialStreams)
}

export function calculateTxPowerFromEirp(
  eirpDbm: number,
  antennaGainDbi: number,
  pathLossDb = 0,
  spatialStreams = 1,
): number {
  if (spatialStreams < 1) return Number.NaN
  return eirpDbm - antennaGainDbi + pathLossDb - 10 * Math.log10(spatialStreams)
}

export function formatNumber(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: digits,
  }).format(value)
}
