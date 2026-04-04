const MIN_SESSIONS_FOR_INSIGHTS = 3
const BREAK_THRESHOLD_MINUTES = 20
const EXCESSIVE_BREAK_RATE = 0.45
const SHORT_SESSION_MAX_SECONDS = 25 * 60
const LONG_SESSION_MIN_SECONDS = 45 * 60

function clampPercentage(value) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function formatHour(hour) {
  const normalized = ((hour % 24) + 24) % 24
  const period = normalized >= 12 ? 'PM' : 'AM'
  const displayHour = normalized % 12 || 12
  return `${displayHour} ${period}`
}

function getPeakWindow(sessions) {
  if (sessions.length === 0) return { label: null, startHour: null, count: 0 }

  const buckets = Array.from({ length: 24 }, () => 0)
  sessions.forEach((session) => {
    const hour = new Date(session.created_at).getHours()
    buckets[hour] += 1
  })

  let bestStart = 0
  let bestCount = -1
  for (let hour = 0; hour < 24; hour += 1) {
    const count = buckets[hour] + buckets[(hour + 1) % 24]
    if (count > bestCount) {
      bestCount = count
      bestStart = hour
    }
  }
  return {
    label: `${formatHour(bestStart)}-${formatHour(bestStart + 2)}`,
    startHour: bestStart,
    count: bestCount,
  }
}

function getBreakMetrics(sessions) {
  if (sessions.length < 2) {
    return { gapCount: 0, breakRate: 0, averageGapMinutes: 0 }
  }
  const sorted = [...sessions].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  let gapCount = 0
  let longBreaks = 0
  let totalGapMinutes = 0

  for (let index = 1; index < sorted.length; index += 1) {
    const previousEnd = new Date(sorted[index - 1].created_at).getTime() + (sorted[index - 1].duration * 1000)
    const currentStart = new Date(sorted[index].created_at).getTime()
    const gapMinutes = Math.max(0, Math.round((currentStart - previousEnd) / 60000))
    gapCount += 1
    totalGapMinutes += gapMinutes
    if (gapMinutes > BREAK_THRESHOLD_MINUTES) {
      longBreaks += 1
    }
  }

  return {
    gapCount,
    breakRate: gapCount ? longBreaks / gapCount : 0,
    averageGapMinutes: gapCount ? Math.round(totalGapMinutes / gapCount) : 0,
  }
}

function buildInsights(metrics) {
  if (metrics.sessionCount < MIN_SESSIONS_FOR_INSIGHTS) {
    return [{
      id: 'baseline',
      title: 'Building your baseline',
      message: 'Complete a few more focus sessions to unlock stronger personalized insight.',
      tone: 'neutral',
    }]
  }

  const insights = []
  if (metrics.peakWindow.label) {
    insights.push({
      id: 'peak-hours',
      title: 'Peak focus hours',
      message: `You focus best between ${metrics.peakWindow.label}.`,
      tone: 'positive',
    })
  }

  if (metrics.breakRate >= EXCESSIVE_BREAK_RATE) {
    insights.push({
      id: 'break-balance',
      title: 'Break balance',
      message: `Breaks may be too long recently (avg ${metrics.averageGapMinutes} mins).`,
      tone: 'warning',
    })
  } else {
    insights.push({
      id: 'break-balance',
      title: 'Break balance',
      message: `Break rhythm is stable (avg ${metrics.averageGapMinutes} mins).`,
      tone: 'positive',
    })
  }

  const shortLead = metrics.shortSessionShare - metrics.longSessionShare >= 20
    || metrics.shortDurationShare - metrics.longDurationShare >= 15

  if (shortLead) {
    insights.push({
      id: 'session-shape',
      title: 'Session pattern',
      message: 'Shorter sessions are currently driving more output for you.',
      tone: 'positive',
    })
  } else {
    insights.push({
      id: 'session-shape',
      title: 'Session pattern',
      message: 'Long and short sessions are currently balanced.',
      tone: 'neutral',
    })
  }

  const consistencyScore = clampPercentage(
    (metrics.sessionCount >= 10 ? 45 : metrics.sessionCount * 4)
    + (100 - metrics.breakRate) * 0.2,
  )

  insights.push({
    id: 'consistency',
    title: 'Consistency score',
    message: `Your current focus consistency is ${consistencyScore}/100.`,
    tone: consistencyScore >= 70 ? 'positive' : 'neutral',
  })

  return insights.slice(0, 4)
}

export function generateLocalInsightPayload(sessions) {
  const peakWindow = getPeakWindow(sessions)
  const breakMetrics = getBreakMetrics(sessions)
  const shortSessions = sessions.filter((session) => session.duration <= SHORT_SESSION_MAX_SECONDS)
  const longSessions = sessions.filter((session) => session.duration >= LONG_SESSION_MIN_SECONDS)
  const totalDuration = sessions.reduce((sum, session) => sum + session.duration, 0)
  const shortDuration = shortSessions.reduce((sum, session) => sum + session.duration, 0)
  const longDuration = longSessions.reduce((sum, session) => sum + session.duration, 0)

  const metrics = {
    sessionCount: sessions.length,
    peakWindow: {
      label: peakWindow.label,
      startHour: peakWindow.startHour,
      sessionCount: peakWindow.count,
    },
    breakRate: clampPercentage(breakMetrics.breakRate * 100),
    averageGapMinutes: breakMetrics.averageGapMinutes,
    shortSessionShare: clampPercentage((shortSessions.length / Math.max(1, sessions.length)) * 100),
    longSessionShare: clampPercentage((longSessions.length / Math.max(1, sessions.length)) * 100),
    shortDurationShare: clampPercentage((shortDuration / Math.max(1, totalDuration)) * 100),
    longDurationShare: clampPercentage((longDuration / Math.max(1, totalDuration)) * 100),
  }

  return {
    insights: buildInsights(metrics),
    metrics,
    generatedAt: new Date().toISOString(),
    source: 'local',
  }
}
