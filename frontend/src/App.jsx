import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Toaster, toast } from 'react-hot-toast'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import ExpensesPage from './pages/ExpensesPage'
import IncomePage from './pages/IncomePage'
import AnalyticsPage from './pages/AnalyticsPage'
import SettingsPage from './pages/SettingsPage'
import AdminPage from './pages/AdminPage'
import PlanningPage from './pages/PlanningPage'
import LoadingSpinner from './components/ui/LoadingSpinner'
import useAuthStore from './store/authStore'
import { getCurrentUser, logoutUser } from './services/authService'
import { supabase } from './services/supabase'
import { useTheme } from './context/theme'
import { storeDisplayPreferences } from './utils/currency'
import './App.css'

const ProtectedRoute = ({ children }) => {
  const token = useAuthStore((state) => state.token)
  return token ? children : <Navigate to="/auth" replace />
}

const AdminRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user)
  return user?.role === 'admin' ? children : <Navigate to="/" replace />
}

function App() {
  const { setTheme } = useTheme()
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const setToken = useAuthStore((state) => state.setToken)
  const logout = useAuthStore((state) => state.logout)
  const location = useLocation()
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    let active = true

    const restoreSession = async () => {
      const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } }
      if (!active) return
      setToken(data.session?.access_token || null)
      if (!data.session) logout()
      setCheckingSession(false)
    }

    restoreSession()
    const { data: listener } = supabase
      ? supabase.auth.onAuthStateChange((_event, session) => {
          setToken(session?.access_token || null)
          if (!session) logout()
        })
      : { data: { subscription: null } }

    return () => {
      active = false
      listener.subscription?.unsubscribe()
    }
  }, [setToken, logout])

  useEffect(() => {
    const fetchUser = async () => {
      if (!token || location.pathname === '/reset-password') {
        return
      }

      try {
        const response = await getCurrentUser()
        setUser(response.user)
        storeDisplayPreferences(response.user)
        if (response.user.theme) setTheme(response.user.theme)
      } catch {
        setToken(null)
        logout()
      }
    }

    fetchUser()
  }, [token, location.pathname, setUser, setToken, logout, setTheme])

  const currentTitle = useMemo(() => {
    const routeMap = {
      '/': 'Dashboard',
      '/expenses': 'Expenses',
      '/income': 'Income',
      '/analytics': 'Analytics',
      '/planning': 'Budgets & Recurring',
      '/settings': 'Settings',
      '/admin': 'Admin Dashboard',
    }
    return routeMap[location.pathname] || 'Dashboard'
  }, [location.pathname])

  const handleLogout = async () => {
    try {
      await logoutUser()
      toast.success('Logged out successfully')
    } catch (error) {
      toast.error(error.message)
    } finally {
      logout()
    }
  }

  if (location.pathname === '/reset-password') {
    return (
      <>
        <Routes>
          <Route path="/reset-password" element={<AuthPage />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </>
    )
  }

  if (!token) {
    return (
      <>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </>
    )
  }

  if (checkingSession || !user) {
    return <div className="app-loading"><LoadingSpinner size={36} /></div>
  }

  return (
    <div className="app-shell">
      <Sidebar user={user} onLogout={handleLogout} />
      <main className="main-panel">
        <Header title={currentTitle} user={user} />
        <div className="content-area">
          <Routes>
            <Route path="/" element={<ProtectedRoute>{user?.role === 'admin' ? <Navigate to="/admin" replace /> : <DashboardPage />}</ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute><ExpensesPage /></ProtectedRoute>} />
            <Route path="/income" element={<ProtectedRoute><IncomePage /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/planning" element={<ProtectedRoute><PlanningPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminPage /></AdminRoute></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
      <Toaster position="top-right" />
    </div>
  )
}

export default App
