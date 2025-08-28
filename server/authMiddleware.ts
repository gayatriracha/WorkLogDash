import type { Request, Response, NextFunction } from 'express';
import type { User } from '@shared/schema';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: Omit<User, 'password'>;
    }
  }
}

// Simple session-based auth middleware
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const session = req.session as any;
  
  if (!session || !session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // User data should be stored in session after login
  if (!session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  req.user = session.user;
  next();
}

// Middleware to check if user is not authenticated (for login/signup pages)
export function requireGuest(req: Request, res: Response, next: NextFunction) {
  const session = req.session as any;
  
  if (session && session.userId) {
    return res.status(403).json({ message: 'Already authenticated' });
  }

  next();
}