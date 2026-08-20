import { vi } from 'vitest'

export interface CapturedResponse {
  statusCode: number | null
  body: unknown
  headers: Map<string, string>
  setHeader: ReturnType<typeof vi.fn>
  status: (code: number) => CapturedResponse
  json: (body: unknown) => CapturedResponse
}

export function response(): CapturedResponse {
  const headers = new Map<string, string>()
  return {
    statusCode: null,
    body: null,
    headers,
    setHeader: vi.fn((name: string, value: string) => {
      headers.set(name.toLowerCase(), String(value))
    }),
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.body = body
      return this
    },
  }
}

export function stateFixture(apiKey = ''): Record<string, unknown> {
  return {
    onboarded: false,
    profile: {
      gender: 'male',
      birthday: '1996-04-12',
      heightCm: 175,
      weightKg: 70,
      activityLevel: 'moderate',
      goal: 'maintain',
      weeklyChangeKg: 0.5,
      soundEnabled: true,
      hapticsEnabled: true,
      trackingPaused: false,
    },
    foodEntries: [],
    weightEntries: [],
    exerciseEntries: [],
    favoriteMeals: [],
    chatMessages: [],
    aiSettings: { provider: 'openrouter', apiKey, model: 'google/gemini-2.0-flash-001' },
    gamification: {
      xp: 0,
      level: 1,
      streakFreezes: 1,
      freezeUsedDates: [],
      freezeEarnedMonth: '2026-08',
      pauseStartedDate: null,
      pauseProtectedDates: [],
      xpEvents: [],
      awardedKeys: [],
      pendingLevelUp: null,
      seenBadgeIds: [],
    },
  }
}
