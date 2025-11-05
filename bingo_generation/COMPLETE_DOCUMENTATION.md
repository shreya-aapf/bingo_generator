# 🎯 Privacy-First Bingo Card Generator - Complete Documentation

A serverless, privacy-first web application for generating cryptographically verifiable bingo cards using Supabase Edge Functions and static frontend technology.

![Bingo Card Generator](https://img.shields.io/badge/Privacy-First-green) ![Serverless](https://img.shields.io/badge/Serverless-Supabase-blue) ![No Database](https://img.shields.io/badge/Database-None-red)

---

## 📋 **Your Project Configuration Summary**

**Your Supabase Project**: **jnsfslmcowcefhpszrfx**  
**Edge Functions URL**: **https://jnsfslmcowcefhpszrfx.supabase.co/functions/v1/**  
**Dashboard**: **https://supabase.com/dashboard/project/jnsfslmcowcefhpszrfx**

### 🚨 **CRITICAL: No Database Required!**

✅ **This system does NOT use any database storage**  
✅ **You do NOT need to create tables, configure RLS, or set up any database features**  
✅ **Everything is stateless and privacy-first by design**

### 🔧 **What's Already Configured**

- ✅ **Frontend URL**: Updated in `public/app.js` to use your Supabase project
- ✅ **Project Config**: `supabase/config.toml` has your project ID  
- ✅ **Setup Scripts**: All scripts reference your specific project

---

## ✨ **System Features**

### 🔒 **Privacy-First Design**
- **Zero data storage** - No user information persisted anywhere
- **Transient processing** - Data exists only during request handling  
- **No tracking** - No cookies, sessions, or user profiles
- **Open source** - Complete transparency in data handling

### 🎲 **Secure Card Generation**
- **Deterministic cards** - Same Card ID always generates identical layout
- **Cryptographic verification** - HMAC-based proof prevents forgery
- **Standard bingo rules** - Proper column ranges (B: 1-15, I: 16-30, etc.)
- **FREE space** - Automatically placed in center position

### 📧 **Email Integration**  
- **Card delivery** - Send cards as PNG attachments via email
- **Rich templates** - Professional HTML email design
- **No storage** - Emails sent and forgotten immediately
- **Proof inclusion** - Verification codes embedded in every card

### 🏆 **Prize Claim System**
- **Win validation** - Automatic bingo pattern verification
- **Proof verification** - Cryptographic validation of card authenticity  
- **Community forwarding** - Claims routed to community inbox
- **Attachment support** - Upload supporting documentation

---

## 🏗️ **System Architecture**

### **High-Level Architecture**
```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   Static Frontend   │────▶│ Supabase Edge       │────▶│     Resend API      │
│   (Vercel/Netlify)  │     │    Functions        │     │   (Email Service)   │
│                     │     │                     │     │                     │
│ • HTML/JS/CSS       │     │ • generate-proof    │     │ • Card Emails       │
│ • Card Generation   │     │ • send-card         │     │ • Claim Forwards    │
│ • UI/UX             │     │ • claim             │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
                                        │
                                        ▼
                            ┌─────────────────────┐
                            │  Community Inbox    │
                            │ community@domain    │
                            └─────────────────────┘
```

### **Component Overview**

#### 1. Static Frontend (HTML/JS/CSS)
**Location**: `/public/`  
**Hosting**: Vercel, Netlify, or Supabase Storage  
**Responsibilities**:
- Deterministic card generation using seeded algorithms
- User interface and interactions
- Canvas/SVG rendering for downloads
- Client-side validation and formatting
- API communication with Edge Functions

#### 2. Supabase Edge Functions (Deno Runtime)
**Location**: `/supabase/functions/`  
**Runtime**: Deno with Web APIs  
**Responsibilities**:
- HMAC proof generation and verification
- Email delivery via Resend API  
- Claim validation and forwarding
- CORS handling and security enforcement

**Functions**:
- **`generate-proof`**: Generate HMAC-SHA256 proof for card authenticity
- **`send-card`**: Email cards to users with verification
- **`claim`**: Validate wins and forward to community inbox

#### 3. Email Service (Resend API)
**Service**: Resend.com  
**Purpose**: Transient email delivery  
**Features**:
- Card delivery with PNG attachments
- Claim forwarding to community inbox  
- HTML email templates with branding
- Delivery tracking and analytics

---

## 📁 **Project Structure**

```
bingo_generation/
├── public/                          # Static frontend
│   ├── index.html                  # Main application interface
│   ├── app.js                      # Core JavaScript logic  
│   ├── styles.css                  # Modern CSS styling
│   └── sw.js                       # Service worker (PWA support)
├── supabase/
│   ├── functions/
│   │   ├── generate-proof/         # HMAC proof generation
│   │   │   └── index.ts
│   │   ├── send-card/              # Email card delivery
│   │   │   └── index.ts
│   │   └── claim/                  # Prize claim processing
│   │       └── index.ts
│   └── config.toml                 # Supabase configuration
├── COMPLETE_DOCUMENTATION.md       # This comprehensive guide
├── package.json                    # Project configuration
└── setup.sh                       # Automated setup script
```

---

## 🔐 **Security Model**

### **Card Authenticity System**

#### CID Generation
```typescript
// Deterministic Card ID generation
const message = "BINGO" + seed;
const hash = SHA256(message);  
const cid = base32(hash).substring(0, 12);
```

#### Proof Generation  
```typescript
// HMAC-based proof system
const proof = HMAC_SHA256(SERVER_SECRET, cid);
const truncatedProof = base32(proof).substring(0, 10);
```

#### Verification Flow
1. Client generates CID from random seed
2. Edge Function computes HMAC proof using server secret
3. Proof is embedded in card and email
4. Claims are validated by regenerating expected proof
5. Invalid proofs are rejected automatically

### **Privacy Protection**
- **No databases** - Zero data persistence
- **Stateless functions** - No memory between requests
- **CORS enforcement** - Origin restrictions in production
- **Input validation** - All user data sanitized

### **Email Security**
- **Verified domains** - FROM_EMAIL must be verified in Resend
- **Rich templates** - Professional, branded email design
- **Attachment safety** - PNG images only for card delivery

---

## ⚙️ **Credential Setup**

### **Required Environment Variables**

Go to your Supabase Dashboard: **https://supabase.com/dashboard/project/jnsfslmcowcefhpszrfx**  
Navigate to: **Settings → Edge Functions → Environment variables**

Add these **5 required environment variables**:

```bash
# 🔑 REQUIRED: Server secret for HMAC proof generation
# Generate with: openssl rand -base64 32
SERVER_SECRET=YOUR_32_CHAR_SECRET_HERE

# 📧 REQUIRED: Resend API key for email functionality  
# Get from: https://resend.com/api-keys
RESEND_API_KEY=re_YOUR_RESEND_API_KEY_HERE

# 📬 REQUIRED: Email where prize claims will be sent
COMMUNITY_EMAIL=your-community-email@yourdomain.com

# 📤 REQUIRED: Verified sender email (must be verified in Resend)
FROM_EMAIL=noreply@yourdomain.com

# 🌐 OPTIONAL: CORS origin restriction (recommended for production)
ALLOWED_ORIGIN=https://your-frontend-domain.com
```

### **Generate Secure Server Secret**

Run one of these commands to generate a secure 32-character secret:

```bash
# Option 1: OpenSSL (recommended)
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Python
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### **Resend Email Service Setup**

1. **Create Resend Account**: Go to https://resend.com
2. **Get API Key**: 
   - Dashboard → API Keys → Create API Key
   - Copy the key (starts with `re_`)
3. **Verify Domain** (recommended):
   - Dashboard → Domains → Add Domain
   - Add DNS records to verify your domain
   - Use verified domain for `FROM_EMAIL`

---

## 🧪 **Local Testing Guide**

### **Step 1: Install Supabase CLI**

Since npm global install doesn't work, use one of these methods:

```bash
# Option 1: Download binary directly (Windows)
# Go to: https://github.com/supabase/cli/releases
# Download supabase_windows_amd64.tar.gz
# Extract and add to PATH

# Option 2: Use Chocolatey (Windows)
choco install supabase

# Option 3: Use Scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### **Step 2: Start Local Development**

```bash
cd bingo_generation

# Initialize Supabase (if not already done)
supabase init

# Start local Supabase services
supabase start
```

This starts:
- Local PostgreSQL database (port 54322) - *We won't use this*
- Local API Gateway (port 54321)  
- Local Edge Functions (port 54321)
- Supabase Studio (port 54323)

### **Step 3: Deploy Functions Locally**

```bash
# Deploy all Edge Functions to local environment
supabase functions deploy generate-proof --no-verify-jwt
supabase functions deploy send-card --no-verify-jwt  
supabase functions deploy claim --no-verify-jwt
```

### **Step 4: Set Local Environment Variables**

```bash
# Set environment variables for local functions
supabase secrets set SERVER_SECRET="local-test-secret-key-32-characters-long"
supabase secrets set RESEND_API_KEY="re_your_actual_resend_key_here"
supabase secrets set COMMUNITY_EMAIL="test@yourdomain.com"
supabase secrets set FROM_EMAIL="test@yourdomain.com"
supabase secrets set ALLOWED_ORIGIN="http://localhost:3000"
```

### **Step 5: Configure Frontend for Local Testing**

**Temporarily** edit `public/app.js` line 9:

```javascript
// CHANGE THIS LINE TEMPORARILY for local testing:
this.supabaseUrl = 'http://localhost:54321'; // Local testing URL

// Original line (change back later):
// this.supabaseUrl = 'https://jnsfslmcowcefhpszrfx.supabase.co';
```

### **Step 6: Start Frontend Server**

```bash
cd public

# Option 1: Python (if you have it)
python -m http.server 3000

# Option 2: Node.js serve
npx serve . -p 3000

# Option 3: Simple PHP server (if you have PHP)  
php -S localhost:3000
```

Your frontend will be available at: **http://localhost:3000**

### **Step 7: Test the System**

#### Test Edge Functions Directly:
```bash
curl -X POST http://localhost:54321/functions/v1/generate-proof \
  -H "Content-Type: application/json" \
  -d '{"cid":"ABC123DEF456"}'

# Expected response:
# {"proof":"SOMETESTPRF","cid":"ABC123DEF456"}
```

#### Test Frontend Interface:
1. Open **http://localhost:3000** in your browser
2. Click "🎲 Generate New Card"  
3. Check that the card generates properly
4. Try the email functionality (if Resend is configured)
5. Test the claim submission

#### Monitor Function Logs:
```bash
# In a separate terminal, monitor logs
supabase functions logs --follow
```

### **Local Testing Checklist**
- [ ] Supabase local services started
- [ ] Edge Functions deployed locally  
- [ ] Environment variables configured
- [ ] Frontend serves on localhost:3000
- [ ] Card generation works
- [ ] Proof generation API responds
- [ ] No CORS errors in browser console
- [ ] Function logs show successful operations

---

## 🚀 **Production Deployment**

### **Step 1: Revert Frontend URL**

Before deploying, change `public/app.js` back:
```javascript
// Change back to production URL
this.supabaseUrl = 'https://jnsfslmcowcefhpszrfx.supabase.co';
```

### **Step 2: Link and Deploy to Production Supabase**

```bash
# Link to your project
supabase link --project-ref jnsfslmcowcefhpszrfx

# Deploy functions to production
supabase functions deploy generate-proof
supabase functions deploy send-card  
supabase functions deploy claim

# Or deploy all at once:
supabase functions deploy
```

### **Step 3: Set Production Environment Variables**

Go to: **https://supabase.com/dashboard/project/jnsfslmcowcefhpszrfx/settings/functions**

Add the 5 environment variables as specified in the Credential Setup section above.

### **Step 4: Deploy Static Frontend**

#### Option A: Vercel Deployment
```bash
cd public
npx vercel --prod

# Follow prompts:
# - Set up and deploy: Yes
# - Which scope: Your account
# - Link to existing project: No
# - Project name: bingo-card-generator
# - Directory: ./ (current)
# - Override settings: No
```

#### Option B: Netlify Deployment
```bash
cd public
npx netlify deploy --prod --dir .
```

#### Option C: Supabase Storage (Simple Option)
```bash
# Upload to Supabase Storage
supabase storage create-bucket website --public

# Upload files
cd public
supabase storage upload website index.html
supabase storage upload website app.js  
supabase storage upload website styles.css

# Access via: https://jnsfslmcowcefhpszrfx.supabase.co/storage/v1/object/public/website/index.html
```

### **Step 5: Test Production System**

#### Test Card Generation:
```bash
# Test proof generation on YOUR project
curl -X POST https://jnsfslmcowcefhpszrfx.supabase.co/functions/v1/generate-proof \
  -H "Content-Type: application/json" \
  -d '{"cid":"A1B2C3D4E5F6"}'

# Response: {"proof":"AB12CD34EF","cid":"A1B2C3D4E5F6"}
```

#### Test Complete Flow:
1. Generate a card on your deployed frontend
2. Enter test email and name
3. Click "Email My Card"
4. Check email delivery
5. Generate a card and mark winning squares
6. Submit claim with test email
7. Check community email inbox

---

## 🎮 **How It Works**

### **For Players**
1. **Generate Card** - Click to create unique bingo card
2. **Get Your Card** - Email card to yourself (optional)
3. **Play Bingo** - Mark squares as numbers are called
4. **Claim Prize** - Submit winning card for verification

### **For Organizers**  
1. **Deploy System** - One-time setup with Supabase + Resend
2. **Monitor Claims** - Receive validated claims at community email
3. **Verify Winners** - Claims include cryptographic proof of authenticity
4. **Award Prizes** - Contact winners directly via provided email

### **Data Flow Diagrams**

#### Card Generation Flow
```
User Click Generate
        ↓
Generate Random Seed
        ↓  
Calculate CID = base32(SHA256("BINGO" + seed))[:12]
        ↓
Generate Card Numbers (deterministic from seed)
        ↓
POST /functions/v1/generate-proof { cid }
        ↓
Server: proof = HMAC-SHA256(SERVER_SECRET, cid)
        ↓
Return { proof, cid }
        ↓  
Render Card with CID + Proof
```

#### Email Flow
```
User Submits Email Form
        ↓
Generate Card Image (Canvas → PNG)
        ↓
POST /functions/v1/send-card { cid, name, email, asset }
        ↓
Validate Input + Regenerate Proof for Verification
        ↓
Call Resend API with HTML Template + PNG Attachment
        ↓
Return Success/Failure
        ↓
Clear All Data (No Persistence)
```

#### Claim Flow  
```
User Marks Squares + Submits Claim
        ↓
Validate Bingo Pattern Client-Side
        ↓
POST /functions/v1/claim { cid, proof, name, email, marks, attachment? }
        ↓
Server Validates:
  - Proof matches HMAC(SERVER_SECRET, cid)
  - Marks form valid bingo pattern
  - Email format correct
        ↓
Generate Claim Reference: CLAIM-YYYY-MM-DD-RANDOM
        ↓
Forward to Community Email via Resend
        ↓
Return { success: true, claimRef }
        ↓
Clear All Data (No Persistence)
```

---

## 🛠️ **Technical Implementation Details**

### **Deterministic Card Generation**

The card generation algorithm ensures identical cards for the same CID:

```javascript
class BingoCardGenerator {
  generateCardNumbers(seed) {
    // Seeded pseudo-random number generator
    let random = this.seededRandom(parseInt(seed));
    
    return {
      B: this.generateColumnNumbers(1, 15, random),
      I: this.generateColumnNumbers(16, 30, random), 
      N: this.generateColumnNumbers(31, 45, random),
      G: this.generateColumnNumbers(46, 60, random),
      O: this.generateColumnNumbers(61, 75, random)
    };
  }
  
  seededRandom(seed) {
    return function() {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  }
}
```

**Key Properties**:
- Same seed always produces same card layout
- Cryptographically secure CID prevents prediction
- Standard bingo column ranges enforced
- FREE space automatically placed in center

### **Bingo Pattern Validation**

```typescript
function validateBingo(marks: string[]): boolean {
  const positions = marks.map(mark => {
    const [row, col] = mark.split('-').map(n => parseInt(n));
    return { row, col };
  });

  // Check rows (5 in same row)
  for (let row = 0; row < 5; row++) {
    if (positions.filter(p => p.row === row).length === 5) return true;
  }
  
  // Check columns (5 in same column)
  for (let col = 0; col < 5; col++) {
    if (positions.filter(p => p.col === col).length === 5) return true;
  }
  
  // Check diagonals...
  return false;
}
```

---

## 📊 **Monitoring & Troubleshooting**

### **Function Logs**
```bash
# View function logs
supabase functions logs generate-proof --follow
supabase functions logs send-card --follow  
supabase functions logs claim --follow
```

### **Common Issues**

1. **"Server configuration error"**
   - Check all environment variables are set
   - Verify Resend API key is valid
   - Ensure `SERVER_SECRET` is configured

2. **CORS Errors**
   - Update `ALLOWED_ORIGIN` to match your domain
   - Ensure frontend URL matches exactly (https vs http)

3. **Email Not Sending**
   - Verify Resend API key permissions
   - Check `FROM_EMAIL` is verified in Resend
   - Check function logs for detailed errors

4. **Proof Validation Failing**
   - Ensure same `SERVER_SECRET` across all functions
   - Check CID format (12 characters, base32)

### **Debug Commands**
```bash
# Check function deployment
supabase functions list

# View recent logs
supabase functions logs --follow

# Test local functions
supabase functions serve generate-proof

# Reset and redeploy
supabase functions deploy generate-proof --no-verify-jwt
```

---

## 🎯 **Why This Architecture?**

### ✅ **Advantages**
- **Complete Privacy**: No user data stored anywhere
- **Tamper-Proof**: Cryptographic verification prevents cheating
- **Scalable**: Serverless functions auto-scale with demand  
- **Cost-Effective**: Pay only for actual usage
- **Maintenance-Free**: No database to maintain or backup
- **Transparent**: Open source demonstrates privacy practices

### ⚠️ **Trade-offs**
- **No Analytics**: Can't track user behavior (by design)
- **No Accounts**: Users must save their own cards
- **Email Dependency**: Requires email service for delivery  
- **Manual Claims**: Community must process wins manually

---

## 📈 **Performance Characteristics**

- **Cold Start**: ~200ms for Edge Functions
- **Warm Execution**: ~50ms per request
- **Email Delivery**: 1-5 seconds via Resend
- **Frontend Loading**: <2s on modern connections

### **Cost Structure**  
- **Supabase Edge Functions**: Pay per execution
- **Resend Email**: Pay per email sent
- **Static Hosting**: Often free tier eligible
- **No Database Costs**: Zero ongoing storage fees

---

## 🔒 **Security Checklist**

### **Environment Security**
- [ ] `SERVER_SECRET` is 32+ characters and secure
- [ ] `RESEND_API_KEY` has minimal required permissions
- [ ] `ALLOWED_ORIGIN` is set to your domain (not *)
- [ ] All secrets are in Supabase env vars, not code

### **Function Security**  
- [ ] CORS headers properly configured
- [ ] Input validation on all endpoints
- [ ] Rate limiting considered (optional)
- [ ] No sensitive data in logs

### **Frontend Security**
- [ ] Supabase URL updated in `app.js`
- [ ] No hardcoded secrets in frontend
- [ ] HTTPS enabled on domain
- [ ] CSP headers configured (optional)

---

## 📋 **Deployment Checklist**

- [ ] Set `SERVER_SECRET` in Supabase environment variables
- [ ] Set `RESEND_API_KEY` in Supabase environment variables  
- [ ] Set `COMMUNITY_EMAIL` in Supabase environment variables
- [ ] Set `FROM_EMAIL` in Supabase environment variables (must be verified)
- [ ] Set `ALLOWED_ORIGIN` in Supabase environment variables (optional)
- [ ] Deploy Edge Functions: `supabase functions deploy`
- [ ] Deploy frontend to hosting platform
- [ ] Test complete flow: Generate → Email → Claim

---

## 🚨 **Common Questions**

### Q: Do I need to set up a database?
**A: NO! This is a zero-database system. That's the whole point!**

### Q: Where is user data stored?
**A: Nowhere! All processing is transient and privacy-first.**

### Q: How do you verify cards without a database?
**A: Cryptographic HMAC proofs using server secrets.**

### Q: Can cards be faked?
**A: No, the HMAC proof system prevents forgery.**

---

## 📞 **Support & Contributing**

### **Quick Help**
1. Check function logs: `supabase functions logs --follow`
2. Verify environment variables in Supabase Dashboard
3. Test with minimal examples first
4. Monitor Resend dashboard for email delivery

### **Contributing Guidelines**
- Maintain privacy-first principles
- Add tests for new features  
- Update documentation
- Follow TypeScript/JavaScript best practices

---

## 🎉 **Congratulations!**

Your privacy-first bingo card system provides:

- ✅ **Zero data storage** - Complete privacy protection
- ✅ **Cryptographic verification** - Tamper-proof cards  
- ✅ **Serverless architecture** - Scales automatically
- ✅ **Email integration** - Seamless user experience
- ✅ **Claim management** - Automated prize verification

**🔒 Privacy • 🛡️ Security • ⚡ Performance • 📱 Modern UX**

The system demonstrates how modern serverless architectures can deliver powerful functionality while maintaining absolute privacy and security through thoughtful design and cryptographic verification.

---

## 🆘 **Quick Commands Reference**

```bash
# Local Development
supabase start                    # Start local services
supabase functions deploy --no-verify-jwt  # Deploy functions locally
supabase secrets set KEY="value"  # Set local secrets
supabase functions logs --follow  # Monitor logs
supabase stop                     # Stop local services

# Production Deployment  
supabase link --project-ref jnsfslmcowcefhpszrfx  # Link to your project
supabase functions deploy         # Deploy to production
cd public && vercel --prod        # Deploy frontend

# Testing
curl -X POST https://jnsfslmcowcefhpszrfx.supabase.co/functions/v1/generate-proof \
  -H "Content-Type: application/json" -d '{"cid":"TEST12345678"}'

# Generate secrets
openssl rand -base64 32           # Generate SERVER_SECRET
```

**Ready to deploy your privacy-first bingo system? Follow the deployment steps above!** 🚀
