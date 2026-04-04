import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from './AuthContext'
import { useTasks } from './TaskContext'
import { api } from '../services/api'
import { generateLocalInsightPayload } from '../utils/localInsights'

const AnalyticsContext = createContext(null)
const CATEGORY_KEYS = ['Work', 'Study', 'Personal', 'Health', 'Finance']
const SESSION_LENGTH_BUCKETS = [
  { key: 'quick', label: '<15 min', maxSeconds: 15 * 60 },
  { key: 'focus', label: '15-30 min', maxSeconds: 30 * 60 },
  { key: 'deep', label: '30-45 min', maxSeconds: 45 * 60 },
  { key: 'marathon', label: '45m+', maxSeconds: Number.POSITIVE_INFINITY },
]

const EMPTY_INSIGHTS = {
  insights: [],
  metrics: {
    peakWindow: { label: null, startHour: null, sessionCount: 0 },
    breakRate: 0,
    averageGapMinutes: 0,
    shortSessionShare: 0,
    longSessionShare: 0,
    shortDurationShare: 0,
    longDurationShare: 0,
    sessionCount: 0,
  },
  generatedAt: null,
}

function formatDateKey(date) {
  return date.toISOString().split('T')[0]
}

function formatMonthLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'short' })
}

function getSessionCategory(session, taskMap) {
  if (!session.task_id) return 'Work'
  return taskMap.get(session.task_id)?.category || 'Work'
}

function calculateStreaks(sessions) {
  if (sessions.length === 0) {
    return { currentStreak: 0, longestStreak: 0 }
  }

  const uniqueDays = [...new Set(sessions.map((session) => formatDateKey(new Date(session.created_at))))].sort()
  const dayTimes = uniqueDays.map((day) => new Date(`${day}T00:00:00`).getTime())

  let longestStreak = 1
  let currentRun = 1

  for (let index = 1; index < dayTimes.length; index += 1) {
    const dayDifference = Math.round((dayTimes[index] - dayTimes[index - 1]) / 86400000)
    if (dayDifference === 1) {
      currentRun += 1
      longestStreak = Math.max(longestStreak, currentRun)
    } else {
      currentRun = 1
    }
  }

  let currentStreak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const latestDay = new Date(`${uniqueDays[uniqueDays.length - 1]}T00:00:00`)
  latestDay.setHours(0, 0, 0, 0)
  const daysFromToday = Math.round((today - latestDay) / 86400000)

  if (daysFromToday <= 1) {
    currentStreak = 1
    for (let index = uniqueDays.length - 1; index > 0; index -= 1) {
      const currentDay = new Date(`${uniqueDays[index]}T00:00:00`).getTime()
      const previousDay = new Date(`${uniqueDays[index - 1]}T00:00:00`).getTime()
      const gap = Math.round((currentDay - previousDay) / 86400000)

      if (gap === 1) currentStreak += 1
      else break
    }
  }

  return { currentStreak, longestStreak }
}

function buildDailySeries(sessions, daysBack) {
  const labels = []
  const buckets = {}
  const now = new Date()

  for (let index = daysBack - 1; index >= 0; index -= 1) {
    const date = new Date(now)
    date.setDate(now.getDate() - index)
    const dateKey = formatDateKey(date)
    buckets[dateKey] = 0
    labels.push(
      daysBack <= 7
        ? date.toLocaleDateString(undefined, { weekday: 'short' })
        : `${date.toLocaleDateString(undefined, { month: 'short' })} ${date.getDate()}`
    )
  }

  sessions.forEach((session) => {
    const dateKey = formatDateKey(new Date(session.created_at))
    if (buckets[dateKey] !== undefined) {
      buckets[dateKey] += session.duration
    }
  })

  return {
    labels,
    data: Object.keys(buckets).map((key) => Number((buckets[key] / 3600).toFixed(2))),
  }
}

