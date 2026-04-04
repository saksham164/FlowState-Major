import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from './AuthContext'
import { useTasks } from './TaskContext'
import { useSubjects } from './SubjectContext'

const InboxContext = createContext(null)

export function InboxProvider({ children }) {
  const { user, session } = useAuth()
  const { addTask } = useTasks()
  const { routeInboxItemToSubject } = useSubjects()
  const [inboxItems, setInboxItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const allowedTaskCategories = new Set(['Work', 'Study', 'Personal', 'Health', 'Finance'])

  const normalizeTaskCategory = (value) => (
    allowedTaskCategories.has(value) ? value : 'Work'
  )

  const fetchInbox = useCallback(async () => {
    if (!user) {
      setInboxItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('inbox_items')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) console.error("Error fetching inbox:", error)
    else setInboxItems(data || [])

    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchInbox()
  }, [fetchInbox])

  // Approve moves it to real tasks
  const approveItem = async (item) => {
    try {
      // 1. Add to active tasks first.
      await addTask({
        name: item.parsed_name,
        category: normalizeTaskCategory(item.parsed_category),
        priority: item.parsed_priority,
        status: 'todo',
        due_date: item.parsed_date
      })

      // 2. Route Gmail/inbox content to a matching subject folder (if any).
      try {
        await routeInboxItemToSubject(item)
      } catch (routeError) {
        console.error('Subject folder routing failed:', routeError)
      }

      // 3. Mark approved only after successful task creation.
      const { error: inboxError } = await supabase
        .from('inbox_items')
        .update({ status: 'approved' })
        .eq('id', item.id)

      if (inboxError) {
        throw new Error(inboxError.message)
      }

      // 4. Update local UI state.
      setInboxItems(prev => prev.filter(i => i.id !== item.id))
    } catch (error) {
      console.error('Approve item failed:', error)
      alert(`Unable to approve item: ${error.message || 'Unknown error'}`)
    }
  }

  // Reject permanently deletes or buries it
  const rejectItem = async (id) => {
    const { error } = await supabase
      .from('inbox_items')
      .update({ status: 'rejected' })
      .eq('id', id)

    if (!error) {
      setInboxItems(prev => prev.filter(i => i.id !== id))
    }
  }

  // Invoke Edge Function for Gmail Auto-Fetch
  const syncGmail = async () => {
    if (!user || !session) return
    setIsSyncing(true)

    try {
      const googleToken = session.provider_token
      if (!googleToken) {
        alert("Action Required: Missing Gmail API scopes! Please sign out gracefully, and sign back in exclusively using the 'Continue with Google' button.")
        return
      }

      // Invoke the Edge Function synchronously
      const { data, error } = await supabase.functions.invoke('sync-gmail', {
        body: { googleToken }
      })

      if (error) throw new Error(error.message)
      if (data?.failure_reason) throw new Error(data.failure_reason)

      // Re-hydrate the local UI table instantly from the fresh Edge insertions
      await fetchInbox()

    } catch (err) {
      console.error("Gmail Sync Failed:", err)
      alert("Error syncing with Gmail: " + (err.message || String(err)))
    } finally {
      // Guaranteed local state clean-up so it never gets stuck spinning
      setIsSyncing(false)
    }
  }

  const value = {
    inboxItems,
    loading,
    isSyncing,
    refreshInbox: fetchInbox,
    approveItem,
    rejectItem,
    syncGmail
  }

  return (
    <InboxContext.Provider value={value}>
      {children}
    </InboxContext.Provider>
  )
}

export function useInbox() {
  const context = useContext(InboxContext)
  if (!context) throw new Error('useInbox must be used within InboxProvider')
  return context
}
