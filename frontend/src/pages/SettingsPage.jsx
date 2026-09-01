import { useState } from 'react'
import { Moon, SunMedium } from 'lucide-react'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { useTheme } from '../context/theme'
import useAuthStore from '../store/authStore'

const SettingsPage = () => {
  const { theme, setTheme } = useTheme()
  const { user } = useAuthStore()
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
  })

  return (
    <div className="page-stack settings-stack">
      <Card title="Profile" subtitle="Basic information">
        <div className="settings-grid">
          <Input label="Name" value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} />
          <Input label="Email" type="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} />
        </div>
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

      <Card title="Preferences" subtitle="Currency and date display">
        <div className="settings-grid">
          <Input label="Currency" value="PHP / ₱" readOnly />
          <Input label="Date format" value="DD/MM/YYYY" readOnly />
        </div>
      </Card>

      <Card title="Security" subtitle="Manage your account">
        <div className="settings-grid">
          <Input label="Current password" type="password" placeholder="Enter current password" />
          <Input label="New password" type="password" placeholder="Enter new password" />
        </div>
        <Button type="button" className="mt-16">Change password</Button>
      </Card>
    </div>
  )
}

export default SettingsPage
