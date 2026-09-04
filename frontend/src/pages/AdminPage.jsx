import { useEffect, useMemo, useState } from 'react'
import { Activity, CheckCircle2, Search, ShieldCheck, Trash2, Users, UserX, WalletCards } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Select from '../components/ui/Select'
import useAuthStore from '../store/authStore'
import {
  deleteAdminUser,
  fetchAdminOverview,
  fetchAdminSettings,
  fetchAdminUsers,
  updateAdminSettings,
  updateAdminUser,
} from '../services/adminService'
import { formatDate } from '../utils/currency'

const AdminPage = () => {
  const currentUser = useAuthStore((state) => state.user)
  const [overview, setOverview] = useState(null)
  const [users, setUsers] = useState([])
  const [settings, setSettings] = useState({ allowRegistration: true, supportEmail: '' })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [busyUserId, setBusyUserId] = useState(null)

  const loadAdminData = async () => {
    const [overviewData, usersData, settingsData] = await Promise.all([
      fetchAdminOverview(),
      fetchAdminUsers(),
      fetchAdminSettings(),
    ])
    setOverview(overviewData)
    setUsers(usersData || [])
    setSettings({
      allowRegistration: settingsData.allowRegistration,
      supportEmail: settingsData.supportEmail || '',
    })
  }

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const [overviewData, usersData, settingsData] = await Promise.all([
          fetchAdminOverview(),
          fetchAdminUsers(),
          fetchAdminSettings(),
        ])
        if (active) {
          setOverview(overviewData)
          setUsers(usersData || [])
          setSettings({
            allowRegistration: settingsData.allowRegistration,
            supportEmail: settingsData.supportEmail || '',
          })
        }
      } catch (error) {
        if (active) toast.error(error.message)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [])

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return users
    return users.filter((user) => (
      user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
    ))
  }, [search, users])

  const handleUserChange = async (user, field, value) => {
    setBusyUserId(user._id)
    try {
      const updated = await updateAdminUser(user._id, {
        role: field === 'role' ? value : user.role,
        status: field === 'status' ? value : user.status,
      })
      setUsers((current) => current.map((item) => item._id === updated._id ? updated : item))
      const overviewData = await fetchAdminOverview()
      setOverview(overviewData)
      toast.success('User updated successfully')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusyUserId(null)
    }
  }

  const handleDelete = async (user) => {
    const confirmed = window.confirm(`Delete ${user.name} and all of their transactions? This cannot be undone.`)
    if (!confirmed) return

    setBusyUserId(user._id)
    try {
      await deleteAdminUser(user._id)
      await loadAdminData()
      toast.success('User deleted successfully')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusyUserId(null)
    }
  }

  const handleSettingsSubmit = async (event) => {
    event.preventDefault()
    setSavingSettings(true)
    try {
      const updated = await updateAdminSettings(settings)
      setSettings({
        allowRegistration: updated.allowRegistration,
        supportEmail: updated.supportEmail || '',
      })
      toast.success('System settings saved')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSavingSettings(false)
    }
  }

  if (loading) {
    return <div className="centered"><LoadingSpinner size={32} /></div>
  }

  const stats = [
    { label: 'Total users', value: overview?.totalUsers || 0, icon: Users, tone: 'primary', detail: 'Registered accounts' },
    { label: 'Active users', value: overview?.activeUsers || 0, icon: ShieldCheck, tone: 'success', detail: 'Can access the platform' },
    { label: 'Suspended', value: overview?.suspendedUsers || 0, icon: UserX, tone: 'danger', detail: 'Access restricted' },
    { label: 'Transactions', value: overview?.totalTransactions || 0, icon: WalletCards, tone: 'warning', detail: 'Across all users' },
  ]

  return (
    <div className="page-stack admin-page">
      <section className="dashboard-welcome admin-welcome">
        <div>
          <span className="section-kicker">Administration</span>
          <h2>Platform control center</h2>
          <p>Monitor account health, manage access, and configure essential system settings.</p>
        </div>
        <span className={`system-status ${settings.allowRegistration ? 'online' : 'restricted'}`}>
          <span /> {settings.allowRegistration ? 'Registration open' : 'Registration restricted'}
        </span>
      </section>

      <div className="stats-grid admin-stats">
        {stats.map(({ label, value, icon: Icon, tone, detail }) => (
          <Card key={label} className={`admin-stat ${tone}`}>
            <div className={`admin-stat-icon ${tone}`}><Icon size={20} /></div>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{detail}</small>
          </Card>
        ))}
      </div>

      <Card title="User management" subtitle="Review accounts and control platform access" action={<span className="count-badge">{users.length} total</span>} className="admin-users-card">
        <div className="admin-user-toolbar search-field">
          <Search size={17} />
          <Input aria-label="Search users" placeholder="Search by name or email" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <div className="table-wrap">
          <table className="data-table admin-user-table">
            <thead>
              <tr><th>User</th><th>Joined</th><th>Role</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const isSelf = user._id === currentUser?._id
                const busy = busyUserId === user._id
                return (
                  <tr key={user._id}>
                    <td>
                      <div className="admin-user-cell">
                        <span className="user-table-avatar">{user.name.charAt(0).toUpperCase()}</span>
                        <div className="table-title"><strong>{user.name}{isSelf ? ' (you)' : ''}</strong><small>{user.email}</small></div>
                      </div>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <Select aria-label={`Role for ${user.name}`} value={user.role} disabled={isSelf || busy} onChange={(event) => handleUserChange(user, 'role', event.target.value)} options={[{ value: 'user', label: 'User' }, { value: 'admin', label: 'Admin' }]} />
                    </td>
                    <td>
                      <Select aria-label={`Status for ${user.name}`} value={user.status} disabled={isSelf || busy} onChange={(event) => handleUserChange(user, 'status', event.target.value)} options={[{ value: 'active', label: 'Active' }, { value: 'suspended', label: 'Suspended' }]} />
                    </td>
                    <td>
                      <button type="button" className="icon-button small danger" disabled={isSelf || busy} onClick={() => handleDelete(user)} aria-label={`Delete ${user.name}`}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredUsers.length === 0 && <p className="admin-empty">No users match your search.</p>}
        </div>
      </Card>

      <div className="admin-bottom-grid">
        <Card title="System settings" subtitle="Control registration and support information">
          <form onSubmit={handleSettingsSubmit} className="admin-settings-form">
            <label className="setting-toggle setting-panel">
              <input type="checkbox" checked={settings.allowRegistration} onChange={(event) => setSettings((current) => ({ ...current, allowRegistration: event.target.checked }))} />
              <span><strong>Allow new registrations</strong><small>Existing users can still sign in when this is disabled.</small></span>
            </label>
            <Input id="support-email" label="Support email" type="email" placeholder="support@example.com" value={settings.supportEmail} onChange={(event) => setSettings((current) => ({ ...current, supportEmail: event.target.value }))} />
            <Button type="submit" disabled={savingSettings}>{savingSettings ? 'Saving...' : 'Save settings'}</Button>
          </form>
        </Card>

        <Card title="System health" subtitle="Current platform status" className="system-health-card">
          <div className="health-row"><span className="health-icon success"><CheckCircle2 size={17} /></span><div><strong>Database connected</strong><small>User data is available</small></div><span className="status-label success">Healthy</span></div>
          <div className="health-row"><span className="health-icon primary"><ShieldCheck size={17} /></span><div><strong>Administrators</strong><small>Accounts with elevated access</small></div><span className="status-label">{overview?.admins || 0}</span></div>
          <div className="health-row"><span className="health-icon warning"><Activity size={17} /></span><div><strong>Registration</strong><small>New account availability</small></div><span className={`status-label ${settings.allowRegistration ? 'success' : 'warning'}`}>{settings.allowRegistration ? 'Open' : 'Closed'}</span></div>
        </Card>
      </div>
    </div>
  )
}

export default AdminPage
