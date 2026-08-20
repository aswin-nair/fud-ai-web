export type MobileAccountConfig = {
  apiBaseUrl: string
  mobileAuthEnabled: boolean
  entitySyncEnabled: boolean
}

export function readMobileAccountConfig(
  env: Record<string, string | undefined> = process.env,
): MobileAccountConfig {
  return {
    apiBaseUrl: (env.EXPO_PUBLIC_API_BASE_URL ?? '').trim().replace(/\/$/, ''),
    mobileAuthEnabled: env.EXPO_PUBLIC_ENABLE_MOBILE_AUTH?.trim().toLowerCase() === 'true',
    entitySyncEnabled: env.EXPO_PUBLIC_ENABLE_ENTITY_SYNC?.trim().toLowerCase() === 'true',
  }
}

export function accountServicesAvailable(config: MobileAccountConfig): boolean {
  return config.mobileAuthEnabled && /^https?:\/\//i.test(config.apiBaseUrl)
}
