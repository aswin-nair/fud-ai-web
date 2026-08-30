import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { awardFreeze, awardLog, awardNote, awardWater, stampEntry } from './awards'
import { defaultProfile, freshState } from './defaults'
import { enqueueMutation, loadDurableAccount, saveDurableSnapshot } from './durable'
import { finalizeGuestClaim, guestUserId, stageGuestStateForAccount } from './guest'
import { LEGACY_IMPORT_NOTICE, importLegacySqlite } from './importer'
import { loggingStreak } from './journey'
import { loadPrivateAIKey, savePrivateAIKey } from './secrets'
import { drainSnapshot } from './sync'
import type { AppState, FoodEntry, SavedMeal, UserProfile, WeightEntry } from './types'

type AppContextValue = {
  userId: string
  guest: boolean
  ready: boolean
  importNotice: string | null
  state: AppState
  dismissImportNotice: () => void
  setProfile: (profile: Partial<UserProfile>) => void
  completeOnboarding: (profile: UserProfile) => void
  addEntry: (entry: FoodEntry) => FoodEntry
  updateEntry: (entry: FoodEntry) => void
  deleteEntry: (id: string) => void
  setWater: (date: string, glasses: number) => void
  addNote: (date: string) => void
  toggleFavorite: (meal: SavedMeal) => void
  addWeight: (weightKg: number) => void
  setMascotActivity: (activity: AppState['gamification']['mascotActivity']) => void
  setFeel: (soundEnabled: boolean, hapticsEnabled: boolean) => void
  setPaused: (paused: boolean) => void
  setAIKey: (apiKey: string) => void
  claimForAccount: (accountId: string) => Promise<boolean>
  finishClaim: (accountId: string) => Promise<void>
  replaceState: (next: AppState) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState('guest:pending')
  const [state, setState] = useState<AppState>(freshState)
  const [ready, setReady] = useState(false)
  const [importNotice, setImportNotice] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const id = await guestUserId()
      setUserId(id)
      const existing = loadDurableAccount(id)
      if (existing) {
        const key = await loadPrivateAIKey(id)
        setState({ ...existing.state, aiSettings: { ...existing.state.aiSettings, apiKey: key } })
      } else {
        const imported = await importLegacySqlite()
        if (imported) {
          saveDurableSnapshot(id, imported)
          setState(imported)
          setImportNotice(LEGACY_IMPORT_NOTICE)
        } else {
          saveDurableSnapshot(id, freshState())
        }
      }
      setReady(true)
    })()
  }, [])

  const persist = useCallback((next: AppState, id = userId) => {
    setState(next)
    if (id.startsWith('guest:')) saveDurableSnapshot(id, next)
    else enqueueMutation(id, next)
  }, [userId])

  const value = useMemo<AppContextValue>(() => ({
    userId,
    guest: userId.startsWith('guest:'),
    ready,
    importNotice,
    state,
    dismissImportNotice: () => setImportNotice(null),
    setProfile: (profile) => persist({ ...state, profile: { ...state.profile, ...profile } }),
    completeOnboarding: (profile) => persist({ ...state, onboarded: true, profile }),
    addEntry: (entry) => {
      const stamped = stampEntry(entry)
      const awarded = awardLog(state.gamification, stamped, state.foodEntries)
      const streak = loggingStreak([...state.foodEntries, stamped], awarded)
      persist({
        ...state,
        onboarded: true,
        foodEntries: [...state.foodEntries, stamped],
        gamification: awardFreeze(awarded, streak),
      })
      return stamped
    },
    updateEntry: (entry) => persist({
      ...state,
      foodEntries: state.foodEntries.map(item => item.id === entry.id ? stampEntry(entry) : item),
    }),
    deleteEntry: (id) => persist({
      ...state,
      foodEntries: state.foodEntries.filter(item => item.id !== id),
    }),
    setWater: (date, glasses) => persist({
      ...state,
      gamification: awardWater(state.gamification, date, glasses),
    }),
    addNote: (date) => persist({
      ...state,
      gamification: awardNote(state.gamification, date),
    }),
    toggleFavorite: (meal) => {
      const exists = state.favoriteMeals.some(item => item.id === meal.id || item.name === meal.name)
      persist({
        ...state,
        favoriteMeals: exists
          ? state.favoriteMeals.filter(item => item.id !== meal.id && item.name !== meal.name)
          : [...state.favoriteMeals, meal],
      })
    },
    addWeight: (weightKg) => persist({
      ...state,
      profile: { ...state.profile, weightKg },
      weightEntries: [...state.weightEntries, { id: crypto.randomUUID(), date: new Date().toISOString(), weightKg }],
    }),
    setMascotActivity: (mascotActivity) => persist({
      ...state,
      gamification: { ...state.gamification, mascotActivity },
    }),
    setFeel: (soundEnabled, hapticsEnabled) => persist({
      ...state,
      profile: { ...state.profile, soundEnabled, hapticsEnabled },
    }),
    setPaused: (trackingPaused) => persist({
      ...state,
      profile: { ...state.profile, trackingPaused },
    }),
    setAIKey: (apiKey) => {
      void savePrivateAIKey(userId, apiKey)
      persist({ ...state, aiSettings: { ...state.aiSettings, apiKey } })
    },
    claimForAccount: async (accountId) => {
      const staged = await stageGuestStateForAccount(accountId)
      if (staged) {
        setUserId(accountId)
        const account = loadDurableAccount(accountId)
        if (account) setState(account.state)
      }
      return staged
    },
    finishClaim: async (accountId) => {
      await finalizeGuestClaim(accountId)
    },
    replaceState: (next) => persist(next),
  }), [importNotice, persist, ready, state, userId])

  useEffect(() => {
    if (!ready || userId.startsWith('guest:')) return
    void drainSnapshot(userId).then(result => {
      if (result.remote) {
        saveDurableSnapshot(userId, result.remote, result.version)
        setState(result.remote)
      }
    })
  }, [ready, userId])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext)
  if (!value) throw new Error('useApp must be used inside AppProvider')
  return value
}

export function emptyProfile(): UserProfile {
  return defaultProfile()
}
