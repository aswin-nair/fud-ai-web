export function stagingLifecyclePlan(env = process.env) {
  const url = (env.STAGING_BASE_URL ?? '').trim()
  if (!url) {
    return {
      run: false,
      certified: false,
      reason: 'STAGING_BASE_URL is not set; cloud lifecycle is not certified',
    }
  }
  try {
    const parsed = new URL(url)
    const local = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
    if (parsed.protocol === 'https:' || (parsed.protocol === 'http:' && local)) {
      return { run: true, certified: false, baseUrl: url.replace(/\/$/, '') }
    }
  } catch {
    return {
      run: false,
      certified: false,
      reason: 'STAGING_BASE_URL is not a valid URL; cloud lifecycle is not certified',
    }
  }
  return {
    run: false,
    certified: false,
    reason: 'STAGING_BASE_URL must be an https origin (or http localhost)',
  }
}

export function stagingAccount(id = crypto.randomUUID()) {
  return {
    name: 'Staging Probe',
    email: `staging-${id}@fud-ai-staging.test`,
    password: `Stg-${id.replaceAll('-', '').slice(0, 16)}Aa1`,
  }
}

export function stagingState() {
  return {
    onboarded: false,
    profile: {
      gender: 'male',
      birthday: '1996-04-12',
      heightCm: 175,
      weightKg: 70,
      activityLevel: 'moderate',
      goal: 'maintain',
      weeklyChangeKg: 0.5,
      soundEnabled: true,
      hapticsEnabled: true,
      trackingPaused: false,
    },
    foodEntries: [],
    weightEntries: [],
    exerciseEntries: [],
    favoriteMeals: [],
    chatMessages: [],
    aiSettings: { provider: 'openrouter', apiKey: '', model: 'google/gemini-2.0-flash-001' },
    gamification: {
      xp: 0,
      level: 1,
      streakFreezes: 1,
      freezeUsedDates: [],
      freezeEarnedMonth: '2026-08',
      pauseStartedDate: null,
      pauseProtectedDates: [],
      xpEvents: [],
      awardedKeys: [],
      pendingLevelUp: null,
      seenBadgeIds: [],
    },
  }
}

async function readJson(res) {
  const text = await res.text()
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    return { raw: text }
  }
}

export async function runStagingLifecycle(baseUrl, fetchImpl = fetch) {
  const account = stagingAccount()
  let token = ''
  const steps = []

  async function call(step, path, init = {}) {
    const headers = new Headers(init.headers)
    if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
    if (token) headers.set('Authorization', `Bearer ${token}`)
    const res = await fetchImpl(`${baseUrl}${path}`, { ...init, headers })
    const body = await readJson(res)
    const serialized = JSON.stringify(body)
    if (/postgres(ql)?:\/\//i.test(serialized) || /DATABASE_URL/i.test(serialized)) {
      throw new Error(`${step} leaked a database address`)
    }
    steps.push({ step, status: res.status })
    return { res, body }
  }

  async function cleanup() {
    if (!token) return
    try {
      await call('cleanup-delete', '/api/account', {
        method: 'DELETE',
        body: JSON.stringify({ confirmation: 'DELETE' }),
      })
    } catch {
      // Cleanup must not hide the original failure.
    }
  }

  try {
    const health = await call('health', '/api/health')
    if (health.res.status !== 200 || health.body.live !== true) {
      throw new Error('Liveness check failed')
    }

    const ready = await call('ready', '/api/ready')
    if (ready.res.status !== 200 || ready.body.ready !== true) {
      throw new Error('Readiness check failed')
    }

    const registered = await call('register', '/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(account),
    })
    if (registered.res.status !== 201 || typeof registered.body.token !== 'string') {
      throw new Error('Registration failed')
    }
    token = registered.body.token

    const login = await call('login', '/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: account.email, password: account.password }),
    })
    if (login.res.status !== 200 || typeof login.body.token !== 'string') {
      throw new Error('Login failed')
    }
    token = login.body.token

    const initial = await call('initial-state', '/api/state')
    if (initial.res.status !== 200 || !Number.isSafeInteger(initial.body.version)) {
      throw new Error('Initial state load failed')
    }

    const mutationId = crypto.randomUUID()
    const state = stagingState()
    const firstWrite = await call('first-write', '/api/state', {
      method: 'PUT',
      body: JSON.stringify({
        state,
        baseVersion: initial.body.version,
        mutationId,
      }),
    })
    if (firstWrite.res.status !== 200 || !Number.isSafeInteger(firstWrite.body.version)) {
      throw new Error('First write failed')
    }

    const replay = await call('idempotent-replay', '/api/state', {
      method: 'PUT',
      body: JSON.stringify({
        state,
        baseVersion: initial.body.version,
        mutationId,
      }),
    })
    if (replay.res.status !== 200 || replay.body.version !== firstWrite.body.version) {
      throw new Error('Idempotent replay did not return the original version')
    }

    const stale = await call('stale-version', '/api/state', {
      method: 'PUT',
      body: JSON.stringify({
        state,
        baseVersion: 0,
        mutationId: crypto.randomUUID(),
      }),
    })
    if (stale.res.status !== 409) {
      throw new Error('Stale version was not rejected')
    }

    const retrieved = await call('retrieve-state', '/api/state')
    if (retrieved.res.status !== 200 || retrieved.body.version !== firstWrite.body.version) {
      throw new Error('Saved state was not retrieved')
    }

    const logout = await call('logout', '/api/auth/logout', { method: 'POST' })
    if (logout.res.status !== 200) throw new Error('Logout failed')

    const afterLogout = await call('login-after-logout', '/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: account.email, password: account.password }),
    })
    if (afterLogout.res.status !== 200 || typeof afterLogout.body.token !== 'string') {
      throw new Error('Login after logout failed')
    }
    token = afterLogout.body.token

    const logoutAll = await call('logout-all', '/api/auth/logout-all', { method: 'POST' })
    if (logoutAll.res.status !== 200) throw new Error('Logout-all failed')

    const afterLogoutAll = await call('login-after-logout-all', '/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: account.email, password: account.password }),
    })
    if (afterLogoutAll.res.status !== 200 || typeof afterLogoutAll.body.token !== 'string') {
      throw new Error('Login after logout-all failed')
    }
    token = afterLogoutAll.body.token

    const deleted = await call('delete-account', '/api/account', {
      method: 'DELETE',
      body: JSON.stringify({ confirmation: 'DELETE' }),
    })
    if (deleted.res.status !== 200) throw new Error('Account deletion failed')
    token = ''

    const rejected = await call('login-after-delete', '/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: account.email, password: account.password }),
    })
    if (rejected.res.status !== 401) {
      throw new Error('Login after deletion was not rejected')
    }

    return { certified: true, steps }
  } catch (error) {
    await cleanup()
    throw error
  }
}
