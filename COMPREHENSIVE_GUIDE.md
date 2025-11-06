# 🎯 Privacy-First Bingo Card Generator - Comprehensive Guide

A complete guide to deploying, testing, and troubleshooting your serverless bingo application.

## 📋 Table of Contents

- [📋 Table of Contents](#-table-of-contents)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Environment Setup](#️-environment-setup)
- [🧪 Testing Your Upload Function](#-testing-your-upload-function)
- [🔧 Direct cURL Testing](#-direct-curl-testing)
- [🛠️ Troubleshooting Guide](#️-troubleshooting-guide)
- [📊 Common Error Responses](#-common-error-responses)
- [🔍 Debug Tools & Utilities](#-debug-tools--utilities)
- [✅ Pre-Deployment Checklist](#-pre-deployment-checklist)
- [🆘 Still Having Issues?](#-still-having-issues)

---

## 🚀 Quick Start

Your bingo application is configured for Supabase project: **jnsfslmcowcefhpszrfx**

### **Method 1: GitHub Codespace (Recommended)**

GitHub Codespaces provides a pre-configured development environment with all tools installed.

#### **Step 1: Create GitHub Repository**
```bash
# 1. Go to https://github.com/new
# 2. Repository name: privacy-first-bingo
# 3. Upload your project files
# 4. Commit and push
```

#### **Step 2: Launch Codespace**
```bash
# 1. In your GitHub repo, click "Code" → "Codespaces" → "Create codespace"
# 2. Wait for environment to load (auto-installs Supabase CLI, Node.js, etc.)
# 3. Terminal will be ready to use
```

#### **Step 3: Deploy Functions**
```bash
# In the Codespace terminal:
supabase functions deploy upload-winning-card

# Deploy all functions (if you have others):
# supabase functions deploy
```

#### **Step 4: Set Environment Variables**
```bash
supabase secrets set SUPABASE_ANON_KEY=your_anon_key
supabase secrets set SERVER_SECRET=your_secret_key
```

#### **Step 5: Deploy Frontend**
```bash
# Option A: Deploy to Vercel
cd public
npx vercel login
npx vercel --prod

# Option B: Deploy to Netlify  
cd public
npx netlify-cli deploy --prod --dir .
```

### **Method 2: Local Setup**
```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Link to your project
supabase link --project-ref jnsfslmcowcefhpszrfx

# 3. Deploy Edge Functions
supabase functions deploy upload-winning-card

# 4. Set environment variables
supabase secrets set SUPABASE_ANON_KEY=your_anon_key
supabase secrets set SERVER_SECRET=your_secret_key
```

---

## ⚙️ Environment Setup

### **Required Environment Variables**

Your Edge Functions need these environment variables to work properly:

```bash
# Your Supabase anonymous key (safe to expose client-side)
supabase secrets set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# A secret key for HMAC proof generation (keep this secret!)
supabase secrets set SERVER_SECRET=your_random_secret_here_min_32_chars

# Optional: Set allowed origin for CORS (default is *)
supabase secrets set ALLOWED_ORIGIN=https://yourdomain.com
```

### **Where to Find Your Keys**

1. **Go to**: https://supabase.com/dashboard/project/jnsfslmcowcefhpszrfx
2. **Navigate to**: Settings → API
3. **Copy**: 
   - Project URL: `https://jnsfslmcowcefhpszrfx.supabase.co`
   - anon/public key (NOT the service_role key)

### **Generate Server Secret**

```bash
# Generate a strong random secret
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 🧪 Testing Your Upload Function

Test the upload functionality to verify storage access and environment variables are working.

### **Method 1: Web App Test (Easiest)**

1. **Open your bingo app** in browser
2. **Click "Test Upload Service"** button in the instructions section  
3. **Check result** - should show ✅ success if endpoint is reachable

### **Method 2: Quick Browser Test**

Open browser console (F12) and run:

```javascript
// Test basic connectivity
fetch('https://jnsfslmcowcefhpszrfx.supabase.co/functions/v1/upload-winning-card', {
  method: 'OPTIONS'
}).then(r => console.log('Status:', r.status, r.statusText))
```

### **Method 3: Automated Test Scripts**

#### **Windows PowerShell:**
```powershell
# Run the PowerShell test script
.\test-upload.ps1
```

#### **Linux/Mac Bash:**
```bash
# Make executable and run
chmod +x test-upload.sh
./test-upload.sh
```

#### **Node.js Test with Valid Proof:**
```bash
# Generate test payload with real HMAC proof
node test-proof-generator.js --payload YOUR_SERVER_SECRET

# Copy the output and use in your curl test
```

---

## 🔧 Direct cURL Testing

### **Basic Connectivity Test**
```bash
# Test if endpoint exists (should not return 404)
curl -X OPTIONS "https://jnsfslmcowcefhpszrfx.supabase.co/functions/v1/upload-winning-card" -v
```

### **Quick Upload Test**
```bash
curl -X POST "https://jnsfslmcowcefhpszrfx.supabase.co/functions/v1/upload-winning-card" \
  -H "Content-Type: application/json" \
  -d '{
    "cid": "ABCDEFGH1234",
    "proof": "DEV-PROOF-ABCDEF", 
    "name": "Test User",
    "email": "test@example.com",
    "marks": ["0-0", "1-1", "2-2", "3-3", "4-4"],
    "asset": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
  }'
```

### **Windows PowerShell Version**
```powershell
$payload = @{
    cid = "ABCDEFGH1234"
    proof = "DEV-PROOF-ABCDEF"
    name = "Test User" 
    email = "test@example.com"
    marks = @("0-0", "1-1", "2-2", "3-3", "4-4")
    asset = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "https://jnsfslmcowcefhpszrfx.supabase.co/functions/v1/upload-winning-card" `
  -Method POST -ContentType "application/json" -Body $payload
```

### **Generate Valid Test Payload**
```bash
# Create payload with real HMAC proof that will pass validation
node test-proof-generator.js --payload YOUR_SERVER_SECRET

# Use the generated payload in your curl command
```

---

## 🛠️ Troubleshooting Guide

Quick fixes for common issues with your bingo application.

### **Step 1: Test Basic Connectivity**

Click the **"Test Upload Service"** button in your bingo app. This tests:
- ✅ Is the Edge Function deployed?
- ✅ Is the URL correct?  
- ✅ Are there network issues?

### **Step 2: Check Browser Console**

1. Press **F12** to open developer tools
2. Go to **Console** tab
3. Try uploading again and look for detailed error messages
4. Enhanced error handling now shows specific issues instead of generic errors

### **Step 3: Quick Fixes for Common Issues**

#### **❌ 401 Unauthorized Error**
```bash
# Check environment variables are set
supabase secrets list
# Should show: SUPABASE_ANON_KEY, SERVER_SECRET

# If missing, set them:
supabase secrets set SUPABASE_ANON_KEY=your_anon_key
supabase secrets set SERVER_SECRET=your_random_secret
```

#### **❌ 404 Function Not Found**
```bash
# Deploy the functions
supabase functions deploy generate-proof
supabase functions deploy upload-winning-card
```

#### **❌ Storage Upload Failed**
- **Create Storage Bucket**: Dashboard → Storage → Create `bingo_cards` bucket
- **Make it Public**: Set bucket to public (no RLS needed for bingo cards)

#### **❌ CORS Errors**
- **Already Fixed**: Functions have permissive CORS headers
- **If persists**: Check browser console for specific CORS details

### **Step 4: View Function Logs**

```bash
# Watch logs in real-time during testing
supabase functions logs upload-winning-card --follow
supabase functions logs generate-proof --follow
```

---

## 📊 Common Error Responses

### ✅ **Success (HTTP 200)**
```json
{
  "success": true,
  "bucketUrl": "https://jnsfslmcowcefhpszrfx.supabase.co/storage/v1/object/public/bingo_cards/winning-card-...",
  "fileName": "winning-card-ABCDEFGH1234-claim_xxx-2024-01-01T12-00-00-000Z.png",
  "claimRef": "claim_xxx"
}
```

### ❌ **Function Not Deployed (HTTP 404)**
```
404 Not Found
```
**Solution:**
```bash
supabase functions deploy upload-winning-card
```

### ❌ **Missing Environment Variables (HTTP 500)**
```json
{
  "error": "Server configuration error"
}
```
**Solution:**
```bash
supabase secrets set SUPABASE_ANON_KEY=your_anon_key_here
supabase secrets set SERVER_SECRET=your_secret_key_here
```

### ❌ **Invalid Proof (HTTP 400)**
```json
{
  "error": "Invalid proof - card verification failed"
}
```
**Solution:** Use the proof generator to create valid test data
```bash
node test-proof-generator.js --payload YOUR_SERVER_SECRET
```

### ❌ **Missing Required Fields (HTTP 400)**
```json
{
  "error": "Missing required fields"
}
```
**Solution:** Ensure all required fields are in your payload: `cid`, `proof`, `name`, `email`, `marks`, `asset`

### ❌ **Storage Upload Error (HTTP 500)**
```json
{
  "error": "Failed to upload winning card",
  "details": "Failed to upload to storage: ..."
}
```
**Solution:** 
- Create `bingo_cards` bucket in Supabase Storage
- Check bucket permissions (should be public for public URLs)

---

## 🔍 Debug Tools & Utilities

### **HMAC Proof Generator**

Generate valid proofs that pass the Edge Function validation:

```bash
# Generate complete test payload
node test-proof-generator.js --payload YOUR_SERVER_SECRET

# Generate proof for specific CID  
node test-proof-generator.js ABCDEFGH1234 YOUR_SERVER_SECRET

# Generate random CID and proof
node test-proof-generator.js YOUR_SERVER_SECRET
```

### **Connection Test Function**

The enhanced web app includes a connection test button that:
- Tests endpoint reachability
- Reports connectivity status  
- Shows detailed error messages
- Logs debug information to console

### **Enhanced Error Messages**

The app now provides specific error messages instead of generic failures:

- **"Server setup incomplete"** → Missing environment variables
- **"Card verification failed"** → Invalid HMAC proof
- **"Storage service unavailable"** → Storage bucket issues  
- **"Network connection failed"** → Connectivity problems
- **"Upload service not found"** → Function not deployed

---

## ✅ Pre-Deployment Checklist

Before going live, ensure all these items are checked:

### **Supabase Configuration**
- [ ] Project created: `jnsfslmcowcefhpszrfx`
- [ ] Edge Function deployed: `upload-winning-card`
- [ ] Environment variables set:
  - [ ] `SUPABASE_ANON_KEY`
  - [ ] `SERVER_SECRET` (minimum 32 characters)
- [ ] Storage bucket created: `bingo_cards`
- [ ] Bucket is public (for public URLs)

### **Function Testing**
- [ ] Connection test passes (web app button shows ✅)
- [ ] Upload test with valid payload succeeds (HTTP 200)
- [ ] File appears in storage bucket
- [ ] Public URL is accessible

### **Frontend Configuration**
- [ ] Correct Supabase URL in `public/app.js`
- [ ] CORS headers allow your domain
- [ ] All static assets load correctly

### **Optional: Email Integration**
- [ ] Resend API key configured (if using email features)
- [ ] Email templates tested
- [ ] From email address verified

---

## 🆘 Still Having Issues?

### **Detailed Diagnostic Steps**

1. **Function Deployment Status**
   ```bash
   supabase functions list
   supabase status
   ```

2. **Redeploy Everything**
   ```bash
   supabase functions deploy upload-winning-card --verify-jwt false
   ```

3. **Check Project Connectivity**
   ```bash
   # Test basic Supabase connectivity
   curl -I "https://jnsfslmcowcefhpszrfx.supabase.co/rest/v1/"
   ```

4. **Environment Variable Verification**
   ```bash
   # Test with temporary debug logging in your Edge Function
   # Add console.log statements to see what env vars are available
   ```

### **Get Help**

If you're still stuck after trying all the above:

1. **Check Function Logs**: 
   - Dashboard → Functions → upload-winning-card → Logs
   - Look for detailed error messages

2. **Test Each Component**:
   - ✅ Function deployed? 
   - ✅ Env vars set?
   - ✅ Storage bucket exists?
   - ✅ Network reachable?

3. **Create Minimal Test Case**:
   ```bash
   # Use the proof generator to create a minimal valid test
   node test-proof-generator.js --payload YOUR_SERVER_SECRET
   ```

4. **Enable Debug Mode**:
   - Use browser dev tools (F12)
   - Check network tab for failed requests
   - Look at console for detailed error logs

### **Common Gotchas**

- **Wrong Supabase URL**: Must match your project exactly
- **Using service_role key**: Use anon key instead for client-side
- **Missing storage bucket**: Create `bingo_cards` bucket manually
- **CORS issues**: Check ALLOWED_ORIGIN environment variable
- **Function not deployed**: Run `supabase functions deploy upload-winning-card`

---

## 💡 Pro Tips

1. **Start Simple**: Use the web app test button first - it's the quickest diagnostic
2. **Use Valid Data**: The proof generator creates test data that passes all validations
3. **Check Logs**: Supabase function logs show detailed error information
4. **Test Incrementally**: Test connectivity → env vars → storage → full upload
5. **Enhanced Errors**: The new error handling shows specific issues instead of generic failures

---

**🎯 This guide covers the complete testing, deployment, and troubleshooting workflow for your privacy-first bingo application. Use the table of contents to jump to relevant sections!**
