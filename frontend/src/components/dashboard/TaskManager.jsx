import { useState } from 'react'
import { Filter, MoreHorizontal, Trash2 } from 'lucide-react'
import { useTasks } from '../../context/TaskContext'
import './TaskManager.css'

const filters = ['all', 'pending', 'completed']

export default function TaskManager() {
  const { tasks, loading, deleteTask, updateTask } = useTasks()
  const [activeFilter, setActiveFilter] = useState('all')
  const [openMenuId, setOpenMenuId] = useState(null)

  const filteredTasks = tasks.filter(task => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'pending') return task.status !== 'completed'
    return task.status === 'completed'
  })

  const getStatusLabel = (status) => {
    if (status === 'todo') return 'Pending'
    if (status === 'in-progress') return 'In Progress'
    if (status === 'completed') return 'Completed'
    return 'Active'
  }

  return (
    <div className="task-queue-workspace animate-fadeIn">
      <div className="task-queue-header">
        <div className="task-tabs-minimal">
          {filters.map(f => (
            <button
               key={f}
               className={activeFilter === f ? 'active' : ''}
               onClick={() => setActiveFilter(f)}
             >
               {f.charAt(0).toUpperCase() + f.slice(1)}
             </button>
           ))}
        </div>
        <button className="task-filter-btn">
          <Filter size={14} />
          Filter
        </button>
      </div>

      <div className="task-table-workspace">
        <div className="task-thead">
          <span>Task Name</span>
          <span>Subject</span>
          <span>Priority</span>
          <span>Status</span>
          <span />
        </div>

        <div className="task-tbody">
          {loading ? (
            <div className="task-empty-state">Loading tasks...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="task-empty-state">No active tasks in queue.</div>
          ) : (
            filteredTasks.map(task => (
              <div className="task-row-workspace" key={task.id}>
                <span className={`task-name-main ${task.status === 'completed' ? 'completed-text' : ''}`}>{task.name}</span>
                <span className="task-subject">{task.category || 'General'}</span>
                <span>
                  <span className={`priority-tag priority-${task.priority}`}>
                    {task.priority.toUpperCase()}
                  </span>
                </span>
                <span className={`status-container status-${task.status}`}>
                  <div className="status-indicator" />
                  {getStatusLabel(task.status)}
                </span>
                <div className="task-actions-cell">
                  <button 
                    className="btn-icon-workspace" 
                    onClick={() => setOpenMenuId(openMenuId === task.id ? null : task.id)}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  {openMenuId === task.id && (
                    <div className="task-menu-workspace">
                      <button onClick={async () => { 
                        await updateTask(task.id, { status: task.status === 'completed' ? 'todo' : 'completed' });
                        setOpenMenuId(null); 
                      }}>
                        {task.status === 'completed' ? 'Mark as Pending' : 'Mark as Done'}
                      </button>
                      <button 
                        className="delete-action"
                        onClick={() => { deleteTask(task.id); setOpenMenuId(null); }}
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
