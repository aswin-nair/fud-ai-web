let accessToken: string | null = null
let activeUserId: string | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

export function setActiveUserId(userId: string | null): void {
  activeUserId = userId
}

export function getActiveUserId(): string | null {
  return activeUserId
}

export function clearMemorySession(): void {
  accessToken = null
  activeUserId = null
}
