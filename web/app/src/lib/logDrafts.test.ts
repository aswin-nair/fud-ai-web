import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { FoodAnalysis } from '../types'
import {
  clearLogDraft,
  isSafeFoodAnalysis,
  loadLogDrafts,
  logDraftStorageKeys,
  saveManualLogDraft,
  saveReviewLogDraft,
  saveTextLogDraft,
} from './logDrafts'

function memoryStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() { return values.size },
    clear: () => values.clear(),
    getItem: key => values.get(key) ?? null,
    key: index => [...values.keys()][index] ?? null,
    removeItem: key => { values.delete(key) },
    setItem: (key, value) => { values.set(key, value) },
  }
}

const analysis: FoodAnalysis = {
  name: 'Rice bowl', calories: 520, protein: 21, carbs: 78, fat: 14, servingSizeGrams: 430,
}

describe('food logging drafts', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-20T12:00:00.000Z'))
  })

  it('keeps drafts isolated by account and never stores a photo or API key field', () => {
    saveTextLogDraft('person-a', 'oatmeal and berries')
    saveManualLogDraft('person-b', {
      name: 'Soup', calories: '250', protein: '8', carbs: '30', fat: '9', mealType: 'lunch', servings: 1,
    })

    expect(loadLogDrafts('person-a').text?.text).toBe('oatmeal and berries')
    expect(loadLogDrafts('person-a').manual).toBeUndefined()
    expect(JSON.stringify(loadLogDrafts('person-b'))).not.toMatch(/apiKey|base64|photo/i)
  })

  it('restores a validated review draft with its stable source and serving state', () => {
    saveReviewLogDraft('person-a', {
      analysis,
      baseAnalysis: analysis,
      mealType: 'dinner',
      servings: 1.5,
      source: 'textInput',
      emptyNumericFields: ['fat'],
    })

    expect(loadLogDrafts('person-a').review).toMatchObject({
      analysis,
      mealType: 'dinner',
      servings: 1.5,
      source: 'textInput',
      emptyNumericFields: ['fat'],
    })
  })

  it('quarantines malformed draft data instead of hydrating it', () => {
    const [key, recovery] = logDraftStorageKeys('person-a')
    localStorage.setItem(key, JSON.stringify({ version: 1, review: { analysis: { calories: -1 } } }))

    expect(loadLogDrafts('person-a')).toEqual({ version: 1 })
    expect(localStorage.getItem(key)).toBeNull()
    expect(localStorage.getItem(recovery)).toContain('"calories":-1')
  })

  it('clears both active and recovery data during an explicit full clear', () => {
    saveTextLogDraft('person-a', 'draft')
    const [, recovery] = logDraftStorageKeys('person-a')
    localStorage.setItem(recovery, 'old-corrupt-data')

    clearLogDraft('person-a')

    expect(logDraftStorageKeys('person-a').map(key => localStorage.getItem(key))).toEqual([null, null])
  })

  it.each([
    { ...analysis, calories: Number.NaN },
    { ...analysis, protein: Number.POSITIVE_INFINITY },
    { ...analysis, carbs: -1 },
    { ...analysis, name: '   ' },
  ])('rejects unsafe analysis input %#', candidate => {
    expect(isSafeFoodAnalysis(candidate)).toBe(false)
  })
})
