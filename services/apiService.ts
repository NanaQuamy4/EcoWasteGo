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
  private async request<T>(
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
      const response = await fetch(url, config);
      const data = await response.json();

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
        
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`API Request failed (attempt ${retryCount + 1}):`, error);
      
      // Retry logic for network errors (not auth errors)
      if (retryCount < 2 && error instanceof Error && !error.message.includes('Authentication failed')) {
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

  async login(credentials: { email: string; password: string; rememberMe?: boolean }): Promise<AuthResponse> {
    console.log('Attempting login for:', credentials.email);
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

  async resetPassword(token: string, newPassword: string): Promise<ApiResponse> {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  async verifyEmail(email: string, token: string): Promise<ApiResponse> {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL, {
      method: 'POST',
      body: JSON.stringify({ email, token }),
    });
  }

  async getCurrentUser(): Promise<UserProfile> {
    const response = await this.request<UserProfile>(API_CONFIG.ENDPOINTS.AUTH.ME);
    return response.data!;
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
    return response.data!;
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

  async updateWasteStatus(id: string, status: WasteCollection['status']): Promise<WasteCollection> {
    const response = await this.request<WasteCollection>(`${API_CONFIG.ENDPOINTS.WASTE.UPDATE_STATUS}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
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

  async getPayments(): Promise<Payment[]> {
    const response = await this.request<Payment[]>(API_CONFIG.ENDPOINTS.PAYMENTS.GET_ALL);
    return response.data!;
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
  async getUserStats(): Promise<any> {
    const response = await this.request(API_CONFIG.ENDPOINTS.ANALYTICS.USER_STATS);
    return response.data;
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

  // Utility Methods
  isAuthenticated(): boolean {
    return this.token !== null && !this.isTokenExpired();
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
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService; 