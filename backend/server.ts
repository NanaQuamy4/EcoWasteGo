import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

// Load environment variables first
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  console.error('Please update your .env file with your Supabase credentials');
  console.error('Get them from: https://supabase.com/dashboard → Settings → API');
  process.exit(1);
} else {
  console.log('✅ All required environment variables are configured');
}

// Import routes
import analyticsRoutes from './src/routes/analytics';
import authRoutes from './src/routes/auth';
import historyRoutes from './src/routes/history';
import locationsRoutes from './src/routes/locations';
import notificationsRoutes from './src/routes/notifications';
import onboardingRoutes from './src/routes/onboarding';
import optimizedUsersRoutes from './src/routes/optimizedUsers';
import paymentsRoutes from './src/routes/payments';
import performanceRoutes from './src/routes/performance';
import privacyRoutes from './src/routes/privacy';
import recyclerCelebrationRoutes from './src/routes/recycler-celebration';
import recyclerNavigationRoutes from './src/routes/recycler-navigation';
import recyclerPaymentSummaryRoutes from './src/routes/recycler-payment-summary';
import recyclerRegistrationRoutes from './src/routes/recycler-registration';
import recyclerRequestsRoutes from './src/routes/recycler-requests';
import recyclerWeightEntryRoutes from './src/routes/recycler-weight-entry';
import recyclersRoutes from './src/routes/recyclers';
import registerRoutes from './src/routes/register';
import rewardsRoutes from './src/routes/rewards';
import roleBasedRoutes from './src/routes/roleBased';
import supportRoutes from './src/routes/support';
import textRecyclerRoutes from './src/routes/text-recycler';
import trackingRoutes from './src/routes/tracking';
import usersRoutes from './src/routes/users';
import wasteRoutes from './src/routes/waste';
import { supabase } from './src/config/supabase';

// Import security middleware
import { apiRateLimit, authRateLimit, cspMiddleware, paymentRateLimit, requestSizeLimiter, sanitizeInput } from './src/middleware/security';
import { getSecurityStats, securityMonitoring } from './src/middleware/securityMonitoring';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(helmet());

// Production-ready CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? [
          process.env.FRONTEND_URL || 'https://ecowastego.com',
          process.env.MOBILE_APP_URL || 'https://ecowastego.com'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:8081', 
          'http://localhost:19006',
          'exp://localhost:8081',
          'exp://localhost:19006'
        ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-CSRF-Token', 'X-Session-Id']
};

app.use(cors(corsOptions));

// Security middleware (order matters!)
app.use(securityMonitoring); // Monitor all requests
app.use(cspMiddleware); // Content Security Policy
app.use(sanitizeInput); // Input sanitization
app.use(requestSizeLimiter); // Request size limits

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced rate limiting with security
app.use('/api/auth', authRateLimit); // Stricter auth rate limiting
app.use('/api/payments', paymentRateLimit); // Payment rate limiting
app.use('/api/', apiRateLimit); // General API rate limiting

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('waste_collections')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Database connection test failed:', error);
      res.status(500).json({ 
        status: 'ERROR', 
        message: 'EcoWasteGo Backend is running but database connection failed',
        timestamp: new Date().toISOString(),
        database: 'FAILED',
        error: error.message
      });
      return;
    }
    
    res.status(200).json({ 
      status: 'OK', 
      message: 'EcoWasteGo Backend is running',
      timestamp: new Date().toISOString(),
      database: 'CONNECTED'
    });
  } catch (dbError) {
    console.error('Database connection test failed:', dbError);
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'EcoWasteGo Backend is running but database connection failed',
      timestamp: new Date().toISOString(),
      database: 'FAILED',
      error: dbError instanceof Error ? dbError.message : 'Unknown error'
    });
  }
});

// Security monitoring endpoint (admin only)
app.get('/security/stats', (req, res) => {
  // In production, verify admin role here
  const stats = getSecurityStats();
  res.status(200).json({
    success: true,
    data: stats,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/register', registerRoutes);
app.use('/api/role-based', roleBasedRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/waste', wasteRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/recyclers', recyclersRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/onboarding', onboardingRoutes);

// Optimized routes with performance monitoring
app.use('/api/optimized-users', optimizedUsersRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/privacy', privacyRoutes);
app.use('/api/recycler-celebration', recyclerCelebrationRoutes);
app.use('/api/recycler-navigation', recyclerNavigationRoutes);
app.use('/api/recycler-payment-summary', recyclerPaymentSummaryRoutes);
app.use('/api/recycler-registration', recyclerRegistrationRoutes);
app.use('/api/recycler-requests', recyclerRequestsRoutes);
app.use('/api/recycler-weight-entry', recyclerWeightEntryRoutes);
app.use('/api/text-recycler', textRecyclerRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 EcoWasteGo Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Network access: http://10.132.144.9:${PORT}/health`);
});

export default app; 