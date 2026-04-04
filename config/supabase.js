const { createClient } = require('@supabase/supabase-js');
const config = require('./index');

let supabase = null;

function getSupabase() {
  if (!supabase) {
    if (!config.supabase.url || !config.supabase.anonKey) {
      console.warn('⚠ Supabase credentials not configured — using mock mode');
      return null;
    }
    supabase = createClient(config.supabase.url, config.supabase.anonKey);
  }
  return supabase;
}

// Admin client with service role key (for server-side operations)
let supabaseAdmin = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      return getSupabase(); // Fallback to regular client
    }
    supabaseAdmin = createClient(config.supabase.url, config.supabase.serviceRoleKey);
  }
  return supabaseAdmin;
}

module.exports = { getSupabase, getSupabaseAdmin };
