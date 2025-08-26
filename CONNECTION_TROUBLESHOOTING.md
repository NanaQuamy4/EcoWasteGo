# EcoWasteGo Connection Troubleshooting Guide

## 🚨 Common Connection Issues

### 1. IP Address Mismatch
**Symptoms:**
- Connection timeout errors
- "Connection test timed out after 10 seconds"
- IP addresses failing to connect

**Solution:**
1. Check your current IP address:
   ```bash
   ipconfig
   ```
2. Update your IP address using the provided script:
   ```bash
   # PowerShell
   .\scripts\update-ip.ps1 10.132.254.147
   
   # Or batch file
   .\scripts\update-ip.bat 10.132.254.147
   
   # Test connection
   .\scripts\test-connection.ps1
   ```
3. Restart your backend server

### 2. Backend Server Not Running
**Symptoms:**
- All connection attempts fail
- No response from any IP

**Solution:**
1. Navigate to backend directory:
   ```bash
   cd backend
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Verify server is running on the correct port (3000)

### 3. Firewall Issues
**Symptoms:**
- Connection refused errors
- Timeout on specific ports

**Solution:**
1. Check Windows Firewall settings
2. Allow Node.js through firewall
3. Ensure port 3000 is open

### 4. Network Configuration
**Symptoms:**
- IP addresses changing frequently
- Inconsistent connection behavior

**Solution:**
1. Use environment variables for IP configuration:
   ```bash
   # Set in your environment
   EXPO_PUBLIC_LOCAL_IP=10.132.254.147
   ```
2. Consider using a static IP address on your router
3. Use the IP update scripts when IP changes

## 🔧 Quick Fix Commands

### Update IP Address
```bash
# PowerShell
.\scripts\update-ip.ps1 [NEW_IP]

# Batch
.\scripts\update-ip.bat [NEW_IP]
```

### Start Backend Server
```bash
cd backend
npm run dev
```

### Check Server Status
```bash
# Test health endpoint
curl http://localhost:3000/health
```

### Check Network Configuration
```bash
ipconfig
netstat -an | findstr :3000
```

## 📱 Mobile App Connection

### Expo Development
1. Ensure your mobile device is on the same network
2. Use the correct IP address (not localhost)
3. Check that port 3000 is accessible

### Production Deployment
1. Update API configuration to use production URLs
2. Ensure CORS is properly configured
3. Use HTTPS in production

## 🚀 Prevention Tips

1. **Use Environment Variables**: Set `EXPO_PUBLIC_LOCAL_IP` for easy IP management
2. **Regular IP Checks**: Run `ipconfig` when connection issues occur
3. **Script Automation**: Use the provided IP update scripts
4. **Network Monitoring**: Keep track of network changes
5. **Backup Configuration**: Maintain backup of working configurations

## 📞 Support

If issues persist:
1. Check the server logs for detailed error messages
2. Verify network connectivity
3. Test with different devices/networks
4. Review firewall and antivirus settings

## 🔍 Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
DEBUG=*
```

This will provide detailed connection and request information.
