/*
 * IP address classification with node:net isIP semantics: 4, 6 or 0.
 *
 * node:net is not documented as providing isIP on Cloudflare Workers, and the
 * rate limiter must not fail open because a platform module is missing, so
 * this uses only a strict IPv4 pattern and the URL parser for IPv6.
 */

const IPV4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/

export function ipVersion(value: string): 0 | 4 | 6 {
  if (IPV4.test(value)) return 4
  // Only hex digits, colons and an embedded IPv4 tail belong in an IPv6 literal.
  if (!value.includes(':') || !/^[0-9a-fA-F:.]+$/.test(value)) return 0
  try {
    new URL(`http://[${value}]/`)
    return 6
  } catch {
    return 0
  }
}
