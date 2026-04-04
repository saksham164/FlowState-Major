import { useTasks } from '../../context/TaskContext'
import './WeeklyTimetable.css'

export default function WeeklyTimetable() {
  const { tasks } = useTasks()
  
  // Secure string matching
  const pendingTasks = tasks.filter(t => t.status !== 'completed' && t.due_date)

  const currentDate = new Date()
  const currentDayOfWeek = currentDate.getDay()
  
  // Calculate Monday of the current week
  const monday = new Date(currentDate)
  const diffToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1
  monday.setDate(currentDate.getDate() - diffToMonday)

  const weekDays = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    weekDays.push({
      dateStr: d.toLocaleDateString('en-CA'), // YYYY-MM-DD
      label: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      day: d.getDate()
    })
  }

  const startDateStr = weekDays[0].dateStr
  const endDateStr = weekDays[6].dateStr
  
  // Format MM/DD string for top header nicely
  const getDisplayRange = () => {
    const startM = new Date(startDateStr).toLocaleString('default', { month: 'short' })
    const endM = new Date(endDateStr).toLocaleString('default', { month: 'short' })
    return `${startM} ${weekDays[0].day} - ${endM} ${weekDays[6].day}`
  }

  return (
    <div className="card timetable-card animate-fadeIn" style={{ animationDelay: '0.2s' }}>
      <div className="card-header">
        <h2 className="text-title">Current Week</h2>
        <div className="timetable-nav">
          <span className="timetable-range">{getDisplayRange()}</span>
        </div>
      </div>
      <div className="timetable-scroll">
        <div className="timetable-grid">
          {/* Header row */}
          {weekDays.map(d => (
            <div key={d.dateStr} className="text-label" style={{ textAlign: 'center' }}>
              {d.label} {d.day}
            </div>
          ))}

          {/* Cards Data Row */}
          {weekDays.map(d => {
            const dailyTasks = pendingTasks.filter(t => t.due_date === d.dateStr)

            return (
              <div key={`col-${d.dateStr}`} className="timetable-col">
                {dailyTasks.length === 0 ? (
                  <div className="empty-slot"></div>
                ) : (
                  dailyTasks.map(task => (
                    <div key={task.id} className="timetable-slot active">
                      <strong className="truncate-text">{task.name}</strong>
                      <div className="slot-category">{task.category || 'Work'}</div>
                    </div>
                  ))
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
