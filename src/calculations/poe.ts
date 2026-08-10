export type PoeStandard = '802.3af' | '802.3at' | '802.3bt Type 3' | '802.3bt Type 4'

export type PoeStandardInfo = {
  standard: PoeStandard
  type: string
  maxPsePowerW: number
  minPdPowerW: number
  pairs: number
  nominalVoltageV: number
  note: string
}

export const POE_STANDARDS: PoeStandardInfo[] = [
  {
    standard: '802.3af',
    type: 'Type 1',
    maxPsePowerW: 15.4,
    minPdPowerW: 12.95,
    pairs: 2,
    nominalVoltageV: 48,
    note: 'PoE clássico para dispositivos de menor consumo.',
  },
  {
    standard: '802.3at',
    type: 'Type 2',
    maxPsePowerW: 30,
    minPdPowerW: 25.5,
    pairs: 2,
    nominalVoltageV: 50,
    note: 'PoE+ para APs, câmeras e dispositivos de maior consumo.',
  },
  {
    standard: '802.3bt Type 3',
    type: 'Type 3',
    maxPsePowerW: 60,
    minPdPowerW: 51,
    pairs: 4,
    nominalVoltageV: 52,
    note: '4-pair PoE para cargas mais altas.',
  },
  {
    standard: '802.3bt Type 4',
    type: 'Type 4',
    maxPsePowerW: 90,
    minPdPowerW: 71,
    pairs: 4,
    nominalVoltageV: 52,
    note: 'PoE++ para aplicações de alta potência.',
  },
]

export function getPoeStandardInfo(standard: PoeStandard): PoeStandardInfo {
  return POE_STANDARDS.find(item => item.standard === standard) ?? POE_STANDARDS[0]
}

export function cableLoopResistanceOhm(
  lengthMeters: number,
  conductorResistanceOhmPer100m: number,
  pairs: number,
): number {
  if (lengthMeters <= 0) return 0

  // Two conductors form the DC loop. With multiple powered pairs,
  // current is distributed across the pairs in parallel.
  const oneConductor = conductorResistanceOhmPer100m * lengthMeters / 100
  const loopPerPair = oneConductor * 2
  return loopPerPair / Math.max(1, pairs)
}

export function cableLossW(
  powerW: number,
  voltageV: number,
  loopResistanceOhm: number,
): number {
  if (powerW <= 0 || voltageV <= 0 || loopResistanceOhm <= 0) return 0
  const currentA = powerW / voltageV
  return currentA * currentA * loopResistanceOhm
}

export function calculatePoeBudget({
  standard,
  cableLengthM,
  conductorResistanceOhmPer100m,
  deviceConsumptionW,
  voltageV,
}: {
  standard: PoeStandard
  cableLengthM: number
  conductorResistanceOhmPer100m: number
  deviceConsumptionW: number
  voltageV: number
}) {
  const info = getPoeStandardInfo(standard)
  const loopResistance = cableLoopResistanceOhm(
    cableLengthM,
    conductorResistanceOhmPer100m,
    info.pairs,
  )

  // Estimate loss at the standard's guaranteed PD power.
  const standardCableLoss = cableLossW(
    info.minPdPowerW,
    voltageV,
    loopResistance,
  )

  const estimatedAvailableAtPd = Math.max(
    0,
    info.maxPsePowerW - standardCableLoss,
  )

  const marginW = estimatedAvailableAtPd - deviceConsumptionW
  const utilizationPercent =
    estimatedAvailableAtPd > 0
      ? deviceConsumptionW / estimatedAvailableAtPd * 100
      : 0

  const currentA =
    voltageV > 0
      ? deviceConsumptionW / voltageV
      : 0

  const deviceCableLoss = cableLossW(
    deviceConsumptionW,
    voltageV,
    loopResistance,
  )

  return {
    info,
    loopResistance,
    standardCableLoss,
    estimatedAvailableAtPd,
    marginW,
    utilizationPercent,
    currentA,
    deviceCableLoss,
    pass: marginW >= 0,
  }
}
