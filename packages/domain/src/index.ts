export * from './calendar'
export * from './nutrition'
export * from './streak'

/** Stable identity so a cloud build can prove this package was bundled. */
export const DOMAIN_PACKAGE_ID = '@fud-ai/domain' as const
