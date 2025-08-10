import { NextFunction, Request, Response } from 'express';

// Security event types
export enum SecurityEventType {
  AUTH_FAILURE = 'auth_failure',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  API_KEY_MISUSE = 'api_key_misuse',
  CORS_VIOLATION = 'cors_violation',
  INVALID_TOKEN = 'invalid_token',
  ROLE_VIOLATION = 'role_violation',
  DATA_ACCESS_VIOLATION = 'data_access_violation'
}

// Security event interface
interface SecurityEvent {
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  ip: string;
  userAgent: string;
  userId?: string;
  endpoint: string;
  method: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Security monitoring configuration
const SECURITY_CONFIG = {
  // Rate limiting thresholds
  AUTH_FAILURE_THRESHOLD: 5, // Max auth failures per IP per hour
  SUSPICIOUS_ACTIVITY_THRESHOLD: 10, // Max suspicious events per IP per hour
  
  // IP blacklist duration (in hours)
  BLACKLIST_DURATION: 24,
  
  // Suspicious patterns
  SUSPICIOUS_PATTERNS: [
    /\.\.\//, // Directory traversal
    /<script/i, // XSS attempts
    /union\s+select/i, // SQL injection
    /eval\s*\(/i, // Code injection
    /javascript:/i, // Protocol injection
  ]
};

// In-memory storage for security monitoring (use Redis in production)
const securityEvents = new Map<string, SecurityEvent[]>();
const ipBlacklist = new Map<string, { reason: string; until: Date }>();

/**
 * Security monitoring middleware
 */
export const securityMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  // Check if IP is blacklisted
  if (isIPBlacklisted(ip)) {
    logSecurityEvent({
      type: SecurityEventType.SUSPICIOUS_ACTIVITY,
      severity: 'high',
      message: `Request from blacklisted IP: ${ip}`,
      ip,
      userAgent,
      endpoint: req.path,
      method: req.method,
      timestamp: new Date()
    });
    
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }
  
  // Check for suspicious patterns in request
  if (hasSuspiciousPatterns(req)) {
    logSecurityEvent({
      type: SecurityEventType.SUSPICIOUS_ACTIVITY,
      severity: 'high',
      message: 'Suspicious request pattern detected',
      ip,
      userAgent,
      endpoint: req.path,
      method: req.method,
      timestamp: new Date(),
      metadata: {
        body: req.body,
        query: req.query,
        params: req.params
      }
    });
    
    // Add IP to blacklist for suspicious activity
    addToBlacklist(ip, 'Suspicious request pattern detected');
    
    return res.status(400).json({
      success: false,
      error: 'Invalid request'
    });
  }
  
  // Monitor response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const userId = (req as any).user?.id;
    
    // Log security-relevant responses
    if (res.statusCode === 401 || res.statusCode === 403) {
      logSecurityEvent({
        type: SecurityEventType.AUTH_FAILURE,
        severity: 'medium',
        message: `Authentication/Authorization failure: ${res.statusCode}`,
        ip,
        userAgent,
        userId,
        endpoint: req.path,
        method: req.method,
        timestamp: new Date(),
        metadata: {
          statusCode: res.statusCode,
          duration
        }
      });
      
      // Check if IP should be blacklisted
      checkAndBlacklistIP(ip, SecurityEventType.AUTH_FAILURE);
    }
    
    // Log slow requests (potential DoS)
    if (duration > 5000) { // 5 seconds
      logSecurityEvent({
        type: SecurityEventType.SUSPICIOUS_ACTIVITY,
        severity: 'low',
        message: `Slow request detected: ${duration}ms`,
        ip,
        userAgent,
        userId,
        endpoint: req.path,
        method: req.method,
        timestamp: new Date(),
        metadata: {
          duration,
          statusCode: res.statusCode
        }
      });
    }
  });
  
  next();
};

/**
 * Log security event
 */
