// API Configuration for EcoWasteGo Frontend
export const API_CONFIG = {
  // Base URL for development - using computer's IP address for mobile access
  // Will fallback to localhost if external IP is not accessible
  BASE_URL: 'http://192.168.246.157:3000',
  FALLBACK_URL: 'http://localhost:3000',
  
  // API endpoints
  ENDPOINTS: {
    // Authentication
    AUTH: {
      REGISTER: '/api/register', // Changed from /api/auth/register to use simplified endpoint
      LOGIN: '/api/auth/simple-login', // Changed to use simplified login
      LOGOUT: '/api/auth/logout',
      FORGOT_PASSWORD: '/api/auth/forgot-password',
      RESET_PASSWORD: '/api/auth/reset-password',
      VERIFY_EMAIL: '/api/auth/verify-email',
      ME: '/api/auth/me',
      SWITCH_ROLE: '/api/auth/switch-role',
      SIMPLE_REGISTER: '/api/register', // Direct simplified registration
      SIMPLE_LOGIN: '/api/auth/simple-login', // Direct simplified login
    },
    
    // Users
    USERS: {
      PROFILE: '/api/users/profile',
      UPDATE_PROFILE: '/api/users/profile',
      RECYCLERS: '/api/users/recyclers',
      RECYCLER_DETAILS: '/api/users/recycler',
      DELETE_ACCOUNT: '/api/users/account',
    },
    
    // Waste Collections
    WASTE: {
      CREATE: '/api/waste',
      GET_ALL: '/api/waste',
      GET_BY_ID: '/api/waste',
      UPDATE: '/api/waste',
      DELETE: '/api/waste',
      UPDATE_STATUS: '/api/waste/status',
      ASSIGN_RECYCLER: '/api/waste/assign',
      GET_AVAILABLE_RECYCLERS: '/api/waste/recyclers/available',
    },
    
    // Payments
    PAYMENTS: {
      CREATE: '/api/payments',
      GET_ALL: '/api/payments',
      GET_BY_ID: '/api/payments',
      UPDATE: '/api/payments',
      DELETE: '/api/payments',
      UPDATE_STATUS: '/api/payments/status',
    },
    
    // Analytics
    ANALYTICS: {
      USER_STATS: '/api/analytics/user-stats',
      WASTE_STATS: '/api/analytics/waste-stats',
      ENVIRONMENTAL_IMPACT: '/api/analytics/environmental-impact',
    },
    
    // Notifications
    NOTIFICATIONS: {
      GET_ALL: '/api/notifications',
      MARK_READ: '/api/notifications/read',
      DELETE: '/api/notifications',
    },
    
    // Rewards
    REWARDS: {
      GET_ALL: '/api/rewards',
      CLAIM: '/api/rewards/claim',
    },
    
    // History
    HISTORY: {
      GET_ALL: '/api/history',
      GET_BY_ID: '/api/history',
    },
    
    // Support
    SUPPORT: {
      CREATE_TICKET: '/api/support/tickets',
      GET_TICKETS: '/api/support/tickets',
      GET_MESSAGES: '/api/support/messages',
      SEND_MESSAGE: '/api/support/messages',
    },
    
    // Locations
    LOCATIONS: {
      SEARCH: '/api/locations/search',
      NEARBY: '/api/locations/nearby',
    },
    
    // Tracking
    TRACKING: {
      START: '/api/tracking/start',
      UPDATE: '/api/tracking/update',
      END: '/api/tracking/end',
      GET_STATUS: '/api/tracking/status',
    },
    
    // Onboarding
    ONBOARDING: {
      COMPLETE: '/api/onboarding/complete',
      GET_STATUS: '/api/onboarding/status',
    },
    
    // Privacy
    PRIVACY: {
      ACCEPT: '/api/privacy/accept',
      WITHDRAW: '/api/privacy/withdraw',
      GET_STATUS: '/api/privacy/status',
    },
    
    // Recycler specific endpoints
    RECYCLER: {
      CELEBRATION: '/api/recycler-celebration',
      NAVIGATION: '/api/recycler-navigation',
      PAYMENT_SUMMARY: '/api/recycler-payment-summary',
      REGISTRATION: '/api/recycler-registration',
      REQUESTS: '/api/recycler-requests',
      WEIGHT_ENTRY: '/api/recycler-weight-entry',
      TEXT: '/api/text-recycler',
    },

    // Payment Summary
    PAYMENT_SUMMARY: '/api/payment-summary',

    // SMS Verification
    SMS_VERIFICATION: {
      SEND_CODE: '/api/sms-verification/send-code',
      VERIFY_CODE: '/api/sms-verification/verify-code',
      RESEND_CODE: '/api/sms-verification/resend-code',
      REGISTER: '/api/sms-verification/register',
      STATUS: '/api/sms-verification/status',
    },

    // SMS (Quick SMS)
    SMS: {
      QUICK: '/api/sms/quick',
      SEND: '/api/sms/send',
      STATUS: '/api/sms/status',
    },
  },
  
  // Request headers
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  } as Record<string, string>,
  
  // Timeout settings
  TIMEOUT: 30000, // 30 seconds
  SMS_TIMEOUT: 60000, // 60 seconds for SMS operations (longer due to external API)
  
  // Retry settings
  RETRY_ATTEMPTS: 5,
  RETRY_DELAY: 2000, // 2 seconds
} as const;

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username?: string;
    phone?: string;
    role: 'customer' | 'recycler';
    email_verified: boolean;
    onboarding_completed: boolean;
    profile_image?: string;
    created_at: string;
  };
  session?: {
    access_token: string;
    refresh_token: string;
    expires_at?: string;
    rememberMe?: boolean;
  };
  token?: string; // For backward compatibility
}

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  phone?: string;
  role: 'customer' | 'recycler';
  email_verified: boolean;
  onboarding_completed: boolean;
  privacy_policy_accepted: boolean;
  profile_image?: string;
  verification_status?: 'unverified' | 'pending' | 'verified' | 'rejected';
  company_name?: string;
  business_location?: string;
  areas_of_operation?: string;
  available_resources?: string;
  passport_photo_url?: string;
  business_document_url?: string;
  created_at: string;
  updated_at: string;
}

export interface WasteCollection {
  id: string;
  customer_id: string;
  recycler_id?: string;
  waste_type: 'plastic' | 'paper' | 'glass' | 'metal' | 'organic' | 'electronics' | 'mixed';
  weight?: number;
  description?: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  pickup_date?: string;
  pickup_address?: string;
  pickup_notes?: string;
  collection_photos?: string[];
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  collection_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  payment_method?: 'mobile_money' | 'bank_transfer' | 'cash' | 'card';
  transaction_id?: string;
  payment_date?: string;
  created_at: string;
}

export interface RecyclerProfile {
  id: string;
  user_id: string;
  business_name?: string;
  business_license?: string;
  service_areas?: string[];
  vehicle_type?: string;
  vehicle_number?: string;
  experience_years?: number;
  rating: number;
  total_collections: number;
  is_verified: boolean;
  is_available: boolean;
  created_at: string;
  updated_at: string;
} 