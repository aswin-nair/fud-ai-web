import type { AuthUser } from './auth'
import { saveAuthSession, clearAuthSession } from './auth'
import { apiGoogleAuth, apiLogin, apiRegister, clearAuthToken, saveAuthToken } from './apiClient'
import { registerWithEmail, loginWithEmail } from './localAuth'

export async function registerAccount(
  name: string,
  email: string,
  password: string,
  cloud: boolean,
): Promise<AuthUser> {
  if (cloud) {
    const { token, user } = await apiRegister(name, email, password)
    saveAuthToken(token)
    saveAuthSession(user)
    return user
  }
  const user = await registerWithEmail(name, email, password)
  saveAuthSession(user)
  return user
}

export async function loginAccount(
  email: string,
  password: string,
  cloud: boolean,
): Promise<AuthUser> {
  if (cloud) {
    const { token, user } = await apiLogin(email, password)
    saveAuthToken(token)
    saveAuthSession(user)
    return user
  }
  const user = await loginWithEmail(email, password)
  saveAuthSession(user)
  return user
}

export async function googleAccount(credential: string, cloud: boolean): Promise<AuthUser> {
  if (cloud) {
    const { token, user } = await apiGoogleAuth(credential)
    saveAuthToken(token)
    saveAuthSession(user)
    return user
  }
  throw new Error('Google sign-in requires cloud backend')
}

export function logoutAccount(cloud: boolean): void {
  clearAuthSession()
  if (cloud) clearAuthToken()
}
