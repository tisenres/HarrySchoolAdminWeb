#!/bin/bash

# Harry School Admin - Vercel CLI Deployment Script
# Run this script to deploy to production

echo "🚀 Harry School Admin - Vercel Deployment"
echo "=========================================="

# Fix npm permissions if needed
echo "🔧 Fixing npm permissions..."
sudo chown -R $(whoami) ~/.npm
echo "✅ NPM permissions fixed"

# Install Vercel CLI
echo "📦 Installing Vercel CLI..."
npm install -g vercel
echo "✅ Vercel CLI installed"

# Login to Vercel
echo "🔐 Login to Vercel..."
echo "A browser window will open for authentication"
vercel login

# Set environment variables
echo "🌍 Setting up environment variables..."
export NEXT_PUBLIC_SUPABASE_URL="https://xlcsegukheumsadygmgh.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsY3NlZ3VraGV1bXNhZHlnbWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzOTM5NzksImV4cCI6MjA2OTk2OTk3OX0.kyHG8NazZruZu_pImGLMO8zFQvo--U6nwBqHbUEHBYE"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsY3NlZ3VraGV1bXNhZHlnbWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM5Mzk3OSwiZXhwIjoyMDY5OTY5OTc5fQ.hWgaYpSST_kClaO8-KHlWXGAH6_FOonXO9Ke_b6Xaac"
export NODE_ENV="production"

# Build the application first
echo "🔨 Building application..."
npm run build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod \
  --env NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --env NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --env SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  --env NODE_ENV="production"

echo "✅ Deployment complete!"
echo "🌐 Your app should now be live at the URL shown above"
echo ""
echo "📝 Next steps:"
echo "1. Test the deployed URL"
echo "2. Verify login functionality"
echo "3. Check API endpoints"
echo "4. Test form submissions"