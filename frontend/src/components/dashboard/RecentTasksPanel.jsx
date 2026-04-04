import { FileText, Folder, FileEdit } from 'lucide-react'
import { useTasks } from '../../context/TaskContext'
import './RecentModules.css'

export default function RecentTasksPanel() {
  const { tasks } = useTasks()

  const recentTasks = tasks
    .slice()
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 3)
    .map((task) => {
      const icon = task.status === 'completed' ? FileEdit : task.priority === 'urgent' ? Folder : FileText
      const dueLabel = task.due_date
        ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'No due date'

      return {
        icon,
        title: task.name,
        sub: `${task.category || 'General'} | ${dueLabel}`,
      }
    })

  return (
    <div className="card recent-modules animate-fadeIn" style={{ animationDelay: '0.1s' }}>
      <div className="card-header">
        <h3 className="text-title">Recent Tasks</h3>
        <span className="text-label" style={{ color: 'var(--secondary)' }}>Latest activity</span>
      </div>
      <div className="module-list">
        {recentTasks.length === 0 ? (
          <div className="text-body-sm">Your latest tasks will appear here once you add them.</div>
        ) : (
          recentTasks.map(({ icon: Icon, title, sub }) => (
            <div className="module-item" key={title}>
              <div className="module-icon"><Icon size={18} /></div>
              <div className="module-info">
                <h4>{title}</h4>
                <p>{sub}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
