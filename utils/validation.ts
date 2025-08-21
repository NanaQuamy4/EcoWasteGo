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
  phone: string; // phone number
  password: string;
}

export interface LoginValidationResult {
  isValid: boolean;
  errors: string[];
  formattedPhone?: string;
}

export const validateLogin = (data: LoginValidationData): LoginValidationResult => {
  const errors: string[] = [];

  // Validate phone number
  if (!data.phone || data.phone.trim() === '') {
    errors.push('Phone number is required');
  } else {
    // Clean and validate phone number format
    const cleanedPhone = data.phone.replace(/\D/g, '');
    if (cleanedPhone.length < 9) {
      errors.push('Phone number must be at least 9 digits');
    } else if (cleanedPhone.length > 15) {
      errors.push('Phone number is too long');
    }
  }

  // Validate password
  if (!data.password || data.password.trim() === '') {
    errors.push('Password is required');
  } else if (data.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  // Format phone number for consistency
  let formattedPhone = data.phone;
  if (data.phone && !data.phone.startsWith('+')) {
    // If it's a local number, assume Ghana (+233)
    const cleanedPhone = data.phone.replace(/\D/g, '');
    if (cleanedPhone.startsWith('0')) {
      formattedPhone = '+233' + cleanedPhone.substring(1);
    } else if (cleanedPhone.length === 9) {
      formattedPhone = '+233' + cleanedPhone;
    } else {
      formattedPhone = '+233' + cleanedPhone;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    formattedPhone
  };
}; 

// Registration error handling
export interface RegistrationError {
  code: string;
  message: string;
  userFriendlyMessage: string;
}

export const handleRegistrationError = (error: any): RegistrationError => {
  // Check if it's a backend error with a specific code
  if (error.code) {
    switch (error.code) {
      case 'EMAIL_EXISTS':
        return {
          code: 'EMAIL_EXISTS',
          message: error.error || 'Email already exists',
          userFriendlyMessage: 'This email is already registered. Please use a different email or try logging in instead.'
        };
      
      case 'PHONE_EXISTS':
        return {
          code: 'PHONE_EXISTS',
          message: error.error || 'Phone number already exists',
          userFriendlyMessage: 'This phone number is already registered. Please use a different phone number or try logging in instead.'
        };
      
      case 'USERNAME_EXISTS':
        return {
          code: 'USERNAME_EXISTS',
          message: error.error || 'Username already taken',
          userFriendlyMessage: 'This username is already taken. Please choose a different username.'
        };
      
      case 'COMPANY_EXISTS':
        return {
          code: 'COMPANY_EXISTS',
          message: error.error || 'Company name already exists',
          userFriendlyMessage: 'A recycler with this company name already exists. Please use a different company name.'
        };
      
      default:
        return {
          code: 'UNKNOWN_ERROR',
          message: error.error || error.message || 'Unknown error occurred',
          userFriendlyMessage: 'An unexpected error occurred. Please try again or contact support if the problem persists.'
        };
    }
  }
  
  // Handle network or other errors
  if (error.message?.includes('Network') || error.message?.includes('fetch')) {
    return {
      code: 'NETWORK_ERROR',
      message: error.message,
      userFriendlyMessage: 'Network error. Please check your internet connection and try again.'
    };
  }
  
  // Handle validation errors
  if (error.message?.includes('validation') || error.message?.includes('required')) {
    return {
      code: 'VALIDATION_ERROR',
      message: error.message,
      userFriendlyMessage: 'Please check your input and ensure all required fields are filled correctly.'
    };
  }
  
  // Default error
  return {
    code: 'UNKNOWN_ERROR',
    message: error.message || 'Unknown error occurred',
    userFriendlyMessage: 'An unexpected error occurred. Please try again or contact support if the problem persists.'
  };
}; 