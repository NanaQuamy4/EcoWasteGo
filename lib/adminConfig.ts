// Admin Configuration
// This file contains admin-specific settings

export const ADMIN_EMAIL = 'admin@ecowastego.com'; // Change this to your desired admin email
export const ADMIN_PASSWORD = 'EcoWasteGo!1234'; // Change this to your desired admin password

// Admin verification settings
export const VERIFICATION_EXPIRY_DAYS = 365; // How long verification lasts (1 year)

// Admin permissions
export const ADMIN_PERMISSIONS = {
  VERIFY_RECYCLERS: true,
  VIEW_ALL_USERS: true,
  MANAGE_VERIFICATIONS: true,
  VIEW_ANALYTICS: true,
};

// Check if user is admin based on email
export const isAdminUser = (email: string | undefined): boolean => {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.trim().toLowerCase();
};

// Admin credentials for reference (you should change these)
export const ADMIN_CREDENTIALS = {
  email: ADMIN_EMAIL,
  password: ADMIN_PASSWORD,
};
