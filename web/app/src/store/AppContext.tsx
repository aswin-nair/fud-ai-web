import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import type {

  AppState, FoodEntry, UserProfile, AISettings, FoodAnalysis,

  WeightEntry, ChatMessage, SavedMeal, ExerciseEntry,

} from '../types'

import { loadState, saveState, clearUserState, freshState, importData } from '../lib/storage'

import { mealKey, entryToSaved, savedToEntry } from '../lib/meals'

import { useAuth } from './AuthContext'

import { apiLoadState, apiSaveState } from '../lib/apiClient'

import { isCloudBackend } from '../lib/dataBackend'

import { levelFromXp } from '../lib/xp'

import { advanceAfterLog, openSession } from '../lib/gamification'

import { SplashScreen } from '../components/SplashScreen'

const MIN_SPLASH_MS = 1100

const SPLASH_EXIT_MS = 320

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}



interface AppContextValue {

  state: AppState

  loading: boolean

  setOnboarded: (v: boolean) => void

  updateProfile: (profile: UserProfile) => void

  updateAISettings: (settings: AISettings) => void

  addEntry: (entry: FoodEntry) => void

  updateEntry: (entry: FoodEntry) => void

  deleteEntry: (id: string) => void

  addWeightEntry: (weightKg: number, date?: string) => void

  deleteWeightEntry: (id: string) => void

  toggleFavorite: (entry: FoodEntry | SavedMeal) => void

  logSavedMeal: (meal: SavedMeal) => void

  addChatMessage: (msg: ChatMessage) => void

  clearChat: () => void

  replaceState: (state: AppState) => void

  clearAllData: () => void

  ackLevelUp: () => void

  addExercise: (entry: ExerciseEntry) => void

  deleteExercise: (id: string) => void

  pendingAnalysis: FoodAnalysis | null

  setPendingAnalysis: (a: FoodAnalysis | null) => void

  pendingSource: FoodEntry['source']

  setPendingSource: (s: FoodEntry['source']) => void

}



const AppContext = createContext<AppContextValue | null>(null)



