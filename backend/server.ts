import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

// Import routes
import { supabase } from './src/config/supabase';
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
import smsRoutes from './src/routes/sms';
import smsVerificationRoutes from './src/routes/sms-verification';
import supportRoutes from './src/routes/support';
import textRecyclerRoutes from './src/routes/text-recycler';
import trackingRoutes from './src/routes/tracking';
import usersRoutes from './src/routes/users';
import wasteRoutes from './src/routes/waste';

// Import security middleware
import { apiRateLimit, authRateLimit, cspMiddleware, paymentRateLimit, requestSizeLimiter, sanitizeInput } from './src/middleware/security';
import { getSecurityStats, securityMonitoring } from './src/middleware/securityMonitoring';

// Load environment variables first
const envLoaded = dotenv.config({ path: '.env' });

if (envLoaded.error) {
  console.error('❌ Failed to load .env file:', envLoaded.error);
} else {
  console.log('✅ .env file loaded successfully');
  console.log('📁 Current working directory:', process.cwd());
  console.log('📄 .env file path:', envLoaded.parsed ? 'loaded' : 'not parsed');
  console.log('📄 .env file content preview:', Object.keys(envLoaded.parsed || {}).slice(0, 5));
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL); // Test one variable
  console.log('🔧 SMS Configuration Debug:', {
    SMS_VERIFICATION_ENABLED: process.env.SMS_VERIFICATION_ENABLED,
    MNOTIFY_API_KEY: process.env.MNOTIFY_API_KEY ? 'SET' : 'NOT_SET',
    NODE_ENV: process.env.NODE_ENV
  });
}

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
          'http://localhost:3000', 'http://localhost:8081', 'http://localhost:19006',
          'exp://localhost:8081', 'exp://localhost:19006',
          'http://192.168.71.157:3000', 'http://192.168.71.157:8081', 'http://192.168.71.157:19006',
          'exp://192.168.71.157:8081', 'exp://192.168.71.157:19006'
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
    // Test database connection by checking both new tables
    const [customersResult, recyclersResult] = await Promise.all([
      supabase.from('customers').select('count').limit(1),
      supabase.from('recyclers').select('count').limit(1)
    ]);
    
    if (customersResult.error || recyclersResult.error) {
      console.error('Database connection test failed:', customersResult.error || recyclersResult.error);
      res.status(500).json({ 
        status: 'ERROR', 
        message: 'EcoWasteGo Backend is running but database connection failed',
        timestamp: new Date().toISOString(),
        database: 'FAILED',
        error: (customersResult.error || recyclersResult.error)?.message || 'Unknown error'
      });
      return;
    }
    
    res.status(200).json({ 
      status: 'OK', 
      message: 'EcoWasteGo Backend is running with separated user tables',
      timestamp: new Date().toISOString(),
      database: 'CONNECTED',
      tables: {
        customers: 'available',
        recyclers: 'available'
      }
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

// Test database insert endpoint
app.post('/test-db-insert', async (req, res) => {
  try {
    const { email, username, phone, role } = req.body;
    
    console.log('Testing database insert with:', { email, username, phone, role });
    
    let result;
    if (role === 'customer') {
      result = await supabase
        .from('customers')
        .insert({
          email,
          username,
          phone,
          privacy_policy_accepted: true,
          privacy_policy_version: '1.0',
          privacy_policy_accepted_at: new Date().toISOString()
        })
        .select();
    } else {
      result = await supabase
        .from('recyclers')
        .insert({
          email,
          username,
          phone,
          privacy_policy_accepted: true,
          privacy_policy_version: '1.0',
          privacy_policy_accepted_at: new Date().toISOString()
        })
        .select();
    }
    
    if (result.error) {
      console.error('Database insert test failed:', result.error);
      res.status(500).json({
        success: false,
        error: 'Database insert failed',
        details: result.error
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'Database insert test successful',
      data: result.data
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Test endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Simple registration endpoint (bypasses Supabase Auth)
app.post('/simple-register', async (req, res) => {
  try {
    const { email, username, phone, role, password } = req.body;
    
    console.log('Simple registration for:', { email, username, phone, role });
    
    // Check if user already exists
    let existingUser;
    if (role === 'customer') {
      const { data } = await supabase
        .from('customers')
        .select('id')
        .eq('email', email)
        .single();
      existingUser = data;
    } else {
      const { data } = await supabase
        .from('recyclers')
        .select('id')
        .eq('email', email)
        .single();
      existingUser = data;
    }
    
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
      return;
    }
    
    // Create user profile directly in database
    let result;
    if (role === 'customer') {
      result = await supabase
        .from('customers')
        .insert({
          email,
          username,
          phone,
          privacy_policy_accepted: true,
          privacy_policy_version: '1.0',
          privacy_policy_accepted_at: new Date().toISOString()
        })
        .select()
        .single();
    } else {
      result = await supabase
        .from('recyclers')
        .insert({
          email,
          username,
          phone,
          privacy_policy_accepted: true,
          privacy_policy_version: '1.0',
          privacy_policy_accepted_at: new Date().toISOString()
        })
        .select()
        .single();
    }
    
    if (result.error) {
      console.error('Simple registration failed:', result.error);
      res.status(500).json({
        success: false,
        error: 'Failed to create user profile',
        details: result.error
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'User registered successfully (without email confirmation)',
      data: {
        user: {
          id: result.data.id,
          email: result.data.email,
          username: result.data.username,
          role: role,
          emailVerified: false
        }
      }
    });
    
  } catch (error) {
    console.error('Simple registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API registration endpoint (bypasses Supabase Auth)
app.post('/api/register', async (req, res) => {
  try {
    const { email, username, phone, role, password } = req.body;
    
    console.log('API registration for:', { email, username, phone, role });
    
    // Check if user already exists
    let existingUser;
    if (role === 'customer') {
      const { data } = await supabase
        .from('customers')
        .select('id')
        .eq('email', email)
        .single();
      existingUser = data;
    } else {
      const { data } = await supabase
        .from('recyclers')
        .select('id')
        .eq('email', email)
        .single();
      existingUser = data;
    }
    
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
      return;
    }
    
    // Create user profile directly in database with auto-verification
    let result;
    if (role === 'customer') {
      result = await supabase
        .from('customers')
        .insert({
          email,
          username,
          phone,
          email_verified: true, // Auto-verify the user
          privacy_policy_accepted: true,
          privacy_policy_version: '1.0',
          privacy_policy_accepted_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();
    } else {
      result = await supabase
        .from('recyclers')
        .insert({
          email,
          username,
          phone,
          email_verified: true, // Auto-verify the user
          privacy_policy_accepted: true,
          privacy_policy_version: '1.0',
          privacy_policy_accepted_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();
    }
    
    if (result.error) {
      console.error('API registration failed:', result.error);
      res.status(500).json({
        success: false,
        error: 'Failed to create user profile',
        details: result.error
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'User registered successfully (auto-verified)',
      data: {
        user: {
          id: result.data.id,
          email: result.data.email,
          username: result.data.username,
          phone: result.data.phone,
          role: role,
          emailVerified: true
        }
      }
    });
    
  } catch (error) {
    console.error('API registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API registration endpoint (bypasses Supabase Auth)
app.post('/api/register', async (req, res) => {
  try {
    const { email, username, phone, role, password } = req.body;
    
    console.log('API registration for:', { email, username, phone, role });
    
    // Check if user already exists
    let existingUser;
    if (role === 'customer') {
      const { data } = await supabase
        .from('customers')
        .select('id')
        .eq('email', email)
        .single();
      existingUser = data;
    } else {
      const { data } = await supabase
        .from('recyclers')
        .select('id')
        .eq('email', email)
        .single();
      existingUser = data;
    }
    
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
      return;
    }
    
    // Create user profile directly in database with auto-verification
    let result;
    if (role === 'customer') {
      result = await supabase
        .from('customers')
        .insert({
          email,
          username,
          phone,
          email_verified: true, // Auto-verify the user
          privacy_policy_accepted: true,
          privacy_policy_version: '1.0',
          privacy_policy_accepted_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();
    } else {
      result = await supabase
        .from('recyclers')
        .insert({
          email,
          username,
          phone,
          email_verified: true, // Auto-verify the user
          privacy_policy_accepted: true,
          privacy_policy_version: '1.0',
          privacy_policy_accepted_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();
    }
    
    if (result.error) {
      console.error('API registration failed:', result.error);
      res.status(500).json({
        success: false,
        error: 'Failed to create user profile',
        details: result.error
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'User registered successfully (auto-verified)',
      data: {
        user: {
          id: result.data.id,
          email: result.data.email,
          username: result.data.username,
          phone: result.data.phone,
          role: role,
          emailVerified: true
        }
      }
    });
    
  } catch (error) {
    console.error('API registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
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
app.use('/api/sms-verification', smsVerificationRoutes);
app.use('/api/sms', smsRoutes);

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

// Start server
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 EcoWasteGo Backend Server is running!`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`🌐 Network: http://192.168.71.157:${PORT}`);
  console.log(`📱 Mobile App can connect to: http://192.168.71.157:${PORT}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health Check: http://192.168.71.157:${PORT}/health`);
});

export default app; 