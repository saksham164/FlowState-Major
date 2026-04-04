import { Play, Pause, RotateCcw, BrainCircuit } from 'lucide-react'
import { useFocus, FOCUS_MODES } from '../context/FocusContext'
import { useTasks } from '../context/TaskContext'
import './FocusTimer.css'

export default function FocusTimer() {
  const { 
    timeRemaining, 
    isRunning, 
    toggleTimer, 
    resetTimer, 
    currentMode, 
    setMode,
    activeTaskId,
    setActiveTaskId
  } = useFocus()

  const { tasks } = useTasks()
  const pendingTasks = tasks.filter(t => t.status !== 'completed')

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // Calculate circumference for circular progress
  const radius = 140
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (timeRemaining / currentMode.duration) * circumference

  return (
    <div className="focus-page animate-fadeIn">
      <header className="focus-header">
        <div>
          <h1 className="text-display">Deep Work</h1>
          <p className="text-body">Eliminate the noise. Focus on what matters.</p>
        </div>
        
        <div className="task-selector-wrapper">
          <BrainCircuit size={18} className="task-selector-icon" />
          <select 
            className="task-selector"
            value={activeTaskId || ''}
            onChange={(e) => setActiveTaskId(e.target.value)}
          >
            <option value="">Select a task to focus on...</option>
            {pendingTasks.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="focus-timer-container">
        {/* Modes */}
        <div className="focus-modes">
          <button 
            className={`mode-btn ${currentMode.key === FOCUS_MODES.POMODORO.key ? 'active' : ''}`}
            onClick={() => setMode('POMODORO')}
          >
            Pomodoro
          </button>
          <button 
            className={`mode-btn ${currentMode.key === FOCUS_MODES.SHORT_BREAK.key ? 'active' : ''}`}
            onClick={() => setMode('SHORT_BREAK')}
          >
            Short Break
          </button>
          <button 
            className={`mode-btn ${currentMode.key === FOCUS_MODES.LONG_BREAK.key ? 'active' : ''}`}
            onClick={() => setMode('LONG_BREAK')}
          >
            Long Break
          </button>
        </div>

        {/* Circular Timer Ring */}
        <div className="timer-ring-container">
          <svg className="timer-svg" width="320" height="320">
            <circle
              className="timer-circle-bg"
              cx="160" cy="160" r={radius}
            />
            <circle
              className="timer-circle-progress"
              cx="160" cy="160" r={radius}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
              }}
            />
          </svg>
          <div className="timer-display-huge">
            {formatTime(timeRemaining)}
          </div>
        </div>

        {/* Controls */}
        <div className="timer-controls">
          <button className="btn-play-huge" onClick={toggleTimer}>
            {isRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" style={{ marginLeft: '4px' }}/>}
          </button>
          <button className="btn-reset-huge" onClick={resetTimer} aria-label="Reset Timer">
            <RotateCcw size={24} />
          </button>
        </div>
      </div>
    </div>
  )
}
