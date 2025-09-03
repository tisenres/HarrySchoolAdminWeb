# 🚀 Harry School Admin - Vercel Deployment Checklist

## Prerequisites ✅

### 1. Vercel Account Setup
- [ ] Create account at https://vercel.com
- [ ] Connect GitHub account
- [ ] Install Vercel CLI (optional): `npm i -g vercel`

### 2. Environment Variables Needed
Create these in Vercel Dashboard → Project Settings → Environment Variables:

```env
# Required - Supabase Production
NEXT_PUBLIC_SUPABASE_URL=https://xlcsegukheumsadygmgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your_anon_key]
SUPABASE_SERVICE_ROLE_KEY=[your_service_role_key]

# Optional - AI Features
OPENAI_API_KEY=[your_openai_key_if_using_ai]

# System
NODE_ENV=production
```

### 3. Pre-Deployment Checks
- [x] Production build successful: `npm run build`
- [x] TypeScript errors resolved
- [x] Environment variables configured
- [x] Database migrations ready
- [x] vercel.json configured

---

## 🔧 Deployment Options

### Option 1: GitHub Integration (Recommended)
1. Push code to GitHub repository
2. Go to https://vercel.com/new
3. Import your GitHub repository
4. Configure:
   - Framework: Next.js (auto-detected)
   - Root Directory: `harry-school-admin`
   - Build Command: `npm run build`
   - Install Command: `npm install`
5. Add environment variables
6. Deploy!

### Option 2: CLI Deployment
```bash
# Fix npm permissions first (if needed)
sudo chown -R $(whoami) ~/.npm

# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? [your-account]
# - Link to existing project? N
# - Project name? harry-school-admin
# - Directory? ./
# - Override settings? N
```

### Option 3: Manual Upload
1. Build locally: `npm run build`
2. Go to https://vercel.com/new
3. Upload `.next` folder
4. Configure environment variables
5. Deploy

---

## 📝 Environment Variables Configuration

### In Vercel Dashboard:

1. Go to Project Settings → Environment Variables
2. Add each variable:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xlcsegukheumsadygmgh.supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | [Get from Supabase Dashboard] | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | [Get from Supabase Dashboard] | Production |

### Getting Supabase Keys:
1. Go to https://supabase.com/dashboard
2. Select your project: `xlcsegukheumsadygmgh`
3. Go to Settings → API
4. Copy:
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret → `SUPABASE_SERVICE_ROLE_KEY`

---

## 🌐 Domain Configuration

### Option A: Vercel Subdomain (Free)
- Automatic: `harry-school-admin.vercel.app`
- No configuration needed

### Option B: Custom Domain
1. Add domain in Vercel Dashboard → Domains
2. Configure DNS:
   ```
   Type: A
   Name: admin (or @)
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
3. Wait for DNS propagation (5-30 minutes)
4. SSL certificate auto-configured

---

## 🚦 Deployment Steps

### Step 1: Final Local Check
```bash
# Build test
npm run build

# Type check
npm run typecheck

# Lint check
npm run lint
```

### Step 2: Push to GitHub
```bash
git add .
git commit -m "Production deployment ready"
git push origin main
```

### Step 3: Deploy via Vercel
1. Go to https://vercel.com/new
2. Import repository
3. Configure environment variables
4. Click "Deploy"

### Step 4: Post-Deployment
1. Test production URL
2. Verify authentication works
3. Check all API endpoints
4. Test form submissions
5. Verify database connectivity

---

## ✅ Post-Deployment Verification

### Functional Tests
- [ ] Login page loads
- [ ] Authentication works
- [ ] API endpoints respond
- [ ] Forms submit correctly
- [ ] Data loads from Supabase
- [ ] Internationalization works

### Performance Tests
- [ ] Page load time < 3s
- [ ] API responses < 200ms
- [ ] No console errors
- [ ] SSL certificate valid

### Security Tests
- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] Authentication required
- [ ] Environment variables hidden

---

## 🔍 Monitoring Setup

### Vercel Analytics (Built-in)
- Automatic performance monitoring
- Real user metrics
- Core Web Vitals tracking

### Error Tracking (Optional)
```bash
# Add Sentry for error tracking
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

---

## 🚨 Troubleshooting

### Common Issues:

**Build Fails:**
- Check TypeScript errors: `npm run typecheck`
- Verify environment variables are set
- Check Node version compatibility

**Database Connection Issues:**
- Verify Supabase URL is correct
- Check service role key is valid
- Ensure RLS policies allow access

**Authentication Not Working:**
- Verify anon key is correct
- Check Supabase Auth settings
- Verify redirect URLs configured

**Slow Performance:**
- Enable Vercel Edge Functions
- Optimize images with next/image
- Check bundle size: `npm run analyze`

---

## 📞 Quick Deploy Commands

```bash
# One-line deploy (after CLI setup)
vercel --prod

# Deploy preview branch
vercel

# Deploy with specific env
vercel --env NODE_ENV=production

# Check deployment status
vercel ls

# View logs
vercel logs harry-school-admin
```

---

## 🎯 Ready to Deploy!

**Your app is production-ready!** Choose your deployment method above and follow the steps. The entire process should take 5-10 minutes.

**Need help?** The app has been thoroughly tested and is ready for production use.