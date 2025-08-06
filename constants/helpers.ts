import { ENVIRONMENTAL_FACTORS } from './index';

// Weight parsing utility
export const parseWeight = (weight: string): number => {
  return parseFloat(weight.replace(' kg', ''));
};

// Status color mapping
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return '#4CAF50';
    case 'cancelled':
      return '#f44336';
    case 'pending':
      return '#FF9800';
    default:
      return '#666';
  }
};

// Status text mapping
export const getStatusText = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'pending':
      return 'Pending';
    default:
      return 'Unknown';
  }
};

// Star rating component
export const renderStars = (rating: number): string => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(emptyStars);
};

// Environmental impact calculations
export const calculateEnvironmentalImpact = (weight: string) => {
  const weightInKg = parseWeight(weight);
  
  return {
    co2Saved: (weightInKg * ENVIRONMENTAL_FACTORS.co2PerKg).toFixed(1),
    treesEquivalent: (weightInKg * ENVIRONMENTAL_FACTORS.treesPerKg).toFixed(1),
    energyHours: Math.round(weightInKg * ENVIRONMENTAL_FACTORS.energyHoursPerKg),
    carKm: Math.round(weightInKg * ENVIRONMENTAL_FACTORS.carKmPerKg),
  };
};

// Format date for display
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format time for display
export const formatTime = (timeString: string): string => {
  return timeString; // Already in HH:MM format
};

// Format seconds to MM:SS format
export const formatSecondsToTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Calculate total statistics from history data
export const calculateTotalStats = (historyData: any[]) => {
  const completedPickups = historyData.filter(item => item.status === 'completed');
  
  const totalWeight = completedPickups.reduce((total, item) => {
    return total + parseWeight(item.weight);
  }, 0);
  
  const totalAmount = completedPickups.reduce((total, item) => {
    return total + parseFloat(item.amount.replace('GHS ', ''));
  }, 0);
  
  const environmentalImpact = calculateEnvironmentalImpact(`${totalWeight} kg`);
  
  return {
    totalPickups: completedPickups.length,
    totalWeight: `${totalWeight.toFixed(1)} kg`,
    totalAmount: `GHS ${totalAmount.toFixed(2)}`,
    co2Saved: `${environmentalImpact.co2Saved} kg`,
    treesEquivalent: environmentalImpact.treesEquivalent,
  };
};

// Phone number formatting
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 12 && cleaned.startsWith('233')) {
    // Ghana number: +233 XX XXX XXXX
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  } else if (cleaned.length === 10) {
    // Local number: 0XX XXX XXXX
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  
  return phone; // Return original if can't format
};

// Validation helpers
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Updated phone validation to handle country codes properly
export const isValidPhone = (phone: string, countryCode?: string): boolean => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  if (countryCode) {
    // If country code is provided, validate without leading zero
    const countryCodeDigits = countryCode.replace(/\D/g, '');
    const phoneWithoutCountryCode = cleaned.replace(new RegExp(`^${countryCodeDigits}`), '');
    
    // Check if the remaining digits are valid (typically 9 digits for most countries)
    return phoneWithoutCountryCode.length >= 7 && phoneWithoutCountryCode.length <= 10;
  } else {
    // Fallback to original validation for backward compatibility
    const phoneRegex = /^(\+233|0)[0-9]{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }
};

// Helper function to clean phone number input
export const cleanPhoneInput = (input: string, countryCode?: string): string => {
  // Remove all non-digit characters
  let cleaned = input.replace(/\D/g, '');
  
  if (countryCode) {
    const countryCodeDigits = countryCode.replace(/\D/g, '');
    
    // If the input starts with the country code, remove it
    if (cleaned.startsWith(countryCodeDigits)) {
      cleaned = cleaned.substring(countryCodeDigits.length);
    }
    
    // Remove leading zero if present (common issue when country code is already selected)
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
  }
  
  return cleaned;
};

// Debounce utility for search/filter
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Memoization utility for expensive calculations
export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}; 