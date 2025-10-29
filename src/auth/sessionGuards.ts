import { Request, Response, NextFunction } from 'express';

// Middleware to require specific roles from session
export const requireSessionRoles = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRoles = req.session.user.realm_access?.roles || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: roles,
        userRoles 
      });
    }

    next();
  };
};

// Middleware to check if user has admin role
export const requireAdmin = requireSessionRoles(['admin']);

// Middleware to check if user has user role
export const requireUser = requireSessionRoles(['user']);