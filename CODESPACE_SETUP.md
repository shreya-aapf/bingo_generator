# 🚀 GitHub Codespace Setup Guide

This guide will help you deploy your privacy-first bingo system using GitHub Codespaces - no local setup required!

## 📋 **Prerequisites**

- GitHub account
- Supabase account (you already have project: jnsfslmcowcefhpszrfx)
- Resend account for email functionality

## 🎯 **Step 1: Create GitHub Repository**

### 1.1 Create a new repository on GitHub
1. Go to https://github.com/new
2. Repository name: `privacy-first-bingo` (or your preferred name)
3. Description: `Serverless, privacy-first bingo card generator with Supabase Edge Functions`
4. Set to **Public** (recommended) or Private
5. ✅ Add a README file
6. ✅ Add .gitignore template: None (we have our own)
7. ✅ Choose license: MIT
8. Click **Create repository**

### 1.2 Upload your code
```bash
# In your local project directory (Windows):
git init
git add .
git commit -m "Initial commit: Privacy-first bingo system"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

## 🛠️ **Step 2: Launch GitHub Codespace**

### 2.1 Start Codespace
1. Go to your GitHub repository
2. Click the green **Code** button
3. Click **Codespaces** tab
4. Click **Create codespace on main**

*Note: The first launch takes 2-3 minutes as it sets up the environment*

### 2.2 Automatic Setup
The Codespace will automatically:
- ✅ Install Supabase CLI
- ✅ Install Node.js and development tools (Vercel, Netlify CLI, serve)
- ✅ Set up the development environment
- ✅ Configure port forwarding (3000, 54321, 54323)

### 2.3 Verify Setup
In the Codespace terminal, run:
```bash
supabase --version    # Should show version info
node --version        # Should show Node.js version
npm --version         # Should show npm version
```

## 🔐 **Step 3: Configure Supabase Credentials**

### 3.1 Get Supabase Access Token
1. Go to https://supabase.com/dashboard/account/tokens
2. Click **Generate new token**
3. Name: `GitHub Codespace`
4. Copy the token (starts with `sbp_`)

### 3.2 Link to Your Project
In the Codespace terminal:
```bash
# Set your access token (replace with your actual token)
export SUPABASE_ACCESS_TOKEN=sbp_your_token_here

# Link to your project
supabase link --project-ref jnsfslmcowcefhpszrfx
```

## ⚙️ **Step 4: Set Environment Variables**

### 4.1 Generate Server Secret
```bash
# Generate a secure 32-character secret
openssl rand -base64 32
# Copy this output - you'll need it next
```

### 4.2 Configure in Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/jnsfslmcowcefhpszrfx/settings/functions
2. Click **Environment variables**
3. Add these variables:

| Variable | Value | Example |
|----------|--------|---------|
| `SERVER_SECRET` | *Your generated secret* | `K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols=` |
| `RESEND_API_KEY` | *Your Resend API key* | `re_123abc456def...` |
| `COMMUNITY_EMAIL` | *Where claims go* | `community@yourdomain.com` |
| `FROM_EMAIL` | *Verified sender* | `noreply@yourdomain.com` |
| `ALLOWED_ORIGIN` | *Your frontend URL* | `https://your-site.vercel.app` |

### 4.3 Get Resend API Key
1. Sign up at https://resend.com
2. Go to Dashboard → API Keys
3. Create new API key
4. Copy the key (starts with `re_`)

## 🚀 **Step 5: Deploy Edge Functions**

In the Codespace terminal:

```bash
# Deploy all Edge Functions to production
supabase functions deploy

# You should see:
# ✅ generate-proof deployed
# ✅ send-card deployed  
# ✅ claim deployed
```

### 5.1 Test Functions
```bash
# Test proof generation
curl -X POST https://jnsfslmcowcefhpszrfx.supabase.co/functions/v1/generate-proof \
  -H "Content-Type: application/json" \
  -d '{"cid":"TEST12345678"}'

# Should return: {"proof":"SOMETHING123","cid":"TEST12345678"}
```

## 🌐 **Step 6: Deploy Frontend**

### Option A: Deploy to Vercel
```bash
cd public

# Login to Vercel (will open browser)
npx vercel login

# Deploy to production
npx vercel --prod

# Follow prompts:
# - Set up and deploy: Yes
# - Which scope: Your account  
# - Link to existing project: No
# - Project name: privacy-first-bingo
# - Directory: ./ (current)
```

### Option B: Deploy to Netlify
```bash
cd public

# Login to Netlify (will open browser)
npx netlify login

# Deploy to production
npx netlify deploy --prod --dir .

# Follow prompts and note the URL
```

### Option C: Test Locally First
```bash
# Start local server
cd public
npx serve . -p 3000

# Access via the forwarded port in Codespace
# Check "Ports" tab in VS Code for the URL
```

## 🧪 **Step 7: Test Complete System**

### 7.1 Test Frontend
1. Visit your deployed frontend URL
2. Click "🎲 Generate New Card"
3. Verify card appears with CID and proof
4. Check browser console for any errors

### 7.2 Test Email (if configured)
1. Enter your email and name
2. Click "📧 Send Card"
3. Check your email for delivery

### 7.3 Test Claims
1. Generate a card
2. Mark a winning pattern (full row/column/diagonal)
3. Submit claim
4. Check community email inbox

## 🔍 **Step 8: Monitor and Debug**

### 8.1 View Function Logs
```bash
# Monitor all function logs
supabase functions logs --follow

# Or monitor specific functions
supabase functions logs generate-proof --follow
supabase functions logs send-card --follow  
supabase functions logs claim --follow
```

### 8.2 Common Issues

**❌ "Server configuration error"**
```bash
# Check environment variables are set
curl -X POST https://jnsfslmcowcefhpszrfx.supabase.co/functions/v1/generate-proof \
  -H "Content-Type: application/json" \
  -d '{"cid":"TEST"}'
```

**❌ CORS errors**
- Update `ALLOWED_ORIGIN` in Supabase environment variables
- Set to your actual frontend domain

**❌ Email not sending**
- Verify Resend API key is valid
- Check `FROM_EMAIL` is verified in Resend account

## 🎉 **Step 9: You're Live!**

Your privacy-first bingo system is now deployed and running! 

### Key URLs:
- **Frontend**: Your Vercel/Netlify URL
- **Edge Functions**: `https://jnsfslmcowcefhpszrfx.supabase.co/functions/v1/`
- **Supabase Dashboard**: https://supabase.com/dashboard/project/jnsfslmcowcefhpszrfx
- **Function Logs**: Same dashboard → Edge Functions → Logs

### System Features:
- 🔒 **Zero Data Storage** - Complete privacy protection
- 🎲 **Cryptographic Security** - Tamper-proof cards
- 📧 **Email Integration** - Professional delivery
- 🏆 **Automated Claims** - Prize verification system
- ⚡ **Auto-Scaling** - Serverless infrastructure

## 🛟 **Need Help?**

1. **Codespace Issues**: Rebuild codespace or check terminal output
2. **Deployment Issues**: Check function logs with `supabase functions logs`
3. **Email Issues**: Verify Resend configuration and logs
4. **Frontend Issues**: Check browser console and network tab

## 📚 **Additional Resources**

- **Full Documentation**: See `COMPLETE_DOCUMENTATION.md` in your repo
- **Supabase Docs**: https://supabase.com/docs
- **Resend Docs**: https://resend.com/docs
- **GitHub Codespaces**: https://github.com/features/codespaces

---

**🎯 Congratulations! You've deployed a production-ready, privacy-first bingo system using modern serverless architecture!**
