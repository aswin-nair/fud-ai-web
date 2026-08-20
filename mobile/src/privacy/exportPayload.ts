export const EXPORT_SCHEMA_VERSION = 1 as const

export const SECRET_KEY_PATTERN =
  /apiKey|api_key|appLock|app-lock|password|bearer|token|secureStore|installID|proxyEndpoint/i

export type ExportProfile = {
  name: string
  dateOfBirth: string
  sex: string
  heightCm: number
  weightKg: number
  activityLevel: string
  goal: string
  weeklyRatePct: number
  timezone: string
  dailyKcalTarget: number
  proteinGTarget: number
  carbsGTarget: number
  fatGTarget: number
}

export type ExportSettings = {
  soundEnabled: boolean
  hapticsEnabled: boolean
  trackingPaused: boolean
}

export type ExportFood = {
  id: number
  name: string
  brand: string | null
  servingLabel: string
  servingGrams: number | null
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
  source: string
  isFavorite: boolean
}

export type ExportMeal = {
  id: number
  foodId: number | null
  customName: string | null
  servings: number
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
  mealSlot: string
  loggedAtUtc: string
  localDate: string
}

export type LocalExport = {
  schemaVersion: typeof EXPORT_SCHEMA_VERSION
  app: 'fud-ai-mobile'
  exportedAt: string
  profile: ExportProfile | null
  settings: ExportSettings | null
  foods: ExportFood[]
  meals: ExportMeal[]
  weight: []
  exercise: []
  points: { delta: number; reason: string; localDate: string }[]
  quests: { localDate: string; type: string; target: number; progress: number }[]
  freezes: { grantedLocalDate: string; consumedLocalDate: string | null }[]
}

export type ExportSource = {
  exportedAt?: string
  profile: (ExportProfile & ExportSettings) | null
  foods: ExportFood[]
  meals: ExportMeal[]
  points: LocalExport['points']
  quests: LocalExport['quests']
  freezes: LocalExport['freezes']
}

export function buildLocalExport(source: ExportSource): LocalExport {
  const profile = source.profile
    ? {
        name: source.profile.name,
        dateOfBirth: source.profile.dateOfBirth,
        sex: source.profile.sex,
        heightCm: source.profile.heightCm,
        weightKg: source.profile.weightKg,
        activityLevel: source.profile.activityLevel,
        goal: source.profile.goal,
        weeklyRatePct: source.profile.weeklyRatePct,
        timezone: source.profile.timezone,
        dailyKcalTarget: source.profile.dailyKcalTarget,
        proteinGTarget: source.profile.proteinGTarget,
        carbsGTarget: source.profile.carbsGTarget,
        fatGTarget: source.profile.fatGTarget,
      }
    : null

  const settings = source.profile
    ? {
        soundEnabled: source.profile.soundEnabled,
        hapticsEnabled: source.profile.hapticsEnabled,
        trackingPaused: source.profile.trackingPaused,
      }
    : null

  return {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    app: 'fud-ai-mobile',
    exportedAt: source.exportedAt ?? new Date().toISOString(),
    profile,
    settings,
    foods: source.foods.filter((food) => food.source === 'custom'),
    meals: source.meals,
    weight: [],
    exercise: [],
    points: source.points,
    quests: source.quests,
    freezes: source.freezes,
  }
}

export function serializeLocalExport(payload: LocalExport): string {
  return `${JSON.stringify(payload, null, 2)}\n`
}

export function secretKeysInExport(json: string): string[] {
  const matches = json.match(new RegExp(SECRET_KEY_PATTERN.source, 'gi')) ?? []
  return [...new Set(matches)]
}
