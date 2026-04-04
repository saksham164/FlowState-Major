import { RotateCcw, Coffee } from 'lucide-react'
import { useFocus } from '../../context/FocusContext'
import './FocusCard.css'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function FocusCard() {
  const { timeRemaining, isRunning, toggleTimer, resetTimer, currentMode } = useFocus()

  const buttonLabel = isRunning ? 'Pause' 
                    : timeRemaining < currentMode.duration ? 'Resume' 
                    : 'Start'

  return (
    <div className="focus-card animate-fadeIn">
      <div className="focus-label">Focus Session</div>
      <div className="focus-time">{formatTime(timeRemaining)}</div>
      <div className="focus-actions">
        <button className="btn-start" onClick={toggleTimer}>{buttonLabel}</button>
        <button className="btn-reset" onClick={resetTimer} aria-label="Reset timer">
          <RotateCcw size={20} />
        </button>
      </div>
      <div className="focus-break">
        <Coffee size={14} style={{ display: 'inline', verticalAlign: '-2px' }} />
        {' '}Short break in {Math.ceil(timeRemaining / 60)} mins
      </div>
    </div>
  )
}
