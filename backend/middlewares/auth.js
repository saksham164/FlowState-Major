const jwt = require('jsonwebtoken');

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

/**
 * JWT Authentication middleware
 * Verifies Supabase-issued JWTs using the project's JWT secret.
 * Set SUPABASE_JWT_SECRET in backend/.env from:
 *   Supabase Dashboard → Project Settings → API → JWT Secret
 */
function authenticate(req, res, next) {
  let token = null;

  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // Fallback to cookie
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    const err = new Error('Authentication required');
    err.statusCode = 401;
    return next(err);
  }

  if (!SUPABASE_JWT_SECRET) {
    const err = new Error('Server misconfiguration: SUPABASE_JWT_SECRET is not set');
    err.statusCode = 500;
    return next(err);
  }

  try {
    // Supabase JWTs are signed with HS256
    const decoded = jwt.verify(token, SUPABASE_JWT_SECRET, { algorithms: ['HS256'] });
    // Attach the Supabase user payload: { sub (userId), email, role, ... }
    req.user = {
      userId: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (error) {
    const err = new Error('Invalid or expired token');
    err.statusCode = 401;
    next(err);
  }
}

/**
 * Optional auth — attaches user if token present, continues otherwise
 */
function optionalAuth(req, res, next) {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token && SUPABASE_JWT_SECRET) {
    try {
      const decoded = jwt.verify(token, SUPABASE_JWT_SECRET, { algorithms: ['HS256'] });
      req.user = {
        userId: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      };
    } catch {
      // Token invalid — continue without user
    }
  }
  next();
}

module.exports = { authenticate, optionalAuth };
