// Simple shared state for recycler statistics
class RecyclerStats {
  private static instance: RecyclerStats;
  private completedPickups: Set<string> = new Set();
  private activePickups: Set<string> = new Set();
  private pendingRequests: Set<string> = new Set();
  private todayEarnings: number = 0;
  private weeklySubscriptionFees: number = 0; // Track 10% fees
  private weeklyPickupCount: number = 0; // Track pickups for the week
  private lastWeekReset: Date = new Date(); // Track when week resets
  private isInitialized: boolean = false; // Track if mock data has been initialized

  private constructor() {}

  static getInstance(): RecyclerStats {
    if (!RecyclerStats.instance) {
      RecyclerStats.instance = new RecyclerStats();
    }
    return RecyclerStats.instance;
  }

  // Pending Requests Management
  addPendingRequest(requestId: string) {
    this.pendingRequests.add(requestId);
  }

  removePendingRequest(requestId: string) {
    this.pendingRequests.delete(requestId);
  }

  getPendingRequestsCount(): number {
    return this.pendingRequests.size;
  }

  // Active Pickups Management
  addActivePickup(requestId: string) {
    this.activePickups.add(requestId);
    this.removePendingRequest(requestId);
  }

  removeActivePickup(requestId: string) {
    this.activePickups.delete(requestId);
  }

  getActivePickupsCount(): number {
    return this.activePickups.size;
  }

  // Get total available requests (pending + active)
  getTotalAvailableRequestsCount(): number {
    return this.pendingRequests.size + this.activePickups.size;
  }

  // Completed Pickups Management
  addCompletedPickup(pickupId: string, earnings: number) {
    this.completedPickups.add(pickupId);
    this.todayEarnings += earnings;
    
    // Remove from active pickups when completed
    this.removeActivePickup(pickupId);
    
    // Calculate and add 10% subscription fee
    const subscriptionFee = earnings * 0.10;
    this.weeklySubscriptionFees += subscriptionFee;
    this.weeklyPickupCount++;
    
    console.log(`🔍 DEBUG: Pickup completed - ID: ${pickupId}`);
    console.log(`💰 Earnings: GHS ${earnings.toFixed(2)}`);
    console.log(`💸 Subscription fee (10%): GHS ${subscriptionFee.toFixed(2)}`);
    console.log(`📊 Total weekly fees: GHS ${this.weeklySubscriptionFees.toFixed(2)}`);
    console.log(`📈 Weekly pickup count: ${this.weeklyPickupCount}`);
    console.log(`📉 Active pickups after completion: ${this.activePickups.size}`);
    console.log(`📊 Total available requests: ${this.getTotalAvailableRequestsCount()}`);
  }

  getCompletedPickupsCount(): number {
    return this.completedPickups.size;
  }

  getTodayEarnings(): number {
    return this.todayEarnings;
  }

  resetDailyStats() {
    this.completedPickups.clear();
    this.activePickups.clear();
    this.pendingRequests.clear();
    this.todayEarnings = 0;
  }

  // Initialize with mock data
  initializeMockData() {
    if (this.isInitialized) {
      console.warn('Mock data already initialized. Skipping.');
      return;
    }
    // Add some mock pending requests
    this.addPendingRequest('1');
    this.addPendingRequest('2');
    this.addPendingRequest('3');
    
    // Add some mock active pickups
    this.addActivePickup('5');
    this.addActivePickup('6');
    this.isInitialized = true;
    console.log('Mock data initialized successfully.');
  }

  // Get weekly subscription fees owed
  getWeeklySubscriptionFees(): number {
    return this.weeklySubscriptionFees;
  }

  // Get weekly pickup count
  getWeeklyPickupCount(): number {
    return this.weeklyPickupCount;
  }

  // Pay subscription fees (reset to 0)
  paySubscriptionFees(): void {
    this.weeklySubscriptionFees = 0;
    this.weeklyPickupCount = 0;
    this.lastWeekReset = new Date();
    console.log('Subscription fees paid and reset');
  }

  // Check if payment is required (fees > 0)
  isPaymentRequired(): boolean {
    return this.weeklySubscriptionFees > 0;
  }

  // Get formatted subscription fee string
  getSubscriptionFeeString(): string {
    return `GHS ${this.weeklySubscriptionFees.toFixed(2)}`;
  }

  // Get weekly summary
  getWeeklySummary(): { fees: number; pickups: number; avgFee: number } {
    const avgFee = this.weeklyPickupCount > 0 ? this.weeklySubscriptionFees / this.weeklyPickupCount : 0;
    return {
      fees: this.weeklySubscriptionFees,
      pickups: this.weeklyPickupCount,
      avgFee: avgFee
    };
  }
}

export default RecyclerStats.getInstance(); 