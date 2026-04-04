import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react'
import { useTasks } from './TaskContext'
import { supabase } from '../services/supabaseClient'
import { useAuth } from './AuthContext'
import { useAnalytics } from './AnalyticsContext'

const FocusContext = createContext(null)

export const FOCUS_MODES = {
  POMODORO: { key: 'pomodoro', label: 'Pomodoro', duration: 25 * 60 },
  SHORT_BREAK: { key: 'shortBreak', label: 'Short Break', duration: 5 * 60 },
  LONG_BREAK: { key: 'longBreak', label: 'Long Break', duration: 15 * 60 },
}

export function FocusProvider({ children }) {
  const { user } = useAuth()
  const { updateTask } = useTasks()
  const { refreshAnalytics } = useAnalytics()
  const [currentMode, setCurrentMode] = useState(FOCUS_MODES.POMODORO)
  const [timeRemaining, setTimeRemaining] = useState(currentMode.duration)
  const [isRunning, setIsRunning] = useState(false)
  const [activeTaskId, setActiveTaskId] = useState(null)

  const intervalRef = useRef(null)
  
  // Use a ref to access the completely up-to-date states within setInterval callbacks
  const stateRef = useRef({ currentMode, activeTaskId })
  useEffect(() => {
    stateRef.current = { currentMode, activeTaskId }
  }, [currentMode, activeTaskId])

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsRunning(false)
  }, [])

  const setMode = useCallback((modeKey) => {
    stopTimer()
    const newMode = FOCUS_MODES[modeKey.toUpperCase()] || FOCUS_MODES.POMODORO
    setCurrentMode(newMode)
    setTimeRemaining(newMode.duration)
  }, [stopTimer])

  const recordSession = useCallback(async (taskId) => {
    if (!user) return
    try {
      await supabase.from('focus_sessions').insert([{
        user_id: user.id,
        duration: FOCUS_MODES.POMODORO.duration,
        task_id: taskId || null
      }])
      await refreshAnalytics()
    } catch (err) {
      console.error('Failed to log session', err)
    }
  }, [refreshAnalytics, user])

  const handleComplete = useCallback(() => {
    stopTimer()
    
    // Play sound notification
    try {
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3')
      audio.volume = 0.5
      audio.play().catch(() => {})
    } catch (e) {
      // Ignored if blocked
    }

    const { currentMode: mode, activeTaskId: taskId } = stateRef.current

    // Session Logic
    if (mode.key === FOCUS_MODES.POMODORO.key) {
      recordSession(taskId)
      setMode('SHORT_BREAK')
      // Auto-start break? Wait, better to let user start break.
    } else {
      setMode('POMODORO')
    }
  }, [stopTimer, setMode, recordSession])

  const startTimer = useCallback(() => {
    if (isRunning) return
    setIsRunning(true)
    
    // Auto status update for tasks! 
    if (stateRef.current.activeTaskId && stateRef.current.currentMode.key === FOCUS_MODES.POMODORO.key) {
      updateTask(stateRef.current.activeTaskId, { status: 'in-progress' }).catch(() => {})
    }
    
    intervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [isRunning, handleComplete, updateTask])

  const toggleTimer = useCallback(() => {
    if (isRunning) stopTimer()
    else startTimer()
  }, [isRunning, startTimer, stopTimer])

  const resetTimer = useCallback(() => {
    stopTimer()
    setTimeRemaining(currentMode.duration)
  }, [stopTimer, currentMode])

  // Cleanup on unmount (though this context rarely unmounts)
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const value = {
    isRunning,
    timeRemaining,
    currentMode,
    activeTaskId,
    setActiveTaskId,
    toggleTimer,
    setMode,
    resetTimer
  }

  return (
    <FocusContext.Provider value={value}>
      {children}
    </FocusContext.Provider>
  )
}

export function useFocus() {
  const context = useContext(FocusContext)
  if (!context) throw new Error('useFocus must be used within FocusProvider')
  return context
}
