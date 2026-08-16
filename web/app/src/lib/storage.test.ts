import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AppState } from '../types'
import {
  exportData,
  freshState,
  importData,
  loadPrivateAIKey,
  saveState,
} from './storage'

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

function stateWithKey(): AppState {
  return {
    ...freshState(),
    aiSettings: {
      ...freshState().aiSettings,
      apiKey: 'sk-private-test-value',
    },
  }
}

describe('private BYOK storage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
  })

  it('keeps API keys out of the persisted application-state blob', () => {
    saveState('user-1', stateWithKey())

    expect(loadPrivateAIKey('user-1')).toBe('sk-private-test-value')
    expect(localStorage.getItem('fud-ai-web-state-user-1')).not.toContain('sk-private-test-value')
  })

  it('keeps API keys out of exports', () => {
    expect(exportData(stateWithKey())).not.toContain('sk-private-test-value')
  })

  it('does not accept an API key from an imported backup', () => {
    const imported = importData(JSON.stringify(stateWithKey()), 'device-only-key')
    expect(imported.aiSettings.apiKey).toBe('device-only-key')
  })

  it('refuses an imported goal weight below BMI 18.5', () => {
    const state = freshState()
    state.profile = { ...state.profile, heightCm: 180, goalWeightKg: 55 }

    expect(() => importData(JSON.stringify(state))).toThrow(/healthy weight/i)
  })
})
