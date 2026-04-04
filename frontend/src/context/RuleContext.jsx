import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

const RuleContext = createContext(null);

export function RuleProvider({ children }) {
  const { user } = useAuth();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('user_rules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error("Error fetching rules:", error);
    else setRules(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const addRule = async (rule) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('user_rules')
      .insert([{ ...rule, user_id: user.id }])
      .select();

    if (error) throw error;
    setRules(prev => [data[0], ...prev]);
    return data[0];
  };

  const deleteRule = async (id) => {
    const { error } = await supabase
      .from('user_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setRules(prev => prev.filter(r => r.id !== id));
  };

  return (
    <RuleContext.Provider value={{ rules, loading, addRule, deleteRule, fetchRules }}>
      {children}
    </RuleContext.Provider>
  );
}

export function useRules() {
  const context = useContext(RuleContext);
  if (!context) throw new Error('useRules must be used within RuleProvider');
  return context;
}
