import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, Menu, LogOut, Inbox, AlertTriangle, CheckCheck, User } from 'lucide-react'
import { useTasks } from '../../context/TaskContext'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import './Topbar.css'

export default function Topbar({ onMenuToggle }) {
  const { tasks } = useTasks()
  const { user, logout } = useAuth()
  const { notifications, unreadCount, dismissNotification, clearNotifications } = useNotifications()
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const navigate = useNavigate()

  const hits = query.trim().length > 0 
    ? tasks.filter(t => t.name.toLowerCase().includes(query.toLowerCase()))
    : []

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-toggle" onClick={onMenuToggle} aria-label="Toggle menu">
          <Menu size={20} />
        </button>

        <div className="topbar-search" style={{ position: 'relative' }}>
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search tasks or focus sessions" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
          />

          {/* Dynamic Search Results */}
          {showResults && query && (
            <div className="search-results-popover">
              {hits.length > 0 ? (
                hits.slice(0, 5).map(h => (
                  <div key={h.id} className="search-hit">
                    <strong>{h.name}</strong>
                    <span className="hit-badge">{h.status}</span>
                  </div>
                ))
              ) : (
                <div className="search-hit" style={{ color: 'var(--on-surface-variant)' }}>
                  No tasks matched.
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      <div className="topbar-right">
        <div style={{ position: 'relative' }}>
          <button className="topbar-btn notification-trigger" aria-label="Notifications" onClick={() => setNotificationsOpen((open) => !open)}>
            {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            <Bell size={20} />
          </button>
          {notificationsOpen && (
            <div className="notifications-popover">
              <div className="notifications-header">
                <div>
                  <div className="notifications-title">Alerts</div>
                  <div className="notifications-subtitle">{unreadCount === 0 ? 'All clear' : `${unreadCount} active notifications`}</div>
                </div>
                {notifications.length > 0 && (
                  <button className="notifications-clear-btn" onClick={clearNotifications}>
                    <CheckCheck size={14} />
                    Clear
                  </button>
                )}
              </div>

              <div className="notifications-list">
                {notifications.length === 0 ? (
                  <div className="notification-empty">
                    <Inbox size={18} />
                    <span>No high-priority alerts right now.</span>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <button
                      key={notification.id}
                      className={`notification-item notification-item-${notification.type}`}
                      onClick={() => {
                        dismissNotification(notification.id)
                        setNotificationsOpen(false)
                        navigate(notification.href)
                      }}
                    >
                      <div className="notification-item-icon">
                        {notification.type === 'warning' ? <AlertTriangle size={16} /> : <Bell size={16} />}
                      </div>
                      <div className="notification-item-copy">
                        <div className="notification-item-title">{notification.title}</div>
                        <div className="notification-item-text">{notification.message}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <div className="topbar-avatar" onClick={() => setProfileOpen(p => !p)}>
            <div className="avatar-placeholder">
              {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div className="profile-dropdown" style={{ 
              position: 'absolute', top: '100%', right: '0', marginTop: '12px', 
              background: 'var(--surface-container-lowest)', border: '1px solid var(--surface-container-high)', 
              borderRadius: 'var(--radius-md)', padding: '4px', boxShadow: 'var(--shadow-medium)', 
              zIndex: 100, minWidth: '160px' 
            }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--surface-container-high)', marginBottom: '4px' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user?.user_metadata?.full_name || 'User Profile'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
              </div>
              <button 
                onClick={() => {
                  navigate('/profile')
                  setProfileOpen(false)
                }}
                style={{ 
                  width: '100%', padding: '10px 12px', background: 'transparent', border: 'none', 
                  textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', 
                  cursor: 'pointer', fontSize: '0.875rem', color: 'var(--on-surface)',
                  borderRadius: 'var(--radius-sm)'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface-container-low)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <User size={16} /> Profile
              </button>
              <button 
                onClick={logout} 
                style={{ 
                  width: '100%', padding: '10px 12px', background: 'transparent', border: 'none', 
                  textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', 
                  cursor: 'pointer', fontSize: '0.875rem', color: 'var(--status-urgent)',
                  borderRadius: 'var(--radius-sm)'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(220, 38, 38, 0.05)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
