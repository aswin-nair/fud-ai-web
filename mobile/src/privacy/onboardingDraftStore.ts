import {
  deleteOnboardingDrafts,
  loadOnboardingDraftRow,
  saveOnboardingDraftRow,
} from '@/db/queries/localPrivacy'
import {
  buildPersistedDraft,
  restoreOnboardingDraft,
  type OnboardingDraftFields,
} from '@/privacy/onboardingDraft'

export async function persistOnboardingDraft(
  fields: OnboardingDraftFields,
  options: { profilePresent?: boolean; firstLogRecorded?: boolean } = {},
): Promise<void> {
  const draft = buildPersistedDraft(fields, options)
  await saveOnboardingDraftRow({
    schemaVersion: draft.schemaVersion,
    step: draft.step,
    payload: JSON.stringify(draft),
    updatedAt: draft.updatedAt,
    quarantined: false,
  })
}

export async function persistQuarantinedDraft(raw: string, reason: string): Promise<void> {
  await saveOnboardingDraftRow({
    schemaVersion: 0,
    step: 'welcome',
    payload: JSON.stringify({ reason, raw }),
    updatedAt: new Date().toISOString(),
    quarantined: true,
  })
}

export async function loadRestoredOnboardingDraft(): Promise<OnboardingDraftFields | null> {
  const row = await loadOnboardingDraftRow()
  if (!row || row.quarantined) return null

  const restored = restoreOnboardingDraft(row.payload)
  if (restored.status === 'ok') {
    const { schemaVersion: _schema, step: _step, updatedAt: _updated, ...fields } = restored.draft
    return fields
  }

  if (restored.status === 'quarantine') {
    await persistQuarantinedDraft(restored.raw, restored.reason)
  }

  return null
}

export async function clearPersistedOnboardingDraft(): Promise<void> {
  await deleteOnboardingDrafts()
}
