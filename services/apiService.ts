import { API_CONFIG, ApiResponse, AuthResponse, Payment, RecyclerProfile, UserProfile, WasteCollection } from '../constants/api';

// Storage keys for local data
const STORAGE_KEYS = {
  AUTH_TOKEN: 'ecowastego_auth_token',
  USER_PROFILE: 'ecowastego_user_profile',
} as const;

// Simple in-memory token storage (for development)
let globalToken: string | null = null;

// API Service Class
class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.loadToken();
  }

  // Load token from storage
  private async loadToken(): Promise<void> {
    try {
      // Use global token storage for now
      this.token = globalToken;
      console.log('Token loaded:', this.token ? this.token.substring(0, 20) + '...' : 'null');
    } catch (error) {
      console.error('Error loading token:', error);
      this.token = null;
    }
  }

  // Save token to storage
  private async saveToken(token: string, rememberMe?: boolean): Promise<void> {
    try {
      if (!token) {
        console.warn('No token provided to saveToken');
        return;
      }
      
      this.token = token;
      globalToken = token; // Store in global variable
      
      // Store token with expiration based on rememberMe
      const tokenData = {
        token,
        rememberMe: rememberMe || false,
        expiresAt: rememberMe 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
          : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };
      
      // In a real app, save to AsyncStorage or SecureStore
      console.log('Token saved:', token.substring(0, 20) + '...', 
        rememberMe ? '(Remember Me - 30 days)' : '(Regular - 24 hours)');
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  // Clear token from storage
  private async clearToken(): Promise<void> {
    try {
      this.token = null;
      globalToken = null; // Clear global token
      // In a real app, clear from AsyncStorage or SecureStore
      console.log('Token cleared');
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  }

  // Check if token is expired
  private isTokenExpired(): boolean {
    try {
      // In a real app, this would check the stored token's expiration
      // For now, we'll assume tokens are valid for the session
      return false;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  // Get headers for requests
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    if (this.token && !this.isTokenExpired()) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Generic request method with retry logic
  public async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: this.getHeaders(),
    };

    try {
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        // If JSON parsing fails, try to get the text response to debug
        const textResponse = await response.text();
        console.error('Failed to parse JSON response. Response starts with:', textResponse.substring(0, 100));
        
        // Check if it's an HTML error page
        if (textResponse.includes('<html') || textResponse.includes('<!DOCTYPE')) {
          throw new Error('Server returned HTML instead of JSON. The backend may not be running or there may be a routing issue.');
        }
        
        // Check if it's a plain text error
        if (textResponse.startsWith('This page cannot be displayed') || textResponse.startsWith('The page cannot be displayed')) {
          throw new Error('Cannot connect to the server. Please check if the backend is running and accessible.');
        }
        
        throw new Error(`Invalid server response: ${textResponse.substring(0, 50)}...`);
      }

      // Handle authentication errors
      if (response.status === 401) {
        console.log('Authentication failed, clearing token and redirecting to login');
        await this.clearToken();
        
        // In a real app, you'd navigate to login screen
        // For now, we'll throw an error that can be caught by the UI
        throw new Error('Authentication failed. Please login again.');
      }

      // Handle other errors
      if (!response.ok) {
        const errorMessage = data.message || data.error || `HTTP ${response.status}: ${response.statusText}`;
        const error = new Error(errorMessage);
        
        // Add error code for specific handling
        if (data.code) {
          (error as any).code = data.code;
        }
        
        // Don't retry for role mismatch (403) or authentication errors (401)
        if (response.status === 403 || response.status === 401) {
          throw error;
        }
        
        throw error;
      }

      return data;
    } catch (error) {
      // Handle timeout/abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Request timed out after', API_CONFIG.TIMEOUT, 'ms');
        throw new Error(`Request timed out. Please check your internet connection and try again.`);
      }

      // Handle network errors
      if (error instanceof Error && error.message.includes('Network request failed')) {
        console.error('Network request failed - backend may not be accessible');
        throw new Error('Unable to connect to the server. Please check your internet connection and ensure the backend is running.');
      }

      // Handle JSON parse errors specifically
      if (error instanceof Error && error.message.includes('JSON Parse error')) {
        console.error('JSON parse error - server may not be responding with valid JSON');
        throw new Error('Server returned invalid data. Please check if the backend is running and accessible.');
      }

      // Handle HTML response errors
      if (error instanceof Error && error.message.includes('HTML instead of JSON')) {
        console.error('Server returned HTML - backend may not be running or there may be a routing issue');
        throw new Error('Cannot connect to the server. The backend may not be running or there may be a network issue.');
      }

      // Only log detailed error info for first attempt or non-retryable errors
      if (retryCount === 0 || (error instanceof Error && 
          (error.message.includes('Authentication failed') ||
           error.message.includes('Access denied') ||
           error.message.includes('ROLE_MISMATCH') ||
           error.message.includes('registered as a')))) {
        console.error(`API Request failed:`, error instanceof Error ? error.message : String(error));
      }
      
      // Retry logic for network errors only (not auth, role mismatch, or other business logic errors)
      const shouldRetry = retryCount < 2 && 
        error instanceof Error && 
        !error.message.includes('Authentication failed') &&
        !error.message.includes('Access denied') &&
        !error.message.includes('ROLE_MISMATCH') &&
        !error.message.includes('registered as a') &&
        !error.message.includes('Request timed out') &&
        !error.message.includes('Unable to connect to the server');
      
      if (shouldRetry) {
        console.log(`Retrying request (${retryCount + 1}/3)...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.request(endpoint, options, retryCount + 1);
      }
      
      throw error;
    }
  }

  // Authentication Methods
  async register(userData: {
    email: string;
    password: string;
    username?: string;
    phone?: string;
    role?: 'customer' | 'recycler';
  }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data) {
      // Handle different token formats
      const token = response.data.token || response.data.session?.access_token;
      if (token) {
        await this.saveToken(token);
      } else {
        console.warn('No token found in registration response');
      }
    }

    return response.data!;
  }

  async login(credentials: { email: string; password: string; role?: 'customer' | 'recycler'; rememberMe?: boolean }): Promise<AuthResponse> {
    console.log('Attempting login for:', credentials.email);
    
    // Test backend connectivity first
    try {
      await this.ensureBackendAccess();
    } catch (error) {
      console.error('Backend connectivity test failed:', error);
      throw error;
    }

    // Additional connectivity check - try to reach the login endpoint specifically
    try {
      const testResponse = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`, {
        method: 'OPTIONS', // Use OPTIONS to test connectivity without sending data
        headers: { 'Accept': 'application/json' }
      });
      
      if (!testResponse.ok) {
        console.warn('Login endpoint connectivity test failed:', testResponse.status, testResponse.statusText);
      }
    } catch (testError) {
      console.warn('Login endpoint connectivity test failed:', testError);
      // Don't throw here, let the actual login attempt proceed
    }
    
    const response = await this.request<AuthResponse>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      // Handle different token formats
      const token = response.data.token || response.data.session?.access_token;
      if (token) {
        console.log('Login successful, saving token...');
        await this.saveToken(token, credentials.rememberMe);
        console.log('Token saved successfully');
      } else {
        console.warn('No token found in login response');
      }
    } else {
      console.error('Login response not successful:', response);
    }

    return response.data!;
  }

  async logout(): Promise<void> {
    try {
      console.log('ApiService: Attempting logout...');
      // Try to call the logout endpoint, but don't fail if it doesn't work
      await this.request(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {
        method: 'POST',
      });
      console.log('ApiService: Logout API call successful');
    } catch (error) {
      console.log('ApiService: Logout API call failed, but continuing with local cleanup:', error);
      // Don't throw the error, just log it
    } finally {
      console.log('ApiService: Clearing local token...');
      await this.clearToken();
      console.log('ApiService: Logout complete');
    }
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(email: string, newPassword: string): Promise<ApiResponse> {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    });
  }

  async verifyEmail(email: string, code: string): Promise<ApiResponse> {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL, {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }

  async getCurrentUser(): Promise<UserProfile> {
    // First check if we have a token
    const token = this.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      const response = await this.request<UserProfile>(API_CONFIG.ENDPOINTS.AUTH.ME);
      return response.data!;
    } catch (error: any) {
      // If we get a 401, it means the token is invalid, so clear it
      if (error.message?.includes('Authentication failed') || error.message?.includes('401')) {
        console.log('Token is invalid, clearing it');
        await this.clearToken();
      }
      throw error;
    }
  }

  // User Profile Methods
  async getUserProfile(): Promise<UserProfile> {
    const response = await this.request<UserProfile>(API_CONFIG.ENDPOINTS.USERS.PROFILE);
    return response.data!;
  }

  async updateUserProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    const response = await this.request<UserProfile>(API_CONFIG.ENDPOINTS.USERS.UPDATE_PROFILE, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    return response.data!;
  }

  async getRecyclers(): Promise<RecyclerProfile[]> {
    const response = await this.request<RecyclerProfile[]>(API_CONFIG.ENDPOINTS.USERS.RECYCLERS);
    return response.data || [];
  }

  async getAvailableRecyclersExcludingRejected(location?: string): Promise<RecyclerProfile[]> {
    const endpoint = location 
      ? `${API_CONFIG.ENDPOINTS.WASTE.GET_AVAILABLE_RECYCLERS}?location=${encodeURIComponent(location)}`
      : API_CONFIG.ENDPOINTS.WASTE.GET_AVAILABLE_RECYCLERS;
    
    const response = await this.request<RecyclerProfile[]>(endpoint);
    return response.data || [];
  }

  async searchRecyclersByLocation(location: string, wasteType?: string): Promise<RecyclerProfile[]> {
    try {
      const params = new URLSearchParams({
        location,
        ...(wasteType && { waste_type: wasteType }),
        limit: '20' // Get more results for better selection
      });

      const response = await this.request<{ data: RecyclerProfile[] }>(
        `/api/recyclers/search?${params}`,
        { method: 'GET' }
      );

      return response.data?.data || [];
    } catch (error) {
      console.error('Error searching recyclers by location:', error);
      // Fallback to getting all recyclers if search fails
      return this.getRecyclers();
    }
  }

  async getRecyclerDetails(recyclerId: string): Promise<RecyclerProfile> {
    const response = await this.request<RecyclerProfile>(`${API_CONFIG.ENDPOINTS.USERS.RECYCLER_DETAILS}/${recyclerId}`);
    return response.data!;
  }

  async deleteAccount(): Promise<ApiResponse> {
    return this.request(API_CONFIG.ENDPOINTS.USERS.DELETE_ACCOUNT, {
      method: 'DELETE',
    });
  }

  // Waste Collection Methods
  async createWasteCollection(wasteData: {
    waste_type: WasteCollection['waste_type'];
    weight?: number;
    description?: string;
    pickup_address?: string;
    pickup_notes?: string;
  }): Promise<WasteCollection> {
    const response = await this.request<WasteCollection>(API_CONFIG.ENDPOINTS.WASTE.CREATE, {
      method: 'POST',
      body: JSON.stringify(wasteData),
    });
    return response.data!;
  }

  async getWasteCollections(): Promise<WasteCollection[]> {
    const response = await this.request<WasteCollection[]>(API_CONFIG.ENDPOINTS.WASTE.GET_ALL);
    return response.data!;
  }

  async getWasteCollection(id: string): Promise<WasteCollection> {
    const response = await this.request<WasteCollection>(`${API_CONFIG.ENDPOINTS.WASTE.GET_BY_ID}/${id}`);
    return response.data!;
  }

  async updateWasteCollection(id: string, updates: Partial<WasteCollection>): Promise<WasteCollection> {
    const response = await this.request<WasteCollection>(`${API_CONFIG.ENDPOINTS.WASTE.UPDATE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.data!;
  }

  async deleteWasteCollection(id: string): Promise<ApiResponse> {
    return this.request(`${API_CONFIG.ENDPOINTS.WASTE.DELETE}/${id}`, {
      method: 'DELETE',
    });
  }

  async updateWasteStatus(id: string, status: WasteCollection['status'], rejection_reason?: string): Promise<WasteCollection> {
    const body: any = { status };
    if (rejection_reason) {
      body.rejection_reason = rejection_reason;
    }
    
    const response = await this.request<WasteCollection>(`${API_CONFIG.ENDPOINTS.WASTE.UPDATE_STATUS}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return response.data!;
  }

  async assignRecycler(collectionId: string, recyclerId: string): Promise<WasteCollection> {
    const response = await this.request<WasteCollection>(`${API_CONFIG.ENDPOINTS.WASTE.ASSIGN_RECYCLER}/${collectionId}`, {
      method: 'PUT',
      body: JSON.stringify({ recycler_id: recyclerId }),
    });
    return response.data!;
  }

  // Payment Methods
  async createPayment(paymentData: {
    collection_id: string;
    amount: number;
    currency?: string;
    payment_method?: Payment['payment_method'];
  }): Promise<Payment> {
    const response = await this.request<Payment>(API_CONFIG.ENDPOINTS.PAYMENTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
    return response.data!;
  }

  async getPayments(status?: string, page: number = 1, limit: number = 20): Promise<ApiResponse<any[]>> {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const params = new URLSearchParams();
      if (status) params.append('status', status);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await this.request<any[]>(`/api/payments/recycler?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response;
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  }

  async getPayment(id: string): Promise<Payment> {
    const response = await this.request<Payment>(`${API_CONFIG.ENDPOINTS.PAYMENTS.GET_BY_ID}/${id}`);
    return response.data!;
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment> {
    const response = await this.request<Payment>(`${API_CONFIG.ENDPOINTS.PAYMENTS.UPDATE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.data!;
  }

  async updatePaymentStatus(id: string, status: Payment['status']): Promise<Payment> {
    const response = await this.request<Payment>(`${API_CONFIG.ENDPOINTS.PAYMENTS.UPDATE_STATUS}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    return response.data!;
  }

  // Analytics Methods
  async getUserStats(): Promise<ApiResponse<any>> {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await this.request<any>('/api/analytics/user-stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }

  async getWasteStats(): Promise<any> {
    const response = await this.request(API_CONFIG.ENDPOINTS.ANALYTICS.WASTE_STATS);
    return response.data;
  }

  async getEnvironmentalImpact(): Promise<any> {
    const response = await this.request(API_CONFIG.ENDPOINTS.ANALYTICS.ENVIRONMENTAL_IMPACT);
    return response.data;
  }

  // Notifications Methods
  async getNotifications(): Promise<any[]> {
    const response = await this.request<any[]>(API_CONFIG.ENDPOINTS.NOTIFICATIONS.GET_ALL);
    return response.data || [];
  }

  async markNotificationAsRead(id: string): Promise<ApiResponse> {
    return this.request(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_READ}/${id}`, {
      method: 'PUT',
    });
  }

  async deleteNotification(id: string): Promise<ApiResponse> {
    return this.request(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS.DELETE}/${id}`, {
      method: 'DELETE',
    });
  }

  // Rewards Methods
  async getRewards(): Promise<any[]> {
    const response = await this.request<any[]>(API_CONFIG.ENDPOINTS.REWARDS.GET_ALL);
    return response.data || [];
  }

  async claimReward(id: string): Promise<ApiResponse> {
    return this.request(`${API_CONFIG.ENDPOINTS.REWARDS.CLAIM}/${id}`, {
      method: 'POST',
    });
  }

  // History Methods
  async getHistory(): Promise<any[]> {
    const response = await this.request<any[]>(API_CONFIG.ENDPOINTS.HISTORY.GET_ALL);
    return response.data || [];
  }

  async getHistoryItem(id: string): Promise<any> {
    const response = await this.request(`${API_CONFIG.ENDPOINTS.HISTORY.GET_BY_ID}/${id}`);
    return response.data;
  }

  // Support Methods
  async createSupportTicket(ticketData: any): Promise<any> {
    const response = await this.request(API_CONFIG.ENDPOINTS.SUPPORT.CREATE_TICKET, {
      method: 'POST',
      body: JSON.stringify(ticketData),
    });
    return response.data;
  }

  async getSupportTickets(): Promise<any[]> {
    const response = await this.request<any[]>(API_CONFIG.ENDPOINTS.SUPPORT.GET_TICKETS);
    return response.data || [];
  }

  async getSupportMessages(ticketId: string): Promise<any[]> {
    const response = await this.request<any[]>(`${API_CONFIG.ENDPOINTS.SUPPORT.GET_MESSAGES}/${ticketId}`);
    return response.data || [];
  }

  async sendSupportMessage(ticketId: string, message: string): Promise<any> {
    const response = await this.request(API_CONFIG.ENDPOINTS.SUPPORT.SEND_MESSAGE, {
      method: 'POST',
      body: JSON.stringify({ ticket_id: ticketId, message }),
    });
    return response.data;
  }

  // Location Methods
  async searchLocations(query: string): Promise<any[]> {
    const response = await this.request<any[]>(`${API_CONFIG.ENDPOINTS.LOCATIONS.SEARCH}?q=${encodeURIComponent(query)}`);
    return response.data || [];
  }

  async getNearbyLocations(lat: number, lng: number, radius?: number): Promise<any[]> {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      ...(radius && { radius: radius.toString() }),
    });
    const response = await this.request<any[]>(`${API_CONFIG.ENDPOINTS.LOCATIONS.NEARBY}?${params}`);
    return response.data || [];
  }

  // Tracking Methods
  async startTracking(collectionId: string): Promise<any> {
    const response = await this.request(API_CONFIG.ENDPOINTS.TRACKING.START, {
      method: 'POST',
      body: JSON.stringify({ collection_id: collectionId }),
    });
    return response.data;
  }

  async updateTracking(trackingId: string, location: { lat: number; lng: number }): Promise<any> {
    const response = await this.request(`${API_CONFIG.ENDPOINTS.TRACKING.UPDATE}/${trackingId}`, {
      method: 'PUT',
      body: JSON.stringify(location),
    });
    return response.data;
  }

  async endTracking(trackingId: string): Promise<any> {
    const response = await this.request(`${API_CONFIG.ENDPOINTS.TRACKING.END}/${trackingId}`, {
      method: 'PUT',
    });
    return response.data;
  }

  async getTrackingStatus(trackingId: string): Promise<any> {
    const response = await this.request(`${API_CONFIG.ENDPOINTS.TRACKING.GET_STATUS}/${trackingId}`);
    return response.data;
  }

  // Onboarding Methods
  async completeOnboarding(): Promise<ApiResponse> {
    return this.request(API_CONFIG.ENDPOINTS.ONBOARDING.COMPLETE, {
      method: 'POST',
    });
  }

  async getOnboardingStatus(): Promise<any> {
    const response = await this.request(API_CONFIG.ENDPOINTS.ONBOARDING.GET_STATUS);
    return response.data;
  }

  // Privacy Methods
  async acceptPrivacyPolicy(): Promise<ApiResponse> {
    return this.request(API_CONFIG.ENDPOINTS.PRIVACY.ACCEPT, {
      method: 'POST',
    });
  }

  async withdrawPrivacyPolicy(): Promise<ApiResponse> {
    return this.request(API_CONFIG.ENDPOINTS.PRIVACY.WITHDRAW, {
      method: 'POST',
    });
  }

  async getPrivacyStatus(): Promise<any> {
    const response = await this.request(API_CONFIG.ENDPOINTS.PRIVACY.GET_STATUS);
    return response.data;
  }

  // Role Management
  async switchRole(newRole: 'customer' | 'recycler'): Promise<UserProfile> {
    const response = await this.request<UserProfile>(API_CONFIG.ENDPOINTS.AUTH.SWITCH_ROLE, {
      method: 'POST',
      body: JSON.stringify({ role: newRole }),
    });
    if (!response.data) {
      throw new Error('No user data returned from role switch');
    }
    return response.data;
  }

  // Recycler Registration
  async completeRecyclerRegistration(registrationData: {
    companyName: string;
    businessLocation: string;
    areasOfOperation: string;
    availableResources: string;
    passportPhotoUrl?: string;
    businessDocumentUrl?: string;
  }): Promise<UserProfile> {
    const response = await this.request<UserProfile>('/api/recycler-registration/complete', {
      method: 'POST',
      body: JSON.stringify(registrationData),
    });
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to complete registration');
  }

  /**
   * Update recycler availability status
   */
  async updateRecyclerAvailability(isAvailable: boolean): Promise<ApiResponse> {
    try {
      console.log('Updating recycler availability:', isAvailable);
      
      const response = await this.request<ApiResponse>('/api/recyclers/availability', {
        method: 'PUT',
        body: JSON.stringify({
          is_available: isAvailable,
          availability_schedule: {
            // Default availability schedule - can be enhanced later
            monday: isAvailable,
            tuesday: isAvailable,
            wednesday: isAvailable,
            thursday: isAvailable,
            friday: isAvailable,
            saturday: isAvailable,
            sunday: isAvailable
          }
        }),
      });

      console.log('Availability update response:', response);
      return response;
    } catch (error) {
      console.error('Error updating recycler availability:', error);
      
      // If the error indicates the profile doesn't exist, try to create it first
      if (error instanceof Error && error.message.includes('Profile not found')) {
        console.log('Profile not found, attempting to create basic profile first...');
        
        try {
          // Create a basic recycler profile first
          await this.request('/api/recyclers/profile', {
            method: 'POST',
            body: JSON.stringify({
              business_name: 'Recycler',
              service_areas: ['General'],
              waste_types: ['mixed'],
              experience_years: 1,
              hourly_rate: 10.0
            }),
          });

          // Now try to update availability again
          console.log('Profile created, retrying availability update...');
          return await this.request<ApiResponse>('/api/recyclers/availability', {
            method: 'PUT',
            body: JSON.stringify({
              is_available: isAvailable,
              availability_schedule: {
                monday: isAvailable,
                tuesday: isAvailable,
                wednesday: isAvailable,
                thursday: isAvailable,
                friday: isAvailable,
                saturday: isAvailable,
                sunday: isAvailable
              }
            }),
          });
        } catch (createError) {
          console.error('Failed to create profile:', createError);
          throw new Error(`Failed to create recycler profile: ${createError instanceof Error ? createError.message : String(createError)}`);
        }
      }
      
      throw error;
    }
  }

  // Utility Methods
  isAuthenticated(): boolean {
    const hasToken = this.token !== null;
    const isExpired = this.isTokenExpired();
    console.log('isAuthenticated check:', { hasToken, isExpired, token: this.token ? this.token.substring(0, 20) + '...' : 'null' });
    return hasToken && !isExpired;
  }

  getToken(): string | null {
    console.log('getToken called, returning:', this.token ? this.token.substring(0, 20) + '...' : 'null');
    return this.token;
  }

  // Check authentication status and refresh if needed
  async checkAuthStatus(): Promise<boolean> {
    try {
      if (!this.isAuthenticated()) {
        return false;
      }

      // Try to get current user to validate token
      await this.getCurrentUser();
      return true;
    } catch (error) {
      console.log('Token validation failed, user needs to re-authenticate');
      await this.clearToken();
      return false;
    }
  }

  // Force re-authentication
  async forceReAuth(): Promise<void> {
    await this.clearToken();
    // In a real app, you'd navigate to login screen here
    console.log('User needs to re-authenticate');
  }

  // Text Messaging Methods
  async getChatMessages(pickupId: string): Promise<any[]> {
    const response = await this.request<any[]>(`${API_CONFIG.ENDPOINTS.RECYCLER.TEXT}/${pickupId}`);
    return response.data || [];
  }

  async sendChatMessage(pickupId: string, message: string): Promise<any> {
    const response = await this.request(`${API_CONFIG.ENDPOINTS.RECYCLER.TEXT}/${pickupId}/send`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    return response.data;
  }

  async getMessageSuggestions(): Promise<string[]> {
    const response = await this.request<string[]>(`${API_CONFIG.ENDPOINTS.RECYCLER.TEXT}/suggestions`);
    return response.data || [];
  }

  async createPaymentSummary(paymentData: {
    requestId: string;
    weight: number;
    wasteType: string;
    rate: number;
    subtotal: number;
    environmentalTax: number;
    totalAmount: number;
  }): Promise<any> {
    const response = await this.request(`${API_CONFIG.ENDPOINTS.PAYMENT_SUMMARY}`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
    return response.data;
  }

  async addRecyclerReview(reviewData: {
    recycler_id: string;
    collection_id: string;
    rating: number;
    comment?: string;
  }): Promise<any> {
    const response = await this.request('/api/recyclers/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
    return response.data;
  }

  async getPaymentSummary(requestId: string): Promise<any> {
    const response = await this.request<any>(`${API_CONFIG.ENDPOINTS.PAYMENT_SUMMARY}/${requestId}`);
    return response.data;
  }

  async rejectPaymentSummary(paymentSummaryId: string, rejectionReason: string): Promise<any> {
    const response = await this.request(`${API_CONFIG.ENDPOINTS.PAYMENT_SUMMARY}/${paymentSummaryId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ rejectionReason }),
    });
    return response.data;
  }

  async acceptPaymentSummary(paymentSummaryId: string): Promise<any> {
    const response = await this.request(`${API_CONFIG.ENDPOINTS.PAYMENT_SUMMARY}/${paymentSummaryId}/accept`, {
      method: 'PUT',
    });
    return response.data;
  }

  async updatePaymentSummary(paymentSummaryId: string, paymentData: {
    weight: number;
    wasteType: string;
    rate: number;
    subtotal: number;
    environmentalTax: number;
    totalAmount: number;
  }): Promise<any> {
    const response = await this.request(`${API_CONFIG.ENDPOINTS.PAYMENT_SUMMARY}/${paymentSummaryId}`, {
      method: 'PUT',
      body: JSON.stringify(paymentData),
    });
    return response.data;
  }

  // Test backend connectivity
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing connection to:', this.baseURL);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for connection test
      
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('✅ Backend connection successful');
        return true;
      } else {
        console.log('❌ Backend responded with status:', response.status);
        return false;
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('❌ Connection test timed out after 10 seconds');
      } else if (error instanceof Error && error.message.includes('Network request failed')) {
        console.error('❌ Network request failed - backend may not be accessible');
      } else {
        console.error('❌ Connection test failed:', error);
      }
      return false;
    }
  }

  // Try alternative IP addresses if primary fails
  private async tryAlternativeIPs(): Promise<string | null> {
    const alternativeIPs = [
      'http://10.132.144.9:3000',  // Current configured IP
      'http://10.133.121.133:3000', // Alternative IP from previous config
      'http://localhost:3000',      // Local development
      'http://127.0.0.1:3000'      // Local development alternative
    ];

    for (const ip of alternativeIPs) {
      try {
        console.log(`Trying alternative IP: ${ip}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for each IP
        
        const response = await fetch(`${ip}/health`, {
          method: 'GET',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log(`✅ Found working IP: ${ip}`);
          return ip;
        }
      } catch (error) {
        console.log(`❌ IP ${ip} failed:`, error instanceof Error ? error.message : String(error));
        continue;
      }
    }
    
    console.log('❌ No alternative IPs worked');
    return null;
  }

  // Check if backend is accessible before making requests
  private async ensureBackendAccess(): Promise<void> {
    let isConnected = await this.testConnection();
    
    if (!isConnected) {
      console.log('Primary IP failed, trying alternatives...');
      const workingIP = await this.tryAlternativeIPs();
      
      if (workingIP) {
        console.log(`Switching to working IP: ${workingIP}`);
        this.baseURL = workingIP;
        isConnected = true;
      } else {
        throw new Error('Backend server is not accessible on any known IP address. Please check your internet connection and ensure the server is running on port 3000.');
      }
    }
  }

  // Public method to test connection and get detailed status
  async getConnectionStatus(): Promise<{
    isConnected: boolean;
    currentIP: string;
    workingIPs: string[];
    failedIPs: string[];
    error?: string;
  }> {
    const workingIPs: string[] = [];
    const failedIPs: string[] = [];
    let error: string | undefined;

    try {
      // Test current IP
      const currentIPWorking = await this.testConnection();
      if (currentIPWorking) {
        workingIPs.push(this.baseURL);
      } else {
        failedIPs.push(this.baseURL);
      }

      // Test all alternative IPs
      const alternativeIPs = [
        'http://10.132.144.9:3000',
        'http://10.133.121.133:3000',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
      ];

      for (const ip of alternativeIPs) {
        if (ip === this.baseURL) continue; // Skip current IP as it's already tested
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(`${ip}/health`, {
            method: 'GET',
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            workingIPs.push(ip);
          } else {
            failedIPs.push(ip);
          }
        } catch (err) {
          failedIPs.push(ip);
        }
      }

      return {
        isConnected: workingIPs.length > 0,
        currentIP: this.baseURL,
        workingIPs,
        failedIPs,
        error
      };
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      return {
        isConnected: false,
        currentIP: this.baseURL,
        workingIPs,
        failedIPs,
        error
      };
    }
  }

  // New method to diagnose connection issues
  async diagnoseConnection(): Promise<{
    baseURL: string;
    canReachServer: boolean;
    responseType: 'json' | 'html' | 'text' | 'error';
    responsePreview: string;
    statusCode?: number;
    error?: string;
  }> {
    try {
      console.log('Diagnosing connection to:', this.baseURL);
      
      const response = await fetch(`${this.baseURL}/api/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      let responseType: 'json' | 'html' | 'text' | 'error' = 'error';
      let responsePreview = '';
      
      try {
        const text = await response.text();
        responsePreview = text.substring(0, 100);
        
        if (text.includes('<html') || text.includes('<!DOCTYPE')) {
          responseType = 'html';
        } else if (text.startsWith('{') || text.includes('{')) {
          responseType = 'json';
        } else {
          responseType = 'text';
        }
      } catch (parseError) {
        responseType = 'error';
        responsePreview = 'Failed to read response';
      }
      
      return {
        baseURL: this.baseURL,
        canReachServer: response.ok,
        responseType,
        responsePreview,
        statusCode: response.status,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      };
    } catch (error) {
      return {
        baseURL: this.baseURL,
        canReachServer: false,
        responseType: 'error',
        responsePreview: '',
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService; 