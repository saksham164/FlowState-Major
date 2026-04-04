const express = require('express');
const { authenticate } = require('../middlewares/auth');
const { getSupabaseForRequest, getAccessTokenFromRequest } = require('../utils/supabase');
const { generateInsightPayload } = require('../services/insightEngine');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const accessToken = getAccessTokenFromRequest(req);
    const supabase = getSupabaseForRequest(accessToken);

    const { data, error } = await supabase
      .from('focus_sessions')
      .select('id, duration, created_at')
      .eq('user_id', req.user.userId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      const requestError = new Error(error.message || 'Failed to load focus sessions');
      requestError.statusCode = 500;
      throw requestError;
    }

    res.json({
      success: true,
      ...generateInsightPayload(data || []),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
