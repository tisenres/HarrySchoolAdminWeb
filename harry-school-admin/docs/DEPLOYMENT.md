# Deployment Guide - Harry School CRM

## Prerequisites

- Node.js 18+ installed
- Vercel CLI installed (`npm i -g vercel`)
- Supabase project configured
- Environment variables ready

## Environment Variables

Create these environment variables in Vercel dashboard:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xlcsegukheumsadygmgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>

# Optional: For enhanced security
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
```

## Deployment Steps

### 1. Initial Setup

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login
```

### 2. First Deployment

```bash
# Link project to Vercel
vercel link

# Deploy to production
vercel --prod
```

### 3. Configure Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to Settings → Environment Variables
4. Add the required environment variables for Production

### 4. Database Setup

Ensure your Supabase database has all migrations applied:

```bash
# Apply migrations to production
npx supabase db push --db-url postgresql://postgres:[YOUR-PASSWORD]@db.xlcsegukheumsadygmgh.supabase.co:5432/postgres
```

### 5. Domain Configuration (Optional)

1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## Continuous Deployment

### GitHub Integration

1. Push code to GitHub repository
2. Connect repository in Vercel Dashboard
3. Automatic deployments on push to main branch

### Manual Deployment

```bash
# Deploy from local
vercel --prod

# Deploy specific branch
vercel --prod --scope your-team
```

## Post-Deployment Checklist

- [ ] Test authentication flow
- [ ] Verify database connectivity
- [ ] Check all API endpoints
- [ ] Test file uploads (if applicable)
- [ ] Verify email notifications
- [ ] Test all CRUD operations
- [ ] Check performance metrics
- [ ] Verify SSL certificate

## Monitoring

### Vercel Analytics

Enable in Vercel Dashboard → Analytics

### Error Tracking

Consider integrating:
- Sentry for error tracking
- LogRocket for session replay
- Datadog for APM

## Rollback Procedure

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]

# Or use Vercel Dashboard → Deployments → Instant Rollback
```

## Performance Optimization

### Build Optimization

```json
// next.config.ts additions
{
  "swcMinify": true,
  "compress": true,
  "images": {
    "domains": ["xlcsegukheumsadygmgh.supabase.co"]
  }
}
```

### Edge Functions

Configure edge runtime for API routes:

```typescript
export const runtime = 'edge'; // Add to API routes
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **API Keys**: Use different keys for dev/staging/production
3. **CORS**: Configure allowed origins
4. **Rate Limiting**: Implement API rate limiting
5. **Headers**: Security headers are configured in `vercel.json`

## Troubleshooting

### Build Failures

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Database Connection Issues

- Verify Supabase URL and keys
- Check network restrictions
- Ensure RLS policies are configured

### Performance Issues

- Enable Vercel Edge Network
- Optimize images with next/image
- Implement proper caching strategies
- Use ISR for static pages

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)