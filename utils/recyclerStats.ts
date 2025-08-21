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
  private paymentHistory: {
    id: string;
    date: string;
    time: string;
    pickupId: string;
    amount: number;
    status: string;
    customer: string;
    wasteType: string;
    weight: string;
  }[] = [];

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
  addCompletedPickup(pickupId: string, earnings: number, paymentData?: { customer: string; wasteType: string; weight: string; }) {
    this.completedPickups.add(pickupId);
    this.todayEarnings += earnings;
    this.removeActivePickup(pickupId); // Crucial fix for counter
    const subscriptionFee = earnings * 0.10;
    this.weeklySubscriptionFees += subscriptionFee;
    this.weeklyPickupCount++;
    
    if (paymentData) {
      const now = new Date();
      this.paymentHistory.push({
        id: `payment_${Date.now()}`,
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0].substring(0, 5),
        pickupId: pickupId,
        amount: earnings,
        status: 'completed',
        customer: paymentData.customer,
        wasteType: paymentData.wasteType,
        weight: paymentData.weight
      });
    }
  }

  getCompletedPickupsCount(): number {
    return this.completedPickups.size;
  }

  getTodayEarnings(): number {
    return this.todayEarnings;
  }

  // Get payment history
  getPaymentHistory() {
    return this.paymentHistory;
  }

  // Get earnings statistics for different periods
  getEarningsStats() {
    const totalEarnings = this.todayEarnings;
    const completedPickups = this.completedPickups.size;
    const averagePerPickup = completedPickups > 0 ? totalEarnings / completedPickups : 0;
    const weeklyEarnings = totalEarnings * 7; // Estimate for week
    const monthlyEarnings = totalEarnings * 30; // Estimate for month

    return {
      totalEarnings,
      completedPickups,
      averagePerPickup,
      weeklyEarnings,
      monthlyEarnings,
      todayEarnings: totalEarnings,
      yesterdayEarnings: totalEarnings * 0.8, // Mock data for now
    };
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
      return; // Already initialized
    }

    // Add some mock pending requests
    this.addPendingRequest('request_001');
    this.addPendingRequest('request_002');
    this.addPendingRequest('request_003');

    // Add some mock active pickups
    this.addActivePickup('pickup_001');
    this.addActivePickup('pickup_002');

    // Add some mock payment history
    this.paymentHistory = [
      {
        id: 'payment_001',
        date: '2024-01-15',
        time: '14:30',
        pickupId: 'pickup_001',
        amount: 25.50,
        status: 'completed',
        customer: 'John Doe',
        wasteType: 'Mixed Waste',
        weight: '8.5 kg'
      },
      {
        id: 'payment_002',
        date: '2024-01-14',
        time: '16:45',
        pickupId: 'pickup_002',
        amount: 18.75,
        status: 'completed',
        customer: 'Jane Smith',
        wasteType: 'Plastic',
        weight: '6.2 kg'
      }
    ];

    this.isInitialized = true;
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