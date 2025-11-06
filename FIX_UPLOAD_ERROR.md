# 🛠️ Fix Upload & CORS Error

## ❌ **Current Errors**
1. `new row violates row-level security policy` 
2. CORS errors preventing upload

## 🎯 **Root Cause**
The Edge Function was using the `anon` key instead of `service_role` key, which doesn't have permission to write to storage buckets.

## ✅ **Solution - Follow These Steps**

### **Step 1: Get Your Service Role Key**

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/jnsfslmcowcefhpszrfx
2. **Navigate to**: Settings → API
3. **Copy the `service_role` key** (NOT the anon key)
   - ⚠️ **IMPORTANT**: This is the secret key, keep it secure!
   - It looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### **Step 2: Set Environment Variable**

```bash
# Set the service role key (replace with your actual key)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Step 3: Deploy Updated Function**

```bash
# Deploy the fixed function
supabase functions deploy upload-winning-card
```

### **Step 4: Test Upload**

1. **Open your bingo app**
2. **Generate a card**
3. **Mark squares to make a winning pattern**
4. **Submit claim** - should work now! ✅

---

## 🔍 **What Was Fixed**

### **1. Storage Permissions**
- **Before**: Used `anon` key (limited permissions)  
- **After**: Uses `service_role` key (full access to storage)

### **2. CORS Headers**
- **Before**: Limited CORS headers
- **After**: More permissive headers for development

### **3. Error Handling**
- **Before**: Generic error messages
- **After**: Specific missing environment variable details

---

## 📊 **Expected Results**

### **✅ Success Response:**
```json
{
  "success": true,
  "bucketUrl": "https://jnsfslmcowcefhpszrfx.supabase.co/storage/v1/object/public/bingo_cards/winning-card-ABCD1234-claim_xxx.png",
  "fileName": "winning-card-ABCD1234-claim_xxx-2024-01-01.png", 
  "claimRef": "claim_xxx"
}
```

### **📁 File Location:**
Check **Supabase Dashboard** → **Storage** → **bingo_cards** bucket - your file should appear there!

---

## 🚨 **If Still Having Issues**

### **Check Environment Variables**
```bash
# List all set secrets (won't show values)
supabase secrets list

# Should show:
# - SERVER_SECRET
# - SUPABASE_SERVICE_ROLE_KEY
```

### **Check Function Logs**
```bash
# View real-time logs
supabase functions logs upload-winning-card --follow
```

### **Verify Storage Bucket**
1. **Go to**: Supabase Dashboard → Storage
2. **Check**: `bingo_cards` bucket exists
3. **If missing**: Create bucket named `bingo_cards` (public)

### **Test Connection First**
Use the "Test Upload Service" button in your bingo app to verify connectivity before trying full upload.

---

## 💡 **Security Note**

The `service_role` key has full database access - this is safe in Edge Functions (server-side) but **NEVER use it in client-side code!**

- ✅ **Edge Functions**: Use `service_role` key
- ❌ **Frontend/Client**: Use `anon` key only

---

## 🎉 **After Successful Fix**

Your bingo app will:
- ✅ Upload files to storage successfully
- ✅ Generate unique claim references  
- ✅ Return public URLs for downloaded cards
- ✅ Handle CORS properly
- ✅ Work without database (privacy-first!)

**Test it now - claim submission should work! 🎯**
