import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend the Express Request interface to include the user property
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    id: string;
    email: string;
    name: string;
    [key: string]: any;
  };
}

export const protect = (req: Request, res: Response, next: NextFunction): void => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      // Attach user to the request object with consistent userId field
      (req as AuthRequest).user = {
        userId: decoded.sub || decoded.id || decoded.userId,
        id: decoded.sub || decoded.id || decoded.userId,
        email: decoded.email,
        name: decoded.name,
        ...decoded
      };
      
      console.log('Auth middleware: User authenticated:', (req as AuthRequest).user?.userId);
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
      return;
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
    return;
  }
};
