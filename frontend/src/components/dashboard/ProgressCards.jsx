import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js'
import { Line } from 'react-chartjs-2'
import { CheckCircle2, Clock3, TimerReset, Zap } from 'lucide-react'
import { useAnalytics } from '../../context/AnalyticsContext'
import './ProgressCards.css'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

export default function ProgressCards() {
  const {
    totalTasks,
    completedTasks,
    totalSessions,
    averageSessionMinutes,
    timeSeries7,
    loading,
  } = useAnalytics()

  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)

  const stats = [
    {
      icon: CheckCircle2,
      tag: 'TASKS',
      title: `${completedTasks}/${totalTasks} Completed`,
      desc: 'Task completion this cycle',
      progress: completionRate,
      delay: 0,
    },
    {
      icon: Zap,
      tag: 'FOCUS',
      title: `${totalSessions} Sessions`,
      desc: 'Focus sessions logged',
      progress: Math.min(totalSessions * 10, 100),
      delay: 0.05,
    },
    {
      icon: Clock3,
      tag: 'RHYTHM',
      title: `${averageSessionMinutes} Min Avg`,
      desc: 'Average focus session length',
      progress: Math.min(Math.round((averageSessionMinutes / 60) * 100), 100),
      delay: 0.1,
    },
  ]

  const chartData = {
    labels: timeSeries7.labels,
    datasets: [
      {
        label: 'Focus Hours',
        data: timeSeries7.data,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.16)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointBackgroundColor: '#10B981',
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        displayColors: false,
        callbacks: {
          label: (context) => `${context.parsed.y} hrs`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94A3B8' },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(148, 163, 184, 0.12)' },
        ticks: { color: '#94A3B8' },
      },
    },
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="text-headline">Flow Overview</h2>
          <span className="text-label">Live dashboard metrics</span>
        </div>
        <div className="progress-summary-chip">
          <TimerReset size={14} />
          {loading ? 'Syncing...' : 'Updated from your latest sessions'}
        </div>
      </div>
      <div className="progress-row">
        {stats.map(({ icon: Icon, tag, title, desc, progress, delay }) => (
          <div
            key={tag}
            className="progress-card animate-fadeIn"
            style={{ animationDelay: `${delay}s` }}
          >
            <div className="progress-card-top">
              <div className="progress-card-icon">
                <Icon size={20} />
              </div>
              <span className="tag">{tag}</span>
            </div>
            <h3 className="progress-card-title">{title}</h3>
            <p className="text-body-sm">{desc}</p>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="progress-meta">
              <span className="text-caption">Progress</span>
              <span className="text-caption" style={{ fontWeight: 600 }}>{progress}%</span>
            </div>
          </div>
        ))}
      </div>
      <div className="progress-trend-card card animate-fadeIn" style={{ animationDelay: '0.15s' }}>
        <div className="card-header">
          <div>
            <h3 className="text-title">7-Day Productivity Trend</h3>
            <p className="text-body-sm">Daily focus hours based on completed sessions.</p>
          </div>
          <span className="text-label">Focus Hours</span>
        </div>
        <div className="progress-chart-wrap">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  )
}
