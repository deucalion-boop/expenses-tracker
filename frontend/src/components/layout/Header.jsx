import { Bell, ChevronDown, Moon, Search, SunMedium } from 'lucide-react'
import PropTypes from 'prop-types'
import { useTheme } from '../../context/theme'

const Header = ({ title, user, onSearch, searchValue }) => {
  const { theme, setTheme } = useTheme()

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1>{title}</h1>
      </div>

      <div className="topbar-actions">
        {onSearch && (
          <label className="search-box" aria-label="Search">
            <Search size={16} />
            <input value={searchValue || ''} onChange={(event) => onSearch(event.target.value)} placeholder="Search..." />
          </label>
        )}

        <button type="button" className="icon-button" aria-label="Toggle theme" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? <Moon size={18} /> : <SunMedium size={18} />}
        </button>

        <button type="button" className="icon-button" aria-label="Notifications">
          <Bell size={18} />
        </button>

        <div className="profile-chip">
          <div className="avatar-circle small">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
          <div>
            <strong>{user?.name || 'User'}</strong>
            <small>{user?.email || 'user@example.com'}</small>
          </div>
          <ChevronDown size={16} />
        </div>
      </div>
    </header>
  )
}

Header.propTypes = {
  title: PropTypes.string.isRequired,
  user: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
  }),
  onSearch: PropTypes.func,
  searchValue: PropTypes.string,
}

export default Header
