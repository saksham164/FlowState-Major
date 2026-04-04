import { useState } from 'react'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { useTasks } from '../context/TaskContext'
import './Calendar.css'

export default function Calendar() {
  const { tasks } = useTasks()
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()

  const monthName = currentDate.toLocaleString('default', { month: 'long' })

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  // Find tasks for a specific day
  const getTasksForDay = (day) => {
    // Format checking date as YYYY-MM-DD
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return tasks.filter(t => t.due_date === dateStr && t.status !== 'completed')
  }

  // Generate grid blanks for days before the 1st
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => (
    <div className="calendar-day empty" key={`empty-${i}`} />
  ))

  // Generate actual days
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const dayTasks = getTasksForDay(day)
    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()

    return (
      <div className={`calendar-day ${isToday ? 'today' : ''}`} key={day}>
        <span className="day-number">{day}</span>
        <div className="day-tasks">
          {dayTasks.map(task => (
            <div className={`calendar-task-item priority-${task.priority}`} key={task.id}>
              {task.name}
            </div>
          ))}
        </div>
      </div>
    )
  })

  return (
    <div className="calendar-page animate-fadeIn">
      <header className="calendar-header">
        <div>
          <h1 className="text-display">Schedule</h1>
          <p className="text-body">Your obligations, laid out clearly.</p>
        </div>
        
        <div className="calendar-controls">
          <button className="btn-ghost btn-icon" onClick={handlePrevMonth}>
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-title month-display">{monthName} {year}</h2>
          <button className="btn-ghost btn-icon" onClick={handleNextMonth}>
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      <div className="calendar-container">
        <div className="calendar-weekdays text-label">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>
        <div className="calendar-grid-full">
          {blanks}
          {days}
        </div>
      </div>
    </div>
  )
}
