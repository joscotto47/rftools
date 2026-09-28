import { describe, expect, it } from 'vitest'
import { checkRegulatory } from './regulatory'
import { getChannelConfigs, type ChannelWidth, type WifiBand } from './wifiChannels'
import {
  checkCompliance,
  getEffectivePowerLimits,
  type ApplicationType,
  type RegulatoryDeviceType,
} from './regulatoryPower'

function channel(band: WifiBand, width: ChannelWidth, number: number) {
  const config = getChannelConfigs(band, width).find(c => c.channel === number)
  if (!config) throw new Error(`channel ${number} (${width} MHz) not found`)
  return config
}

function check(opts: {
  band: WifiBand
  width: ChannelWidth
  ch: number
  tx: number
  chains?: number
  gain?: number
  loss?: number
  device?: RegulatoryDeviceType
  app?: ApplicationType
  hasTpc?: boolean
}) {
  const config = channel(opts.band, opts.width, opts.ch)
  const limits = getEffectivePowerLimits(config, opts.device ?? 'AP', opts.gain ?? 0, {
    applicationType: opts.app,
    hasTpc: opts.hasTpc,
  })
  const result = checkCompliance({
    txPowerPerChainDbm: opts.tx,
    txChains: opts.chains ?? 1,
    antennaGainDbi: opts.gain ?? 0,
    cableLossDb: opts.loss ?? 0,
    channelWidthMHz: opts.width,
  }, limits)
  return { limits, result }
}

describe('conducted power is summed over all TX chains (item 10.3.4)', () => {
  it('fails 4 chains of 29 dBm (35 dBm total) against the 30 dBm limit at 5.8 GHz', () => {
    const { result } = check({ band: '5 GHz', width: 20, ch: 157, tx: 29, chains: 4, gain: 5 })
    expect(result.totalConductedDbm).toBeCloseTo(35.02, 2)
    expect(result.conductedPass).toBe(false)
    expect(result.pass).toBe(false)
  })

  it('passes a single 29 dBm chain at 5.8 GHz', () => {
    const { result } = check({ band: '5 GHz', width: 20, ch: 157, tx: 29, gain: 5 })
    expect(result.pass).toBe(true)
  })

  it('checks both sides of the limit: 2 chains at 2.4 GHz (+3.01 dB)', () => {
    // 26.98 dBm → 29.99 dBm total; 27 dBm → 30.01 dBm total.
    expect(check({ band: '2.4 GHz', width: 20, ch: 6, tx: 26.98, chains: 2 }).result.conductedPass).toBe(true)
    expect(check({ band: '2.4 GHz', width: 20, ch: 6, tx: 27, chains: 2 }).result.conductedPass).toBe(false)
  })
})

describe('antenna gain reduction', () => {
  it('reduces 1 dB per dB above 6 dBi in general 2.4 GHz use', () => {
    const { limits } = check({ band: '2.4 GHz', width: 20, ch: 6, tx: 20, gain: 15 })
    expect(limits.adjustedMaxConductedDbm).toBe(21)
  })

  it('reduces 1 dB per 3 dB above 6 dBi for 2.4 GHz fixed point-to-point (item 10.5.1)', () => {
    const { limits } = check({ band: '2.4 GHz', width: 20, ch: 6, tx: 20, gain: 15, app: 'FIXED_PTP' })
    expect(limits.adjustedMaxConductedDbm).toBe(27)
    expect(limits.fixedPtpExemptionApplied).toBe(true)
  })

  it('has no reduction for 5.8 GHz fixed point-to-point (item 10.5.2)', () => {
    const { limits } = check({ band: '5 GHz', width: 20, ch: 157, tx: 20, gain: 30, app: 'FIXED_PTP' })
    expect(limits.adjustedMaxConductedDbm).toBe(30)
  })

  it('uses a 23 dBi threshold for 5.15–5.25 GHz point-to-point APs (item 11.1.2)', () => {
    const general = check({ band: '5 GHz', width: 20, ch: 36, tx: 20, gain: 20 })
    const ptp = check({ band: '5 GHz', width: 20, ch: 36, tx: 20, gain: 20, app: 'FIXED_PTP' })
    expect(general.limits.adjustedMaxConductedDbm).toBe(16)
    expect(ptp.limits.adjustedMaxConductedDbm).toBe(30)
  })

  it('also reduces the conducted PSD limit in 5 GHz', () => {
    const { limits } = check({ band: '5 GHz', width: 20, ch: 36, tx: 10, gain: 9 })
    expect(limits.adjustedMaxPsdDbmMHz).toBe(14)
  })
})

