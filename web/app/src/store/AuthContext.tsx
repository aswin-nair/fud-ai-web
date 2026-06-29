import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

import type { CredentialResponse } from '@react-oauth/google'

import { jwtDecode } from 'jwt-decode'

import type { AuthUser, GoogleJwtPayload } from '../lib/auth'

import { loadAuthSession, saveAuthSession } from '../lib/auth'

import { googleAccount, loginAccount, logoutAccount, registerAccount } from '../lib/authService'

import { isCloudBackend } from '../lib/dataBackend'



interface AuthContextValue {

  user: AuthUser | null

  signInWithGoogle: (response: CredentialResponse) => Promise<void>

  signInWithEmail: (email: string, password: string) => Promise<void>

  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>

  signOut: () => void

}



const AuthContext = createContext<AuthContextValue | null>(null)



function persistUser(user: AuthUser, setUser: (u: AuthUser) => void) {

  saveAuthSession(user)

  setUser(user)

}



export function AuthProvider({ children }: { children: ReactNode }) {

  const cloud = isCloudBackend()

  const [user, setUser] = useState<AuthUser | null>(() => loadAuthSession())



  const signInWithGoogle = useCallback(async (response: CredentialResponse) => {

    if (!response.credential) return

    if (cloud) {

      const next = await googleAccount(response.credential, true)

      persistUser(next, setUser)

      return

    }

    const decoded = jwtDecode<GoogleJwtPayload>(response.credential)

    persistUser({

      sub: decoded.sub,

      email: decoded.email,

      name: decoded.name,

      picture: decoded.picture,

      provider: 'google',

    }, setUser)

  }, [cloud])



  const signInWithEmail = useCallback(async (email: string, password: string) => {

    const next = await loginAccount(email, password, cloud)

    persistUser(next, setUser)

  }, [cloud])



  const signUpWithEmail = useCallback(async (name: string, email: string, password: string) => {

    const next = await registerAccount(name, email, password, cloud)

    persistUser(next, setUser)

  }, [cloud])



  const signOut = useCallback(() => {

    logoutAccount(cloud)

    setUser(null)

  }, [cloud])



  const value = useMemo(() => ({

    user,

    signInWithGoogle,

    signInWithEmail,

    signUpWithEmail,

    signOut,

  }), [user, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut])



  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>

}



export function useAuth() {

  const ctx = useContext(AuthContext)

  if (!ctx) throw new Error('useAuth must be used within AuthProvider')

  return ctx

}

