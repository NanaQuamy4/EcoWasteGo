import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'customer' | 'recycler';
        username?: string;
      };
    }
  }
}

/**
 * Middleware to authenticate user using Supabase Auth
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Get user details from database
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, email, role, username')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return res.status(401).json({
        success: false,
        error: 'User profile not found'
      });
    }

    // Add user info to request
    req.user = {
      id: userProfile.id,
      email: userProfile.email,
      role: userProfile.role,
      username: userProfile.username
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Middleware to authenticate customers only
 */
export const authenticateCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authenticateToken(req, res, (err) => {
      if (err) return next(err);
      
      if (req.user?.role !== 'customer') {
        return res.status(403).json({
          success: false,
          error: 'Customer access required'
        });
      }
      
      next();
    });
  } catch (error) {
    console.error('Customer authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Middleware to authenticate recyclers only
 */
export const authenticateRecycler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authenticateToken(req, res, (err) => {
      if (err) return next(err);
      
      if (req.user?.role !== 'recycler') {
        return res.status(403).json({
          success: false,
          error: 'Recycler access required'
        });
      }
      
      next();
    });
  } catch (error) {
    console.error('Recycler authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}; 