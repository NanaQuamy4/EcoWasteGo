import { API_CONFIG, ApiResponse, AuthResponse, UserProfile, WasteCollection, Payment, RecyclerProfile } from '../constants/api';

// Storage keys for local data
const STORAGE_KEYS = {
  AUTH_TOKEN: 'ecowastego_auth_token',
  USER_PROFILE: 'ecowastego_user_profile',
} as const;

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
      // In a real app, you'd use AsyncStorage or SecureStore
      // For now, we'll use a simple approach
      this.token = null; // Will be set after login
    } catch (error) {
      console.error('Error loading token:', error);
    }
  }

  // Save token to storage
  private async saveToken(token: string): Promise<void> {
    try {
      this.token = token;
      // In a real app, save to AsyncStorage or SecureStore
      console.log('Token saved');
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  // Clear token from storage
  private async clearToken(): Promise<void> {
    try {
      this.token = null;
      // In a real app, clear from AsyncStorage or SecureStore
      console.log('Token cleared');
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  }

  // Get headers for requests
  private getHeaders(): Record<string, string> {
    const headers = { ...API_CONFIG.HEADERS };
    
    if (this.token) {
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

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          await this.clearToken();
          throw new Error('Authentication failed. Please login again.');
        }

        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error(`API Request failed (attempt ${retryCount + 1}):`, error);

      // Retry logic
      if (retryCount < API_CONFIG.RETRY_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY));
        return this.request<T>(endpoint, options, retryCount + 1);
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
      await this.saveToken(response.data.token);
    }

    return response.data!;
  }

  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      await this.saveToken(response.data.token);
    }

    return response.data!;
  }

  async logout(): Promise<void> {
    try {
      await this.request(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {
        method: 'POST',
      });
    } finally {
      await this.clearToken();
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
    const response = await this.request(API_CONFIG.ENDPOINTS.NOTIFICATIONS.GET_ALL);
    return response.data!;
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
    const response = await this.request(API_CONFIG.ENDPOINTS.REWARDS.GET_ALL);
    return response.data!;
  }

  async claimReward(id: string): Promise<ApiResponse> {
    return this.request(`${API_CONFIG.ENDPOINTS.REWARDS.CLAIM}/${id}`, {
      method: 'POST',
    });
  }

  // History Methods
  async getHistory(): Promise<any[]> {
    const response = await this.request(API_CONFIG.ENDPOINTS.HISTORY.GET_ALL);
    return response.data!;
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
    const response = await this.request(API_CONFIG.ENDPOINTS.SUPPORT.GET_TICKETS);
    return response.data!;
  }

  async getSupportMessages(ticketId: string): Promise<any[]> {
    const response = await this.request(`${API_CONFIG.ENDPOINTS.SUPPORT.GET_MESSAGES}/${ticketId}`);
    return response.data!;
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
    const response = await this.request(`${API_CONFIG.ENDPOINTS.LOCATIONS.SEARCH}?q=${encodeURIComponent(query)}`);
    return response.data!;
  }

  async getNearbyLocations(lat: number, lng: number, radius?: number): Promise<any[]> {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      ...(radius && { radius: radius.toString() }),
    });
    const response = await this.request(`${API_CONFIG.ENDPOINTS.LOCATIONS.NEARBY}?${params}`);
    return response.data!;
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

  // Utility Methods
  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService; 