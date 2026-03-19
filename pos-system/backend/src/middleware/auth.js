const jwt = require('jsonwebtoken');
const config = require('../config');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = header.slice(7);
  try {
    req.employee = jwt.verify(token, config.jwt.secret);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.employee) return res.status(401).json({ error: 'Unauthenticated' });
    const perms = req.employee.permissions || [];
    const role  = req.employee.role;
    if (role === 'admin' || perms.includes('all') || roles.includes(role)) return next();
    return res.status(403).json({ error: 'Insufficient permissions' });
  };
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.employee) return res.status(401).json({ error: 'Unauthenticated' });
    const perms = req.employee.permissions || [];
    const role  = req.employee.role;
    if (role === 'admin' || perms.includes('all') || perms.includes(permission)) return next();
    return res.status(403).json({ error: `Permission required: ${permission}` });
  };
}

module.exports = { authenticate, requireRole, requirePermission };