export function AppProvider({ children }: { children: ReactNode }) {

  const { user } = useAuth()

  const cloud = isCloudBackend()

  const userId = user!.sub

  const [state, setState] = useState<AppState>(() => (cloud ? freshState() : loadState(userId)))

  const [loading, setLoading] = useState(true)

  const [splashExiting, setSplashExiting] = useState(false)

  const [pendingAnalysis, setPendingAnalysis] = useState<FoodAnalysis | null>(null)

  const [pendingSource, setPendingSource] = useState<FoodEntry['source']>('textInput')

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hydrated = useRef(false)



  useEffect(() => {

    let cancelled = false

    hydrated.current = false

    setPendingAnalysis(null)

    setSplashExiting(false)

    if (exitTimer.current) clearTimeout(exitTimer.current)



    async function hydrate() {

      const minTime = delay(MIN_SPLASH_MS)

      let hydration: Promise<void>

      if (cloud) {

        hydration = (async () => {

          try {

            const remote = await apiLoadState()

            if (!cancelled && remote) {

              setState(importData(JSON.stringify(remote)))

            } else if (!cancelled) {

              setState(freshState())

            }

          } catch {

            if (!cancelled) setState(freshState())

          }

        })()

      } else {

        hydration = Promise.resolve(setState(loadState(userId)))

      }

      await Promise.all([hydration, minTime])

      if (cancelled) return

      hydrated.current = true

      setState(s => {
        const opened = openSession(s)
        return { ...s, gamification: opened.gamification }
      })

      // Play the splash's fade/scale-out transition before unmounting it.

      setSplashExiting(true)

      exitTimer.current = setTimeout(() => {

        if (!cancelled) {

          setLoading(false)

          setSplashExiting(false)

        }

      }, SPLASH_EXIT_MS)

    }



    hydrate()

    return () => {

      cancelled = true

      if (exitTimer.current) clearTimeout(exitTimer.current)

    }

  }, [userId, cloud])



  useEffect(() => {

    if (!hydrated.current) return



    if (cloud) {

      if (saveTimer.current) clearTimeout(saveTimer.current)

      saveTimer.current = setTimeout(() => {

        apiSaveState(state).catch(err => console.error('Failed to sync state', err))

      }, 500)

      return () => {

        if (saveTimer.current) clearTimeout(saveTimer.current)

      }

    }



    saveState(userId, state)

  }, [userId, state, cloud])



  useEffect(() => {

    if (user?.name && !state.profile.name && hydrated.current) {

      setState(s => ({ ...s, profile: { ...s.profile, name: user.name } }))

    }

  }, [user?.name, state.profile.name])



  const value = useMemo<AppContextValue>(() => ({

    state,

    loading,

    setOnboarded: (v) => setState(s => ({ ...s, onboarded: v })),

    updateProfile: (profile) => setState(s => ({ ...s, profile })),

    updateAISettings: (aiSettings) => setState(s => ({ ...s, aiSettings })),

    addEntry: (entry) => setState(s => {
      const advanced = advanceAfterLog(s, entry)
      return {
        ...s,
        foodEntries: [...s.foodEntries, entry],
        gamification: advanced.gamification,
      }
    }),

    updateEntry: (entry) => setState(s => ({

      ...s,

      foodEntries: s.foodEntries.map(e => e.id === entry.id ? entry : e),

    })),

    deleteEntry: (id) => setState(s => ({

      ...s,

      foodEntries: s.foodEntries.filter(e => e.id !== id),

    })),

    addWeightEntry: (weightKg, date) => {

      const entry: WeightEntry = {

        id: crypto.randomUUID(),

        date: date ?? new Date().toISOString(),

        weightKg,

      }

      setState(s => ({

        ...s,

        weightEntries: [...s.weightEntries, entry],

        profile: { ...s.profile, weightKg },

      }))

    },

    deleteWeightEntry: (id) => setState(s => ({

      ...s,

      weightEntries: s.weightEntries.filter(w => w.id !== id),

    })),

    toggleFavorite: (entry) => {

      const key = mealKey(entry)

      setState(s => {

        const exists = s.favoriteMeals.some(f => mealKey(f) === key)

        return {

          ...s,

          favoriteMeals: exists

            ? s.favoriteMeals.filter(f => mealKey(f) !== key)

            : [...s.favoriteMeals, 'timestamp' in entry ? entryToSaved(entry) : entry],

        }

      })

    },

    logSavedMeal: (meal) => setState(s => {
      const entry = savedToEntry(meal)
      const advanced = advanceAfterLog(s, entry)
      return { ...s, foodEntries: [...s.foodEntries, entry], gamification: advanced.gamification }
    }),

    addChatMessage: (msg) => setState(s => ({

      ...s,

      chatMessages: [...s.chatMessages, msg],

    })),

    clearChat: () => setState(s => ({ ...s, chatMessages: [] })),

    replaceState: (next) => setState(next),

    ackLevelUp: () => setState(s => ({
      ...s,
      gamification: { ...s.gamification, pendingLevelUp: null },
    })),

    addExercise: (entry: ExerciseEntry) => setState(s => {

      const earnedXp = 20
      const newXp = s.gamification.xp + earnedXp
      const newLevel = levelFromXp(newXp)
      const didLevelUp = newLevel > s.gamification.level
      const xpEvent = {
        id: crypto.randomUUID(),
        key: `exercise-${entry.id}`,
        xp: earnedXp,
        label: 'Exercise logged!',
        timestamp: new Date().toISOString(),
      }
      const alreadyAwarded = s.gamification.xpEvents.some(e => e.key === xpEvent.key)

      return {
        ...s,
        exerciseEntries: [...s.exerciseEntries, entry],
        gamification: {
          ...s.gamification,
          xp: alreadyAwarded ? s.gamification.xp : newXp,
          level: alreadyAwarded ? s.gamification.level : newLevel,
          pendingLevelUp: (!alreadyAwarded && didLevelUp) ? newLevel : s.gamification.pendingLevelUp,
          xpEvents: alreadyAwarded
            ? s.gamification.xpEvents
            : [xpEvent, ...s.gamification.xpEvents].slice(0, 50),
        },
      }

    }),

    deleteExercise: (id: string) => setState(s => ({

      ...s,

      exerciseEntries: s.exerciseEntries.filter(e => e.id !== id),

    })),

    clearAllData: () => {

      if (!cloud) clearUserState(userId)

      setState(freshState())

      setPendingAnalysis(null)

      if (cloud) {

        apiSaveState(freshState()).catch(err => console.error('Failed to clear remote state', err))

      }

    },

    pendingAnalysis,

    setPendingAnalysis,

    pendingSource,

    setPendingSource,

  }), [state, loading, pendingAnalysis, pendingSource, userId, cloud])



  if (loading) {

    return <SplashScreen exiting={splashExiting} />

  }



  return <AppContext.Provider value={value}>{children}</AppContext.Provider>

}



export function useApp() {

  const ctx = useContext(AppContext)

  if (!ctx) throw new Error('useApp must be used within AppProvider')

  return ctx

}

export function isFavorite(state: AppState, entry: FoodEntry): boolean {

  const key = mealKey(entry)

  return state.favoriteMeals.some(f => mealKey(f) === key)

}

