import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';

// CSRF token storage (in production, use Redis or database)
const csrfTokens = new Map<string, { token: string; expires: number }>();

// Generate CSRF token
export const generateCSRFToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Validate CSRF token
export const validateCSRFToken = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF validation for GET requests
  if (req.method === 'GET') {
    return next();
  }

  const token = req.headers['x-csrf-token'] as string;
  const sessionId = req.headers['x-session-id'] as string;

  if (!token || !sessionId) {
    return res.status(403).json({
      success: false,
      error: 'CSRF token missing'
    });
  }

  const storedToken = csrfTokens.get(sessionId);
  if (!storedToken || storedToken.token !== token || Date.now() > storedToken.expires) {
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired CSRF token'
    });
  }

  // Remove used token
  csrfTokens.delete(sessionId);
  next();
};

// Store CSRF token
export const storeCSRFToken = (sessionId: string, token: string): void => {
  csrfTokens.set(sessionId, {
    token,
    expires: Date.now() + 30 * 60 * 1000 // 30 minutes
  });
};

// Clean up expired tokens (run periodically)
export const cleanupExpiredTokens = (): void => {
  const now = Date.now();
  for (const [sessionId, tokenData] of csrfTokens.entries()) {
    if (now > tokenData.expires) {
      csrfTokens.delete(sessionId);
    }
  }
};

// Clean up expired tokens every 5 minutes
setInterval(cleanupExpiredTokens, 5 * 60 * 1000); 