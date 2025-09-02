# 🚀 Quick Admin Setup Guide

## 📋 **Step 1: Choose Your Admin Email**

### **Option A: Use Your Real Email (Recommended)**
Edit `lib/adminConfig.ts`:
```typescript
export const ADMIN_EMAIL = 'your-email@gmail.com'; // Your real email
export const ADMIN_PASSWORD = 'YourSecurePassword123!';
```

### **Option B: Use Default Email (For Testing)**
Keep the default:
```typescript
export const ADMIN_EMAIL = 'admin@ecowastego.com';
export const ADMIN_PASSWORD = 'EcoWasteGo2024!';
```

## 📱 **Step 2: Register Admin Account**

1. **Open your EcoWasteGo app**
2. **Go to Registration screen**
3. **Fill in the form**:
   - Email: Use the email from Step 1
   - Password: Use the password from Step 1
   - Fill other required fields
4. **Click Register**
5. **Verify email** (if using real email)

## 🔐 **Step 3: Login as Admin**

1. **Go to Login screen**
2. **Enter admin credentials**:
   - Email: Your admin email
   - Password: Your admin password
3. **Click Login**
4. **Should automatically redirect to Admin Portal**

## ✅ **Step 4: Test Admin Features**

1. **Check Admin Portal** loads correctly
2. **Navigate to Verifications** section
3. **Test approve/reject** recycler applications
4. **Verify admin logout** works

## 🔧 **Troubleshooting:**

### **Admin Not Redirecting:**
- Check `ADMIN_EMAIL` in `lib/adminConfig.ts` matches exactly
- Ensure admin account exists and is verified
- Check console for error messages

### **Can't Register:**
- Make sure email format is valid
- Ensure password meets requirements
- Check if email already exists

### **Admin Features Not Working:**
- Run database updates from `database_updates.sql`
- Check Supabase connection
- Verify admin permissions

## 📝 **Example Setup:**

### **Using Real Email:**
```typescript
// lib/adminConfig.ts
export const ADMIN_EMAIL = 'john.doe@gmail.com';
export const ADMIN_PASSWORD = 'EcoWasteGo2024!@#$';
```

### **Registration Form:**
- Email: `john.doe@gmail.com`
- Password: `EcoWasteGo2024!@#$`
- Full Name: `John Doe`
- Phone: `+1234567890`
- Role: `customer` (or `recycler` - doesn't matter for admin)

### **Login:**
- Email: `john.doe@gmail.com`
- Password: `EcoWasteGo2024!@#$`
- Should redirect to Admin Portal

## 🎯 **Success Indicators:**

✅ Admin Portal loads with menu items
✅ Can access Verifications section
✅ Can see recycler verification requests
✅ Can approve/reject applications
✅ Admin logout works correctly

## ⚠️ **Important Notes:**

- **No real email account needed**: `admin@ecowastego.com` is just an identifier
- **Use your real email**: Better for email verification and password reset
- **Keep credentials secure**: Don't share admin credentials
- **Test thoroughly**: Verify all admin features work
- **Backup access**: Consider having a backup admin account
