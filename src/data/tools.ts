import type { Tool } from '../types'

/** Single source for the sidebar menu and the dashboard cards. */
export const TOOLS: Tool[] = [
  {
    name: { pt: 'Conversor dBm', en: 'dBm Converter' },
    description: { pt: 'Converta dBm para mW/W e vice-versa com precisão.', en: 'Convert dBm to mW/W and back with precision.' },
    path: '/rf/dbm', category: 'RF',
  },
  {
    name: { pt: 'Calculadora de EIRP', en: 'EIRP Calculator' },
    description: { pt: 'EIRP, potência conduzida total e PSD comparadas com os limites da ANATEL.', en: 'EIRP, total conducted power and PSD checked against ANATEL limits.' },
    path: '/rf/eirp', category: 'RF',
  },
  {
    name: { pt: 'Link Budget', en: 'Link Budget' },
    description: { pt: 'Monte um link budget completo do TX ao RX, com FSPL e zona de Fresnel.', en: 'Build a complete RF link budget from TX to RX, with FSPL and Fresnel zone.' },
    path: '/rf/link-budget', category: 'RF',
  },
  {
    name: { pt: 'Atenuação de RF', en: 'RF Attenuation' },
    description: { pt: 'Compare perdas típicas de materiais em 2.4, 5 e 6 GHz.', en: 'Compare typical material losses at 2.4, 5 and 6 GHz.' },
    path: '/rf/attenuation', category: 'RF',
  },
  {
    name: { pt: 'Antenas', en: 'Antenna Tools' },
    description: { pt: 'Comprimento de onda, zona de Fresnel e distância de Fraunhofer.', en: 'Wavelength, Fresnel zone and Fraunhofer distance.' },
    path: '/rf/antenna', category: 'RF',
  },
  {
    name: { pt: 'Ruído / SNR', en: 'Noise / SNR' },
    description: { pt: 'Piso de ruído, figura de ruído, SNR e sensibilidade do receptor.', en: 'Noise floor, noise figure, SNR and receiver sensitivity.' },
    path: '/rf/noise-snr', category: 'RF',
  },
  {
    name: { pt: 'Mapa de Canais', en: 'Wi-Fi Channel Map' },
    description: { pt: 'Explore os canais de 2.4, 5 e 6 GHz com DFS e perfil ANATEL.', en: 'Explore 2.4, 5 and 6 GHz channels with DFS and ANATEL profile.' },
    path: '/wifi/channels', category: 'Wi-Fi',
  },
  {
    name: { pt: 'PHY Rate', en: 'PHY Rate' },
    description: { pt: 'Estime a PHY rate do Wi-Fi por MCS, NSS e largura de canal.', en: 'Estimate Wi-Fi PHY rate from MCS, NSS and bandwidth.' },
    path: '/wifi/phy-rate', category: 'Wi-Fi',
  },
  {
    name: { pt: 'Capacidade Wi-Fi', en: 'Wi-Fi Capacity' },
    description: { pt: 'Capacidade por airtime, throughput por cliente, mix de MCS e APs multi-rádio.', en: 'Airtime-based capacity per client, MCS mix and multi-radio APs.' },
    path: '/wifi/capacity', category: 'Wi-Fi',
  },
  {
    name: { pt: 'Planejador de Rede', en: 'Network Planner' },
    description: { pt: 'Dimensione a quantidade de APs por capacidade e cobertura.', en: 'Size the number of APs by capacity and coverage.' },
    path: '/wifi/planner', category: 'Wi-Fi',
  },
  {
    name: { pt: 'Sub-rede IPv4', en: 'IPv4 Subnet' },
    description: { pt: 'Calcule rede, broadcast, hosts e máscaras.', en: 'Calculate network, broadcast, hosts and masks.' },
    path: '/networking/subnet', category: 'Networking',
  },
  {
    name: { pt: 'Calculadora de PoE', en: 'PoE Calculator' },
    description: { pt: 'Estime o orçamento de potência PoE e as perdas no cabo.', en: 'Estimate PoE power budget and cable losses.' },
    path: '/poe', category: 'PoE',
  },
]
