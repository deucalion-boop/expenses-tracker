import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
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
      navigate('/')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page shell-center">
      <Card className="auth-card" title={isLogin ? 'Welcome back' : 'Create your account'} subtitle="Track your money with confidence.">
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <Input id="name" name="name" label="Full name" value={form.name} onChange={handleChange} error={errors.name} />
          )}
          <Input id="email" name="email" label="Email" type="email" value={form.email} onChange={handleChange} error={errors.email} />
          <Input id="password" name="password" label="Password" type="password" value={form.password} onChange={handleChange} error={errors.password} />

          <Button type="submit" disabled={loading} className="full-width">
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create account'}
          </Button>
        </form>

        <div className="toggle-text">
          <span>{isLogin ? 'Need an account?' : 'Already have an account?'}</span>
          <button type="button" className="link-button" onClick={() => setIsLogin((current) => !current)}>
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </Card>
    </div>
  )
}

export default AuthPage
