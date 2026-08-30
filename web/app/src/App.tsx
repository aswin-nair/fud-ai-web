import { useEffect } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { googleClientId, isGoogleAuthConfigured } from './lib/auth'
import { hasSeenAccount } from './lib/guestMode'
import { AuthProvider, useAuth } from './store/AuthContext'
import { AppProvider, useApp } from './store/AppContext'
import { ToastProvider } from './components/Toast'
import { LoginPage } from './pages/LoginPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { HomePage } from './pages/HomePage'
import { OnboardingPage } from './pages/OnboardingPage'
import { LogMenuPage } from './pages/LogMenuPage'
import { LogTextPage } from './pages/LogTextPage'
import { PhotoLogPage } from './pages/PhotoLogPage'
import { SavedMealsPage } from './pages/SavedMealsPage'
import { ReviewFoodPage } from './pages/ReviewFoodPage'
import { ManualEntryPage } from './pages/ManualEntryPage'
import { EditFoodPage } from './pages/EditFoodPage'
import { ProgressPage } from './pages/ProgressPage'
import { CoachPage } from './pages/CoachPage'
import { SettingsPage } from './pages/SettingsPage'
import { JourneyPage } from './pages/JourneyPage'
import { AboutPage } from './pages/AboutPage'
import { SupportPage } from './pages/SupportPage'
import { ComponentSheetPage } from './pages/ComponentSheetPage'
import { AnchorProvider } from './mascot/anchors'
import { MascotOverlay } from './mascot/MascotOverlay'
import type { ReactNode } from 'react'
import { useNavDirection } from './hooks/useNavDirection'

/** Client-side navigation keeps the browser's scroll offset by default; land each new page at the top. */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function routerBasename(): string | undefined {
  const base = import.meta.env.BASE_URL
  if (!base || base === '/') return undefined
  return base.endsWith('/') ? base.slice(0, -1) : base
}

/**
 * Carries the navigation direction down to the page as a class, so a screen
 * can slide in from the side the user came from. `display: contents` keeps the
 * wrapper out of layout entirely.
 */
function DirectionalRoutes({ children }: { children: ReactNode }) {
  const direction = useNavDirection()
  return <div className={`nav-dir nav-dir-${direction}`}>{children}</div>
}

function AuthenticatedRoutes() {
  const { state } = useApp()

  if (!state.onboarded) {
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    )
  }

  return (
    <AnchorProvider>
    <MascotOverlay />
    <DirectionalRoutes>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/progress" element={<ProgressPage />} />
      <Route path="/coach" element={<CoachPage />} />
      <Route path="/log" element={<LogMenuPage />} />
      <Route path="/log/text" element={<LogTextPage />} />
      <Route path="/log/photo" element={<PhotoLogPage />} />
      <Route path="/log/saved" element={<SavedMealsPage />} />
      <Route path="/discover" element={<SavedMealsPage />} />
      <Route path="/log/manual" element={<ManualEntryPage />} />
      <Route path="/review" element={<ReviewFoodPage />} />
      <Route path="/edit/:id" element={<EditFoodPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/support" element={<SupportPage />} />
      <Route path="/journey" element={<JourneyPage />} />
      {import.meta.env.DEV && <Route path="/dev/components" element={<ComponentSheetPage />} />}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </DirectionalRoutes>
    </AnchorProvider>
  )
}

function GuestRoutes() {
  const { state } = useApp()

  if (!state.onboarded) {
    // A device that has held an account belongs to someone coming back, not to a
    // first-time visitor. Sending them to onboarding would make them rebuild a
    // profile they already have, so the fallback becomes the login screen —
    // which also covers session expiry, not just an explicit sign-out.
    const fallback = hasSeenAccount() ? '/login' : '/onboarding'
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to={fallback} replace />} />
      </Routes>
    )
  }

  return (
    <AnchorProvider>
      <MascotOverlay />
      <Routes>
        <Route path="/" element={<HomePage guest />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnchorProvider>
  )
}

function AppGate() {
  const { user, sessionReady } = useAuth()

  if (!sessionReady) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1 className="login-title">Fud AI</h1>
          <p className="login-sub">Checking your session…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <AppProvider guest>
        <GuestRoutes />
      </AppProvider>
    )
  }

  return (
    <AppProvider key={user.sub}>
      <AuthenticatedRoutes />
    </AppProvider>
  )
}

function AppShell() {
  return (
    <AuthProvider>
      <BrowserRouter basename={routerBasename()}>
        <ScrollToTop />
        <ToastProvider>
          <AppGate />
        </ToastProvider>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default function App() {
  if (!isGoogleAuthConfigured()) {
    return <AppShell />
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AppShell />
    </GoogleOAuthProvider>
  )
}