describe('5 GHz limits (Ato nº 14158/2025)', () => {
  it('limits 5.25–5.35 GHz to min(24 dBm, 11 + 10log B)', () => {
    const { limits } = check({ band: '5 GHz', width: 20, ch: 56, tx: 10 })
    expect(limits.adjustedMaxConductedDbm).toBe(24)
    expect(limits.dfsRequired).toBe(true)
  })

  it('limits clients in 5.15–5.25 GHz to 24 dBm and 11 dBm/MHz', () => {
    const { limits } = check({ band: '5 GHz', width: 20, ch: 36, tx: 10, device: 'CLIENT' })
    expect(limits.adjustedMaxConductedDbm).toBe(24)
    expect(limits.adjustedMaxPsdDbmMHz).toBe(11)
  })

  it('caps EIRP at 27 dBm without TPC (item 11.5.1)', () => {
    const { limits, result } = check({ band: '5 GHz', width: 80, ch: 106, tx: 20, gain: 9, hasTpc: false })
    expect(limits.maxEirpDbm).toBe(27)
    expect(result.eirpPass).toBe(false)
  })

  it('does not apply the TPC cap to 5.725–5.850 MHz', () => {
    const { limits } = check({ band: '5 GHz', width: 20, ch: 157, tx: 20, hasTpc: false })
    expect(limits.maxEirpDbm).toBeUndefined()
  })

  it('fails the conducted PSD for a narrow channel at full power', () => {
    // 24 dBm over 20 MHz = 10.99 dBm/MHz passes; 25 dBm fails both limits.
    expect(check({ band: '5 GHz', width: 20, ch: 56, tx: 24 }).result.pass).toBe(true)
    expect(check({ band: '5 GHz', width: 20, ch: 56, tx: 25 }).result.psdPass).toBe(false)
  })
})

describe('6 GHz (Ato nº 1306/2021 limits, Ato nº 10400/2026 band)', () => {
  it('lets PSD limit a 20 MHz AP well below 30 dBm EIRP', () => {
    // 5 dBm/MHz × 20 MHz → about 18 dBm EIRP.
    expect(check({ band: '6 GHz', width: 20, ch: 1, tx: 18, device: 'AP' }).result.pass).toBe(true)
    const full = check({ band: '6 GHz', width: 20, ch: 1, tx: 30, device: 'AP' }).result
    expect(full.eirpPass).toBe(true)
    expect(full.psdPass).toBe(false)
  })

  it('needs 320 MHz to reach 30 dBm EIRP within 5 dBm/MHz (160 MHz fails PSD)', () => {
    const { result } = check({ band: '6 GHz', width: 160, ch: 15, tx: 30, device: 'AP' })
    expect(result.psdPass).toBe(false)
    expect(check({ band: '6 GHz', width: 320, ch: 31, tx: 30, device: 'AP' }).result.pass).toBe(true)
  })

  it('uses 24 dBm / −1 dBm/MHz for clients and 17 dBm / −5 dBm/MHz for VLP', () => {
    expect(check({ band: '6 GHz', width: 20, ch: 1, tx: 10, device: 'CLIENT' }).limits.maxEirpDbm).toBe(24)
    expect(check({ band: '6 GHz', width: 20, ch: 1, tx: 10, device: 'VLP' }).limits.maxPsdDbmMHz).toBe(-5)
  })

  it('rejects channels above 6.425 MHz', () => {
    const { limits, result } = check({ band: '6 GHz', width: 20, ch: 97, tx: 0, device: 'AP' })
    expect(limits.applicable).toBe(false)
    expect(result.pass).toBe(false)
  })

  it('rejects blocks that cross 6.425 MHz', () => {
    // 80 MHz ch 103 spans 6.395–6.475 MHz.
    expect(check({ band: '6 GHz', width: 80, ch: 103, tx: 0 }).limits.applicable).toBe(false)
  })

  it('lists only channels inside 5.925–6.425 MHz as allowed', () => {
    const allowed = (width: ChannelWidth) =>
      getChannelConfigs('6 GHz', width)
        .filter(c => checkRegulatory(c, 'BR-ANATEL').allowed)
        .map(c => c.channel)
    expect(allowed(20).at(-1)).toBe(93)
    expect(allowed(20)).toHaveLength(24)
    expect(allowed(160)).toEqual([15, 47, 79])
    expect(allowed(320)).toEqual([31, 63])
  })
})
