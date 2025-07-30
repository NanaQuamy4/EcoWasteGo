// Simple shared state for recycler statistics
class RecyclerStats {
  private static instance: RecyclerStats;
  private completedPickups: Set<string> = new Set();
  private todayEarnings: number = 0;

  private constructor() {}

  static getInstance(): RecyclerStats {
    if (!RecyclerStats.instance) {
      RecyclerStats.instance = new RecyclerStats();
    }
    return RecyclerStats.instance;
  }

  addCompletedPickup(pickupId: string, earnings: number = 0) {
    this.completedPickups.add(pickupId);
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
    this.todayEarnings = 0;
  }
}

export default RecyclerStats.getInstance(); 