# 🎯 Pathfinder Bingo - Complete Setup Guide

## Overview

A punk rock-styled bingo application for Pathfinder Summit with cloud storage integration and Automation Anywhere bot deployment capabilities.

## 🏗️ Architecture

### Frontend Features
- **3-Column Layout**: Instructions | Card Generation & Upload | Prize Claims
- **Punk Rock Design**: AA brand colors (#FF5A10, #662D8F, #FFBC03) with neobrutalist styling
- **PNG Upload**: Users can upload bingo card images to cloud storage
- **Automation Deployment**: Uses AA bots for email sending instead of direct email

### Backend Services
- **Supabase Edge Functions**: Serverless functions for proof generation and uploads
- **Cloud Storage**: `bingo_cards` bucket for PNG file storage
- **Automation Anywhere Integration**: Bot deployment for email processing

## 🚀 Quick Setup

### 1. Supabase Configuration

**Environment Variables:**
```bash
SUPABASE_URL=https://jnsfslmcowcefhpszrfx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_key_here
SERVER_SECRET=your_hmac_secret_for_proofs
ALLOWED_ORIGIN=*
```

**Storage Bucket:**
- Bucket name: `bingo_cards`
- Settings: Public read/write enabled
- File types: PNG files allowed

### 2. Deploy Functions

```bash
# Deploy proof generation
supabase functions deploy generate-proof

# Deploy existing upload function  
supabase functions deploy upload-winning-card

# Deploy claim processing (if using AA integration)
supabase functions deploy deploy-claim-automation
```

### 3. Automation Anywhere Setup (Optional)

**Environment Variables:**
```bash
AA_CONTROL_ROOM_URL=https://your-cr.automationanywhere.digital
AA_AUTH_TOKEN=your_bearer_token
AA_EMAIL_BOT_PATH=/Bots/EmailCardBot
AA_CLAIM_BOT_PATH=/Bots/ProcessClaimBot
```

**Required Bots:**
- **EmailCardBot**: Sends bingo cards via email
- **ProcessClaimBot**: Handles prize claim processing

## 🎮 How It Works

### User Journey
1. **Generate Card**: Creates unique bingo card with cryptographic proof
2. **Download/Upload**: User can download PNG or upload to cloud storage
3. **Play Game**: Mark squares during Pathfinder Summit activities  
4. **Claim Prize**: Submit winning patterns for verification

### Technical Flow
1. **Card Generation**: 
   - Frontend generates deterministic card based on seed
   - HMAC proof created via Edge Function
   - Card displayed with AA brand styling

2. **PNG Upload**:
   - User selects PNG file (any bingo card image)
   - File validated and uploaded to `bingo_cards` bucket
   - Public URL returned for sharing

3. **Prize Claims**:
   - User marks winning squares on frontend
   - Pattern validated (row/column/diagonal)
   - AA automation deployed to process claim

## 📱 Frontend Structure

### Three-Column Layout

**Left Column - Instructions:**
- Game rules and how-to-play guide
- Privacy information
- Troubleshooting tips

**Middle Column - Card Generation:**
- Generate new card button
- Bingo card display (vintage ticket style)
- Download PNG functionality
- Upload PNG to cloud storage

**Right Column - Prize Claims:**
- Mark winning squares interface
- Claim submission form
- Verification status

### Responsive Design
- **Desktop (1200px+)**: Full 3-column layout
- **Tablet (768-1200px)**: 2 columns with claims below  
- **Mobile (<768px)**: Single column stack

## 🎨 Styling

### Brand Colors
- **AA Orange**: #FF5A10 (primary)
- **AA Plum**: #662D8F (secondary) 
- **AA Gold**: #FFBC03 (accent)

### Typography
- **Headers**: Noto Serif with white outline
- **Body**: Barlow Condensed for punk rock aesthetic
- **Monospace**: Courier New for technical elements

### Design Elements
- **Neobrutalist borders**: Thick black borders with colored shadows
- **Vintage ticket**: Perforated edges, aged paper texture
- **Arcade background**: Subtle retro gaming machines (optional)

## 🔧 File Structure

```
bingo_generator/
├── public/
│   ├── index.html          # Main application
│   ├── app.js             # Frontend logic
│   ├── styles.css         # Punk rock styling
│   └── sw.js              # Service worker
├── supabase/
│   └── functions/
│       ├── generate-proof/     # HMAC proof generation
│       └── upload-winning-card/ # PNG upload to storage
├── SETUP_GUIDE.md         # This file
└── README.md              # Quick reference
```

## 🧪 Testing

### Test PNG Upload
```bash
# Test upload functionality
curl -X POST 'https://jnsfslmcowcefhpszrfx.supabase.co/functions/v1/upload-winning-card' \
  -F 'png_file=@test-card.png'
```

### Test Proof Generation  
```bash
# Test proof generation
curl -X POST 'https://jnsfslmcowcefhpszrfx.supabase.co/functions/v1/generate-proof' \
  -H 'Content-Type: application/json' \
  -d '{"cid":"TEST12345678"}'
```

## 📋 Bingo Content

### Activity Categories (by Column)

**B Column**: "Book a demo", "Browse Bot Store", "Build your first bot"
**I Column**: "Install AA Desktop", "Integrate with API", "Identify use case"  
**N Column**: "Network with peers", "Navigate Control Room", "New skill learned"
**G Column**: "Get certified", "Generate report", "Governance reviewed"
**O Column**: "Optimize performance", "Orchestrate workflow", "Onboard new user"

**FREE Space**: "Sign up for PF Summit" (easy completion)

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**: Check ALLOWED_ORIGIN environment variable
2. **Upload Fails**: Verify `bingo_cards` bucket exists and has public policies
3. **Proof Generation**: Ensure SERVER_SECRET is set correctly
4. **Styling Issues**: Check if Google Fonts are loading properly

### Storage Policies
```sql
-- Ensure public read access
CREATE POLICY "Allow public downloads" ON storage.objects
FOR SELECT USING (bucket_id = 'bingo_cards');
```

## 🔐 Security

### Privacy Features
- **No personal data stored** in databases
- **Cryptographic proofs** for card verification
- **Client-side generation** of bingo cards
- **Optional user info** only when explicitly provided

### File Validation
- **PNG files only** with size limits (10MB max)
- **Filename sanitization** to prevent exploits
- **Public storage** with controlled access policies

## 🚀 Deployment

### Production Checklist
- [ ] Set proper ALLOWED_ORIGIN for your domain
- [ ] Configure AA bot credentials (if using automation)
- [ ] Test all Edge Functions
- [ ] Verify storage bucket policies
- [ ] Test responsive design on all devices
- [ ] Validate bingo content accuracy

### Performance
- **Static hosting** via Supabase or CDN
- **Edge functions** for serverless scaling  
- **Client-side rendering** for fast load times
- **Image optimization** for PNG downloads

This setup provides a complete, privacy-first bingo system with modern styling and cloud integration!
