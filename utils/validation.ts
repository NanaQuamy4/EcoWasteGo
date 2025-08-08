// Validation utilities for EcoWasteGo app

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface PhoneValidationResult extends ValidationResult {
  formattedNumber?: string;
}

// Email validation
export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
};

// Phone number validation and formatting
export const validateAndFormatPhone = (
  phoneNumber: string, 
  countryCode: string
): PhoneValidationResult => {
  if (!phoneNumber || phoneNumber.trim() === '') {
    return { isValid: false, error: 'Phone number is required' };
  }

  if (!countryCode || countryCode.trim() === '') {
    return { isValid: false, error: 'Country code is required' };
  }

  // Remove all non-digit characters from phone number
  const cleanedPhone = phoneNumber.replace(/\D/g, '');
  
  if (cleanedPhone.length < 7) {
    return { isValid: false, error: 'Phone number is too short' };
  }

  if (cleanedPhone.length > 15) {
    return { isValid: false, error: 'Phone number is too long' };
  }

  // Remove leading zero if present (common in many countries)
  let formattedPhone = cleanedPhone;
  if (formattedPhone.startsWith('0')) {
    formattedPhone = formattedPhone.substring(1);
  }

  // Ensure country code starts with +
  const formattedCountryCode = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
  
  // Combine country code and phone number
  const fullNumber = `${formattedCountryCode}${formattedPhone}`;
  
  // Final validation regex for international phone numbers
  const phoneRegex = /^\+\d{10,15}$/;
  if (!phoneRegex.test(fullNumber)) {
    return { isValid: false, error: 'Invalid phone number format' };
  }

  return { 
    isValid: true, 
    formattedNumber: fullNumber 
  };
};

// Password validation
export const validatePassword = (password: string): ValidationResult => {
  if (!password || password.trim() === '') {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters' };
  }

  // Optional: Enhanced password validation
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];
  if (!hasUpperCase) errors.push('uppercase letter');
  if (!hasLowerCase) errors.push('lowercase letter');
  if (!hasNumbers) errors.push('number');
  if (!hasSpecialChar) errors.push('special character');

  if (errors.length > 0) {
    return { 
      isValid: false, 
      error: `Password must contain at least one ${errors.join(', ')}` 
    };
  }

  return { isValid: true };
};

// Confirm password validation
export const validateConfirmPassword = (
  password: string, 
  confirmPassword: string
): ValidationResult => {
  if (!confirmPassword || confirmPassword.trim() === '') {
    return { isValid: false, error: 'Please confirm your password' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }

  return { isValid: true };
};

// Login validation (email or phone)
export const validateLoginIdentifier = (
  identifier: string
): ValidationResult => {
  if (!identifier || identifier.trim() === '') {
    return { isValid: false, error: 'Email or phone number is required' };
  }

  // Check if it's an email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(identifier.trim())) {
    return { isValid: true };
  }

  // Check if it's a phone number (basic check)
  const phoneRegex = /^\+?\d{10,15}$/;
  if (phoneRegex.test(identifier.replace(/\s/g, ''))) {
    return { isValid: true };
  }

  return { isValid: false, error: 'Please enter a valid email or phone number' };
};

// Full signup validation
export interface SignupValidationData {
  email: string;
  phoneNumber: string;
  countryCode: string;
  password: string;
  confirmPassword: string;
  fullName?: string;
  companyName?: string; // For recyclers
}

export interface SignupValidationResult {
  isValid: boolean;
  errors: string[];
  formattedPhone?: string;
}

export const validateSignup = (data: SignupValidationData): SignupValidationResult => {
  const errors: string[] = [];

  // Validate email
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) {
    errors.push(emailValidation.error!);
  }

  // Validate phone number
  const phoneValidation = validateAndFormatPhone(data.phoneNumber, data.countryCode);
  if (!phoneValidation.isValid) {
    errors.push(phoneValidation.error!);
  }

  // Validate password
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) {
    errors.push(passwordValidation.error!);
  }

  // Validate confirm password
  const confirmPasswordValidation = validateConfirmPassword(data.password, data.confirmPassword);
  if (!confirmPasswordValidation.isValid) {
    errors.push(confirmPasswordValidation.error!);
  }

  // Validate required fields
  if (!data.fullName || data.fullName.trim() === '') {
    errors.push('Full name is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
    formattedPhone: phoneValidation.formattedNumber
  };
};

// Full login validation
export interface LoginValidationData {
  identifier: string; // email or phone
  password: string;
}

export interface LoginValidationResult {
  isValid: boolean;
  errors: string[];
  isEmail: boolean;
  formattedIdentifier?: string;
}

export const validateLogin = (data: LoginValidationData): LoginValidationResult => {
  const errors: string[] = [];

  // Validate identifier (email or phone)
  const identifierValidation = validateLoginIdentifier(data.identifier);
  if (!identifierValidation.isValid) {
    errors.push(identifierValidation.error!);
  }

  // Validate password
  if (!data.password || data.password.trim() === '') {
    errors.push('Password is required');
  } else if (data.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  // Determine if identifier is email or phone
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmail = emailRegex.test(data.identifier.trim());

  // Format identifier if it's a phone number
  let formattedIdentifier = data.identifier;
  if (!isEmail) {
    // If it's a phone number without country code, assume local format
    const cleanedPhone = data.identifier.replace(/\D/g, '');
    if (!data.identifier.startsWith('+') && cleanedPhone.length > 0) {
      // This would need to be enhanced based on user's location or preference
      // For now, we'll just clean the number
      formattedIdentifier = cleanedPhone;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    isEmail,
    formattedIdentifier
  };
}; 