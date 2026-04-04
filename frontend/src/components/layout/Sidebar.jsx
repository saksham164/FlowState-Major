import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, CheckCircle, Clock, BarChart3,
  Calendar, Settings, LogOut, Plus, Inbox, FolderOpen
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import './Sidebar.css'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: CheckCircle, label: 'Tasks' },
  { to: '/focus', icon: Clock, label: 'Focus Timer' },
  { to: '/inbox', icon: Inbox, label: 'Inbox' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/folders', icon: FolderOpen, label: 'Folders' },
]

const footerItems = [
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleNewTask = () => {
    navigate('/tasks')
    if (onClose) onClose()
  }

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <h1>FlowState</h1>
        <span>The Digital Sanctuary</span>
      </div>

      <div className="sidebar-cta">
        <button className="btn-cta" id="btn-new-task" onClick={handleNewTask}>
          <Plus size={16} />
          New Task
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => isActive ? 'active' : ''}
            onClick={onClose}
          >
            <span className="nav-icon"><Icon size={20} /></span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {footerItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={onClose}>
            <span className="nav-icon"><Icon size={20} /></span>
            {label}
          </NavLink>
        ))}
        <button className="sidebar-footer-btn" id="btn-signout" onClick={logout}>
          <span className="nav-icon"><LogOut size={20} /></span>
          Sign Out
        </button>
      </div>
    </aside>
  )
}
