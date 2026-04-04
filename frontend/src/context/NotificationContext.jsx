import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useInbox } from './InboxContext'
import { useTasks } from './TaskContext'

const NotificationContext = createContext(null)
const DISMISSED_KEY = 'flowstate.dismissedNotifications'

function getStoredDismissedIds() {
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function buildTaskNotification(task, type) {
  const dueLabel = task.due_date
    ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'today'

  if (type === 'overdue') {
    return {
      id: `task-overdue-${task.id}`,
      type: 'warning',
      source: 'tasks',
      title: 'Task overdue',
      message: `${task.name} is overdue since ${dueLabel}.`,
      href: '/tasks',
      createdAt: task.due_date || task.created_at,
    }
  }

  return {
    id: `task-due-${task.id}`,
    type: task.priority === 'urgent' ? 'warning' : 'info',
    source: 'tasks',
    title: 'Task due soon',
    message: `${task.name} is due ${dueLabel}.`,
    href: '/tasks',
    createdAt: task.due_date || task.created_at,
  }
}

function buildInboxNotification(item) {
  return {
    id: `inbox-${item.id}`,
    type: item.parsed_priority === 'urgent' ? 'warning' : 'info',
    source: 'inbox',
    title: item.parsed_priority === 'urgent' ? 'Urgent inbox item' : 'Inbox triage pending',
    message: `${item.parsed_name} from ${item.sender || 'Unknown sender'} needs review.`,
    href: '/inbox',
    createdAt: item.created_at,
  }
}

export function NotificationProvider({ children }) {
  const { inboxItems } = useInbox()
  const { tasks } = useTasks()
  const [dismissedIds, setDismissedIds] = useState([])

  useEffect(() => {
    setDismissedIds(getStoredDismissedIds())
  }, [])

  useEffect(() => {
    window.localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissedIds))
  }, [dismissedIds])

  const notifications = useMemo(() => {
    const today = new Date()
    const todayKey = today.toISOString().split('T')[0]
    const urgentInboxNotifications = inboxItems
      .filter((item) => item.parsed_priority === 'urgent' || item.parsed_priority === 'high')
      .map(buildInboxNotification)

    const taskNotifications = tasks
      .filter((task) => task.status !== 'completed' && task.due_date)
      .flatMap((task) => {
        if (task.due_date < todayKey) {
          return [buildTaskNotification(task, 'overdue')]
        }
        if (task.due_date === todayKey || task.priority === 'urgent') {
          return [buildTaskNotification(task, 'due')]
        }
        return []
      })

    return [...urgentInboxNotifications, ...taskNotifications]
      .filter((notification) => !dismissedIds.includes(notification.id))
      .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))
      .slice(0, 8)
  }, [dismissedIds, inboxItems, tasks])

  const dismissNotification = (id) => {
    setDismissedIds((current) => current.includes(id) ? current : [...current, id])
  }

  const clearNotifications = () => {
    const activeIds = notifications.map((notification) => notification.id)
    setDismissedIds((current) => [...new Set([...current, ...activeIds])])
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount: notifications.length,
        dismissNotification,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used within NotificationProvider')
  return context
}
