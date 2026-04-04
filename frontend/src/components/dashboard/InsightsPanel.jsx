import { AlertTriangle, BrainCircuit, CheckCircle2, Clock3, RefreshCw } from 'lucide-react'
import { useAnalytics } from '../../context/AnalyticsContext'
import './InsightsPanel.css'

export default function InsightsPanel() {
  const { insights, insightMetrics, insightsLoading, insightsError, generatedAt } = useAnalytics()

  const getToneIcon = (tone) => {
    if (tone === 'warning') return AlertTriangle
    if (tone === 'positive') return CheckCircle2
    return BrainCircuit
  }

  return (
    <div className="card insights-panel animate-fadeIn" style={{ animationDelay: '0.05s' }}>
      <div className="card-header insights-header">
        <div>
          <h3 className="text-title">AI Insights</h3>
          <p className="text-body-sm">Adaptive coaching from your recent focus history.</p>
        </div>
        <div className="insights-generated-at">
          <Clock3 size={14} />
          {insightsLoading ? 'Refreshing...' : generatedAt ? new Date(generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
        </div>
      </div>

      <div className="insight-stats">
        <div className="insight-stat">
          <div className="stat-label">Peak Window</div>
          <div className="stat-value">
            {insightsLoading ? <RefreshCw className="animate-spin" size={16} /> : (insightMetrics.peakWindow.label || 'Not enough data')}
          </div>
        </div>
        <div className="insight-stat">
          <div className="stat-label">Break Rate</div>
          <div className="stat-value">
            {insightsLoading ? <RefreshCw className="animate-spin" size={16} /> : `${insightMetrics.breakRate}%`}
          </div>
        </div>
      </div>

      <div className="insight-list">
        {insightsLoading ? (
          <div className="insight-item insight-item-loading">
            <RefreshCw className="animate-spin" size={16} />
            <span className="text-body-sm">Generating personalized insights...</span>
          </div>
        ) : insightsError ? (
          <div className="insight-item insight-item-warning">
            <div className="insight-item-icon">
              <AlertTriangle size={16} />
            </div>
            <span className="text-body-sm">Insights service temporarily unavailable. Try refresh.</span>
          </div>
        ) : insights.length === 0 ? (
          <div className="insight-item insight-item-neutral">
            <div className="insight-item-icon">
              <BrainCircuit size={16} />
            </div>
            <span className="text-body-sm">No insights yet. Finish a few sessions to build your baseline.</span>
          </div>
        ) : (
          insights.map((insight) => {
            const Icon = getToneIcon(insight.tone)
            return (
              <div className={`insight-item insight-item-${insight.tone || 'neutral'}`} key={insight.id}>
                <div className="insight-item-icon">
                  <Icon size={16} />
                </div>
                <div>
                  <div className="insight-item-title">{insight.title}</div>
                  <div className="text-body-sm">{insight.message}</div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
