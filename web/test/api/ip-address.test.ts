import { isIP } from 'node:net'
import { describe, expect, it } from 'vitest'
import { ipVersion } from '../../api/_lib/ipAddress.js'

// Workers do not document node:net, so the rate limiter uses its own check.
// It must agree with Node wherever a proxy header could plausibly carry a value.
const CASES = [
  '203.0.113.7',
  '0.0.0.0',
  '255.255.255.255',
  '256.1.1.1',
  '1.2.3',
  '1.2.3.4.5',
  '01.2.3.4',
  '203.0.113.7 ',
  '::1',
  '::',
  '2001:db8::1',
  '2001:0db8:0000:0000:0000:ff00:0042:8329',
  '::ffff:192.0.2.1',
  'fe80::1',
  '2001:db8::g',
  ':::1',
  '1::2::3',
  '[::1]',
  'unknown',
  'localhost',
  '',
]

describe('ipVersion', () => {
  it.each(CASES)('matches node:net isIP for %j', value => {
    expect(ipVersion(value)).toBe(isIP(value))
  })

  it('refuses scoped IPv6 addresses, which no edge header should contain', () => {
    expect(ipVersion('fe80::1%eth0')).toBe(0)
  })
})
