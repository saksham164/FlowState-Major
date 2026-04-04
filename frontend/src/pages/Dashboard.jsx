import ProgressCards from '../components/dashboard/ProgressCards'
import TaskManager from '../components/dashboard/TaskManager'
import WeeklyTimetable from '../components/dashboard/WeeklyTimetable'
import FocusCard from '../components/dashboard/FocusCard'
import InsightsPanel from '../components/dashboard/InsightsPanel'
import RecentTasksPanel from '../components/dashboard/RecentTasksPanel'
import DeepWorkZone from '../components/dashboard/DeepWorkZone'
import SubjectFoldersPanel from '../components/dashboard/SubjectFoldersPanel'
import './Dashboard.css'

export default function Dashboard() {
  return (
    <>
      <div className="dashboard-grid">
        {/* Left Column */}
        <div className="dashboard-main">
          <ProgressCards />
          <TaskManager />
          <WeeklyTimetable />
        </div>

        {/* Right Column */}
        <div className="dashboard-sidebar">
          <FocusCard />
          <SubjectFoldersPanel />
          <InsightsPanel />
          <RecentTasksPanel />
          <DeepWorkZone />
        </div>
      </div>
    </>
  )
}
