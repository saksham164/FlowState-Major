import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, CheckCircle, Clock, BarChart3,
  Settings, LogOut, Plus, Inbox, FolderOpen, User
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useAnalytics } from '../../context/AnalyticsContext'
import './Sidebar.css'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/tasks', icon: CheckCircle, label: 'Tasks' },
  { to: '/focus', icon: Clock, label: 'Focus Timer' },
  { to: '/inbox', icon: Inbox, label: 'Inbox' },
  { to: '/folders', icon: FolderOpen, label: 'Folders' },
]

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { efficiency } = useAnalytics()

  const handleNewTask = () => {
    navigate('/tasks')
    if (onClose) onClose()
  }

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <h1>FlowState</h1>
        <div className="power-user-tag">Power User</div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => isActive ? 'active' : ''}
            onClick={onClose}
          >
            <span className="nav-icon"><Icon size={18} /></span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-widgets">
        <div className="focus-level-widget">
          <div className="focus-level-label">
            <span>Focus Level</span>
            <span className="focus-level-value">{efficiency}%</span>
          </div>
          <div className="focus-level-bar">
            <div className="focus-level-fill" style={{ width: `${efficiency}%` }} />
          </div>
        </div>

        <button className="btn-new-task-pill" onClick={handleNewTask}>
          <Plus size={16} />
          New Task
        </button>
      </div>

      <div className="sidebar-footer">
        <NavLink to="/profile" onClick={onClose}>
          <span className="nav-icon"><User size={18} /></span>
          Profile
        </NavLink>
        <NavLink to="/settings" onClick={onClose}>
          <span className="nav-icon"><Settings size={18} /></span>
          Settings
        </NavLink>
        <button className="sidebar-footer-btn" onClick={logout}>
          <span className="nav-icon"><LogOut size={18} /></span>
          Logout
        </button>
      </div>
    </aside>
  )
}
