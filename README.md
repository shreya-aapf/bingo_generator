# 🎮 Pathfinder Summit Bingo Generator

A complete bingo card generation and winning card submission system for the Automation Anywhere Pathfinder Summit.

---

## 🚀 Quick Links

- **[Complete Deployment Guide](COMPLETE_DEPLOYMENT_GUIDE.md)** ⭐ Start here for setup instructions
- **[SQL Setup File](supabase/migrations/QUICK_SETUP.sql)** - Copy-paste into Supabase SQL Editor

---

## 📋 What This Project Includes

### 1. **Bingo Card Generator**
- Rule-based card generation with activity pools
- Deterministic seeded random for unique cards
- Download cards as PNG
- Fixed center free square
- 5x5 grid with proper activity distribution

### 2. **Winning Card Submission System**
- User form to submit winning cards
- Image upload to Supabase Storage
- Database record with all submission details
- Unique claim reference IDs
- Admin review workflow

---

## ⚡ Quick Start

### 3-Step Setup (5 minutes)

1. **Create Database Table**
   - Open Supabase Dashboard → SQL Editor
   - Copy-paste `supabase/migrations/QUICK_SETUP.sql`
   - Click Run

2. **Verify Storage Bucket**
   - Check `bingo_cards` bucket exists
   - Create if missing (make it Public)

3. **Deploy Edge Function**
   ```bash
   supabase login
   supabase link --project-ref jnsfslmcowcefhpszrfx
   supabase functions deploy upload-winning-card
   ```

**📖 See [COMPLETE_DEPLOYMENT_GUIDE.md](COMPLETE_DEPLOYMENT_GUIDE.md) for detailed instructions**

---

## 📁 Project Structure

```
bingo_generator/
├── public/
│   ├── index.html              # Main application
│   ├── app.js                  # Frontend logic
│   ├── bingo-data.js          # Activity pools & rules
│   └── styles.css              # Styling
├── supabase/
│   ├── functions/
│   │   └── upload-winning-card/
│   │       └── index.ts        # Edge Function for uploads
│   └── migrations/
│       ├── QUICK_SETUP.sql     # Quick database setup
│       └── 20241117000000_create_winning_claims_table.sql
└── COMPLETE_DEPLOYMENT_GUIDE.md # Full documentation
```

---

## 🎯 Features

### Bingo Card Generation
- ✅ 5 activity pools (B, I, N, G, O buckets)
- ✅ Rule-based selection (e.g., pick 3 from Keynotes, 2 from Hands-on)
- ✅ Fixed center free square
- ✅ Deterministic based on card ID (CID)
- ✅ Download as PNG
- ✅ Cryptographic proof system
- ✅ Mark squares on uploaded cards

### Winning Card Submission
- ✅ Name and email capture
- ✅ Image upload validation
- ✅ Supabase Storage integration
- ✅ Database record with metadata
- ✅ Unique claim reference IDs
- ✅ Admin review workflow
- ✅ Status tracking (pending/approved/rejected)
- ✅ Row Level Security

---

## 🗄️ Database Schema

### `winning_claims` Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `claim_ref` | TEXT | Unique claim reference (e.g., CLAIM-K8X9L2-ABC123) |
| `full_name` | TEXT | User's name |
| `email` | TEXT | User's email |
| `file_url` | TEXT | Public URL to winning card image |
| `file_path` | TEXT | Storage path |
| `image_type` | TEXT | Image format (png/jpeg/webp) |
| `file_size_bytes` | INTEGER | File size |
| `submitted_at` | TIMESTAMPTZ | Submission time |
| `status` | TEXT | pending/approved/rejected |
| `admin_notes` | TEXT | Admin review notes |

---

## 🎮 How to Use (For Players)

1. **Generate Your Card**
   - Visit the app
   - Click "Generate a Bingo Card"
   - Download your card immediately

2. **Play Bingo**
   - Complete activities on your card
   - Mark them off as you go

3. **Submit Winning Card**
   - When you get 5 in a row
   - Click "Claim a Winning Card"
   - Upload your marked card
   - Enter name and email
   - Submit!

4. **Get Confirmation**
   - Receive claim reference ID
   - Wait for admin review

---

## 👨‍💼 How to Use (For Admins)

1. **View Submissions**
   - Supabase Dashboard → Table Editor → `winning_claims`
   - See all submissions with details

