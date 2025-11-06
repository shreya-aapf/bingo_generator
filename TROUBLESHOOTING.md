# Troubleshooting Upload Issues

If you're getting "failed to upload card" errors, follow this checklist to identify and fix the issue.

## 🔍 Quick Diagnosis

1. **Test the Connection First**
   - Click the "Test Upload Service" button in the instructions section
   - Check the browser console (F12) for detailed error messages

## 🔧 Common Issues & Solutions

### 1. Edge Function Not Deployed
**Symptoms:** 404 errors, "Upload service not found"
**Solution:**
```bash
# Deploy the Edge Function
supabase functions deploy upload-winning-card
```

### 2. Missing Environment Variables
**Symptoms:** "Server configuration error"
**Required Environment Variables:**
- `SUPABASE_ANON_KEY`
- `SERVER_SECRET`

**Solution:**
```bash
# Set environment variables
supabase secrets set SUPABASE_ANON_KEY=your_anon_key_here
supabase secrets set SERVER_SECRET=your_secret_key_here
```

### 3. Storage Bucket Missing
**Symptoms:** "Failed to upload to storage"
**Solution:**
- Go to Supabase Dashboard → Storage
- Create a bucket named `bingo_cards`
- Make it public if you want public URLs

### 4. Database Table Missing
**Symptoms:** Database insertion errors
**Solution:**
```sql
-- Run this migration if tables don't exist
-- Or check supabase/migrations/ folder
```

### 5. CORS Issues
**Symptoms:** CORS policy errors, Network errors
**Solution:**
- Check that `ALLOWED_ORIGIN` is set correctly in Edge Function
- Ensure your domain is whitelisted

### 6. Wrong Supabase URL
**Symptoms:** Network connection failed, 404 errors
**Solution:**
- Verify your Supabase URL in `app.js`
- Should be: `https://your-project-id.supabase.co`

## 🛠️ Debug Steps

1. **Check Browser Console (F12)**
   ```javascript
   // Look for these errors:
   // - Network errors
   // - CORS errors  
   // - 404/500 HTTP errors
   // - Detailed error messages from our enhanced error handling
   ```

2. **Test Edge Function Directly**
   ```bash
   # Test the endpoint
   curl -X OPTIONS https://your-project-id.supabase.co/functions/v1/upload-winning-card
   ```

3. **Check Supabase Logs**
   - Go to Supabase Dashboard → Functions
   - Click on `upload-winning-card`
   - Check the logs for errors

4. **Verify Database Tables**
   ```sql
   -- Check if tables exist
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

5. **Check Storage Bucket**
   - Dashboard → Storage
   - Verify `bingo_cards` bucket exists
   - Check permissions

## 📋 Environment Checklist

- [ ] Supabase project created
- [ ] Edge Function deployed (`upload-winning-card`)
- [ ] Environment variables set (`SUPABASE_ANON_KEY`, `SERVER_SECRET`)
- [ ] Storage bucket `bingo_cards` created
- [ ] Database tables created (run migrations)
- [ ] CORS configured properly
- [ ] Correct Supabase URL in frontend code

## 🆘 Still Having Issues?

If none of the above solutions work:

1. **Enable Debug Mode**
   - Open browser console (F12)
   - Look for detailed error messages
   - Check the "Upload details" log when submitting

2. **Test with Simple Data**
   - Try uploading without attachments first
   - Use a simple name/email (no special characters)

3. **Check Edge Function Logs**
   - Supabase Dashboard → Functions → upload-winning-card → Logs

4. **Verify All Services**
   - Edge Function: Working ✅/❌
   - Storage: Working ✅/❌  
   - Database: Working ✅/❌
   - Frontend: Working ✅/❌

## 💡 Pro Tips

- The "Test Upload Service" button helps identify connectivity issues
- Browser console shows detailed error messages with our enhanced error handling
- Most issues are related to incomplete Supabase setup
- Environment variables are the most common culprit
