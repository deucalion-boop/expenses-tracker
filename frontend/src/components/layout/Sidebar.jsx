import { BarChart3, DollarSign, LayoutDashboard, LogOut, PiggyBank, Settings, ShieldCheck, Wallet } from 'lucide-react'
import PropTypes from 'prop-types'
import { NavLink } from 'react-router-dom'
import Button from '../ui/Button'

const navItems = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Expenses', to: '/expenses', icon: Wallet },
  { label: 'Income', to: '/income', icon: DollarSign },
  { label: 'Analytics', to: '/analytics', icon: BarChart3 },
  { label: 'Settings', to: '/settings', icon: Settings },
]

const adminNavItems = [
  { label: 'Admin dashboard', to: '/admin', icon: ShieldCheck },
  { label: 'Settings', to: '/settings', icon: Settings },
]

const Sidebar = ({ user, onLogout }) => (
  <aside className="sidebar">
    <div className="brand-block">
      <div className="brand-icon"><PiggyBank size={18} /></div>
      <div>
        <p className="eyebrow">Finance</p>
        <h2>LedgerFlow</h2>
      </div>
    </div>

    <nav className="sidebar-nav" aria-label="Sidebar navigation">
      <span className="nav-section-label">Workspace</span>
      {(user?.role === 'admin' ? adminNavItems : navItems).map(({ label, to, icon: Icon }) => (
        <NavLink key={label} to={to} title={label} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end={to === '/'}>
          <Icon size={18} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>

    <div className="sidebar-footer">
      <div className="user-pill">
        <div className="avatar-circle">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
        <div>
          <strong>{user?.name || 'User'}</strong>
          <small>{user?.email || 'No email'}</small>
          {user?.role === 'admin' && <small className="role-label">Administrator</small>}
        </div>
      </div>
      <Button variant="ghost" onClick={onLogout} className="logout-button">
        <LogOut size={16} />
        Logout
      </Button>
    </div>
  </aside>
)

Sidebar.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    role: PropTypes.oneOf(['user', 'admin']),
  }),
  onLogout: PropTypes.func.isRequired,
}

export default Sidebar