export const logSecurityEvent = (event: SecurityEvent) => {
  const ip = event.ip;
  
  // Store event
  if (!securityEvents.has(ip)) {
    securityEvents.set(ip, []);
  }
  
  const events = securityEvents.get(ip)!;
  events.push(event);
  
  // Keep only last 100 events per IP
  if (events.length > 100) {
    events.splice(0, events.length - 100);
  }
  
  // Log to console (replace with proper logging service in production)
  console.warn(`🚨 SECURITY EVENT [${event.severity.toUpperCase()}]: ${event.type}`, {
    ip: event.ip,
    endpoint: event.endpoint,
    message: event.message,
    timestamp: event.timestamp,
    metadata: event.metadata
  });
  
  // In production, send to security monitoring service
  // sendToSecurityService(event);
};

/**
 * Check if IP has suspicious patterns
 */
function hasSuspiciousPatterns(req: Request): boolean {
  const body = JSON.stringify(req.body);
  const query = JSON.stringify(req.query);
  const params = JSON.stringify(req.params);
  const url = req.url;
  
  const allContent = `${body} ${query} ${params} ${url}`.toLowerCase();
  
  return SECURITY_CONFIG.SUSPICIOUS_PATTERNS.some(pattern => 
    pattern.test(allContent)
  );
}

/**
 * Check if IP is blacklisted
 */
function isIPBlacklisted(ip: string): boolean {
  const blacklistEntry = ipBlacklist.get(ip);
  if (!blacklistEntry) return false;
  
  // Remove expired blacklist entries
  if (new Date() > blacklistEntry.until) {
    ipBlacklist.delete(ip);
    return false;
  }
  
  return true;
}

/**
 * Add IP to blacklist
 */
function addToBlacklist(ip: string, reason: string) {
  const until = new Date();
  until.setHours(until.getHours() + SECURITY_CONFIG.BLACKLIST_DURATION);
  
  ipBlacklist.set(ip, { reason, until });
  
  console.warn(`🚫 IP ${ip} blacklisted until ${until.toISOString()}. Reason: ${reason}`);
}

/**
 * Check if IP should be blacklisted based on event count
 */
function checkAndBlacklistIP(ip: string, eventType: SecurityEventType) {
  const events = securityEvents.get(ip) || [];
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  // Count recent events
  const recentEvents = events.filter(event => 
    event.timestamp > oneHourAgo && event.type === eventType
  );
  
  if (eventType === SecurityEventType.AUTH_FAILURE && 
      recentEvents.length >= SECURITY_CONFIG.AUTH_FAILURE_THRESHOLD) {
    addToBlacklist(ip, `Too many authentication failures: ${recentEvents.length}`);
  }
  
  if (eventType === SecurityEventType.SUSPICIOUS_ACTIVITY && 
      recentEvents.length >= SECURITY_CONFIG.SUSPICIOUS_ACTIVITY_THRESHOLD) {
    addToBlacklist(ip, `Too many suspicious activities: ${recentEvents.length}`);
  }
}

/**
 * Get security statistics
 */
export const getSecurityStats = () => {
  const totalEvents = Array.from(securityEvents.values())
    .reduce((sum, events) => sum + events.length, 0);
  
  const blacklistedIPs = Array.from(ipBlacklist.entries())
    .filter(([_, entry]) => new Date() < entry.until)
    .length;
  
  return {
    totalSecurityEvents: totalEvents,
    blacklistedIPs,
    monitoredIPs: securityEvents.size,
    recentEvents: Array.from(securityEvents.values())
      .flat()
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10)
  };
};

/**
 * Clean up expired data
 */
export const cleanupSecurityData = () => {
  const now = new Date();
  
  // Clean up expired blacklist entries
  for (const [ip, entry] of ipBlacklist.entries()) {
    if (now > entry.until) {
      ipBlacklist.delete(ip);
    }
  }
  
  // Clean up old security events (older than 24 hours)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  for (const [ip, events] of securityEvents.entries()) {
    const recentEvents = events.filter(event => event.timestamp > oneDayAgo);
    if (recentEvents.length === 0) {
      securityEvents.delete(ip);
    } else {
      securityEvents.set(ip, recentEvents);
    }
  }
};

// Clean up data every hour
setInterval(cleanupSecurityData, 60 * 60 * 1000);
