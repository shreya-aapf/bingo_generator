# Supabase Deployment Instructions
**Pathfinder Summit Bingo - Winning Claims System**

---

## 📋 Prerequisites

1. **Supabase CLI** installed
   ```bash
   # Install Supabase CLI (if not already installed)
   npm install -g supabase
   ```

2. **Supabase Project** set up
   - Go to [https://supabase.com](https://supabase.com)
   - Create or use existing project
   - Note your project reference ID (found in Project Settings)

3. **Login to Supabase CLI**
   ```bash
   supabase login
   ```

---

## 🚀 Step-by-Step Deployment

### Step 1: Link Your Local Project to Supabase

Navigate to your project directory:
```bash
cd "C:\Users\ShreyaKumar\OneDrive - Automation Anywhere\Documents\code\pathfinder_summit\bingo_generation\bingo_generator"
```

Link to your Supabase project:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Replace `YOUR_PROJECT_REF` with your actual project reference (e.g., `jnsfslmcowcefhpszrfx`)

---

### Step 2: Run Database Migration

Apply the migration to create the `winning_claims` table:

```bash
supabase db push
```

This will:
- ✅ Create the `winning_claims` table
- ✅ Set up proper indexes for performance
- ✅ Enable Row Level Security (RLS)
- ✅ Create access policies
- ✅ Set up auto-update triggers

**Alternative**: If you want to apply the migration manually through the Supabase Dashboard:
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open and paste the contents of `supabase/migrations/20251117_create_winning_claims_table.sql`
4. Click **Run**

---

### Step 3: Deploy Edge Function

Deploy the updated `upload-winning-card` edge function:

```bash
supabase functions deploy upload-winning-card
```

This will:
- ✅ Upload the function code to Supabase
- ✅ Make it available at the endpoint
- ✅ Automatically configure environment variables

---

### Step 4: Verify Deployment

#### 4.1 Check Database Table

1. Go to your Supabase Dashboard
2. Navigate to **Table Editor**
3. Look for the `winning_claims` table
4. Verify these columns exist:
   - `id` (UUID, Primary Key)
   - `claim_ref` (Text, Unique)
   - `full_name` (Text)
   - `email` (Text)
   - `file_url` (Text)
   - `file_path` (Text)
   - `submitted_at` (Timestamptz)
   - `created_at` (Timestamptz)
   - `updated_at` (Timestamptz)
   - `image_type` (Text)
   - `file_size_bytes` (Integer)

#### 4.2 Check Edge Function

1. Go to **Edge Functions** in your Supabase Dashboard
2. Verify `upload-winning-card` is listed and deployed
3. Check the logs for any errors

#### 4.3 Test the Function

Use the Supabase Dashboard or `curl` to test:

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/upload-winning-card \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }'
```

---

### Step 5: Configure Storage Bucket (If Not Already Done)

Ensure your `bingo_cards` storage bucket exists and has proper policies:

1. Go to **Storage** in Supabase Dashboard
2. If `bingo_cards` bucket doesn't exist, create it:
   - Click **New bucket**
   - Name: `bingo_cards`
   - Public bucket: ✅ Yes (for public URLs)

3. Set bucket policies:
   ```sql
   -- Allow public to insert files (for uploads)
   CREATE POLICY "Allow public uploads" ON storage.objects
   FOR INSERT TO public
   WITH CHECK (bucket_id = 'bingo_cards');

   -- Allow public to read files (for viewing)
   CREATE POLICY "Allow public reads" ON storage.objects
   FOR SELECT TO public
   USING (bucket_id = 'bingo_cards');
   ```

---

## 🔍 Verify Everything is Working

### Test the Complete Flow

1. Open your bingo app: `http://localhost:8000` (or your deployed URL)
2. Navigate to the "Claim Your Prize" section
3. Fill in the form:
   - Full Name: Your Name
   - Email: your@email.com
   - Upload a test bingo card image
4. Click **Submit Claim**
5. You should see a success message

### Check Database

1. Go to Supabase Dashboard → **Table Editor** → `winning_claims`
2. You should see a new row with:
   - Your name
   - Your email
   - File URL pointing to the uploaded image
   - Claim reference (e.g., `CLAIM-ABC123-XYZ789`)

### Check Storage

1. Go to Supabase Dashboard → **Storage** → `bingo_cards` bucket
2. You should see the uploaded file: `winning-card-CLAIM-XXX-timestamp.png`

---

## 🛠️ Troubleshooting

### Error: "relation 'winning_claims' does not exist"

**Solution**: Run the migration again:
```bash
supabase db push
```

### Error: "Failed to upload to storage"

**Solution**: Check storage bucket permissions:
1. Go to Storage → bingo_cards → Policies
2. Ensure public insert and select policies exist

### Error: "Function deployment failed"

**Solution**: 
1. Check function logs: `supabase functions logs upload-winning-card`
2. Verify environment variables are set
3. Redeploy: `supabase functions deploy upload-winning-card --no-verify-jwt`

### Can't see data in table

**Solution**: Check RLS policies:
```sql
-- Temporarily disable RLS for testing (re-enable in production!)
ALTER TABLE public.winning_claims DISABLE ROW LEVEL SECURITY;
```

---

## 📊 Monitoring and Management

### View Recent Claims

```sql
SELECT 
  claim_ref,
  full_name,
  email,
  submitted_at
FROM winning_claims
ORDER BY submitted_at DESC
LIMIT 20;
```

### Count Total Claims

```sql
SELECT COUNT(*) as total_claims
FROM winning_claims;
```

### Find Claims by Email

```sql
SELECT *
FROM winning_claims
WHERE email = 'user@example.com';
```

---

## 🔐 Security Notes

1. **RLS is enabled** by default - only service role and claim owners can read their data
2. **Email validation** happens at the database level
3. **File metadata** includes claim reference for tracking
4. **Public can insert** but not delete or update records

---

## 📝 Environment Variables

Your edge function uses these automatically from Supabase:
- `SUPABASE_URL` - Auto-configured
- `SUPABASE_ANON_KEY` - Auto-configured

No manual configuration needed! ✨

---

## ✅ Success Checklist

- [ ] Supabase CLI installed
- [ ] Logged in to Supabase CLI
- [ ] Project linked locally
- [ ] Database migration applied (`winning_claims` table created)
- [ ] Edge function deployed (`upload-winning-card`)
- [ ] Storage bucket configured (`bingo_cards`)
- [ ] Test submission successful
- [ ] Data visible in database table
- [ ] File visible in storage bucket

---

## 🎉 You're Done!

Your winning claims system is now live! Users can:
1. Upload their winning bingo cards
2. Submit their name and email
3. All data is stored in `winning_claims` table
4. Files are stored in `bingo_cards` storage bucket
5. Each claim gets a unique reference ID

For support, check the Supabase Dashboard logs or run:
```bash
supabase functions logs upload-winning-card --follow
```

