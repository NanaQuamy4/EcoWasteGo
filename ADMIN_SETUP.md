# 🔐 Admin Setup Guide

## 📧 **Admin Credentials**

### **Default Admin Account:**
- **Email**: `admin@ecowastego.com`
- **Password**: `EcoWasteGo2024!`

### **⚠️ IMPORTANT: Change These Credentials!**

1. **Change Email**: Update `ADMIN_EMAIL` in `lib/adminConfig.ts`
2. **Change Password**: Update `ADMIN_PASSWORD` in `lib/adminConfig.ts`
3. **Create Admin Account**: Register with your chosen credentials

## 🚀 **Setup Steps:**

### **Step 1: Update Admin Credentials**
Edit `lib/adminConfig.ts`:
```typescript
export const ADMIN_EMAIL = 'your-admin-email@domain.com';
export const ADMIN_PASSWORD = 'YourSecurePassword123!';
```

### **Step 2: Create Admin Account**
1. Open the app
2. Go to Registration screen
3. Register with your admin email and password
4. Complete email verification

### **Step 3: Test Admin Access**
1. Login with admin credentials
2. Should automatically redirect to admin portal
3. Test verification management

## 🔒 **Security Best Practices:**

### **Password Requirements:**
- ✅ Minimum 8 characters
- ✅ Mix of uppercase and lowercase
- ✅ Include numbers
- ✅ Include special characters
- ✅ Avoid common words

### **Email Security:**
- ✅ Use a dedicated admin email
- ✅ Enable 2FA if possible
- ✅ Use a strong email password

### **Recommended Admin Credentials:**
```
Email: admin@ecowastego.com
Password: EcoWasteGo2024!@#$%
```

## 🛡️ **Access Control:**

### **How Admin Access Works:**
1. **Email Detection**: App checks if login email matches `ADMIN_EMAIL`
2. **Automatic Redirect**: Admin users go to admin portal
3. **Universal Login**: Admin can login from any screen
4. **Access Verification**: All admin screens verify admin email

### **Security Features:**
- ✅ Email-based access control
- ✅ Automatic admin detection
- ✅ Secure admin portal
- ✅ Access verification on all admin screens

## 🔧 **Troubleshooting:**

### **Admin Not Redirecting:**
1. Check `ADMIN_EMAIL` in `lib/adminConfig.ts`
2. Ensure email matches exactly (case-sensitive)
3. Verify admin account exists in Supabase

### **Can't Access Admin Portal:**
1. Check if logged in with admin email
2. Verify admin account is verified
3. Check console for error messages

### **Admin Features Not Working:**
1. Run database updates from `database_updates.sql`
2. Check Supabase RLS policies
3. Verify admin permissions

## 📝 **Notes:**

- **Single Admin**: Currently supports one admin account
- **Email-Based**: Access controlled by email address
- **Simple Setup**: No complex role systems
- **Secure**: Admin-only features protected
- **Scalable**: Easy to add more admin features

## 🔄 **Future Enhancements:**

- Multiple admin support
- Role-based permissions
- Admin activity logging
- Two-factor authentication
- Admin session management
