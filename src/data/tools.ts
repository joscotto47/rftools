import type { Tool } from '../types'

/** Single source for the sidebar menu and the dashboard cards. */
export const TOOLS: Tool[] = [
  { name: 'Conversor dBm', title: 'dBm Converter', description: 'Convert dBm to mW/W and back with precision.', path: '/rf/dbm', category: 'RF' },
  { name: 'Calculadora de EIRP', title: 'EIRP Calculator', description: 'EIRP, total conducted power and PSD checked against ANATEL limits.', path: '/rf/eirp', category: 'RF' },
  { name: 'Link Budget', title: 'Link Budget', description: 'Build a complete RF link budget from TX to RX, with FSPL and Fresnel zone.', path: '/rf/link-budget', category: 'RF' },
  { name: 'RF Attenuation', title: 'RF Attenuation', description: 'Compare typical material losses at 2.4, 5 and 6 GHz.', path: '/rf/attenuation', category: 'RF' },
  { name: 'Antenna Tools', title: 'Antenna Tools', description: 'Wavelength, Fresnel zone and Fraunhofer distance.', path: '/rf/antenna', category: 'RF' },
  { name: 'Noise / SNR', title: 'Noise / SNR', description: 'Noise floor, noise figure, SNR and receiver sensitivity.', path: '/rf/noise-snr', category: 'RF' },
  { name: 'Mapa de Canais', title: 'Wi-Fi Channel Map', description: 'Explore 2.4, 5 and 6 GHz channels with DFS and ANATEL profile.', path: '/wifi/channels', category: 'Wi-Fi' },
  { name: 'PHY Rate', title: 'PHY Rate Calculator', description: 'Estimate Wi-Fi PHY rate from MCS, NSS and bandwidth.', path: '/wifi/phy-rate', category: 'Wi-Fi' },
  { name: 'Wi-Fi Capacity', title: 'Wi-Fi Capacity', description: 'Airtime-based capacity per client, MCS mix and multi-radio APs.', path: '/wifi/capacity', category: 'Wi-Fi' },
  { name: 'Network Planner', title: 'Network Planner', description: 'Size the number of APs by capacity and coverage.', path: '/wifi/planner', category: 'Wi-Fi' },
  { name: 'Subnet IPv4', title: 'IPv4 Subnet Calculator', description: 'Calculate network, broadcast, hosts and masks.', path: '/networking/subnet', category: 'Networking' },
  { name: 'Calculadora de PoE', title: 'PoE Calculator', description: 'Estimate PoE power budget and cable losses.', path: '/poe', category: 'PoE' },
]
