import { FileText, Folder, FileEdit } from 'lucide-react'
import './RecentModules.css'

const modules = [
  { icon: FileText, title: 'Cloud Architecture Assignment', sub: 'Computer Science · 2 days left' },
  { icon: Folder, title: 'UX Research Repository', sub: 'UX Design · Resources updated' },
  { icon: FileEdit, title: 'Weekly Marketing Notes', sub: 'Marketing · Draft saved' },
]

export default function RecentModules() {
  return (
    <div className="card recent-modules animate-fadeIn" style={{ animationDelay: '0.1s' }}>
      <div className="card-header">
        <h3 className="text-title">Recent Modules</h3>
        <a href="#" className="text-label" style={{ color: 'var(--secondary)' }}>View</a>
      </div>
      <div className="module-list">
        {modules.map(({ icon: Icon, title, sub }) => (
          <div className="module-item" key={title}>
            <div className="module-icon"><Icon size={18} /></div>
            <div className="module-info">
              <h4>{title}</h4>
              <p>{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
