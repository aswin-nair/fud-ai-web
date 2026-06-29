import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import type {

  AppState, FoodEntry, UserProfile, AISettings, FoodAnalysis,

  WeightEntry, ChatMessage, SavedMeal,

} from '../types'

import { loadState, saveState, clearUserState, freshState, importData } from '../lib/storage'

import { mealKey, entryToSaved, savedToEntry } from '../lib/meals'

import { useAuth } from './AuthContext'

import { apiLoadState, apiSaveState } from '../lib/apiClient'

import { isCloudBackend } from '../lib/dataBackend'



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

  toggleFavorite: (entry: FoodEntry) => void

  logSavedMeal: (meal: SavedMeal) => void

  addChatMessage: (msg: ChatMessage) => void

  clearChat: () => void

  replaceState: (state: AppState) => void

  clearAllData: () => void

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

  const [loading, setLoading] = useState(cloud)

  const [pendingAnalysis, setPendingAnalysis] = useState<FoodAnalysis | null>(null)

  const [pendingSource, setPendingSource] = useState<FoodEntry['source']>('textInput')

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hydrated = useRef(false)



  useEffect(() => {

    let cancelled = false

    hydrated.current = false

    setPendingAnalysis(null)



    async function hydrate() {

      if (cloud) {

        setLoading(true)

        try {

          const remote = await apiLoadState()

          if (!cancelled && remote) {

            setState(importData(JSON.stringify(remote)))

          } else if (!cancelled) {

            setState(freshState())

          }

        } catch {

          if (!cancelled) setState(freshState())

        } finally {

          if (!cancelled) {

            setLoading(false)

            hydrated.current = true

          }

        }

      } else {

        setState(loadState(userId))

        hydrated.current = true

        setLoading(false)

      }

    }



    hydrate()

    return () => { cancelled = true }

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

    addEntry: (entry) => setState(s => ({

      ...s,

      foodEntries: [...s.foodEntries, entry],

      profile: { ...s.profile, weightKg: s.profile.weightKg },

    })),

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

            : [...s.favoriteMeals, entryToSaved(entry)],

        }

      })

    },

    logSavedMeal: (meal) => setState(s => ({

      ...s,

      foodEntries: [...s.foodEntries, savedToEntry(meal)],

    })),

    addChatMessage: (msg) => setState(s => ({

      ...s,

      chatMessages: [...s.chatMessages, msg],

    })),

    clearChat: () => setState(s => ({ ...s, chatMessages: [] })),

    replaceState: (next) => setState(next),

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

    return (

      <div className="app-shell" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>

        <div className="loading-spinner" aria-label="Loading your data" />

      </div>

    )

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

