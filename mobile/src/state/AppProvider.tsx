import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AppState as NativeAppState } from 'react-native'
import { awardFreeze, awardLog, awardNote, awardWater, stampEntry } from './awards'
import { defaultProfile, freshState } from './defaults'
import { enqueueMutation, loadDurableAccount, saveDurableSnapshot } from './durable'
import { canInstallRemoteSnapshot } from './durablePolicy'
import { finalizeGuestClaim, guestUserId, stageGuestStateForAccount } from './guest'
import { LEGACY_IMPORT_NOTICE, importLegacySqlite } from './importer'
import { loggingStreak } from './journey'
import { loadPrivateAIKey, loadSessionTokens, savePrivateAIKey } from './secrets'
import { requestSnapshotDrain } from './sync'
import type { AppState, FoodEntry, SavedMeal, UserProfile } from './types'

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
  activateAccount: (accountId: string) => Promise<void>
  claimForAccount: (accountId: string) => Promise<boolean>
  finishClaim: (accountId: string) => Promise<void>
  replaceState: (next: AppState) => void
  resetLocalState: () => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState('guest:pending')
  const [state, setState] = useState<AppState>(freshState)
  const [ready, setReady] = useState(false)
  const [importNotice, setImportNotice] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const accountId = await loadSessionTokens()
        .then(session => session.accountId)
        .catch(() => null)
      const id = accountId ?? await guestUserId()
      setUserId(id)
      const existing = loadDurableAccount(id)
      if (existing) {
        const key = await loadPrivateAIKey(id)
        setState({ ...existing.state, aiSettings: { ...existing.state.aiSettings, apiKey: key } })
      } else if (id.startsWith('guest:')) {
        const imported = await importLegacySqlite()
        if (imported) {
          saveDurableSnapshot(id, imported)
          setState(imported)
          setImportNotice(LEGACY_IMPORT_NOTICE)
        } else {
          saveDurableSnapshot(id, freshState())
        }
      } else {
        const next = freshState()
        saveDurableSnapshot(id, next)
        setState(next)
      }
      setReady(true)
    })()
  }, [])

  const persist = useCallback((next: AppState, id = userId) => {
    setState(next)
    if (id.startsWith('guest:')) saveDurableSnapshot(id, next)
    else {
      enqueueMutation(id, next)
      void requestSnapshotDrain(id)
    }
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
    activateAccount: async (accountId) => {
      const account = loadDurableAccount(accountId)
      const next = account?.state ?? freshState()
      if (!account) saveDurableSnapshot(accountId, next)
      const key = await loadPrivateAIKey(accountId)
      setUserId(accountId)
      setState({ ...next, aiSettings: { ...next.aiSettings, apiKey: key } })
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
    resetLocalState: async () => {
      const id = await guestUserId()
      const next = freshState()
      setUserId(id)
      saveDurableSnapshot(id, next)
      setState(next)
    },
  }), [importNotice, persist, ready, state, userId])

  useEffect(() => {
    if (!ready || userId.startsWith('guest:')) return
    let cancelled = false
    const refresh = () => requestSnapshotDrain(userId).then(result => {
      const remote = result.remote
      if (!cancelled && remote && result.version !== undefined
        && canInstallRemoteSnapshot(loadDurableAccount(userId), result.version)) {
        saveDurableSnapshot(userId, remote, result.version)
        setState(current => ({
          ...remote,
          aiSettings: { ...remote.aiSettings, apiKey: current.aiSettings.apiKey },
        }))
      }
    })
    void refresh()
    const subscription = NativeAppState.addEventListener('change', next => {
      if (next === 'active') void refresh()
    })
    return () => {
      cancelled = true
      subscription.remove()
    }
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
