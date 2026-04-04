import { useEffect, useRef, useState } from 'react'
import { BrainCircuit, ArrowRight, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTasks } from '../../context/TaskContext'
import './DeepWorkZone.css'

export default function DeepWorkZone() {
  const { tasks } = useTasks()
  const navigate = useNavigate()
  const [stage, setStage] = useState('idle')
  const [countdown, setCountdown] = useState(3)
  const [rippleTick, setRippleTick] = useState(0)
  const launchTimeoutRef = useRef(null)

  // Find the next high/medium priority task that isn't completed
  const nextTask = tasks
    .filter(t => t.status !== 'completed')
    .sort((a, b) => {
      const priorityMap = { urgent: 0, high: 1, medium: 2, low: 3 }
      return (priorityMap[a.priority] || 4) - (priorityMap[b.priority] || 4)
    })[0]

  useEffect(() => {
    if (stage !== 'primed') return undefined

    const countdownInterval = setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          clearInterval(countdownInterval)
          setStage('launching')
          launchTimeoutRef.current = setTimeout(() => {
            navigate('/focus')
          }, 300)
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => {
      clearInterval(countdownInterval)
    }
  }, [navigate, stage])

  useEffect(() => {
    return () => {
      if (launchTimeoutRef.current) {
        clearTimeout(launchTimeoutRef.current)
      }
    }
  }, [])

  const handleStart = () => {
    setRippleTick((tick) => tick + 1)

    if (!nextTask) {
      navigate('/tasks')
      return
    }

    if (stage === 'idle') {
      setCountdown(3)
      setStage('primed')
      return
    }

    if (stage === 'primed') {
      setCountdown(3)
      setStage('idle')
    }
  }

  const buttonLabel = !nextTask
    ? 'PLAN SESSION'
    : stage === 'idle'
      ? 'READY?'
      : stage === 'primed'
        ? `LOCK IN (${countdown})`
        : 'LAUNCHING'

  const helperText = !nextTask
    ? 'No active priority task detected. Open Tasks to create your next deep focus session.'
    : stage === 'idle'
      ? 'Tap READY to start a short launch sequence before entering focus mode.'
      : stage === 'primed'
        ? 'Breath in, clear distractions, and lock into this session.'
        : 'Entering Focus Mode...'

  return (
    <div className="deep-work-zone animate-fadeIn" style={{ animationDelay: '0.15s' }}>
      <div className="zone-header">
        <h3 className="text-label">Deep Work Zone</h3>
        <BrainCircuit size={18} className="zone-icon" />
      </div>

      <div className={`zone-content card zone-${stage}`}>
        <div className="session-prompt">
          <span className="prompt-title">Next Session</span>
          <p className="prompt-text">
            {nextTask ? (
              <>Focus on <span className="task-highlight">"{nextTask.name}"</span> starts now.</>
            ) : (
              "No tasks scheduled. Ready to start something new?"
            )}
          </p>
          <p className="prompt-helper">{helperText}</p>
        </div>

        <div className="zone-status-row">
          <span className={`zone-status-dot ${stage}`}></span>
          <span className="zone-status-text">
            {stage === 'idle' && 'Standby'}
            {stage === 'primed' && 'Primed'}
            {stage === 'launching' && 'Launching'}
          </span>
        </div>

        <button className={`btn-ready btn-stage-${stage}`} onClick={handleStart} disabled={stage === 'launching'}>
          <span>{buttonLabel}</span>
          {stage === 'idle' ? <ArrowRight size={18} /> : <Sparkles size={18} />}
          <span className="ready-ripple" key={rippleTick}></span>
        </button>
      </div>
    </div>
  )
}
