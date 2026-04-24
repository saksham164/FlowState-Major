import { useAnalytics } from '../../context/AnalyticsContext'
import { Book, Code, Cpu, Globe, Rocket, Zap } from 'lucide-react'
import './ProgressCards.css'

const iconMap = {
  'Study': Book,
  'Work': Code,
  'Research': Cpu,
  'Learning': Rocket,
  'General': Globe,
  'Default': Zap
}

export default function ProgressCards() {
  const { categoryBreakdown, loading } = useAnalytics()

  // Get top 3 categories by duration
  const topCategories = [...categoryBreakdown]
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 3)

  if (loading) return <div className="subject-mastery-loading">Loading mastery data...</div>

  return (
    <div className="subject-mastery-row">
      {topCategories.map((cat, idx) => {
        const Icon = iconMap[cat.name] || iconMap.Default
        const mastery = Math.min(Math.round((cat.duration / 60) * 10), 100) // Mock mastery based on hours
        
        return (
          <div key={cat.name} className="subject-mastery-card animate-fadeIn" style={{ animationDelay: `${idx * 0.1}s` }}>
            <div className="mastery-card-header">
              <div className="mastery-icon-box">
                <Icon size={20} />
              </div>
              <div className="mastery-info">
                <span className="mastery-percentage">{mastery}% Mastery</span>
              </div>
            </div>
            
            <h3 className="mastery-subject-name">{cat.name}</h3>
            
            <div className="mastery-progress-track">
              <div 
                className="mastery-progress-fill" 
                style={{ width: `${mastery}%` }} 
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
