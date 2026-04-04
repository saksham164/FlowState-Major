import { useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import { Activity, Flame, RefreshCw, Timer, TrendingUp } from 'lucide-react'
import { useAnalytics } from '../context/AnalyticsContext'
import './Analytics.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function Analytics() {
  const {
    loading,
    analyticsError,
    totalFocusHours,
    efficiency,
    totalSessions,
    averageSessionMinutes,
    currentStreak,
    longestStreak,
    bestDayHours,
    momentum,
    noAnalyticsData,
    timeSeries7,
    timeSeries30,
    monthlySeries6,
    categoryBreakdown,
    categoryTrend,
    sessionLengthDistribution,
    refreshAnalytics,
  } = useAnalytics()
  
  const [chartType, setChartType] = useState('line') // 'line' | 'bar'
  const [timeRange, setTimeRange] = useState('30d') // '7d' | '30d' | '6m'

  const activeSeries = timeRange === '7d'
    ? timeSeries7
    : timeRange === '30d'
      ? timeSeries30
      : monthlySeries6

  const chartData = {
    labels: activeSeries.labels,
    datasets: [
      {
        label: 'Focus Hours',
        data: activeSeries.data,
        backgroundColor: 'rgba(0, 108, 73, 0.2)',
        borderColor: '#006C49',
        borderWidth: 2,
        pointBackgroundColor: '#FFFFFF',
        pointBorderColor: '#006C49',
        pointBorderWidth: 2,
        pointRadius: 4,
        fill: chartType === 'line',
        tension: 0.3, // smooth curves for line chart
        borderRadius: chartType === 'bar' ? 4 : 0, // rounded bars
      }
    ]
  }

  const categoryColors = ['#10B981', '#0F766E', '#F59E0B', '#2563EB', '#8B5CF6']

  const categoryTrendData = {
    labels: categoryTrend.labels,
    datasets: categoryTrend.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: `${categoryColors[index]}CC`,
      borderRadius: 8,
      borderSkipped: false,
      stack: 'focus',
    })),
  }

  const distributionData = {
    labels: sessionLengthDistribution.map((bucket) => bucket.label),
    datasets: [
      {
        label: 'Sessions',
        data: sessionLengthDistribution.map((bucket) => bucket.count),
        backgroundColor: ['#10B981', '#22C55E', '#F59E0B', '#2563EB'],
        borderRadius: 10,
      },
    ],
  }

  const categoryBreakdownData = {
    labels: categoryBreakdown.map((item) => item.category),
    datasets: [
      {
        label: 'Focus Hours',
        data: categoryBreakdown.map((item) => item.hours),
        backgroundColor: categoryColors,
        borderRadius: 10,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(25, 28, 30, 0.9)',
        titleFont: { family: 'Inter', size: 13 },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 12,
        cornerRadius: 4,
        displayColors: false,
        callbacks: {
          label: (context) => `${context.parsed.y} hrs`,
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter' }, color: '#404944' }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { font: { family: 'Inter' }, color: '#404944' }
      }
    }
  }

  const stackedBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y} hrs`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { color: '#475569' },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: { color: 'rgba(148, 163, 184, 0.12)' },
        ticks: { color: '#475569' },
      },
    },
  }

  const compactBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#475569' },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(148, 163, 184, 0.12)' },
        ticks: { color: '#475569' },
      },
    },
  }

  const ChartComponent = chartType === 'line' ? Line : Bar
  const statCards = [
    { icon: Activity, label: 'Total Focus', value: `${totalFocusHours} hrs`, meta: `${totalSessions} sessions logged` },
    { icon: TrendingUp, label: 'Task Efficiency', value: `${efficiency}%`, meta: `${momentum >= 0 ? '+' : ''}${momentum}% recent momentum` },
    { icon: Flame, label: 'Current Streak', value: `${currentStreak} days`, meta: `Longest streak ${longestStreak} days` },
    { icon: Timer, label: 'Avg Session', value: `${averageSessionMinutes} min`, meta: `Best day ${bestDayHours} hrs` },
  ]

  return (
    <div className="analytics-page animate-fadeIn">
      <header className="analytics-header">
        <div>
          <h1 className="text-display">Analytics</h1>
          <p className="text-body">Track your flow state progression with longer-range trends and session pattern signals.</p>
        </div>
        <button className="analytics-refresh-btn" onClick={refreshAnalytics} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </header>

      <div className="analytics-stats-grid">
        {statCards.map(({ icon: Icon, label, value, meta }) => (
          <div className="analytics-stat-card" key={label}>
            <div className="analytics-stat-icon">
              <Icon size={20} />
            </div>
            <div className="stat-label-large">{label}</div>
            <div className="stat-value-huge">{value}</div>
            <div className="analytics-stat-meta">{meta}</div>
          </div>
        ))}
      </div>

      {analyticsError ? (
        <div className="analytics-state-card">
          <h3 className="text-title">Unable to load focus history</h3>
          <p className="text-body-sm">{analyticsError}</p>
        </div>
      ) : noAnalyticsData ? (
        <div className="analytics-state-card">
          <h3 className="text-title">Analytics will appear after your first sessions</h3>
          <p className="text-body-sm">Complete a few focus sessions to unlock trend, streak, and session-distribution reporting.</p>
        </div>
      ) : null}

      {!analyticsError && !noAnalyticsData && (
        <>
          <div className="chart-container">
            <div className="chart-header">
              <div>
                <h3 className="text-title">Focus Trend</h3>
                <p className="text-body-sm">Switch between daily and monthly windows to inspect your productivity rhythm.</p>
              </div>
              
              <div className="chart-controls">
                <div className="toggle-group">
                  <button 
                    className={`toggle-btn ${chartType === 'line' ? 'active' : ''}`}
                    onClick={() => setChartType('line')}
                  >
                    Line
                  </button>
                  <button 
                    className={`toggle-btn ${chartType === 'bar' ? 'active' : ''}`}
                    onClick={() => setChartType('bar')}
                  >
                    Bar
                  </button>
                </div>
                
                <div className="toggle-group">
                  <button 
                    className={`toggle-btn ${timeRange === '7d' ? 'active' : ''}`}
                    onClick={() => setTimeRange('7d')}
                  >
                    7 Days
                  </button>
                  <button 
                    className={`toggle-btn ${timeRange === '30d' ? 'active' : ''}`}
                    onClick={() => setTimeRange('30d')}
                  >
                    30 Days
                  </button>
                  <button 
                    className={`toggle-btn ${timeRange === '6m' ? 'active' : ''}`}
                    onClick={() => setTimeRange('6m')}
                  >
                    6 Months
                  </button>
                </div>
              </div>
            </div>

            <div className="chart-canvas-wrapper">
              <ChartComponent data={chartData} options={chartOptions} />
            </div>
          </div>

          <div className="analytics-grid">
            <div className="chart-container">
              <div className="chart-header">
                <div>
                  <h3 className="text-title">Category Trend</h3>
                  <p className="text-body-sm">Weekly focus hours split by task category.</p>
                </div>
              </div>
              <div className="chart-canvas-wrapper analytics-chart-sm">
                <Bar data={categoryTrendData} options={stackedBarOptions} />
              </div>
            </div>

            <div className="chart-container">
              <div className="chart-header">
                <div>
                  <h3 className="text-title">Session Distribution</h3>
                  <p className="text-body-sm">How your session lengths are currently spread.</p>
                </div>
              </div>
              <div className="chart-canvas-wrapper analytics-chart-sm">
                <Bar data={distributionData} options={compactBarOptions} />
              </div>
            </div>
          </div>

          <div className="analytics-grid">
            <div className="chart-container">
              <div className="chart-header">
                <div>
                  <h3 className="text-title">Category Breakdown</h3>
                  <p className="text-body-sm">Total focus hours logged against each task category.</p>
                </div>
              </div>
              <div className="chart-canvas-wrapper analytics-chart-sm">
                <Bar data={categoryBreakdownData} options={compactBarOptions} />
              </div>
            </div>

            <div className="analytics-summary-card">
              <div className="analytics-summary-block">
                <span className="text-label">Best Day</span>
                <strong>{bestDayHours} hrs</strong>
                <p className="text-body-sm">Highest focus output in the last 30 days.</p>
              </div>
              <div className="analytics-summary-block">
                <span className="text-label">Momentum</span>
                <strong>{momentum >= 0 ? '+' : ''}{momentum}%</strong>
                <p className="text-body-sm">Compares your most recent 3 days against the earlier 4 days.</p>
              </div>
              <div className="analytics-summary-block">
                <span className="text-label">Top Categories</span>
                <div className="analytics-breakdown-list">
                  {categoryBreakdown
                    .filter((item) => item.hours > 0)
                    .sort((a, b) => b.hours - a.hours)
                    .slice(0, 3)
                    .map((item) => (
                      <div className="analytics-breakdown-row" key={item.category}>
                        <span>{item.category}</span>
                        <span>{item.hours} hrs</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
