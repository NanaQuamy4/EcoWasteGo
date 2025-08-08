import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
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

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8081',
    'http://localhost:19006',
    'http://10.36.50.88:3000',
    'http://10.36.50.88:8081',
    'http://10.36.50.88:19006',
    'http://10.132.144.9:3000',
    'http://10.132.144.9:8081',
    'http://10.133.121.133:3000',
    'http://10.133.121.133:8081',
    'exp://localhost:8081',
    'exp://localhost:19006',
    'exp://10.36.50.88:8081',
    'exp://10.36.50.88:19006',
    'exp://10.132.144.9:8081',
    'exp://10.133.121.133:8081',
    'http://localhost:19000',
    'http://localhost:19001',
    'http://localhost:19002',
    // Add current IP for mobile access
    'http://10.36.50.88:19006',
    'exp://10.36.50.88:19006'
  ],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'EcoWasteGo Backend is running',
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