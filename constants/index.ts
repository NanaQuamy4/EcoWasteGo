// App Colors
export const COLORS = {
  primary: '#1C3301',
  secondary: '#4CAF50',
  background: '#CFDFBF',
  lightGreen: '#E3F0D5',
  white: '#fff',
  black: '#000',
  gray: '#666',
  lightGray: '#999',
  darkGreen: '#22330B',
  red: '#f44336',
  green: '#4CAF50',
} as const;

// App Dimensions
export const DIMENSIONS = {
  borderRadius: 12,
  cardBorderRadius: 16,
  padding: 16,
  margin: 16,
} as const;

// Mock Data
export const MOCKED_TRUCKS = [
  {
    id: 1,
    name: 'John Doe',
    type: 'Big Truck',
    image: require('../assets/images/truck.png'),
    eta: '5 mins',
    rating: 4.8,
    recyclerId: 'REC001',
    recyclerName: 'John Doe',
    color: '#4CAF50',
    rate: 'GHS 1.20/kg',
    pastPickups: 156,
  },
  {
    id: 2,
    name: 'Jane Smith',
    type: 'Small Truck',
    image: require('../assets/images/small truck.png'),
    eta: '8 mins',
    rating: 4.6,
    recyclerId: 'REC002',
    recyclerName: 'Jane Smith',
    color: '#2196F3',
    rate: 'GHS 1.15/kg',
    pastPickups: 89,
  },
  {
    id: 3,
    name: 'Mike Johnson',
    type: 'Big Truck',
    image: require('../assets/images/truck.png'),
    eta: '12 mins',
    rating: 4.9,
    recyclerId: 'REC003',
    recyclerName: 'Mike Johnson',
    color: '#FF9800',
    rate: 'GHS 1.25/kg',
    pastPickups: 234,
  },
  {
    id: 4,
    name: 'Sarah Wilson',
    type: 'Small Truck',
    image: require('../assets/images/small truck.png'),
    eta: '15 mins',
    rating: 4.7,
    recyclerId: 'REC004',
    recyclerName: 'Sarah Wilson',
    color: '#9C27B0',
    rate: 'GHS 1.10/kg',
    pastPickups: 67,
  },
];

export const RECYCLER_DATA = {
  name: 'John Doe',
  phone: '+233 24 123 4567',
  rating: 4.8,
  truckType: 'Big Truck',
  recyclerId: 'REC001',
  color: '#4CAF50',
  rate: 'GHS 1.20/kg',
  pastPickups: 156,
};

export const PAYMENT_DATA = {
  weight: '8.5 kg',
  rate: 'GHS 1.20/kg',
  baseAmount: 'GHS 10.20',
  environmentalTax: 'GHS 0.51',
  totalAmount: 'GHS 10.71',
  notes: [
    'Payment is due upon pickup completion',
    'Environmental tax (5%) is included',
    'Cash or Mobile Money accepted',
  ],
};

