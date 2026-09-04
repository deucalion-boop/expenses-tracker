import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { ArrowLeft, KeyRound, Mail, PiggyBank, ShieldCheck } from 'lucide-react'
import {
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPassword,
} from '../services/authService'
import useAuthStore from '../store/authStore'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'

const initialForm = { name: '', email: '', password: '', confirmPassword: '' }

const modeContent = {
  login: {
    icon: ShieldCheck,
    kicker: 'Secure access',
    title: 'Welcome back',
    description: 'Sign in to continue managing your finances.',
  },
  register: {
    icon: ShieldCheck,
    kicker: 'Secure access',
    title: 'Start your journey',
    description: 'Create an account and take control of your money.',
  },
  forgot: {
    icon: Mail,
    kicker: 'Account recovery',
    title: 'Forgot your password?',
    description: 'Enter your email and we will send you a secure reset link.',
  },
  reset: {
    icon: KeyRound,
    kicker: 'Choose a new password',
    title: 'Reset your password',
    description: 'Create a strong password you have not used before.',
  },
}

const AuthPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { setToken, setUser } = useAuthStore()
  const [mode, setMode] = useState(location.pathname === '/reset-password' ? 'reset' : 'login')
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const content = modeContent[mode]
  const KickerIcon = content.icon

  const switchMode = (nextMode) => {
    if (loading || nextMode === mode) return
    setMode(nextMode)
    setErrors({})
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const validate = () => {
    const nextErrors = {}
    if (mode === 'register' && !form.name.trim()) nextErrors.name = 'Name is required'
    if (mode !== 'reset' && !form.email.trim()) nextErrors.email = 'Email is required'
    if (['login', 'register', 'reset'].includes(mode) && !form.password) nextErrors.password = 'Password is required'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Enter a valid email'
    if (['login', 'register', 'reset'].includes(mode) && form.password && form.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters'
    }
    if (mode === 'reset' && form.password !== form.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return
    setLoading(true)

    try {
      if (mode === 'forgot') {
        await requestPasswordReset(form.email.trim().toLowerCase())
        toast.success('Password reset link sent. Check your email.')
        setMode('login')
        setForm(initialForm)
        return
      }

      if (mode === 'reset') {
        await resetPassword(form.password)
        toast.success('Password updated. You can now sign in.')
        navigate('/auth', { replace: true })
        return
      }

      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password }
      const data = mode === 'login' ? await loginUser(payload) : await registerUser(payload)

      if (data.requiresEmailConfirmation) {
        toast.success('Account created. Check your email to confirm your account.')
        setForm(initialForm)
        setMode('login')
        return
      }

      setToken(data.token)
      setUser(data.user)
      toast.success(mode === 'login' ? 'Login successful' : 'Account created successfully')
      navigate(data.user.role === 'admin' ? '/admin' : '/')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const submitLabel = {
    login: 'Sign in securely',
    register: 'Create my account',
    forgot: 'Send reset link',
    reset: 'Update password',
  }[mode]

  return (
    <div className="auth-page shell-center">
      <div className="auth-background" aria-hidden="true"><span className="auth-grid" /></div>

      <main className="auth-shell">
        <a className="auth-brand" href="/" aria-label="SpendWise home">
          <span className="auth-brand-icon"><PiggyBank size={22} /></span>
          <span>SpendWise</span>
        </a>

        <Card className="auth-card">
          <div className="auth-card-header">
            <span className="auth-kicker"><KickerIcon size={14} /> {content.kicker}</span>
            <h1>{content.title}</h1>
            <p>{content.description}</p>
          </div>

          {(mode === 'login' || mode === 'register') && (
            <div className="auth-mode-switch" role="tablist" aria-label="Authentication mode">
              <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>Login</button>
              <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'active' : ''} onClick={() => switchMode('register')}>Register</button>
            </div>
          )}

          <form key={mode} onSubmit={handleSubmit} className="auth-form auth-form-enter">
            {mode === 'register' && (
              <Input id="name" name="name" label="Full name" autoComplete="name" placeholder="Your full name" value={form.name} onChange={handleChange} error={errors.name} />
            )}
            {mode !== 'reset' && (
              <Input id="email" name="email" label="Email address" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={handleChange} error={errors.email} />
            )}
            {['login', 'register', 'reset'].includes(mode) && (
              <Input id="password" name="password" label={mode === 'reset' ? 'New password' : 'Password'} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="At least 6 characters" value={form.password} onChange={handleChange} error={errors.password} />
            )}
            {mode === 'reset' && (
              <Input id="confirmPassword" name="confirmPassword" label="Confirm new password" type="password" autoComplete="new-password" placeholder="Enter the password again" value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />
            )}
            {mode === 'login' && (
              <button type="button" className="link-button forgot-password-link" onClick={() => switchMode('forgot')}>Forgot password?</button>
            )}

            <Button type="submit" disabled={loading} className="full-width auth-submit" aria-busy={loading}>
              {loading ? <><span className="button-loader" /> Please wait...</> : submitLabel}
            </Button>
          </form>

          {mode === 'login' || mode === 'register' ? (
            <div className="toggle-text">
              <span>{mode === 'login' ? 'New to SpendWise?' : 'Already have an account?'}</span>
              <button type="button" className="link-button" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>
                {mode === 'login' ? 'Create account' : 'Sign in'}
              </button>
            </div>
          ) : (
            <button type="button" className="link-button auth-back-link" onClick={() => mode === 'reset' ? navigate('/auth') : switchMode('login')}>
              <ArrowLeft size={15} /> Back to sign in
            </button>
          )}
        </Card>

        <p className="auth-footnote">Your financial data stays private and protected.</p>
      </main>
    </div>
  )
}

export default AuthPage
