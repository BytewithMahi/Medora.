const { supabase } = require('../services/db/supabaseService');

/**
 * Validates the Custom Authentication Headers matching the frontend's architecture
 */
const requireAuth = async (req, res, next) => {
  const email = req.headers['x-user-email'];
  const passkey = req.headers['x-user-passkey'];
  const role = req.headers['x-user-role'];

  if (!email || !passkey || !role) {
    return res.status(401).json({ success: false, error: 'Unauthorized, missing authentication headers' });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('passkey', passkey)
      .eq('role', role)
      .single();

    if (error || !data) {
      return res.status(403).json({ success: false, error: 'Forbidden, invalid credentials' });
    }

    if (data.status === 'Pending' || data.status === 'Rejected') {
      return res.status(403).json({ success: false, error: 'Forbidden, account not approved' });
    }

    req.user = data; // Contains role, email, etc.
    next();
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Authentication service error' });
  }
};

/**
 * Role-Based Access Control Middleware
 * @param {Array<string>} roles - e.g. ['Admin', 'Manufacturer']
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Forbidden, you lack the required role to perform this action' 
      });
    }
    next();
  };
};

module.exports = { requireAuth, requireRole };
