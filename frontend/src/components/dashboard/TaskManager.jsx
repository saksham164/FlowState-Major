import { useState } from 'react'
import { GripVertical, MoreHorizontal, Trash2 } from 'lucide-react'
import './TaskManager.css'

import { useTasks } from '../../context/TaskContext'

const filters = ['all', 'pending', 'completed']

export default function TaskManager() {
  const { tasks, loading, deleteTask, reorderTasks, supportsManualOrdering } = useTasks()
  const [activeFilter, setActiveFilter] = useState('all')
  const [openMenuId, setOpenMenuId] = useState(null)
  const [draggedTaskId, setDraggedTaskId] = useState(null)
  const [dragOverTaskId, setDragOverTaskId] = useState(null)

  const filteredTasks = tasks.filter(task => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'pending') return task.status !== 'completed'
    return task.status === 'completed'
  })
  const pendingTasks = tasks.filter(task => task.status !== 'completed')
  const completedTasks = tasks.filter(task => task.status === 'completed')
  const canReorder = supportsManualOrdering && activeFilter !== 'completed' && pendingTasks.length > 1

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return 'No due date'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Label helper
  const getLabel = (status) => {
    if (status === 'todo') return 'To Do'
    if (status === 'in-progress') return 'In Progress'
    return 'Completed'
  }

  const moveTask = async (targetTaskId) => {
    if (!canReorder || !draggedTaskId || draggedTaskId === targetTaskId) {
      setDraggedTaskId(null)
      setDragOverTaskId(null)
      return
    }

    const reorderedPendingIds = pendingTasks.map((task) => task.id)
    const fromIndex = reorderedPendingIds.indexOf(draggedTaskId)
    const toIndex = reorderedPendingIds.indexOf(targetTaskId)

    if (fromIndex === -1 || toIndex === -1) {
      setDraggedTaskId(null)
      setDragOverTaskId(null)
      return
    }

    reorderedPendingIds.splice(fromIndex, 1)
    reorderedPendingIds.splice(toIndex, 0, draggedTaskId)

    try {
      await reorderTasks([...reorderedPendingIds, ...completedTasks.map((task) => task.id)])
    } catch (error) {
      console.error('Failed to reorder from dashboard:', error)
    } finally {
      setDraggedTaskId(null)
      setDragOverTaskId(null)
    }
  }

  return (
    <div className="card task-manager animate-fadeIn" style={{ animationDelay: '0.15s' }}>
      <div className="card-header">
        <div>
          <h2 className="text-title">Task Manager</h2>
          {canReorder && <div className="task-order-hint text-label">Drag pending rows to reorder</div>}
        </div>
        <div className="task-tabs">
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
      </div>

      <div className="task-table-header text-label">
        <span></span>
        <span>Task Name</span>
        <span>Due Date</span>
        <span>Priority</span>
        <span>Status</span>
        <span></span>
      </div>

      <div className="task-list">
        {loading ? (
          <div className="text-body-sm" style={{ padding: '1rem' }}>Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-body-sm" style={{ padding: '1rem' }}>No tasks found in this view.</div>
        ) : (
          filteredTasks.map(task => (
            <div
              className={`task-row ${draggedTaskId === task.id ? 'dragging' : ''} ${dragOverTaskId === task.id ? 'drag-over' : ''}`}
              key={task.id}
              draggable={canReorder && task.status !== 'completed'}
              onDragStart={() => {
                if (!canReorder || task.status === 'completed') return
                setDraggedTaskId(task.id)
              }}
              onDragEnter={() => {
                if (!canReorder || task.status === 'completed') return
                setDragOverTaskId(task.id)
              }}
              onDragOver={(event) => {
                if (!canReorder || task.status === 'completed') return
                event.preventDefault()
              }}
              onDragEnd={() => {
                setDraggedTaskId(null)
                setDragOverTaskId(null)
              }}
              onDrop={() => {
                if (!canReorder || task.status === 'completed') return
                moveTask(task.id)
              }}
            >
              <span>
                {canReorder && task.status !== 'completed' ? (
                  <button className="task-drag-handle" type="button" aria-label={`Reorder ${task.name}`}>
                    <GripVertical size={14} />
                  </button>
                ) : null}
              </span>
              <span className="task-name">{task.name}</span>
              <span className="text-body-sm">{formatDate(task.due_date)}</span>
              <span><span className={`badge badge-${task.priority}`}>{task.priority}</span></span>
              <span className={`status-dot ${task.status}`}>{getLabel(task.status)}</span>
              <div style={{ position: 'relative' }}>
                <button 
                  className="btn-ghost btn-icon" 
                  aria-label="More options"
                  onClick={() => setOpenMenuId(openMenuId === task.id ? null : task.id)}
                >
                  <MoreHorizontal size={16} />
                </button>
                {openMenuId === task.id && (
                   <div 
                     className="task-popover" 
                     onClick={() => {
                        deleteTask(task.id)
                        setOpenMenuId(null)
                     }}
                   >
                     <Trash2 size={14} />
                     Delete
                   </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
