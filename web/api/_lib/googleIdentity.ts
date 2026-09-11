import { createRemoteJWKSet, jwtVerify } from 'jose'

/*
 * Verifies a Google Identity Services credential (an ID token) with jose.
 *
 * This replaces google-auth-library's OAuth2Client, which depends on Node's
 * HTTP stack and does not run on Cloudflare Workers. The checks are the same
 * ones verifyIdToken performs: Google's published signing keys, the Google
 * issuer, this app's client ID as audience, and expiry.
 */

const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com']
const googleSigningKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'))

export interface GoogleIdClaims {
  sub?: string
  email?: string
  email_verified?: boolean
  name?: string
  picture?: string
}

export async function verifyGoogleCredential(credential: string, audience: string): Promise<GoogleIdClaims> {
  const { payload } = await jwtVerify(credential, googleSigningKeys, {
    issuer: GOOGLE_ISSUERS,
    audience,
  })
  return payload as GoogleIdClaims
}
