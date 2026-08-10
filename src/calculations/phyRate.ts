export type WifiGeneration = 'Wi-Fi 5' | 'Wi-Fi 6' | 'Wi-Fi 7'
export type McsInfo = { mcs:number; modulation:string; codingRate:string; bits:number; num:number; den:number }

export const MCS: Record<WifiGeneration, McsInfo[]> = {
  'Wi-Fi 5': [
    [0,'BPSK','1/2',1,1,2],[1,'QPSK','1/2',2,1,2],[2,'QPSK','3/4',2,3,4],
    [3,'16-QAM','1/2',4,1,2],[4,'16-QAM','3/4',4,3,4],[5,'64-QAM','2/3',6,2,3],
    [6,'64-QAM','3/4',6,3,4],[7,'64-QAM','5/6',6,5,6],[8,'256-QAM','3/4',8,3,4],
    [9,'256-QAM','5/6',8,5,6],
  ].map(x=>({mcs:x[0] as number,modulation:x[1] as string,codingRate:x[2] as string,bits:x[3] as number,num:x[4] as number,den:x[5] as number})),
  'Wi-Fi 6': [
    [0,'BPSK','1/2',1,1,2],[1,'QPSK','1/2',2,1,2],[2,'QPSK','3/4',2,3,4],
    [3,'16-QAM','1/2',4,1,2],[4,'16-QAM','3/4',4,3,4],[5,'64-QAM','2/3',6,2,3],
    [6,'64-QAM','3/4',6,3,4],[7,'64-QAM','5/6',6,5,6],[8,'256-QAM','3/4',8,3,4],
    [9,'256-QAM','5/6',8,5,6],[10,'1024-QAM','3/4',10,3,4],[11,'1024-QAM','5/6',10,5,6],
  ].map(x=>({mcs:x[0] as number,modulation:x[1] as string,codingRate:x[2] as string,bits:x[3] as number,num:x[4] as number,den:x[5] as number})),
  'Wi-Fi 7': [
    [0,'BPSK','1/2',1,1,2],[1,'QPSK','1/2',2,1,2],[2,'QPSK','3/4',2,3,4],
    [3,'16-QAM','1/2',4,1,2],[4,'16-QAM','3/4',4,3,4],[5,'64-QAM','2/3',6,2,3],
    [6,'64-QAM','3/4',6,3,4],[7,'64-QAM','5/6',6,5,6],[8,'256-QAM','3/4',8,3,4],
    [9,'256-QAM','5/6',8,5,6],[10,'1024-QAM','3/4',10,3,4],[11,'1024-QAM','5/6',10,5,6],
    [12,'4096-QAM','3/4',12,3,4],[13,'4096-QAM','5/6',12,5,6],
  ].map(x=>({mcs:x[0] as number,modulation:x[1] as string,codingRate:x[2] as string,bits:x[3] as number,num:x[4] as number,den:x[5] as number})),
}

export const WIDTHS: Record<WifiGeneration, number[]> = {
  'Wi-Fi 5':[20,40,80,160], 'Wi-Fi 6':[20,40,80,160], 'Wi-Fi 7':[20,40,80,160,320],
}
const NSD: Record<WifiGeneration, Record<number,number>> = {
  'Wi-Fi 5':{20:52,40:108,80:234,160:468},
  'Wi-Fi 6':{20:234,40:468,80:980,160:1960},
  'Wi-Fi 7':{20:234,40:468,80:980,160:1960,320:3920},
}
export function phyRate(gen:WifiGeneration,width:number,m:McsInfo,nss:number,gi:number){
  const symbol = gen==='Wi-Fi 5' ? 3.2+gi : 12.8+gi
  return NSD[gen][width]*m.bits*(m.num/m.den)*nss/symbol
}
