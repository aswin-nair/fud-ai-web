import { GoogleOAuthProvider } from '@react-oauth/google'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { googleClientId, isGoogleAuthConfigured } from './lib/auth'
import { AuthProvider, useAuth } from './store/AuthContext'
import { AppProvider, useApp } from './store/AppContext'
import { ToastProvider } from './components/Toast'
import { LoginPage } from './pages/LoginPage'
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
import { AboutPage } from './pages/AboutPage'

function routerBasename(): string | undefined {
  const base = import.meta.env.BASE_URL
  if (!base || base === '/') return undefined
  return base.endsWith('/') ? base.slice(0, -1) : base
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
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/progress" element={<ProgressPage />} />
      <Route path="/coach" element={<CoachPage />} />
      <Route path="/log" element={<LogMenuPage />} />
      <Route path="/log/text" element={<LogTextPage />} />
      <Route path="/log/photo" element={<PhotoLogPage />} />
      <Route path="/log/saved" element={<SavedMealsPage />} />
      <Route path="/log/manual" element={<ManualEntryPage />} />
      <Route path="/review" element={<ReviewFoodPage />} />
      <Route path="/edit/:id" element={<EditFoodPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function AppGate() {
  const { user } = useAuth()

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
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
