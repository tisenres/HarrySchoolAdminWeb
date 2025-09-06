# Harry School CRM - Educational Management System

A comprehensive educational management ecosystem for Harry School in Tashkent.

## 🏗️ Project Structure

This repository uses a **monorepo structure** containing multiple applications:

```
HarrySchoolAdminWeb/
├── src/                    # Admin Panel (Next.js)
├── mobile/                 # React Native Apps
├── docs/                   # General Documentation
├── admin-docs/             # Admin Panel Specific Documentation
├── admin-tests/            # Admin Panel Tests
├── database/               # Database schemas and migrations
├── supabase/              # Supabase configuration
├── scripts/               # Build and deployment scripts
├── public/                # Static assets
├── package.json           # Main project dependencies
└── README.md              # This file
```

## 🚀 Admin Panel (Root Level)

The Next.js admin application is located at the root level:

- **Source Code**: `/src`
- **Configuration**: Root level files (next.config.ts, tailwind.config.ts, etc.)
- **Build**: `npm run build`
- **Development**: `npm run dev`
- **Testing**: `npm test`

## 📱 Mobile Applications

Located in `/mobile` directory:
- Teacher App
- Student App

## 🛠️ Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Environment**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## 📚 Documentation

- **General Documentation**: `/docs`
- **Admin Panel Documentation**: `/admin-documentation`
- **Development Guide**: `/CLAUDE.md`
- **Mobile Apps Documentation**: `/mobile/docs`

## 🧪 Testing

- **Unit Tests**: `npm test`
- **E2E Tests**: `npm run test:e2e`
- **Linting**: `npm run lint`

## 🚢 Deployment

- **Admin Panel**: Deployed on Vercel
- **Mobile Apps**: Built with EAS Build (Expo)

For detailed deployment instructions, see `/admin-documentation/DEPLOYMENT_CHECKLIST.md`

## 🔧 Development

This project uses:
- **Next.js 14+** with App Router
- **TypeScript** for type safety
- **Supabase** for backend services
- **Tailwind CSS** with shadcn/ui components
- **ESLint & Prettier** for code quality

See `/CLAUDE.md` for comprehensive development guidelines.