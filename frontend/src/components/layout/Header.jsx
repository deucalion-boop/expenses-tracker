import { Moon, Search, SunMedium } from 'lucide-react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { useTheme } from '../../context/theme'

const Header = ({ title, user, onSearch, searchValue }) => {
  const { theme, setTheme } = useTheme()

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1>{title}</h1>
        <p>{new Intl.DateTimeFormat('en-PH', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</p>
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

        <Link to="/settings" className="profile-chip" aria-label="Open account settings">
          <div className="avatar-circle small">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
          <div>
            <strong>{user?.name || 'User'}</strong>
            <small>{user?.role === 'admin' ? 'Administrator' : 'Personal account'}</small>
          </div>
        </Link>
      </div>
    </header>
  )
}

Header.propTypes = {
  title: PropTypes.string.isRequired,
  user: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    role: PropTypes.oneOf(['user', 'admin']),
  }),
  onSearch: PropTypes.func,
  searchValue: PropTypes.string,
}

export default Header
