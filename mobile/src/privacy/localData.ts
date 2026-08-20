import {
  DELETE_STORE_IDS,
  deletionSucceeded,
  runLocalDeletion,
  type DeleteStoreAdapter,
  type DeleteStoreId,
  type DeleteStoreResult,
} from '@/privacy/deletePlan'
import { buildLocalExport, serializeLocalExport, secretKeysInExport } from '@/privacy/exportPayload'
import { clearAppLockEnabled, isNativeAppLockPlatform } from '@/security/appLockNative'
import { useAppLockStore } from '@/security/appLockStore'
import { useDayStore } from '@/stores/dayStore'
import { useLogStore } from '@/stores/logStore'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useProfileStore } from '@/stores/profileStore'
import { useQuestStore } from '@/stores/questStore'
import { seedBuiltinFoods } from '@/db/seed'
import {
  deleteFoods,
  deleteFreezes,
  deleteMealEntries,
  deleteOnboardingDrafts,
  deletePoints,
  deleteProductEvents,
  deleteProfileRows,
  deleteQuests,
  loadExportSource,
} from '@/db/queries/localPrivacy'

export type ShareExportResult =
  | { ok: true; shared: boolean }
  | { ok: false; error: string }

export async function createReadableExport(): Promise<string> {
  const source = await loadExportSource()
  const json = serializeLocalExport(buildLocalExport(source))
  const leaked = secretKeysInExport(json)
  if (leaked.length > 0) {
    throw new Error('Export contained excluded fields')
  }
  return json
}

export async function shareReadableExport(): Promise<ShareExportResult> {
  try {
    const json = await createReadableExport()
    return shareJsonFile(json)
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Export failed',
    }
  }
}

export async function deleteAllLocalData(): Promise<{
  ok: boolean
  results: DeleteStoreResult[]
}> {
  const adapters: Record<DeleteStoreId, DeleteStoreAdapter> = {
    meal_entries: deleteMealEntries,
    points_ledger: deletePoints,
    streak_freezes: deleteFreezes,
    quests: deleteQuests,
    foods: deleteFoods,
    profile: deleteProfileRows,
    onboarding_drafts: deleteOnboardingDrafts,
    product_events: deleteProductEvents,
    app_lock: async () => {
      if (isNativeAppLockPlatform()) {
        await clearAppLockEnabled()
      }
      await useAppLockStore.getState().initialize(false)
    },
    memory: async () => {
      useProfileStore.setState({ profile: null, loading: false })
      useOnboardingStore.getState().reset()
      useLogStore.getState().reset()
      useDayStore.setState({
        entries: [],
        totals: { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, entryCount: 0 },
        streak: { count: 0, loggedToday: false, atRisk: false },
        points: 0,
        loading: false,
      })
      useQuestStore.setState({
        spec: null,
        title: '',
        progress: 0,
        complete: false,
        justCompleted: false,
      })
    },
    builtin_foods_reseed: async () => {
      await seedBuiltinFoods()
    },
  }

  const result = await runLocalDeletion(adapters)
  return {
    ok: deletionSucceeded(result.results) && result.ok,
    results: result.results,
  }
}

async function shareJsonFile(json: string): Promise<ShareExportResult> {
  const FileSystem = require('expo-file-system/legacy') as {
    cacheDirectory: string | null
    writeAsStringAsync: (uri: string, contents: string) => Promise<void>
  }
  const Sharing = require('expo-sharing') as {
    isAvailableAsync: () => Promise<boolean>
    shareAsync: (uri: string, options: { mimeType: string; dialogTitle: string }) => Promise<void>
  }

  const directory = FileSystem.cacheDirectory
  if (!directory) {
    return { ok: false, error: 'No cache directory is available on this device.' }
  }

  const uri = `${directory}fud-ai-export.json`
  await FileSystem.writeAsStringAsync(uri, json)

  if (!(await Sharing.isAvailableAsync())) {
    return { ok: true, shared: false }
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/json',
    dialogTitle: 'Export Fud AI data',
  })
  return { ok: true, shared: true }
}
