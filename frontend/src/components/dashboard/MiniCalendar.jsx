import { useState } from 'react'
import { useTasks } from '../../context/TaskContext'
import './MiniCalendar.css'

const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function MiniCalendar() {
  const { tasks } = useTasks()
  const [hoveredDay, setHoveredDay] = useState(null)
  
  const currentDate = new Date()
  const todayNum = currentDate.getDate()

  // Format local date securely avoiding JS timezone shifts (YYYY-MM-DD)
  // en-CA natively outputs YYYY-MM-DD regardless of locale
  const todayStr = currentDate.toLocaleDateString('en-CA')
  const currentMonthStr = todayStr.substring(0, 7)

  // Get tasks due this month securely using string prefix check
  const pendingTasks = tasks.filter(t => {
    if (t.status === 'completed' || !t.due_date) return false
    return t.due_date.startsWith(currentMonthStr)
  })

  // Set of dates that have tasks (parse out the DD part)
  const eventDays = new Set(pendingTasks.map(t => parseInt(t.due_date.substring(8, 10), 10)))

  // Base list of global upcoming tasks
  const defaultUpcoming = pendingTasks
    .filter(t => t.due_date >= todayStr)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .slice(0, 3)

  // Hovered Specific Output
  let activeTasks = defaultUpcoming
  if (hoveredDay !== null) {
      const activeStr = `${currentMonthStr}-${String(hoveredDay).padStart(2, '0')}`
      activeTasks = pendingTasks.filter(t => t.due_date === activeStr)
  }

  return (
    <div className="calendar-mini animate-fadeIn" style={{ animationDelay: '0.15s' }}>
      <div className="calendar-mini-header">
        <h3 className="text-title">Calendar</h3>
        <span className="text-label">{currentDate.toLocaleString('default', { month: 'long' })}</span>
      </div>

      <div className="calendar-grid">
        {days.map((d, i) => (
          <div key={i} className="day-header">{d}</div>
        ))}
        {Array.from({ length: 7 }, (_, i) => {
           // Fixed local week generator offset
           const day = todayNum - currentDate.getDay() + i
           if (day < 1 || day > 31) return <div key={i} className="day empty" />

           const isToday = day === todayNum
           const hasEvent = eventDays.has(day)
           let cls = 'day'
           if (isToday) cls += ' today'
           if (hasEvent) cls += ' has-event'
           
           return (
             <div 
               key={day} 
               className={cls}
               onMouseEnter={() => setHoveredDay(day)}
               onMouseLeave={() => setHoveredDay(null)}
               style={{ cursor: 'crosshair', transition: 'transform 0.1s ease', transform: hoveredDay === day ? 'scale(1.15)' : 'scale(1)' }}
             >
               {day}
             </div>
           )
        })}
      </div>

      <div className="calendar-events">
        {activeTasks.length === 0 ? (
          <div className="text-body-sm" style={{ textAlign: 'center', opacity: 0.6, marginTop: '1rem' }}>
             {hoveredDay ? 'No events scheduled.' : 'No upcoming events'}
          </div>
        ) : (
          activeTasks.map(task => (
             <div className="calendar-event-item" key={task.id}>
               <span className="event-dot" style={{ background: 'var(--primary)' }} />
               <span className="text-body-sm">{task.name}</span>
             </div>
          ))
        )}
      </div>
    </div>
  )
}