2. **Review Cards**
   - Click on `file_url` to view image
   - Verify winning pattern

3. **Approve/Reject**
   ```sql
   UPDATE winning_claims
   SET status = 'approved', admin_notes = 'Verified!'
   WHERE claim_ref = 'CLAIM-XXX-XXX';
   ```

4. **Export Data**
   - Table Editor → Export button
   - Choose CSV/JSON/Excel

---

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5 Canvas, CSS3
- **Backend**: Supabase Edge Functions (Deno/TypeScript)
- **Database**: PostgreSQL (via Supabase)
- **Storage**: Supabase Storage
- **Authentication**: Row Level Security (RLS)
- **Deployment**: Supabase Platform

---

## 📊 Activity Pools

Cards are generated from these buckets:

- **B - Keynotes & Awards** (5 items, pick 3)
- **I - Hands-on + Cert + Booths** (9 items, specific rules)
- **N - Pathfinder** (1 fixed center + 5 others, pick 3)
- **G - Framework Tags** (9 items, pick 3-5)
- **O - Product Highlights + Sessions** (11 items, pick 5-7)

Total: 25 squares per card (including center free square)

---

## 🔐 Security

- ✅ Row Level Security (RLS) enabled
- ✅ Public bucket for easy image access
- ✅ Email validation
- ✅ Image type validation (PNG/JPEG/WEBP only)
- ✅ File size limits
- ✅ CORS headers configured
- ✅ Unique claim references prevent conflicts

---

## 🧪 Testing

Run the local development server:

```bash
cd public
python -m http.server 8000
# Or use any local server

# Open browser
http://localhost:8000
```

Test the complete flow:
1. Generate a card
2. Download it
3. Mark some squares (or use annotation tool)
4. Submit via "Claim a Winning Card"
5. Verify in Supabase Dashboard

---

## 📝 Commands Quick Reference

```bash
# Login to Supabase
supabase login

# Link project
supabase link --project-ref jnsfslmcowcefhpszrfx

# Deploy function
supabase functions deploy upload-winning-card

# View logs
supabase functions logs upload-winning-card --follow

# Check status
supabase status
```

---

## 🐛 Troubleshooting

Common issues and solutions are documented in [COMPLETE_DEPLOYMENT_GUIDE.md](COMPLETE_DEPLOYMENT_GUIDE.md#troubleshooting)

Quick fixes:
- **Function fails**: Redeploy with `supabase functions deploy upload-winning-card`
- **Table doesn't exist**: Run `QUICK_SETUP.sql` in SQL Editor
- **Bucket missing**: Create `bingo_cards` bucket (make it Public)
- **CLI issues**: Update with `npm update -g supabase`

---

## 📚 Documentation

- **[COMPLETE_DEPLOYMENT_GUIDE.md](COMPLETE_DEPLOYMENT_GUIDE.md)** - Comprehensive setup and usage guide
- **[supabase/migrations/QUICK_SETUP.sql](supabase/migrations/QUICK_SETUP.sql)** - Database setup script

---

## 🎉 Project Status

✅ **Production Ready**

- [x] Bingo card generation with rules
- [x] Download cards as PNG
- [x] Card annotation tool
- [x] Winning card submission
- [x] Database storage
- [x] File upload to storage
- [x] Admin review workflow
- [x] Complete documentation
- [x] Security (RLS) configured
- [x] Error handling
- [x] Logging

---

## 🔄 Future Enhancements (Optional)

- [ ] Email notifications on submission
- [ ] Custom admin dashboard UI
- [ ] OCR to verify bingo numbers
- [ ] AI pattern detection
- [ ] Prize fulfillment workflow
- [ ] Real-time leaderboard
- [ ] Social sharing features

---

## 📞 Support

For deployment help, see [COMPLETE_DEPLOYMENT_GUIDE.md](COMPLETE_DEPLOYMENT_GUIDE.md)

**Your Supabase Project:**
- URL: `https://jnsfslmcowcefhpszrfx.supabase.co`
- Dashboard: https://supabase.com/dashboard/project/jnsfslmcowcefhpszrfx

---

## 📄 License

Internal use - Automation Anywhere Pathfinder Summit 2025

---

**Ready to deploy? Open [COMPLETE_DEPLOYMENT_GUIDE.md](COMPLETE_DEPLOYMENT_GUIDE.md) and follow the 3-step setup!** 🚀
