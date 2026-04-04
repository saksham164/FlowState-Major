const { createClient } = require('@supabase/supabase-js');
const config = require('../../config');

function getSupabaseForRequest(accessToken) {
  if (!config.supabase.url || !config.supabase.anonKey) {
    const error = new Error('Server misconfiguration: Supabase credentials are not set');
    error.statusCode = 500;
    throw error;
  }

  return createClient(config.supabase.url, config.supabase.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}

function getAccessTokenFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  return req.cookies?.token || null;
}

module.exports = {
  getSupabaseForRequest,
  getAccessTokenFromRequest,
};
