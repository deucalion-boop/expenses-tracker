import { useState } from 'react'
import PropTypes from 'prop-types'
import { Moon, SunMedium } from 'lucide-react'
import toast from 'react-hot-toast'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useTheme } from '../context/theme'
import useAuthStore from '../store/authStore'
import { changePassword, updatePreferences, updateProfile } from '../services/authService'
import { storeDisplayPreferences } from '../utils/currency'

const emptyPasswords = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

const SettingsContent = ({ user, setUser }) => {
  const { theme, setTheme } = useTheme()
  const [profile, setProfile] = useState({
    name: user.name,
    email: user.email,
  })
  const [passwords, setPasswords] = useState(emptyPasswords)
  const [savingProfile, setSavingProfile] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [savingPreferences, setSavingPreferences] = useState(false)
  const [preferences, setPreferences] = useState({
    currency: user.currency || 'PHP', dateFormat: user.dateFormat || 'MMM d, yyyy',
    theme: user.theme || theme, dashboardPeriod: user.dashboardPeriod || 'month',
  })

  const savePreferences = async (event) => {
    event.preventDefault()
    setSavingPreferences(true)
    try {
      const response = await updatePreferences(preferences)
      setUser(response.user)
      storeDisplayPreferences(response.user)
      setTheme(preferences.theme)
      toast.success('Preferences saved')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSavingPreferences(false)
    }
  }

  const handleProfileSubmit = async (event) => {
    event.preventDefault()
    const name = profile.name.trim()
    const email = profile.email.trim()

    if (name.length < 2) {
      toast.error('Name must be at least 2 characters')
      return
    }
    if (!email) {
      toast.error('Email is required')
      return
    }

    setSavingProfile(true)
    try {
      const response = await updateProfile({ name, email })
      setUser(response.user)
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()

    if (!passwords.currentPassword) {
      toast.error('Current password is required')
      return
    }
    if (passwords.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    setChangingPassword(true)
    try {
      await changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      })
      setPasswords(emptyPasswords)
      toast.success('Password changed successfully')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="page-stack settings-stack">
      <Card title="Profile" subtitle="Update the name and email shown across your account">
        <form onSubmit={handleProfileSubmit}>
          <div className="settings-grid">
            <Input id="profile-name" label="Name" required minLength={2} value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} />
            <Input id="profile-email" label="Email" type="email" required value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} />
          </div>
          <Button type="submit" className="mt-16" disabled={savingProfile}>
            {savingProfile ? 'Saving...' : 'Save profile'}
          </Button>
        </form>
      </Card>

      <Card title="Appearance" subtitle="Choose your theme">
        <div className="theme-switcher">
          <button type="button" className={`theme-option ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>
            <SunMedium size={18} /> Light mode
          </button>
          <button type="button" className={`theme-option ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>
            <Moon size={18} /> Dark mode
          </button>
        </div>
      </Card>

      <Card title="Preferences" subtitle="Save display preferences across devices">
        <form onSubmit={savePreferences}>
          <div className="settings-grid">
            <Select label="Currency" value={preferences.currency} onChange={(event) => setPreferences({ ...preferences, currency: event.target.value })} options={['PHP','USD','EUR','GBP','JPY'].map((value) => ({ value, label: value }))} />
            <Select label="Date format" value={preferences.dateFormat} onChange={(event) => setPreferences({ ...preferences, dateFormat: event.target.value })} options={[{value:'MMM d, yyyy',label:'Sep 5, 2026'},{value:'MM/dd/yyyy',label:'09/05/2026'},{value:'dd/MM/yyyy',label:'05/09/2026'},{value:'yyyy-MM-dd',label:'2026-09-05'}]} />
            <Select label="Default dashboard range" value={preferences.dashboardPeriod} onChange={(event) => setPreferences({ ...preferences, dashboardPeriod: event.target.value })} options={[{value:'month',label:'This month'},{value:'year',label:'This year'},{value:'all',label:'All time'}]} />
            <Select label="Saved theme" value={preferences.theme} onChange={(event) => setPreferences({ ...preferences, theme: event.target.value })} options={[{value:'light',label:'Light'},{value:'dark',label:'Dark'}]} />
          </div>
          <Button type="submit" className="mt-16" disabled={savingPreferences}>{savingPreferences ? 'Saving...' : 'Save preferences'}</Button>
        </form>
      </Card>

      <Card title="Security" subtitle="Change your password securely">
        <form onSubmit={handlePasswordSubmit}>
          <div className="settings-grid">
            <Input id="current-password" label="Current password" type="password" autoComplete="current-password" required value={passwords.currentPassword} onChange={(event) => setPasswords((current) => ({ ...current, currentPassword: event.target.value }))} />
            <Input id="new-password" label="New password" type="password" autoComplete="new-password" required minLength={6} value={passwords.newPassword} onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))} />
            <Input id="confirm-password" label="Confirm new password" type="password" autoComplete="new-password" required minLength={6} value={passwords.confirmPassword} onChange={(event) => setPasswords((current) => ({ ...current, confirmPassword: event.target.value }))} />
          </div>
          <Button type="submit" className="mt-16" disabled={changingPassword}>
            {changingPassword ? 'Changing...' : 'Change password'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

SettingsContent.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    currency: PropTypes.string,
    dateFormat: PropTypes.string,
    theme: PropTypes.string,
    dashboardPeriod: PropTypes.string,
  }).isRequired,
  setUser: PropTypes.func.isRequired,
}

const SettingsPage = () => {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)

  if (!user) {
    return <div className="centered"><LoadingSpinner size={28} /></div>
  }

  return <SettingsContent user={user} setUser={setUser} />
}

export default SettingsPage
