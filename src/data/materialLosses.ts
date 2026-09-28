import type { Localized } from '../i18n'

export type WifiLossBand = '2.4 GHz' | '5 GHz' | '6 GHz'

export type MaterialCategory = 'wall' | 'glass' | 'structural' | 'metal' | 'environment'

export const MATERIAL_CATEGORY_LABELS: Record<MaterialCategory, Localized> = {
  wall: { pt: 'Parede', en: 'Wall' },
  glass: { pt: 'Vidro', en: 'Glass' },
  structural: { pt: 'Estrutural', en: 'Structural' },
  metal: { pt: 'Metal', en: 'Metal' },
  environment: { pt: 'Ambiente', en: 'Environment' },
}

export type MaterialLoss = {
  id: string
  name: Localized
  category: MaterialCategory
  lossDb: Record<WifiLossBand, number>
  note?: Localized
}

export const MATERIAL_LOSSES: MaterialLoss[] = [
  { id: 'drywall', name: { pt: 'Drywall', en: 'Drywall' }, category: 'wall', lossDb: { '2.4 GHz': 3, '5 GHz': 4, '6 GHz': 5 } },
  { id: 'wood', name: { pt: 'Madeira', en: 'Wood' }, category: 'wall', lossDb: { '2.4 GHz': 3, '5 GHz': 4, '6 GHz': 5 } },
  { id: 'glass', name: { pt: 'Vidro comum', en: 'Clear glass' }, category: 'glass', lossDb: { '2.4 GHz': 2, '5 GHz': 3, '6 GHz': 4 } },
  { id: 'tinted-glass', name: { pt: 'Vidro metalizado', en: 'Metallized glass' }, category: 'glass', lossDb: { '2.4 GHz': 8, '5 GHz': 12, '6 GHz': 15 } },
  { id: 'brick', name: { pt: 'Tijolo / Alvenaria', en: 'Brick / Masonry' }, category: 'wall', lossDb: { '2.4 GHz': 6, '5 GHz': 9, '6 GHz': 11 } },
  { id: 'concrete', name: { pt: 'Concreto', en: 'Concrete' }, category: 'structural', lossDb: { '2.4 GHz': 12, '5 GHz': 18, '6 GHz': 22 } },
  { id: 'reinforced-concrete', name: { pt: 'Concreto armado', en: 'Reinforced concrete' }, category: 'structural', lossDb: { '2.4 GHz': 18, '5 GHz': 25, '6 GHz': 30 } },
  { id: 'metal-door', name: { pt: 'Porta metálica', en: 'Metal door' }, category: 'metal', lossDb: { '2.4 GHz': 15, '5 GHz': 20, '6 GHz': 24 } },
  { id: 'elevator', name: { pt: 'Elevador / Caixa metálica', en: 'Elevator / Metal enclosure' }, category: 'metal', lossDb: { '2.4 GHz': 25, '5 GHz': 30, '6 GHz': 35 } },
  { id: 'human-crowd', name: { pt: 'Pessoas / alta densidade', en: 'People / high density' }, category: 'environment', lossDb: { '2.4 GHz': 3, '5 GHz': 5, '6 GHz': 6 } },
]

export function frequencyToLossBand(frequencyGHz: number): WifiLossBand {
  if (frequencyGHz < 3) return '2.4 GHz'
  if (frequencyGHz < 5.925) return '5 GHz'
  return '6 GHz'
}

export function totalMaterialLossDb(
  quantities: Record<string, number>,
  band: WifiLossBand,
): number {
  return MATERIAL_LOSSES.reduce((sum, material) => {
    const quantity = Math.max(0, quantities[material.id] ?? 0)
    return sum + quantity * material.lossDb[band]
  }, 0)
}
