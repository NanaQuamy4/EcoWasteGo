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
  addCompletedPickup(pickupId: string, earnings: number, paymentData?: {
    customer: string;
    wasteType: string;
    weight: string;
  }) {
    this.completedPickups.add(pickupId);
    this.todayEarnings += earnings;
    
    // Remove from active pickups when completed
    this.removeActivePickup(pickupId);
    
    // Calculate and add 10% subscription fee
    const subscriptionFee = earnings * 0.10;
    this.weeklySubscriptionFees += subscriptionFee;
    this.weeklyPickupCount++;
    
    // Add to payment history if payment data is provided
    if (paymentData) {
      const now = new Date();
      const date = now.toISOString().split('T')[0];
      const time = now.toTimeString().split(' ')[0].substring(0, 5);
      
      this.paymentHistory.unshift({
        id: Date.now().toString(),
        date: date,
        time: time,
        pickupId: pickupId,
        amount: earnings,
        status: 'completed',
        customer: paymentData.customer,
        wasteType: paymentData.wasteType,
        weight: paymentData.weight
      });
    }
    
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
    
    // Add some mock payment history
    this.paymentHistory = [
      {
        id: '1',
        date: '2024-01-15',
        time: '14:30',
        pickupId: 'PK-001',
        amount: 25.00,
        status: 'completed',
        customer: 'John Doe',
        wasteType: 'Plastic',
        weight: '12kg'
      },
      {
        id: '2',
        date: '2024-01-15',
        time: '16:45',
        pickupId: 'PK-002',
        amount: 30.00,
        status: 'completed',
        customer: 'Sarah Wilson',
        wasteType: 'Paper',
        weight: '15kg'
      },
      {
        id: '3',
        date: '2024-01-14',
        time: '10:20',
        pickupId: 'PK-003',
        amount: 18.50,
        status: 'completed',
        customer: 'Mike Johnson',
        wasteType: 'Glass',
        weight: '8kg'
      },
      {
        id: '4',
        date: '2024-01-14',
        time: '13:15',
        pickupId: 'PK-004',
        amount: 22.00,
        status: 'completed',
        customer: 'Emma Davis',
        wasteType: 'Plastic',
        weight: '11kg'
      },
      {
        id: '5',
        date: '2024-01-13',
        time: '09:30',
        pickupId: 'PK-005',
        amount: 28.00,
        status: 'completed',
        customer: 'David Brown',
        wasteType: 'Paper',
        weight: '14kg'
      }
    ];
    
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