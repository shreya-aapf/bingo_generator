#!/bin/bash

# Privacy-First Bingo Card Generator - Quick Setup Script
# This script helps automate the initial setup process

set -e  # Exit on any error

echo "🎯 Privacy-First Bingo Card Generator - Setup Script"
echo "=================================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    echo "   Or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "✅ Supabase CLI found"

# Check if project is linked
if [ ! -f ".supabase/config.toml" ]; then
    echo ""
    echo "🔗 Link to your Supabase project:"
    echo "   supabase link --project-ref YOUR_PROJECT_REF"
    echo ""
    read -p "Enter your Supabase project reference ID: " project_ref
    
    if [ -z "$project_ref" ]; then
        echo "❌ Project reference required. Exiting."
        exit 1
    fi
    
    supabase link --project-ref "$project_ref"
    echo "✅ Project linked successfully"
else
    echo "✅ Project already linked"
fi

# Deploy Edge Functions
echo ""
echo "🚀 Deploying Edge Functions..."
supabase functions deploy generate-proof
supabase functions deploy send-card
supabase functions deploy claim
echo "✅ Edge Functions deployed successfully"

# Generate secure server secret
echo ""
echo "🔐 Generating secure SERVER_SECRET..."
server_secret=$(openssl rand -base64 32)
echo "Generated SERVER_SECRET: $server_secret"
echo ""

# Environment variables setup  
echo "⚙️  REQUIRED: Set these environment variables in YOUR Supabase Dashboard:"
echo "   Go to: https://supabase.com/dashboard/project/jnsfslmcowcefhpszrfx/settings/functions"
echo "   Click: Environment variables tab"
echo ""
echo "   🔑 SERVER_SECRET=$server_secret"
echo "   📧 RESEND_API_KEY=re_your_resend_api_key_here"  
echo "   📬 COMMUNITY_EMAIL=community@yourdomain.com"
echo "   📤 FROM_EMAIL=noreply@yourdomain.com"
echo "   🌐 ALLOWED_ORIGIN=https://your-domain.com"
echo ""
echo "   📋 See CREDENTIAL_SETUP.md for detailed instructions!"
echo ""

# Frontend configuration
echo "🌐 Frontend Configuration Required:"
echo "   Edit public/app.js line 12 to update supabaseUrl"
echo ""

# Your project URL (already configured)
project_url="https://jnsfslmcowcefhpszrfx.supabase.co"
echo "   ✅ Already configured: this.supabaseUrl = '$project_url';"
echo ""

# Deployment options
echo "🚀 Next Steps - Deploy Frontend:"
echo ""
echo "Option 1 - Vercel:"
echo "   cd public && npx vercel --prod"
echo ""
echo "Option 2 - Netlify:"  
echo "   cd public && npx netlify deploy --prod --dir ."
echo ""
echo "Option 3 - Local Testing:"
echo "   cd public && python -m http.server 3000"
echo "   Then open: http://localhost:3000"
echo ""

# Final checklist
echo "📋 Final Checklist:"
echo "   [ ] Set environment variables in Supabase Dashboard"
echo "   [ ] Update supabaseUrl in public/app.js"  
echo "   [ ] Set up Resend account and verify FROM_EMAIL domain"
echo "   [ ] Deploy frontend to hosting platform"
echo "   [ ] Test complete flow (generate → email → claim)"
echo ""

echo "🎉 Setup complete! Follow the checklist above to finish deployment."
echo ""
echo "📖 For detailed instructions, see:"
echo "   - README.md for quick overview"
echo "   - COMPLETE_DOCUMENTATION.md for comprehensive guide"
echo ""
echo "🆘 Need help? Check the troubleshooting section in COMPLETE_DOCUMENTATION.md"
