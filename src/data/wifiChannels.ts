export type WifiBand = '2.4 GHz' | '5 GHz' | '6 GHz'
export type ChannelWidth = 20 | 40 | 80 | 160 | 320

export type ChannelConfig = {
  channel: number
  frequencyMHz: number
  band: WifiBand
  width: ChannelWidth
  constituent20MHz: number[]
  dfs?: boolean
  channelSet?: string
}

const freq24 = (channel: number) => channel === 14 ? 2484 : 2407 + channel * 5
const freq5 = (channel: number) => 5000 + channel * 5
const freq6 = (channel: number) => 5950 + channel * 5

function configs(
  band: WifiBand,
  width: ChannelWidth,
  centers: number[],
  getFrequency: (channel: number) => number,
  getConstituents: (center: number) => number[],
  dfsCenters: number[] = [],
  getSet?: (center: number) => string | undefined,
): ChannelConfig[] {
  return centers.map((channel) => ({
    channel,
    frequencyMHz: getFrequency(channel),
    band,
    width,
    constituent20MHz: getConstituents(channel),
    dfs: dfsCenters.includes(channel),
    channelSet: getSet?.(channel),
  }))
}

// 2.4 GHz
const CH24_20 = Array.from({ length: 13 }, (_, i) => i + 1)
const CH24_40 = Array.from({ length: 9 }, (_, i) => i + 3) // centers 3...11

// 5 GHz
const CH5_20 = [
  36, 40, 44, 48,
  52, 56, 60, 64,
  100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140, 144,
  149, 153, 157, 161, 165,
]
const CH5_40 = [38, 46, 54, 62, 102, 110, 118, 126, 134, 142, 151, 159]
const CH5_80 = [42, 58, 106, 122, 138, 155]
const CH5_160 = [50, 114]

const DFS_20 = [52,56,60,64,100,104,108,112,116,120,124,128,132,136,140,144]
const DFS_40 = [54,62,102,110,118,126,134,142]
const DFS_80 = [58,106,122,138]
const DFS_160 = [50,114]

// 6 GHz global IEEE channelization.
// 320 MHz has two overlapping channel sets in Wi-Fi 7.
const CH6_20 = Array.from({ length: 59 }, (_, i) => 1 + i * 4)
const CH6_40 = Array.from({ length: 29 }, (_, i) => 3 + i * 8)
const CH6_80 = Array.from({ length: 14 }, (_, i) => 7 + i * 16)
const CH6_160 = Array.from({ length: 7 }, (_, i) => 15 + i * 32)
const CH6_320 = [31, 63, 95, 127, 159, 191]

const around = (center: number, offsets: number[]) => offsets.map(o => center + o)

export const CHANNEL_CONFIGS: ChannelConfig[] = [
  ...configs('2.4 GHz', 20, CH24_20, freq24, c => [c]),
  ...configs('2.4 GHz', 40, CH24_40, freq24, c => [c - 2, c + 2]),

  ...configs('5 GHz', 20, CH5_20, freq5, c => [c], DFS_20),
  ...configs('5 GHz', 40, CH5_40, freq5, c => around(c, [-2, 2]), DFS_40),
  ...configs('5 GHz', 80, CH5_80, freq5, c => around(c, [-6, -2, 2, 6]), DFS_80),
  ...configs('5 GHz', 160, CH5_160, freq5, c => around(c, [-14,-10,-6,-2,2,6,10,14]), DFS_160),

  ...configs('6 GHz', 20, CH6_20, freq6, c => [c]),
  ...configs('6 GHz', 40, CH6_40, freq6, c => around(c, [-2, 2])),
  ...configs('6 GHz', 80, CH6_80, freq6, c => around(c, [-6, -2, 2, 6])),
  ...configs('6 GHz', 160, CH6_160, freq6, c => around(c, [-14,-10,-6,-2,2,6,10,14])),
  ...configs(
    '6 GHz',
    320,
    CH6_320,
    freq6,
    c => around(c, [-30,-26,-22,-18,-14,-10,-6,-2,2,6,10,14,18,22,26,30]),
    [],
    c => [31,95,159].includes(c) ? '320 MHz-1' : '320 MHz-2',
  ),
]

export const WIDTHS_BY_BAND: Record<WifiBand, ChannelWidth[]> = {
  '2.4 GHz': [20, 40],
  '5 GHz': [20, 40, 80, 160],
  '6 GHz': [20, 40, 80, 160, 320],
}

export function getChannelConfigs(band: WifiBand, width: ChannelWidth): ChannelConfig[] {
  return CHANNEL_CONFIGS.filter((item) => item.band === band && item.width === width)
}
