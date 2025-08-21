// Customer statistics and achievement tracking utility
class CustomerStats {
  private static instance: CustomerStats;
  private completedPickups: Set<string> = new Set();
  private totalWasteRecycled: number = 0; // in kg
  private totalEnvironmentalImpact: number = 0; // CO2 saved
  private totalAmountSpent: number = 0; // total payments made
  private achievements: Map<string, { earned: boolean; date: string; points: number }> = new Map();
  private pickupHistory: {
    id: string;
    date: string;
    time: string;
    recyclerName: string;
    pickupLocation: string;
    wasteType: string;
    weight: number;
    amount: number;
    environmentalTax: number;
    totalAmount: number;
    status: string;
  }[] = [];
  private isInitialized: boolean = false;

  private constructor() {
    this.initializeAchievements();
  }

  static getInstance(): CustomerStats {
    if (!CustomerStats.instance) {
      CustomerStats.instance = new CustomerStats();
    }
    return CustomerStats.instance;
  }

  private initializeAchievements() {
    // Initialize default achievements
    this.achievements.set('first_pickup', { earned: false, date: '', points: 50 });
    this.achievements.set('eco_warrior', { earned: false, date: '', points: 100 });
    this.achievements.set('waste_reducer', { earned: false, date: '', points: 75 });
    this.achievements.set('environmental_champion', { earned: false, date: '', points: 150 });
    this.achievements.set('recycling_master', { earned: false, date: '', points: 200 });
    this.achievements.set('planet_protector', { earned: false, date: '', points: 300 });
  }

  // Add completed pickup and update stats
  addCompletedPickup(pickupData: {
    id: string;
    recyclerName: string;
    pickupLocation: string;
    wasteType: string;
    weight: number;
    amount: number;
    environmentalTax: number;
    totalAmount: number;
  }) {
    const { id, weight, totalAmount } = pickupData;
    
    if (this.completedPickups.has(id)) {
      return; // Already processed
    }

    this.completedPickups.add(id);
    this.totalWasteRecycled += weight;
    this.totalAmountSpent += totalAmount;
    
    // Calculate environmental impact (CO2 saved per kg of waste recycled)
    const co2SavedPerKg = 2.5; // kg CO2 saved per kg of waste recycled
    this.totalEnvironmentalImpact += weight * co2SavedPerKg;

    // Add to pickup history
    const now = new Date();
    this.pickupHistory.push({
      id: pickupData.id,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0].substring(0, 5),
      recyclerName: pickupData.recyclerName,
      pickupLocation: pickupData.pickupLocation,
      wasteType: pickupData.wasteType,
      weight: pickupData.weight,
      amount: pickupData.amount,
      environmentalTax: pickupData.environmentalTax,
      totalAmount: pickupData.totalAmount,
      status: 'completed'
    });

    // Check and award achievements
    this.checkAchievements();
  }

  // Check and award achievements based on current stats
  private checkAchievements() {
    const totalPickups = this.completedPickups.size;
    const totalWaste = this.totalWasteRecycled;

    // First pickup achievement
    if (totalPickups === 1 && !this.achievements.get('first_pickup')?.earned) {
      this.awardAchievement('first_pickup');
    }

    // Eco warrior - 5 pickups
    if (totalPickups >= 5 && !this.achievements.get('eco_warrior')?.earned) {
      this.awardAchievement('eco_warrior');
    }

    // Waste reducer - 20kg recycled
    if (totalWaste >= 20 && !this.achievements.get('waste_reducer')?.earned) {
      this.awardAchievement('waste_reducer');
    }

    // Environmental champion - 50kg recycled
    if (totalWaste >= 50 && !this.achievements.get('environmental_champion')?.earned) {
      this.awardAchievement('environmental_champion');
    }

    // Recycling master - 100kg recycled
    if (totalWaste >= 100 && !this.achievements.get('recycling_master')?.earned) {
      this.awardAchievement('recycling_master');
    }

    // Planet protector - 200kg recycled
    if (totalWaste >= 200 && !this.achievements.get('planet_protector')?.earned) {
      this.awardAchievement('planet_protector');
    }
  }

  // Award an achievement
  private awardAchievement(achievementKey: string) {
    const achievement = this.achievements.get(achievementKey);
    if (achievement && !achievement.earned) {
      achievement.earned = true;
      achievement.date = new Date().toISOString().split('T')[0];
    }
  }

  // Get all achievements
  getAchievements() {
    return this.achievements;
  }

  // Get earned achievements
  getEarnedAchievements() {
    return Array.from(this.achievements.entries())
      .filter(([_, achievement]) => achievement.earned)
      .map(([key, achievement]) => ({ key, ...achievement }));
  }

  // Get total points earned
  getTotalPoints(): number {
    return Array.from(this.achievements.values())
      .filter(achievement => achievement.earned)
      .reduce((total, achievement) => total + achievement.points, 0);
  }

  // Get pickup history
  getPickupHistory() {
    return this.pickupHistory;
  }

  // Get statistics
  getStats() {
    return {
      totalPickups: this.completedPickups.size,
      totalWasteRecycled: this.totalWasteRecycled,
      totalEnvironmentalImpact: this.totalEnvironmentalImpact,
      totalAmountSpent: this.totalAmountSpent,
      totalPoints: this.getTotalPoints(),
      achievementsEarned: this.getEarnedAchievements().length,
      totalAchievements: this.achievements.size
    };
  }

  // Get environmental impact summary
  getEnvironmentalImpact() {
    return {
      co2Saved: this.totalEnvironmentalImpact,
      treesEquivalent: Math.round(this.totalEnvironmentalImpact / 22), // 1 tree absorbs ~22kg CO2/year
      landfillSpaceSaved: Math.round(this.totalWasteRecycled * 0.5), // 0.5 cubic meters per kg
      energySaved: Math.round(this.totalWasteRecycled * 3.5) // kWh saved per kg recycled
    };
  }

  // Initialize with mock data
  initializeMockData() {
    if (this.isInitialized) {
      return;
    }

    // Add some mock completed pickups
    this.addCompletedPickup({
      id: 'mock_001',
      recyclerName: 'John Recycler',
      pickupLocation: 'Accra Central',
      wasteType: 'Mixed Waste',
      weight: 8.5,
      amount: 17.00,
      environmentalTax: 0.85,
      totalAmount: 17.85
    });

    this.addCompletedPickup({
      id: 'mock_002',
      recyclerName: 'Eco Green Services',
      pickupLocation: 'East Legon',
      wasteType: 'Plastic',
      weight: 12.0,
      amount: 24.00,
      environmentalTax: 1.20,
      totalAmount: 25.20
    });

    this.isInitialized = true;
  }

  // Reset stats (for testing)
  resetStats() {
    this.completedPickups.clear();
    this.totalWasteRecycled = 0;
    this.totalEnvironmentalImpact = 0;
    this.totalAmountSpent = 0;
    this.pickupHistory = [];
    
    // Reset achievements
    this.achievements.forEach(achievement => {
      achievement.earned = false;
      achievement.date = '';
    });
  }
}

export default CustomerStats.getInstance();
