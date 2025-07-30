// Simple shared state for recycler statistics
class RecyclerStats {
  private static instance: RecyclerStats;
  private completedPickups: Set<string> = new Set();
  private activePickups: Set<string> = new Set();
  private pendingRequests: Set<string> = new Set();
  private todayEarnings: number = 0;

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
  addCompletedPickup(pickupId: string, earnings: number = 0) {
    this.completedPickups.add(pickupId);
    this.removeActivePickup(pickupId);
    this.todayEarnings += earnings;
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
    // Add some mock pending requests
    this.addPendingRequest('1');
    this.addPendingRequest('2');
    this.addPendingRequest('3');
    this.addPendingRequest('4');
    this.addPendingRequest('7');
    this.addPendingRequest('8');
    
    // Add some mock active pickups
    this.addActivePickup('5');
    this.addActivePickup('6');
  }
}

export default RecyclerStats.getInstance(); 