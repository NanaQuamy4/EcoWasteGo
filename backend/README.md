# EcoWasteGo Backend API

Backend server for the EcoWasteGo waste management application built with Node.js, Express, and Supabase.

## 🚀 Features

- **Authentication System** - User registration, login, password reset
- **Email Services** - Password reset and verification emails
- **JWT Authentication** - Secure token-based authentication
- **Rate Limiting** - API request rate limiting
- **Security** - Helmet.js for security headers
- **Database** - Supabase for real-time database
- **File Upload** - Multer for handling file uploads

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- Email service (Gmail, SendGrid, etc.)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables in `.env`:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000

   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d

   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_app_password
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/verify-email` - Verify email address

### Users
- `GET /api/users` - Get user profile (protected)
- `PUT /api/users` - Update user profile (protected)

### Waste Management
- `GET /api/waste` - Get waste collection data
- `POST /api/waste` - Create waste collection request
- `PUT /api/waste/:id` - Update waste collection

### Payments
- `GET /api/payments` - Get payment history
- `POST /api/payments` - Process payment

### Recyclers
- `GET /api/recyclers` - Get recycler profiles
- `POST /api/recyclers` - Register recycler

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  username VARCHAR NOT NULL,
  phone VARCHAR,
  role VARCHAR DEFAULT 'customer',
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Waste Collections Table
```sql
CREATE TABLE waste_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES users(id),
  recycler_id UUID REFERENCES users(id),
  waste_type VARCHAR NOT NULL,
  weight DECIMAL,
  status VARCHAR DEFAULT 'pending',
  pickup_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Payments Table
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES waste_collections(id),
  amount DECIMAL NOT NULL,
  status VARCHAR DEFAULT 'pending',
  payment_method VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 Development

### Project Structure
```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── utils/           # Utility functions
├── server.js            # Main server file
├── package.json         # Dependencies
└── README.md           # This file
```

### Available Scripts
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests (coming soon)

## 🔒 Security Features

- **Helmet.js** - Security headers
- **Rate Limiting** - API request limiting
- **CORS** - Cross-origin resource sharing
- **JWT** - Secure authentication tokens
- **Input Validation** - Request data validation
- **Error Handling** - Comprehensive error handling

## 📧 Email Templates

The application includes HTML email templates for:
- Password reset emails
- Email verification
- General notifications

## 🚀 Deployment

### Environment Variables
Make sure to set all required environment variables in production:

```env
NODE_ENV=production
PORT=5000
SUPABASE_URL=your_production_supabase_url
SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
JWT_SECRET=your_production_jwt_secret
EMAIL_HOST=your_email_host
EMAIL_USER=your_email_user
EMAIL_PASS=your_email_password
```

### Health Check
The API includes a health check endpoint:
```
GET /health
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

For support, email support@ecowastego.com or create an issue in the repository. 
 