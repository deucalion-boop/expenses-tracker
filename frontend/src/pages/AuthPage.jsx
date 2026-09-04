import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { PiggyBank, ShieldCheck } from 'lucide-react'
import { registerUser, loginUser } from '../services/authService'
import useAuthStore from '../store/authStore'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'

const initialForm = {
  name: '',
  email: '',
  password: '',
}

const AuthPage = () => {
  const navigate = useNavigate()
  const { setToken, setUser } = useAuthStore()
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const switchMode = (loginMode) => {
    if (loading || loginMode === isLogin) return
    setIsLogin(loginMode)
    setErrors({})
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const validate = () => {
    const nextErrors = {}

    if (!isLogin && !form.name.trim()) nextErrors.name = 'Name is required'
    if (!form.email.trim()) nextErrors.email = 'Email is required'
    if (!form.password.trim()) nextErrors.password = 'Password is required'

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Enter a valid email'
    if (form.password && form.password.length < 6) nextErrors.password = 'Password must be at least 6 characters'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const payload = isLogin ? { email: form.email, password: form.password } : form
      const data = isLogin ? await loginUser(payload) : await registerUser(payload)
      const token = data.token
      const user = data.user

      setToken(token)
      setUser(user)
      toast.success(isLogin ? 'Login successful' : 'Account created successfully')
      navigate(user.role === 'admin' ? '/admin' : '/')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page shell-center">
      <div className="auth-background" aria-hidden="true">
        <span className="auth-grid" />
      </div>

      <main className="auth-shell">
        <a className="auth-brand" href="/" aria-label="LedgerFlow home">
          <span className="auth-brand-icon"><PiggyBank size={22} /></span>
          <span>LedgerFlow</span>
        </a>

        <Card className="auth-card">
          <div className="auth-card-header">
            <span className="auth-kicker"><ShieldCheck size={14} /> Secure access</span>
            <h1>{isLogin ? 'Welcome back' : 'Start your journey'}</h1>
            <p>{isLogin ? 'Sign in to continue managing your finances.' : 'Create an account and take control of your money.'}</p>
          </div>

          <div className="auth-mode-switch" role="tablist" aria-label="Authentication mode">
            <button type="button" role="tab" aria-selected={isLogin} className={isLogin ? 'active' : ''} onClick={() => switchMode(true)}>Login</button>
            <button type="button" role="tab" aria-selected={!isLogin} className={!isLogin ? 'active' : ''} onClick={() => switchMode(false)}>Register</button>
          </div>

          <form key={isLogin ? 'login' : 'register'} onSubmit={handleSubmit} className="auth-form auth-form-enter">
            {!isLogin && (
              <Input id="name" name="name" label="Full name" autoComplete="name" placeholder="Your full name" value={form.name} onChange={handleChange} error={errors.name} />
            )}
            <Input id="email" name="email" label="Email address" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={handleChange} error={errors.email} />
            <Input id="password" name="password" label="Password" type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder="At least 6 characters" value={form.password} onChange={handleChange} error={errors.password} />

            <Button type="submit" disabled={loading} className="full-width auth-submit" aria-busy={loading}>
              {loading ? <><span className="button-loader" /> Please wait...</> : isLogin ? 'Sign in securely' : 'Create my account'}
            </Button>
          </form>

          <div className="toggle-text">
            <span>{isLogin ? 'New to LedgerFlow?' : 'Already have an account?'}</span>
            <button type="button" className="link-button" onClick={() => switchMode(!isLogin)}>
              {isLogin ? 'Create account' : 'Sign in'}
            </button>
          </div>
        </Card>

        <p className="auth-footnote">Your financial data stays private and protected.</p>
      </main>
    </div>
  )
}

export default AuthPage
