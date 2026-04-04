import { useState } from 'react'
import { Plus, Clock, CheckCircle2, Circle, GripVertical } from 'lucide-react'
import { useTasks } from '../context/TaskContext'
import './Tasks.css'

export default function Tasks() {
  const { tasks, loading, addTask, updateTask, deleteTask, reorderTasks, supportsManualOrdering } = useTasks()
  const [newTaskName, setNewTaskName] = useState('')
  const [newTaskCategory, setNewTaskCategory] = useState('Work')
  const [newTaskPriority, setNewTaskPriority] = useState('medium')
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0])
  const [isAdding, setIsAdding] = useState(false)
  const [draggedTaskId, setDraggedTaskId] = useState(null)
  const [dragOverTaskId, setDragOverTaskId] = useState(null)

  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!newTaskName.trim()) return

    setIsAdding(true)
    try {
      await addTask({
        name: newTaskName,
        category: newTaskCategory,
        priority: newTaskPriority,
        status: 'todo',
        due_date: newTaskDate || null,
      })
      setNewTaskName('')
      setNewTaskPriority('medium')
      // keep the date and category as is, reducing friction for batch uploads
    } catch (err) {
      console.error(err)
    } finally {
      setIsAdding(false)
    }
  }

  const toggleStatus = async (task) => {
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed'
    try {
      await updateTask(task.id, { status: nextStatus })
    } catch (err) {
      console.error(err)
    }
  }

  const pendingTasks = tasks.filter(t => t.status !== 'completed')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  const moveTask = async (targetTaskId) => {
    if (!draggedTaskId || draggedTaskId === targetTaskId) {
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
    } catch (err) {
      console.error(err)
    } finally {
      setDraggedTaskId(null)
      setDragOverTaskId(null)
    }
  }

  return (
    <div className="tasks-page animate-fadeIn">
      <header className="tasks-header">
        <h1 className="text-display">Focus Board</h1>
        <p className="text-body">Manage your sanctuary of tasks.</p>
      </header>

      {/* Inline Quick Add */}
      <form className="quick-add-form" onSubmit={handleAddTask}>
        <Plus size={20} className="quick-add-icon" />
        <input
          type="text"
          className="quick-add-input"
          placeholder="Jot down a new task..."
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
          disabled={isAdding}
          autoFocus
        />
        
        <div className="quick-add-options">
          <input 
            type="date" 
            className="quick-add-date" 
            value={newTaskDate}
            onChange={(e) => setNewTaskDate(e.target.value)}
            disabled={isAdding}
          />
          <select 
            className="quick-add-select" 
            value={newTaskCategory}
            onChange={(e) => setNewTaskCategory(e.target.value)}
            disabled={isAdding}
          >
            <option value="Work">Work</option>
            <option value="Study">Study</option>
            <option value="Personal">Personal</option>
            <option value="Health">Health</option>
            <option value="Finance">Finance</option>
          </select>
          <select 
            className="quick-add-select" 
            value={newTaskPriority}
            onChange={(e) => setNewTaskPriority(e.target.value)}
            disabled={isAdding}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <button type="submit" disabled={isAdding || !newTaskName.trim()} className="btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}>
          {isAdding ? 'Adding...' : 'Add'}
        </button>
      </form>

      {loading ? (
        <p className="text-body-sm" style={{ marginTop: '2rem' }}>Loading your tasks...</p>
      ) : (
        <div className="tasks-layout">
          {/* Main List */}
          <div className="tasks-group">
            <div className="tasks-group-header">
              <h2 className="text-title group-title">Deep Work</h2>
              {supportsManualOrdering && pendingTasks.length > 1 && (
                <span className="text-label">Drag to reorder</span>
              )}
            </div>
            
            {pendingTasks.length === 0 ? (
              <p className="text-body-sm empty-state">Your mind is clear. No pending tasks.</p>
            ) : (
              <div className="task-cards-container">
                {pendingTasks.map(task => (
                  <div
                    className={`task-card ${draggedTaskId === task.id ? 'dragging' : ''} ${dragOverTaskId === task.id ? 'drag-over' : ''}`}
                    key={task.id}
                    draggable={supportsManualOrdering}
                    onDragStart={() => setDraggedTaskId(task.id)}
                    onDragEnter={() => setDragOverTaskId(task.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDragEnd={() => {
                      setDraggedTaskId(null)
                      setDragOverTaskId(null)
                    }}
                    onDrop={() => moveTask(task.id)}
                  >
                    {supportsManualOrdering && (
                      <button
                        type="button"
                        className="task-drag-handle"
                        aria-label={`Reorder ${task.name}`}
                      >
                        <GripVertical size={18} />
                      </button>
                    )}
                    <button 
                      className="task-toggle" 
                      onClick={() => toggleStatus(task)}
                      aria-label="Mark complete"
                    >
                      <Circle size={20} className="toggle-icon pending" />
                    </button>
                    <div className="task-content">
                      <h3 className="task-title">{task.name}</h3>
                      <div className="task-meta">
                        <span className={`meta-pill priority-${task.priority}`}>
                          {task.priority}
                        </span>
                        {task.due_date && (
                          <span className="meta-date">
                            <Clock size={14} />
                            {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                    <button className="btn-ghost task-delete" onClick={() => deleteTask(task.id)}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed List */}
          {completedTasks.length > 0 && (
            <div className="tasks-group completed-group">
              <h2 className="text-title group-title">Completed</h2>
              <div className="task-cards-container">
                {completedTasks.map(task => (
                  <div className="task-card completed" key={task.id}>
                    <button 
                      className="task-toggle" 
                      onClick={() => toggleStatus(task)}
                      aria-label="Mark pending"
                    >
                      <CheckCircle2 size={20} className="toggle-icon done" />
                    </button>
                    <div className="task-content">
                      <h3 className="task-title">{task.name}</h3>
                    </div>
                    <button className="btn-ghost task-delete" onClick={() => deleteTask(task.id)}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
