import { describe, expect, it } from 'vitest'

import {
  buildPersistedDraft,
  emptyOnboardingFields,
  inferOnboardingStep,
  restoreOnboardingDraft,
  resumeHref,
} from './onboardingDraft'

const eligible = {
  ...emptyOnboardingFields(),
  name: 'Ada',
  dateOfBirth: '1990-01-02',
  sex: 'female' as const,
  heightCm: 170,
  weightKg: 65,
}

describe('onboarding draft restore', () => {
  it('infers the next unfinished step', () => {
    expect(inferOnboardingStep(emptyOnboardingFields())).toBe('profile')
    expect(inferOnboardingStep(eligible)).toBe('activity')
    expect(inferOnboardingStep({ ...eligible, activityLevel: 'light' })).toBe('goal')
    expect(inferOnboardingStep({ ...eligible, activityLevel: 'light', goal: 'maintain' })).toBe(
      'review',
    )
    expect(inferOnboardingStep(eligible, true, false)).toBe('first-meal')
    expect(inferOnboardingStep(eligible, true, true)).toBe('welcome')
  })

  it('restores a valid schema-versioned draft', () => {
    const persisted = buildPersistedDraft({ ...eligible, activityLevel: 'light' })
    const restored = restoreOnboardingDraft(JSON.stringify(persisted))
    expect(restored.status).toBe('ok')
    if (restored.status === 'ok') {
      expect(restored.draft.step).toBe('goal')
      expect(restored.draft.name).toBe('Ada')
    }
  })

  it('quarantines incompatible or ineligible drafts instead of showing them', () => {
    expect(restoreOnboardingDraft('{"schemaVersion":2}')).toMatchObject({
      status: 'quarantine',
      reason: 'incompatible-schema',
    })
    expect(
      restoreOnboardingDraft(
        JSON.stringify(buildPersistedDraft({ ...eligible, dateOfBirth: '2018-01-01' })),
      ),
    ).toMatchObject({ status: 'quarantine', reason: 'ineligible-age' })
    expect(restoreOnboardingDraft('not-json')).toMatchObject({
      status: 'quarantine',
      reason: 'unreadable',
    })
  })

  it('sends a restored user back to the unfinished step', () => {
    const draft = buildPersistedDraft({ ...eligible, activityLevel: 'light' })
    expect(resumeHref({ profilePresent: false, firstLogRecorded: false, draft })).toBe(
      '/(onboarding)/goal',
    )
    expect(
      resumeHref({ profilePresent: true, firstLogRecorded: false, draft: null }),
    ).toBe('/log?firstMeal=1')
    expect(
      resumeHref({ profilePresent: true, firstLogRecorded: true, draft: null }),
    ).toBe('/(tabs)')
  })
})
