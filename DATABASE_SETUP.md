# Database Setup for User-Card Mapping

This guide explains how to set up the database table for tracking user-to-card ID mappings in your Supabase project.

## Quick Setup

### 1. Run the Migration

In your Supabase project dashboard, go to the SQL Editor and run the migration file:

```sql
-- Located at: supabase/migrations/001_create_user_card_mappings.sql
-- Copy and paste the entire contents of that file into the SQL Editor
```

### 2. Add Environment Variables

Make sure these environment variables are set in your Supabase project:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Deploy the New Edge Function

Deploy the `store-user-card` function:

```bash
supabase functions deploy store-user-card
```

## Database Schema

### Table: `user_card_mappings`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `card_id` | VARCHAR(12) | The bingo card CID |
| `user_name` | VARCHAR(255) | Optional user name |
| `user_email` | VARCHAR(255) | Optional user email |
| `session_id` | VARCHAR(255) | Unique session identifier |
| `user_agent` | TEXT | Browser/device information |
| `ip_address` | VARCHAR(45) | User's IP address |
| `created_at` | TIMESTAMP | When the mapping was created |
| `updated_at` | TIMESTAMP | When the mapping was last updated |
| `metadata` | JSONB | Additional flexible data storage |

### Indexes Created
- `idx_user_card_mappings_card_id` - For card lookups
- `idx_user_card_mappings_email` - For user email lookups
- `idx_user_card_mappings_session` - For session tracking
- `idx_user_card_mappings_created_at` - For time-based queries
- `idx_user_card_mappings_metadata` - For JSON queries

### Analytics View
A `user_card_analytics` view is created for daily statistics:
- Cards generated per day
- Unique users with emails
- Unique sessions
- Unique IP addresses

## How It Works

### 1. Card Generation
When a user generates a bingo card:
- Frontend calls `/functions/v1/store-user-card`
- Stores: CID, session ID, user agent, IP, timestamp
- No personal info stored initially

### 2. Email Submission
When a user enters their info to email a card:
- System updates the existing mapping with name/email
- Links the anonymous session to user identity

### 3. Privacy-First Design
- **Session-based tracking** for anonymous users
- **Optional personal info** only when user provides it
- **GDPR compliant** with minimal data collection
- **Secure storage** with Row Level Security (RLS)

## Querying Examples

### Get all cards for a user
```sql
SELECT card_id, created_at, user_name 
FROM user_card_mappings 
WHERE user_email = 'user@example.com'
ORDER BY created_at DESC;
```

### Daily analytics
```sql
SELECT * FROM user_card_analytics 
WHERE date >= CURRENT_DATE - INTERVAL '7 days';
```

### Session activity
```sql
SELECT card_id, user_name, user_email, created_at
FROM user_card_mappings 
WHERE session_id = 'sess_abc123_xyz789';
```

### Popular time analysis
```sql
SELECT 
    EXTRACT(hour FROM created_at) as hour,
    COUNT(*) as card_count
FROM user_card_mappings 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY EXTRACT(hour FROM created_at)
ORDER BY hour;
```

## Privacy & Security

### Row Level Security (RLS)
- **Service role**: Full access for backend functions
- **Authenticated users**: Can only see their own mappings
- **Anonymous users**: No direct database access

### Data Retention
Consider adding a cleanup policy:

```sql
-- Example: Delete mappings older than 1 year
DELETE FROM user_card_mappings 
WHERE created_at < NOW() - INTERVAL '1 year'
AND user_email IS NULL; -- Keep mappings with email longer
```

### GDPR Compliance
To handle data deletion requests:

```sql
-- Delete all data for a user
DELETE FROM user_card_mappings 
WHERE user_email = 'user@example.com';

-- Or anonymize instead of delete
UPDATE user_card_mappings 
SET 
    user_name = NULL,
    user_email = NULL,
    ip_address = NULL,
    user_agent = 'anonymized',
    metadata = '{}'
WHERE user_email = 'user@example.com';
```

## Monitoring & Analytics

### Usage Statistics
```sql
SELECT 
    COUNT(*) as total_cards,
    COUNT(DISTINCT user_email) FILTER (WHERE user_email IS NOT NULL) as unique_users,
    COUNT(DISTINCT session_id) as unique_sessions,
    AVG(EXTRACT(epoch FROM (updated_at - created_at))) as avg_session_duration
FROM user_card_mappings
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';
```

### Popular Cards
```sql
SELECT 
    card_id,
    COUNT(*) as generation_count,
    COUNT(DISTINCT user_email) FILTER (WHERE user_email IS NOT NULL) as unique_users
FROM user_card_mappings 
GROUP BY card_id 
ORDER BY generation_count DESC 
LIMIT 10;
```

This setup provides comprehensive user tracking while maintaining privacy and giving you valuable analytics about card usage patterns!
