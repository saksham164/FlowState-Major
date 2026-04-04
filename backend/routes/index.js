const express = require('express');
const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'FlowState API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Route groups
// Auth is now handled by Supabase Auth directly on the client.
// The backend only verifies Supabase JWTs via the authenticate middleware.
// router.use('/tasks', require('./task.routes'));
// router.use('/focus', require('./focus.routes'));
// router.use('/analytics', require('./analytics.routes'));
router.use('/insights', require('./insights'));

module.exports = router;