function buildMonthlySeries(sessions, monthsBack) {
  const now = new Date()
  const buckets = {}
  const labels = []

  for (let index = monthsBack - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    buckets[key] = 0
    labels.push(formatMonthLabel(date))
  }

  sessions.forEach((session) => {
    const createdAt = new Date(session.created_at)
    const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`
    if (buckets[key] !== undefined) {
      buckets[key] += session.duration
    }
  })

  return {
    labels,
    data: Object.keys(buckets).map((key) => Number((buckets[key] / 3600).toFixed(2))),
  }
}

function buildCategoryBreakdown(sessions, taskMap) {
  const totals = CATEGORY_KEYS.reduce((accumulator, category) => {
    accumulator[category] = 0
    return accumulator
  }, {})

  sessions.forEach((session) => {
    const category = getSessionCategory(session, taskMap)
    totals[category] += session.duration
  })

  const totalSeconds = Object.values(totals).reduce((sum, value) => sum + value, 0)

  return CATEGORY_KEYS.map((category) => {
    const hours = Number((totals[category] / 3600).toFixed(1))
    const share = totalSeconds === 0 ? 0 : Math.round((totals[category] / totalSeconds) * 100)
    return { category, hours, share }
  })
}

function buildCategoryTrend(sessions, taskMap) {
  const now = new Date()
  const weekBuckets = []

  for (let index = 3; index >= 0; index -= 1) {
    const end = new Date(now)
    end.setDate(now.getDate() - (index * 7))
    const start = new Date(end)
    start.setDate(end.getDate() - 6)
    weekBuckets.push({
      label: `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      start,
      end,
      totals: CATEGORY_KEYS.reduce((accumulator, category) => {
        accumulator[category] = 0
        return accumulator
      }, {}),
    })
  }

  sessions.forEach((session) => {
    const createdAt = new Date(session.created_at)
    const bucket = weekBuckets.find(({ start, end }) => createdAt >= start && createdAt <= end)
    if (!bucket) return
    const category = getSessionCategory(session, taskMap)
    bucket.totals[category] += session.duration
  })

  return {
    labels: weekBuckets.map((bucket) => bucket.label),
    datasets: CATEGORY_KEYS.map((category) => ({
      label: category,
      data: weekBuckets.map((bucket) => Number((bucket.totals[category] / 3600).toFixed(2))),
    })),
  }
}

function buildSessionLengthDistribution(sessions) {
  return SESSION_LENGTH_BUCKETS.map((bucket) => {
    const count = sessions.filter((session) => {
      const previousBucket = SESSION_LENGTH_BUCKETS[SESSION_LENGTH_BUCKETS.findIndex((item) => item.key === bucket.key) - 1]
      const minSeconds = previousBucket ? previousBucket.maxSeconds : 0
      return session.duration > minSeconds && session.duration <= bucket.maxSeconds
    }).length

    return {
      label: bucket.label,
      count,
    }
  })
}

function calculateMomentum(timeSeries7) {
  if (timeSeries7.data.length < 7) {
    return 0
  }

  const recent = timeSeries7.data.slice(-3).reduce((sum, value) => sum + Number(value), 0)
  const earlier = timeSeries7.data.slice(0, 4).reduce((sum, value) => sum + Number(value), 0)

  if (earlier === 0) {
    return recent > 0 ? 100 : 0
  }

  return Math.round(((recent - earlier) / earlier) * 100)
}

