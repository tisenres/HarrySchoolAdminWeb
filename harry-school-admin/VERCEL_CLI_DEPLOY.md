# 🚀 Vercel CLI Deployment Guide

## Quick Commands (Run these in Terminal)

### 1️⃣ Fix NPM Permissions
```bash
sudo chown -R $(whoami) ~/.npm
```
*Enter your password when prompted*

### 2️⃣ Install Vercel CLI
```bash
npm install -g vercel
```

### 3️⃣ Login to Vercel
```bash
vercel login
```
*This will open a browser window - sign in with your account*

### 4️⃣ Navigate to Project Directory
```bash
cd /Users/fayzullolutpillayev/Desktop/HarrySchoolAdminWeb/harry-school-admin
```

### 5️⃣ Build the Application
```bash
npm run build
```

### 6️⃣ Deploy to Production
```bash
vercel --prod
```

**Follow the prompts:**
- ✅ Set up and deploy? **Y**
- ✅ Which scope? **[Select your account]**
- ✅ Link to existing project? **N**
- ✅ What's your project's name? **harry-school-admin**
- ✅ In which directory is your code located? **./** (just press Enter)
- ✅ Want to modify settings? **Y**

**Configure these settings:**
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`
- Development Command: `npm run dev`

### 7️⃣ Add Environment Variables
When prompted, add these environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xlcsegukheumsadygmgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsY3NlZ3VraGV1bXNhZHlnbWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzOTM5NzksImV4cCI6MjA2OTk2OTk3OX0.kyHG8NazZruZu_pImGLMO8zFQvo--U6nwBqHbUEHBYE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsY3NlZ3VraGV1bXNhZHlnbWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM5Mzk3OSwiZXhwIjoyMDY5OTY5OTc5fQ.hWgaYpSST_kClaO8-KHlWXGAH6_FOonXO9Ke_b6Xaac
NODE_ENV=production
```

---

## 🎯 Alternative: One-Command Deploy

If you want to use the deployment script I created:

```bash
./deploy.sh
```

---

## 📱 What Happens Next?

1. **Build Process**: Vercel will build your Next.js app (~2-3 minutes)
2. **Deployment**: App gets deployed to global CDN
3. **URL Generated**: You'll get a URL like `https://harry-school-admin-xxx.vercel.app`
4. **SSL**: Automatic HTTPS certificate

---

## ✅ Post-Deployment Testing

Test these URLs (replace with your actual domain):

1. **Homepage**: `https://your-app.vercel.app/en`
2. **Login**: `https://your-app.vercel.app/en/login`
3. **API Health**: `https://your-app.vercel.app/api/teachers` (should return 401)

---

## 🚨 Troubleshooting

**If build fails:**
```bash
# Check build locally first
npm run build

# If successful locally but fails on Vercel, check:
# 1. Environment variables are set correctly
# 2. All dependencies are in package.json
```

**If authentication doesn't work:**
```bash
# Verify environment variables in Vercel dashboard
vercel env ls

# Or check in dashboard: vercel.com → your project → Settings → Environment Variables
```

---

## 🎉 Ready to Deploy!

**Start with command #1 above and follow the steps. Your app will be live in ~5 minutes!**