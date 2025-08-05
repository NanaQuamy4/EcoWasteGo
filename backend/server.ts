import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

// Import routes
import analyticsRoutes from './src/routes/analytics';
import authRoutes from './src/routes/auth';
import historyRoutes from './src/routes/history';
import locationsRoutes from './src/routes/locations';
import notificationsRoutes from './src/routes/notifications';
import onboardingRoutes from './src/routes/onboarding';
import paymentsRoutes from './src/routes/payments';
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
import supportRoutes from './src/routes/support';
import textRecyclerRoutes from './src/routes/text-recycler';
import trackingRoutes from './src/routes/tracking';
import usersRoutes from './src/routes/users';
import wasteRoutes from './src/routes/waste';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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

app.listen(PORT, () => {
  console.log(`🚀 EcoWasteGo Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app; 