export const HISTORY_DATA = [
  {
    id: '1',
    date: '2024-01-15',
    recyclerName: 'John Doe',
    pickupLocation: 'Accra Central',
    weight: '12.5 kg',
    amount: 'GHS 15.75',
    status: 'completed',
    recyclerImage: require('../assets/images/_MG_2771.jpg'),
    rating: 5,
    recyclerPhone: '+233 24 123 4567',
    pickupTime: '14:30',
    environmentalTax: 'GHS 0.79',
    notes: 'Excellent service, very punctual',
  },
  {
    id: '2',
    date: '2024-01-10',
    recyclerName: 'Jane Smith',
    pickupLocation: 'East Legon',
    weight: '8.2 kg',
    amount: 'GHS 9.43',
    status: 'completed',
    recyclerImage: require('../assets/images/_MG_2771.jpg'),
    rating: 4,
    recyclerPhone: '+233 20 987 6543',
    pickupTime: '10:15',
    environmentalTax: 'GHS 0.47',
    notes: 'Good service, friendly recycler',
  },
  {
    id: '3',
    date: '2024-01-05',
    recyclerName: 'Mike Johnson',
    pickupLocation: 'Osu',
    weight: '15.8 kg',
    amount: 'GHS 19.77',
    status: 'completed',
    recyclerImage: require('../assets/images/_MG_2771.jpg'),
    rating: 5,
    recyclerPhone: '+233 26 555 1234',
    pickupTime: '16:45',
    environmentalTax: 'GHS 0.99',
    notes: 'Outstanding service, highly recommended',
  },
  {
    id: '4',
    date: '2024-01-01',
    recyclerName: 'Sarah Wilson',
    pickupLocation: 'Cantonments',
    weight: '6.3 kg',
    amount: 'GHS 6.93',
    status: 'cancelled',
    recyclerImage: require('../assets/images/_MG_2771.jpg'),
    rating: 3,
    recyclerPhone: '+233 27 777 8888',
    pickupTime: '09:30',
    environmentalTax: 'GHS 0.35',
    notes: 'Pickup cancelled due to weather',
  },
  {
    id: '5',
    date: '2023-12-28',
    recyclerName: 'John Doe',
    pickupLocation: 'Airport Residential',
    weight: '11.2 kg',
    amount: 'GHS 13.44',
    status: 'completed',
    recyclerImage: require('../assets/images/_MG_2771.jpg'),
    rating: 5,
    recyclerPhone: '+233 24 123 4567',
    pickupTime: '13:20',
    environmentalTax: 'GHS 0.67',
    notes: 'Perfect service, very professional',
  },
];

export const USER_STATS = {
  totalPickups: 12,
  totalWeight: '156.8 kg',
  co2Saved: '78.4 kg',
  treesEquivalent: 3.9,
  currentStreak: 5,
  badges: [
    { id: 1, name: 'First Pickup', icon: '🌱', earned: true },
    { id: 2, name: '5 Pickups', icon: '🌿', earned: true },
    { id: 3, name: '10 Pickups', icon: '🌳', earned: true },
    { id: 4, name: '50kg Recycled', icon: '🌲', earned: true },
    { id: 5, name: '100kg Recycled', icon: '🌍', earned: false },
    { id: 6, name: 'Eco Warrior', icon: '🏆', earned: false },
  ],
};

// Environmental Impact Calculations
export const ENVIRONMENTAL_FACTORS = {
  co2PerKg: 0.5, // kg CO2 saved per kg recycled
  treesPerKg: 0.025, // trees equivalent per kg
  energyHoursPerKg: 2.5, // light bulb hours per kg
  carKmPerKg: 0.3, // car kilometers equivalent per kg
} as const;

// Message Suggestions for Text Recycler
export const MESSAGE_SUGGESTION_SETS = [
  [
    'When will you arrive?',
    'I\'m at the pickup location',
    'Can you call when you\'re close?',
    'Is there a delay?',
  ],
  [
    'I have extra waste to add',
    'Can you bring extra bags?',
    'Do you accept all types of waste?',
    'What\'s your payment method?',
  ],
  [
    'I\'m running late, please wait',
    'Can you come back later?',
    'I\'ll be there in 10 minutes',
    'Sorry for the inconvenience',
  ],
  [
    'Thank you for the service',
    'Great job today!',
    'I\'ll recommend you to others',
    'See you next time',
  ],
  [
    'Is the weight correct?',
    'Can you explain the calculation?',
    'I think there\'s an error',
    'The rate seems different',
  ],
];

// Dummy responses for text simulation
export const DUMMY_RESPONSES = [
  'I\'m on my way, will be there in 5 minutes.',
  'Yes, I can wait. No problem.',
  'I accept all recyclable materials.',
  'Thank you for choosing our service!',
  'The weight is accurate, I double-checked.',
]; 