import { BarChart3, DollarSign, LayoutDashboard, LogOut, PiggyBank, Settings, Wallet, X } from 'lucide-react'
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

const Sidebar = ({ user, onLogout, isOpen = false, onClose }) => (
  <aside className={`sidebar ${isOpen ? 'open' : ''}`.trim()}>
    <div className="brand-block">
      <div className="brand-icon"><PiggyBank size={18} /></div>
      <div>
        <p className="eyebrow">Finance</p>
        <h2>LedgerFlow</h2>
      </div>
      <button type="button" className="icon-button drawer-close" onClick={onClose} aria-label="Close navigation">
        <X size={18} />
      </button>
    </div>

    <nav className="sidebar-nav" aria-label="Sidebar navigation">
      {navItems.map(({ label, to, icon: Icon }) => (
        <NavLink key={label} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end={to === '/'} onClick={onClose}>
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
  }),
  onLogout: PropTypes.func.isRequired,
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
}

export default Sidebar
