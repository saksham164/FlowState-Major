import { Play, Pause, RotateCcw } from 'lucide-react'
import { useFocus } from '../../context/FocusContext'
import './FocusCard.css'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function FocusCard() {
  const { timeRemaining, isRunning, toggleTimer, resetTimer, currentMode } = useFocus()

  // Circular progress calculation
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (timeRemaining / currentMode.duration) * circumference

  return (
    <div className="focus-card-workspace">
      <div className="focus-main-content">
        <div className="focus-timer-large">
          {formatTime(timeRemaining)}
        </div>
        
        <div className="focus-ring-container">
          <svg width="160" height="160" viewBox="0 0 160 160">
            <circle
              className="focus-ring-bg"
              cx="80" cy="80" r={radius}
            />
            <circle
              className="focus-ring-progress"
              cx="80" cy="80" r={radius}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
              }}
            />
          </svg>
        </div>
      </div>

      <div className="focus-workspace-actions">
        <button className="btn-initialize" onClick={toggleTimer}>
          {isRunning ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          <span>{isRunning ? 'Pause' : 'Initialize'}</span>
        </button>
        <button className="btn-break" onClick={resetTimer}>
          <RotateCcw size={18} />
          <span>Break</span>
        </button>
      </div>

      <div className="focus-sync-status">
        <div className="status-dot" />
        Real-time sync active
      </div>
    </div>
  )
}
