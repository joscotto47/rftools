export type WifiLossBand = '2.4 GHz' | '5 GHz' | '6 GHz'

export type MaterialLoss = {
  id: string
  name: string
  category: string
  lossDb: Record<WifiLossBand, number>
  note?: string
}

export const MATERIAL_LOSSES: MaterialLoss[] = [
  { id: 'drywall', name: 'Drywall', category: 'Parede', lossDb: { '2.4 GHz': 3, '5 GHz': 4, '6 GHz': 5 } },
  { id: 'wood', name: 'Madeira', category: 'Parede', lossDb: { '2.4 GHz': 3, '5 GHz': 4, '6 GHz': 5 } },
  { id: 'glass', name: 'Vidro comum', category: 'Vidro', lossDb: { '2.4 GHz': 2, '5 GHz': 3, '6 GHz': 4 } },
  { id: 'tinted-glass', name: 'Vidro metalizado', category: 'Vidro', lossDb: { '2.4 GHz': 8, '5 GHz': 12, '6 GHz': 15 } },
  { id: 'brick', name: 'Tijolo / Alvenaria', category: 'Parede', lossDb: { '2.4 GHz': 6, '5 GHz': 9, '6 GHz': 11 } },
  { id: 'concrete', name: 'Concreto', category: 'Estrutural', lossDb: { '2.4 GHz': 12, '5 GHz': 18, '6 GHz': 22 } },
  { id: 'reinforced-concrete', name: 'Concreto armado', category: 'Estrutural', lossDb: { '2.4 GHz': 18, '5 GHz': 25, '6 GHz': 30 } },
  { id: 'metal-door', name: 'Porta metálica', category: 'Metal', lossDb: { '2.4 GHz': 15, '5 GHz': 20, '6 GHz': 24 } },
  { id: 'elevator', name: 'Elevador / Caixa metálica', category: 'Metal', lossDb: { '2.4 GHz': 25, '5 GHz': 30, '6 GHz': 35 } },
  { id: 'human-crowd', name: 'Pessoas / alta densidade', category: 'Ambiente', lossDb: { '2.4 GHz': 3, '5 GHz': 5, '6 GHz': 6 } },
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
