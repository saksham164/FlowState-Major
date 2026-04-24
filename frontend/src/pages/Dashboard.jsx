import { useTasks } from '../context/TaskContext'
import { useSubjects } from '../context/SubjectContext'
import { useAnalytics } from '../context/AnalyticsContext'
import TaskManager from '../components/dashboard/TaskManager'
import WeeklyTimetable from '../components/dashboard/WeeklyTimetable'
import FocusCard from '../components/dashboard/FocusCard'
import InsightsPanel from '../components/dashboard/InsightsPanel'
import { FileText, Link as LinkIcon, Book, Calendar } from 'lucide-react'
import './Dashboard.css'

export default function Dashboard() {
  const { tasks } = useTasks()
  const { subjects, materialsBySubject } = useSubjects()
  const { totalSessions } = useAnalytics()

  const pendingAssignments = tasks.filter(t => t.status !== 'completed').length
  const totalResources = Object.values(materialsBySubject).flat().length
  const totalSubjects = subjects.length
  
  const modules = [
    { label: 'Assignments', count: pendingAssignments, icon: FileText, color: '#F87171' },
    { label: 'Resources', count: totalResources, icon: LinkIcon, color: '#60A5FA' },
    { label: 'Subjects', count: totalSubjects, icon: Book, color: '#34D399' },
    { label: 'Exams', count: 0, icon: Calendar, color: '#FBBF24' },
  ]

  return (
    <div className="workspace-dashboard">
      <header className="workspace-header">
        <div className="flex-col">
          <h1 className="workspace-title">Workspace.</h1>
        </div>
        <div className="workspace-date">
          <div className="date-main">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
          <div className="date-sub">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </header>

      <div className="dashboard-row">
        <section className="dashboard-section flex-2">
          <h2 className="section-label">Deep Work Session</h2>
          <FocusCard />
        </section>
        <section className="dashboard-section flex-1">
          <h2 className="section-label">Flow State Metrics</h2>
          <InsightsPanel />
        </section>
      </div>

      <section className="dashboard-section">
        <h2 className="section-label">Module Sync</h2>
        <div className="module-sync-row">
          {modules.map((m, i) => (
            <div key={m.label} className="module-card animate-fadeIn" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="module-card-icon" style={{ color: m.color }}>
                <m.icon size={20} />
              </div>
              <div className="module-card-info">
                <span className="module-count">{m.count}</span>
                <span className="module-label">{m.label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <h2 className="section-label">Active Task Queue</h2>
        <TaskManager />
      </section>

      <section className="dashboard-section">
        <h2 className="section-label">Schedule Grid</h2>
        <WeeklyTimetable />
      </section>
    </div>
  )
}
