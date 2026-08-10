export function prefixToMask(prefix: number): string {
  if (prefix < 0 || prefix > 32) return ''
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
  return [(mask >>> 24) & 255, (mask >>> 16) & 255, (mask >>> 8) & 255, mask & 255].join('.')
}
export function maskToPrefix(mask: string): number | null {
  const parts = mask.split('.').map(Number)
  if (parts.length !== 4 || parts.some(p => !Number.isInteger(p) || p < 0 || p > 255)) return null
  const bits = parts.map(p => p.toString(2).padStart(8,'0')).join('')
  if (!/^1*0*$/.test(bits)) return null
  return bits.indexOf('0') === -1 ? 32 : bits.indexOf('0')
}
export function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some(p => !Number.isInteger(p) || p < 0 || p > 255)) return null
  return (((parts[0]<<24)>>>0) + (parts[1]<<16) + (parts[2]<<8) + parts[3]) >>> 0
}
export function intToIpv4(value: number): string {
  const v = value >>> 0
  return [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255].join('.')
}
export function calculateSubnet(ip: string, prefix: number) {
  const ipInt = ipv4ToInt(ip)
  if (ipInt === null || prefix < 0 || prefix > 32) return null
  const maskInt = prefix === 0 ? 0 : (0xffffffff << (32-prefix)) >>> 0
  const network = (ipInt & maskInt) >>> 0
  const wildcard = (~maskInt) >>> 0
  const broadcast = (network | wildcard) >>> 0
  const totalAddresses = Math.pow(2, 32-prefix)
  let usableHosts = 0, firstHost = network, lastHost = broadcast
  if (prefix <= 30) { usableHosts = totalAddresses - 2; firstHost = network + 1; lastHost = broadcast - 1 }
  else if (prefix === 31) { usableHosts = 2 }
  else { usableHosts = 1; lastHost = network }
  return {
    prefix, mask: intToIpv4(maskInt), wildcard: intToIpv4(wildcard),
    network: intToIpv4(network), broadcast: intToIpv4(broadcast),
    firstHost: intToIpv4(firstHost), lastHost: intToIpv4(lastHost),
    totalAddresses, usableHosts, hostBits: 32-prefix,
  }
}
