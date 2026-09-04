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
import LoadingSpinner from './components/ui/LoadingSpinner'
import useAuthStore from './store/authStore'
import { getCurrentUser, logoutUser } from './services/authService'
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
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const setToken = useAuthStore((state) => state.setToken)
  const logout = useAuthStore((state) => state.logout)
  const location = useLocation()
  const [checkingSession, setCheckingSession] = useState(Boolean(token))

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        return
      }

      try {
        const response = await getCurrentUser()
        setUser(response.user)
      } catch {
        setToken(null)
        logout()
      } finally {
        setCheckingSession(false)
      }
    }

    fetchUser()
  }, [token, setUser, setToken, logout])

  const currentTitle = useMemo(() => {
    const routeMap = {
      '/': 'Dashboard',
      '/expenses': 'Expenses',
      '/income': 'Income',
      '/analytics': 'Analytics',
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
