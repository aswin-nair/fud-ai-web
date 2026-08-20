import { describe, expect, it } from 'vitest'

import { FIRST_LOG_EVENT, shouldRecordNamedEvent } from './productEvents'

describe('product events', () => {
  it('records first_log only once', () => {
    expect(shouldRecordNamedEvent([], FIRST_LOG_EVENT)).toBe(true)
    expect(shouldRecordNamedEvent([FIRST_LOG_EVENT], FIRST_LOG_EVENT)).toBe(false)
  })
})
