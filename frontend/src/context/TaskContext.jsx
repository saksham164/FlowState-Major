import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

const TaskContext = createContext(null);
const ORDER_STORAGE_PREFIX = 'flowstate.taskOrder';

function getOrderStorageKey(userId) {
  return `${ORDER_STORAGE_PREFIX}.${userId}`;
}

function readStoredOrder(userId) {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const raw = window.localStorage.getItem(getOrderStorageKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredOrder(userId, orderIds) {
  if (typeof window === 'undefined' || !userId) return;
  window.localStorage.setItem(getOrderStorageKey(userId), JSON.stringify(orderIds));
}

function applyCustomOrder(taskList, orderIds) {
  if (!orderIds || orderIds.length === 0) return taskList;
  const orderMap = new Map(orderIds.map((id, index) => [id, index]));
  return [...taskList].sort((a, b) => {
    const aRank = orderMap.has(a.id) ? orderMap.get(a.id) : Number.MAX_SAFE_INTEGER;
    const bRank = orderMap.has(b.id) ? orderMap.get(b.id) : Number.MAX_SAFE_INTEGER;
    return aRank - bRank;
  });
}

export function TaskProvider({ children }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskOrderIds, setTaskOrderIds] = useState([]);
  const taskOrderRef = useRef([]);

  useEffect(() => {
    taskOrderRef.current = taskOrderIds;
    if (user?.id) {
      writeStoredOrder(user.id, taskOrderIds);
    }
  }, [taskOrderIds, user]);

  useEffect(() => {
    if (!user?.id) {
      setTaskOrderIds([]);
      return;
    }
    const storedOrder = readStoredOrder(user.id);
    setTaskOrderIds(storedOrder);
  }, [user]);

  const fetchTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true, nullsFirst: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error.message);
    } else {
      const nextTasks = data || [];
      const nextTaskIds = new Set(nextTasks.map((task) => task.id));
      const storedOrder = taskOrderRef.current.filter((id) => nextTaskIds.has(id));
      const newTaskIds = nextTasks.map((task) => task.id).filter((id) => !storedOrder.includes(id));
      const mergedOrder = [...storedOrder, ...newTaskIds];
      setTaskOrderIds(mergedOrder);
      setTasks(applyCustomOrder(nextTasks, mergedOrder));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (newTask) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ ...newTask, user_id: user.id }])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }
    setTaskOrderIds((current) => [data.id, ...current.filter((id) => id !== data.id)]);
    setTasks((prev) => applyCustomOrder([data, ...prev], [data.id, ...taskOrderRef.current.filter((id) => id !== data.id)]));
    return data;
  };

  const updateTask = async (id, updates) => {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }
    setTasks((prev) => prev.map((t) => (t.id === id ? data : t)));
    return data;
  };

  const deleteTask = async (id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      throw new Error(error.message);
    }
    setTaskOrderIds((current) => current.filter((taskId) => taskId !== id));
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const reorderTasks = async (orderedTaskIds) => {
    const existingIds = new Set(tasks.map((task) => task.id));
    const sanitizedOrder = orderedTaskIds.filter((id) => existingIds.has(id));
    const remainingIds = tasks.map((task) => task.id).filter((id) => !sanitizedOrder.includes(id));
    const nextOrder = [...sanitizedOrder, ...remainingIds];

    setTaskOrderIds(nextOrder);
    setTasks((prev) => applyCustomOrder(prev, nextOrder));
  };

  const value = {
    tasks,
    loading,
    supportsManualOrdering: true,
    refreshTasks: fetchTasks,
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}
