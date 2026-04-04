const MIN_SESSIONS_FOR_INSIGHTS = 3;
const BREAK_THRESHOLD_MINUTES = 20;
const EXCESSIVE_BREAK_RATE = 0.45;
const SHORT_SESSION_MAX_SECONDS = 25 * 60;
const LONG_SESSION_MIN_SECONDS = 45 * 60;
const GOOD_CONSISTENCY_SCORE = 70;

function clampPercentage(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatHour(hour) {
  const normalized = ((hour % 24) + 24) % 24;
  const period = normalized >= 12 ? 'PM' : 'AM';
  const displayHour = normalized % 12 || 12;
  return `${displayHour} ${period}`;
}

function formatWindow(startHour) {
  return `${formatHour(startHour)}-${formatHour(startHour + 2)}`;
}

function getPeakWindow(sessions) {
  if (sessions.length === 0) {
    return { label: null, startHour: null, count: 0 };
  }

  const buckets = Array.from({ length: 24 }, () => 0);
  sessions.forEach((session) => {
    const hour = new Date(session.created_at).getHours();
    buckets[hour] += 1;
  });

  let bestStartHour = 0;
  let bestCount = -1;

  for (let hour = 0; hour < 24; hour += 1) {
    const count = buckets[hour] + buckets[(hour + 1) % 24];
    if (count > bestCount) {
      bestCount = count;
      bestStartHour = hour;
    }
  }

  return {
    label: formatWindow(bestStartHour),
    startHour: bestStartHour,
    count: bestCount,
  };
}

function getBreakMetrics(sessions) {
  if (sessions.length < 2) {
    return {
      gapCount: 0,
      excessiveBreakCount: 0,
      breakRate: 0,
      averageGapMinutes: 0,
    };
  }

  const sorted = [...sessions].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  let excessiveBreakCount = 0;
  let gapCount = 0;
  let totalGapMinutes = 0;

  for (let index = 1; index < sorted.length; index += 1) {
    const previousSession = sorted[index - 1];
    const currentSession = sorted[index];
    const previousEnd = new Date(previousSession.created_at).getTime() + (previousSession.duration * 1000);
    const currentStart = new Date(currentSession.created_at).getTime();
    const gapMinutes = Math.max(0, Math.round((currentStart - previousEnd) / 60000));

    gapCount += 1;
    totalGapMinutes += gapMinutes;
    if (gapMinutes > BREAK_THRESHOLD_MINUTES) {
      excessiveBreakCount += 1;
    }
  }

  return {
    gapCount,
    excessiveBreakCount,
    breakRate: gapCount === 0 ? 0 : excessiveBreakCount / gapCount,
    averageGapMinutes: gapCount === 0 ? 0 : Math.round(totalGapMinutes / gapCount),
  };
}

function getSessionPatternMetrics(sessions) {
  const shortSessions = sessions.filter((session) => session.duration <= SHORT_SESSION_MAX_SECONDS);
  const longSessions = sessions.filter((session) => session.duration >= LONG_SESSION_MIN_SECONDS);
  const totalDuration = sessions.reduce((sum, session) => sum + session.duration, 0);
  const shortDuration = shortSessions.reduce((sum, session) => sum + session.duration, 0);
  const longDuration = longSessions.reduce((sum, session) => sum + session.duration, 0);

  return {
    shortSessionCount: shortSessions.length,
    longSessionCount: longSessions.length,
    shortSessionShare: sessions.length === 0 ? 0 : shortSessions.length / sessions.length,
    longSessionShare: sessions.length === 0 ? 0 : longSessions.length / sessions.length,
    shortDurationShare: totalDuration === 0 ? 0 : shortDuration / totalDuration,
    longDurationShare: totalDuration === 0 ? 0 : longDuration / totalDuration,
    averageDurationMinutes: sessions.length === 0 ? 0 : Math.round(totalDuration / sessions.length / 60),
  };
}

function getCadenceMetrics(sessions) {
  if (sessions.length === 0) {
    return { activeDays: 0, cadenceScore: 0 };
  }
  const uniqueDays = new Set(
    sessions.map((session) => new Date(session.created_at).toISOString().split('T')[0]),
  );

  const cadenceScore = clampPercentage(
    Math.min(70, uniqueDays.size * 7) + Math.min(30, sessions.length * 1.5),
  );

  return {
    activeDays: uniqueDays.size,
    cadenceScore,
  };
}

function buildInsights(metrics) {
  const insights = [];

  if (metrics.sessionCount < MIN_SESSIONS_FOR_INSIGHTS) {
    insights.push({
      id: 'building-baseline',
      title: 'Building your baseline',
      message: 'Complete a few more focus sessions to unlock more personalized insight patterns.',
      tone: 'neutral',
    });
    return insights;
  }

  if (metrics.peakWindow.label) {
    insights.push({
      id: 'peak-hours',
      title: 'Peak focus hours',
      message: `You focus best between ${metrics.peakWindow.label}.`,
      tone: 'positive',
    });
  }

  if (metrics.breakRate >= EXCESSIVE_BREAK_RATE) {
    insights.push({
      id: 'break-pattern',
      title: 'Break pattern',
      message: `You take longer breaks than usual between sessions. Your average gap is ${metrics.averageGapMinutes} minutes.`,
      tone: 'warning',
    });
  } else if (metrics.gapCount > 0) {
    insights.push({
      id: 'break-pattern',
      title: 'Break pattern',
      message: `Your breaks are staying fairly consistent, with an average gap of ${metrics.averageGapMinutes} minutes.`,
      tone: 'positive',
    });
  }

  const shortProductivityLead = metrics.shortSessionShare - metrics.longSessionShare >= 0.2
    || metrics.shortDurationShare - metrics.longDurationShare >= 0.15;

  const longProductivityLead = metrics.longSessionShare - metrics.shortSessionShare >= 0.2
    || metrics.longDurationShare - metrics.shortDurationShare >= 0.15;

  if (shortProductivityLead) {
    insights.push({
      id: 'session-pattern',
      title: 'Session pattern',
      message: 'You are more productive in shorter sessions right now.',
      tone: 'positive',
    });
  } else if (longProductivityLead) {
    insights.push({
      id: 'session-pattern',
      title: 'Session pattern',
      message: 'You are sustaining productivity well in longer sessions.',
      tone: 'positive',
    });
  } else {
    insights.push({
      id: 'session-pattern',
      title: 'Session pattern',
      message: 'Your productivity is balanced between shorter and longer sessions.',
      tone: 'neutral',
    });
  }

  if (metrics.cadenceScore >= GOOD_CONSISTENCY_SCORE) {
    insights.push({
      id: 'consistency',
      title: 'Consistency',
      message: `Strong routine detected (${metrics.cadenceScore}/100). Keep your current rhythm.`,
      tone: 'positive',
    });
  } else {
    insights.push({
      id: 'consistency',
      title: 'Consistency',
      message: `Consistency is ${metrics.cadenceScore}/100. Try one extra focused session on low-activity days.`,
      tone: 'neutral',
    });
  }

  return insights.slice(0, 4);
}

function generateInsightPayload(sessions) {
  const peakWindow = getPeakWindow(sessions);
  const breakMetrics = getBreakMetrics(sessions);
  const sessionPatternMetrics = getSessionPatternMetrics(sessions);
  const cadenceMetrics = getCadenceMetrics(sessions);

  const metrics = {
    sessionCount: sessions.length,
    peakWindow: {
      label: peakWindow.label,
      startHour: peakWindow.startHour,
      sessionCount: peakWindow.count,
    },
    breakRate: clampPercentage(breakMetrics.breakRate * 100),
    averageGapMinutes: breakMetrics.averageGapMinutes,
    shortSessionShare: clampPercentage(sessionPatternMetrics.shortSessionShare * 100),
    longSessionShare: clampPercentage(sessionPatternMetrics.longSessionShare * 100),
    shortDurationShare: clampPercentage(sessionPatternMetrics.shortDurationShare * 100),
    longDurationShare: clampPercentage(sessionPatternMetrics.longDurationShare * 100),
    averageSessionMinutes: sessionPatternMetrics.averageDurationMinutes,
    activeDays: cadenceMetrics.activeDays,
    cadenceScore: cadenceMetrics.cadenceScore,
  };

  return {
    insights: buildInsights({
      ...metrics,
      gapCount: breakMetrics.gapCount,
    }),
    metrics,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  generateInsightPayload,
};
