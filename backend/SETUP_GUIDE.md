# EcoWasteGo Backend Setup Guide (Supabase 2025)

## 🚀 **Step 1: Create Supabase Project**

1. **Go to [supabase.com](https://supabase.com)** and sign up/login
2. **Click "New Project"**
3. **Fill in the details:**
   - **Name**: `ecowastego`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users (e.g., US East for US users)
   - **Pricing Plan**: Free tier is fine to start

## 🔑 **Step 2: Get Project Credentials**

Once your project is created:

1. **Go to Settings > API** in your Supabase dashboard
2. **Copy these values:**
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)
   - **Service role key** (for admin operations)

**Note**: The service role key is required for admin operations like user deletion.

## 🗄️ **Step 3: Set Up Database Schema**

1. **Go to SQL Editor** in your Supabase dashboard
2. **Copy the entire content** from `database-schema.sql`
3. **Paste and run** the SQL in the Supabase SQL Editor
4. **Verify the tables are created** by checking the Table Editor

## 🔧 **Step 4: Configure Environment Variables**

1. **Create a `.env` file** in the backend directory:
   ```bash
   touch .env
   ```

2. **Fill in your Supabase credentials:**
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_KEY=your_service_role_key_here
   ```

3. **Configure server settings:**
   ```env
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

4. **Configure Google API (Optional - for location services):**
   ```env
   GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

   **Google Maps API Services Needed:**
   - **Places API**: For location search and suggestions
   - **Directions API**: For route optimization and navigation
   - **Distance Matrix API**: For ETA calculations
   - **Geocoding API**: For address validation

5. **Configure email settings** (optional for now):
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_app_password
   ```

## 🧪 **Step 5: Test the Backend**

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test the health endpoint:**
   ```bash
   curl http://localhost:5000/health
   ```
   Should return: `{"status":"OK","message":"EcoWasteGo Backend is running"}`

3. **Test authentication endpoints:**
   ```bash
   # Test registration
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123","username":"testuser"}'
   ```

## 📱 **Step 6: Configure Frontend**

1. **Update your frontend** to use the backend API
2. **Set the API base URL** to `http://localhost:5000/api`
3. **Test the authentication flow** with your React Native app

## 🔒 **Step 7: Security Configuration**

1. **Enable Row Level Security (RLS)** - Already done in the schema
2. **Configure CORS** - Already set up for localhost:3000
3. **Set up rate limiting** - Already configured
4. **Add input validation** - Implement as needed

## 📧 **Step 8: Email Configuration (Optional)**

For password reset and email verification:

1. **Create a Gmail app password:**
   - Go to Google Account settings
   - Enable 2-factor authentication
   - Generate an app password
   - Use this as `EMAIL_PASS`

2. **Update your `.env` file** with email settings

## 🔄 **Step 9: Authentication Flow**

The backend now uses **Supabase Auth only**:

1. **Registration**: Users sign up through Supabase Auth
2. **Login**: Users sign in with email/password
3. **Session Management**: Supabase handles tokens automatically
4. **Password Reset**: Uses Supabase's built-in reset functionality
5. **Email Verification**: Uses Supabase's email verification
6. **Admin Operations**: Uses service role key for user deletion

## 🚀 **Step 10: Deployment**

1. **Environment Variables**: Set all required env vars
2. **Database**: Ensure schema is deployed
3. **CORS**: Update CORS_ORIGIN for production
4. **Rate Limiting**: Adjust limits for production traffic

## 📚 **API Documentation**

- **Authentication**: `/api/auth/*`
- **Users**: `/api/users/*`
- **Waste Collections**: `/api/waste/*`
- **Payments**: `/api/payments/*`
- **Recyclers**: `/api/recyclers/*`
- **Analytics**: `/api/analytics/*`
- **Notifications**: `/api/notifications/*`
- **Rewards**: `/api/rewards/*`
- **History**: `/api/history/*`

## 🔧 **Troubleshooting**

1. **Supabase Connection**: Check your URL and anon key
2. **Database Schema**: Ensure all tables are created
3. **Environment Variables**: Verify all required vars are set
4. **CORS Issues**: Check FRONTEND_URL configuration
5. **Authentication**: Test with Supabase Auth methods
6. **Admin Operations**: Ensure service role key is configured

## 📞 **Support**

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Backend Issues**: Check the API documentation
- **Database Issues**: Verify RLS policies are enabled 
 