export function AnalyticsProvider({ children }) {
  const { user } = useAuth()
  const { tasks } = useTasks()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [analyticsError, setAnalyticsError] = useState(null)
  const [insights, setInsights] = useState(EMPTY_INSIGHTS.insights)
  const [insightMetrics, setInsightMetrics] = useState(EMPTY_INSIGHTS.metrics)
  const [generatedAt, setGeneratedAt] = useState(EMPTY_INSIGHTS.generatedAt)
  const [insightsLoading, setInsightsLoading] = useState(true)
  const [insightsError, setInsightsError] = useState(null)

  const fetchAnalytics = useCallback(async () => {
    if (!user) {
      setSessions([])
      setAnalyticsError(null)
      setInsights(EMPTY_INSIGHTS.insights)
      setInsightMetrics(EMPTY_INSIGHTS.metrics)
      setGeneratedAt(EMPTY_INSIGHTS.generatedAt)
      setInsightsError(null)
      setLoading(false)
      setInsightsLoading(false)
      return
    }

    setLoading(true)
    setInsightsLoading(true)

    const [sessionsResult, insightsResult] = await Promise.allSettled([
      supabase
        .from('focus_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000),
      api.get('/insights'),
    ])

    if (sessionsResult.status === 'fulfilled') {
      setSessions(sessionsResult.value.data || [])
      setAnalyticsError(null)
    } else {
      console.error('Error fetching focus sessions:', sessionsResult.reason)
      setSessions([])
      setAnalyticsError(sessionsResult.reason?.message || 'Unable to load focus history')
    }
    setLoading(false)

    if (insightsResult.status === 'fulfilled') {
      setInsights(insightsResult.value.insights || [])
      setInsightMetrics(insightsResult.value.metrics || EMPTY_INSIGHTS.metrics)
      setGeneratedAt(insightsResult.value.generatedAt || null)
      setInsightsError(null)
    } else {
      console.error('Error fetching insights:', insightsResult.reason)
      if (sessionsResult.status === 'fulfilled') {
        const localPayload = generateLocalInsightPayload(sessionsResult.value.data || [])
        setInsights(localPayload.insights || EMPTY_INSIGHTS.insights)
        setInsightMetrics(localPayload.metrics || EMPTY_INSIGHTS.metrics)
        setGeneratedAt(localPayload.generatedAt || null)
        setInsightsError(null)
      } else {
        setInsights(EMPTY_INSIGHTS.insights)
        setInsightMetrics(EMPTY_INSIGHTS.metrics)
        setGeneratedAt(null)
        setInsightsError('Unable to load insights right now.')
      }
    }
    setInsightsLoading(false)
  }, [user])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  // --- Computations ---

  // 1. Total Focus Hours
  const totalFocusSeconds = sessions.reduce((acc, s) => acc + s.duration, 0)
  const totalFocusHours = (totalFocusSeconds / 3600).toFixed(1)

  // 2. Efficiency (Completed Tasks / Total Tasks)
  const completedCount = tasks.filter(t => t.status === 'completed').length
  const totalCount = tasks.length
  const efficiency = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)
  const activeTaskCount = tasks.filter(t => t.status === 'in-progress').length
  const pendingTaskCount = tasks.filter(t => t.status !== 'completed').length
  const totalSessions = sessions.length
  const averageSessionMinutes = totalSessions === 0
    ? 0
    : Math.round(totalFocusSeconds / totalSessions / 60)
  const taskMap = new Map(tasks.map((task) => [task.id, task]))

  // 3. Category Distribution (Radar Chart)
  // Categories: 'Work', 'Study', 'Personal', 'Health', 'Finance'
  const categoryCounts = { Work: 0, Study: 0, Personal: 0, Health: 0, Finance: 0 }
  let maxCatCount = 0
  tasks.forEach(t => {
    const c = t.category || 'Work'
    if (categoryCounts[c] !== undefined) {
      categoryCounts[c]++
      if (categoryCounts[c] > maxCatCount) maxCatCount = categoryCounts[c]
    }
  })

  // Normalize out of 100 for the radar chart (if maxCatCount is 0, give small defaults)
  const radarDataArray = Object.keys(categoryCounts).map(cat => {
    if (maxCatCount === 0) return 20 // Default baseline
    return Math.max((categoryCounts[cat] / maxCatCount) * 100, 10)
  })

  const timeSeries7 = buildDailySeries(sessions, 7)
  const timeSeries30 = buildDailySeries(sessions, 30)
  const monthlySeries6 = buildMonthlySeries(sessions, 6)
  const categoryBreakdown = buildCategoryBreakdown(sessions, taskMap)
  const categoryTrend = buildCategoryTrend(sessions, taskMap)
  const sessionLengthDistribution = buildSessionLengthDistribution(sessions)
  const { currentStreak, longestStreak } = calculateStreaks(sessions)
  const bestDayHours = timeSeries30.data.length === 0 ? 0 : Math.max(...timeSeries30.data)
  const momentum = calculateMomentum(timeSeries7)
  const noAnalyticsData = sessions.length === 0

  const value = {
    loading,
    analyticsError,
    insightsLoading,
    insightsError,
    insights,
    insightMetrics,
    generatedAt,
    totalTasks: totalCount,
    completedTasks: completedCount,
    activeTaskCount,
    pendingTaskCount,
    totalSessions,
    averageSessionMinutes,
    currentStreak,
    longestStreak,
    bestDayHours,
    momentum,
    noAnalyticsData,
    totalFocusHours,
    efficiency,
    radarLabels: Object.keys(categoryCounts),
    radarData: radarDataArray,
    timeSeries7,
    timeSeries30,
    monthlySeries6,
    categoryBreakdown,
    categoryTrend,
    sessionLengthDistribution,
    refreshAnalytics: fetchAnalytics
  }

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext)
  if (!context) throw new Error('useAnalytics must be used within AnalyticsProvider')
  return context
}
