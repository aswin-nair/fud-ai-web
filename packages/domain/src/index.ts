export * from './calendar'
export * from './nutrition'
export * from './streak'
export * from './meals'
export * from './freezes'
export * from './notifications'
export * from './xp'
export * from './quests'

/** Stable identity so a cloud build can prove this package was bundled. */
export const DOMAIN_PACKAGE_ID = '@fud-ai/domain' as const
