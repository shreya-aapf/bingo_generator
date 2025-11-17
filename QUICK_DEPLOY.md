# Quick Deployment Commands

## Fast Track - Deploy in 3 Commands

```bash
# 1. Link project (one-time setup)
supabase link --project-ref jnsfslmcowcefhpszrfx

# 2. Deploy database migration
supabase db push

# 3. Deploy edge function
supabase functions deploy upload-winning-card
```

## Verify Deployment

```bash
# Check function logs
supabase functions logs upload-winning-card

# Check database
supabase db pull
```

## Test Locally (Optional)

```bash
# Start local Supabase
supabase start

# Deploy function locally
supabase functions serve upload-winning-card

# Test endpoint
curl http://localhost:54321/functions/v1/upload-winning-card
```

---

## What Gets Created

### Database Table: `winning_claims`
```sql
CREATE TABLE winning_claims (
  id UUID PRIMARY KEY,
  claim_ref TEXT UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  submitted_at TIMESTAMPTZ,
  image_type TEXT,
  file_size_bytes INTEGER
);
```

### Edge Function: `upload-winning-card`
- Uploads image to storage
- Creates database record
- Returns claim reference

### Storage Bucket: `bingo_cards`
- Stores winning card images
- Public read access
- Public upload access

---

## View Your Data

**Supabase Dashboard:**
- Table Editor → `winning_claims`
- Storage → `bingo_cards`
- Edge Functions → `upload-winning-card` (logs)

**SQL Query:**
```sql
SELECT * FROM winning_claims ORDER BY submitted_at DESC;
```

---

For detailed instructions, see `SUPABASE_DEPLOYMENT.md`

