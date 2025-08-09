# CI/CD Pipeline Documentation

## Overview

This document describes the Continuous Integration and Continuous Deployment (CI/CD) pipeline for the Harry School CRM project. Our pipeline ensures code quality, runs comprehensive tests, and automates deployments while maintaining high security and reliability standards.

## Pipeline Architecture

### Workflow Triggers

The CI/CD pipeline is triggered by:

- **Push Events**: To `main` and `develop` branches
- **Pull Requests**: Against `main` and `develop` branches
- **Manual Triggers**: For hotfix deployments
- **Scheduled Runs**: Daily security scans and dependency updates

### Pipeline Stages

```mermaid
graph TD
    A[Code Push/PR] --> B[Quality Checks]
    B --> C[Unit & Integration Tests]
    B --> D[Build Verification]
    B --> E[Database Migration Check]
    B --> F[Security Scan]
    
    C --> G[E2E Tests]
    D --> G
    E --> G
    F --> G
    
    G --> H{Branch Check}
    H -->|develop| I[Deploy to Staging]
    H -->|main| J[Deploy to Production]
    
    I --> K[Staging Tests]
    J --> L[Production Monitoring]
    
    K --> M[Notifications]
    L --> M
```

## Stage Details

### 1. Quality Checks

**Purpose**: Ensure code quality and consistency

**Components**:
- TypeScript type checking
- ESLint code quality analysis
- Prettier formatting verification
- Security vulnerability scan

**Configuration**:
```yaml
quality:
  name: "Code Quality & Standards"
  runs-on: ubuntu-latest
  steps:
    - name: "TypeScript type checking"
      run: npm run type-check
    - name: "ESLint code quality check"
      run: npm run lint:strict
    - name: "Prettier code formatting check"
      run: npm run format:check
    - name: "Security audit"
      run: npm run security
```

**Exit Criteria**:
- ✅ No TypeScript errors
- ✅ No ESLint violations
- ✅ Code properly formatted
- ✅ No high-severity security vulnerabilities

### 2. Unit & Integration Tests

**Purpose**: Verify code functionality and component integration

**Test Matrix**:
- Node.js versions: 18, 20
- Test types: Unit, Integration, Component
- Coverage requirement: 90%

**Configuration**:
```yaml
test:
  strategy:
    matrix:
      node-version: ["18", "20"]
  steps:
    - name: "Run unit and integration tests"
      run: npm run test:ci
    - name: "Upload test coverage"
      uses: codecov/codecov-action@v4
```

**Exit Criteria**:
- ✅ All tests pass
- ✅ Test coverage ≥ 90%
- ✅ No test timeouts or flaky tests

### 3. Build Verification

**Purpose**: Ensure application builds successfully

**Process**:
1. Install dependencies
2. Build Next.js application
3. Verify build artifacts
4. Upload build for E2E tests

**Configuration**:
```yaml
build:
  steps:
    - name: "Build application"
      run: npm run build
      env:
        NEXT_TELEMETRY_DISABLED: 1
    - name: "Upload build artifacts"
      uses: actions/upload-artifact@v4
```

**Exit Criteria**:
- ✅ Build completes without errors
- ✅ All pages render correctly
- ✅ Bundle size within limits

### 4. Database Migration Check

**Purpose**: Validate database schema changes

**Components**:
- PostgreSQL service setup
- Supabase CLI configuration
- Migration syntax validation
- Migration execution test

**Configuration**:
```yaml
database:
  services:
    postgres:
      image: postgres:15
      env:
        POSTGRES_PASSWORD: postgres
        POSTGRES_DB: harry_school_test
  steps:
    - name: "Check migration syntax"
      run: supabase db lint
    - name: "Test migrations"
      run: supabase db reset --db-url $DATABASE_URL
```

**Exit Criteria**:
- ✅ Migration syntax is valid
- ✅ Migrations execute successfully
- ✅ Database constraints are satisfied

### 5. Security Scan

**Purpose**: Identify security vulnerabilities

**Scans**:
- Dependency vulnerabilities (npm audit)
- Code security analysis (CodeQL)
- Infrastructure security (GitHub Security)

**Configuration**:
```yaml
security:
  steps:
    - name: "Run security audit"
      run: npm run security
    - name: "Run CodeQL Analysis"
      uses: github/codeql-action/analyze@v3
```

**Exit Criteria**:
- ✅ No critical security vulnerabilities
- ✅ CodeQL analysis passes
- ✅ Dependencies are up to date

### 6. End-to-End Tests

**Purpose**: Verify complete user workflows

**Test Coverage**:
- Authentication flows
- CRUD operations for all entities
- Multi-language support
- Responsive design
- Accessibility compliance

**Browser Matrix**:
- Chrome, Firefox, Safari
- Desktop and mobile viewports

**Configuration**:
```yaml
e2e:
  steps:
    - name: "Install Puppeteer browsers"
      run: npx puppeteer install --with-deps
    - name: "Run E2E tests"
      run: npm run test:e2e
```

**Exit Criteria**:
- ✅ All critical user paths work
- ✅ Cross-browser compatibility verified
- ✅ Mobile responsiveness confirmed

## Deployment Strategies

### Staging Deployment (develop branch)

**Trigger**: Automatic on merge to `develop`

**Environment**: `staging.harry-school-crm.com`

**Process**:
1. Deploy to Vercel staging environment
2. Run smoke tests
3. Update staging database
4. Notify team via Slack

**Configuration**:
```yaml
deploy-staging:
  if: github.ref == 'refs/heads/develop'
  environment: staging
  steps:
    - name: "Deploy to Vercel Staging"
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

### Production Deployment (main branch)

**Trigger**: Automatic on merge to `main` (with approval gate)

**Environment**: `harry-school-crm.com`

**Process**:
1. Manual approval required
2. Deploy to Vercel production
3. Database migration (if needed)
4. Health checks and monitoring
5. Rollback capability

**Configuration**:
```yaml
deploy-production:
  if: github.ref == 'refs/heads/main'
  environment: production
  steps:
    - name: "Deploy to Vercel Production"
      uses: amondnet/vercel-action@v25
      with:
        vercel-args: "--prod"
```

## Environment Configuration

### Environment Variables

#### Staging Environment
```bash
NODE_ENV=staging
NEXT_PUBLIC_SUPABASE_URL=https://xlcsegukheumsadygmgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsY3NlZ3VraGV1bXNhZHlnbWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzOTM5NzksImV4cCI6MjA2OTk2OTk3OX0.kyHG8NazZruZu_pImGLMO8zFQvo--U6nwBqHbUEHBYE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsY3NlZ3VraGV1bXNhZHlnbWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM5Mzk3OSwiZXhwIjoyMDY5OTY5OTc5fQ.hWgaYpSST_kClaO8-KHlWXGAH6_FOonXO9Ke_b6Xaac
NEXT_PUBLIC_APP_URL=https://staging.harry-school-crm.com
```

#### Production Environment
```bash
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://xlcsegukheumsadygmgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsY3NlZ3VraGV1bXNhZHlnbWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzOTM5NzksImV4cCI6MjA2OTk2OTk3OX0.kyHG8NazZruZu_pImGLMO8zFQvo--U6nwBqHbUEHBYE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsY3NlZ3VraGV1bXNhZHlnbWdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM5Mzk3OSwiZXhwIjoyMDY5OTY5OTc5fQ.hWgaYpSST_kClaO8-KHlWXGAH6_FOonXO9Ke_b6Xaac
NEXT_PUBLIC_APP_URL=https://harry-school-crm.com
```

### Secrets Management

**GitHub Secrets**:
- `VERCEL_TOKEN`: Vercel deployment token
- `ORG_ID`: Vercel organization ID
- `PROJECT_ID`: Vercel project ID
- `TEAM_ID`: Vercel team ID
- `SUPABASE_ACCESS_TOKEN`: Supabase management token
- `SLACK_WEBHOOK_URL`: Notifications webhook

**Security Best Practices**:
- Rotate secrets every 90 days
- Use least-privilege access
- Audit secret usage regularly

- Never log secret values

## Monitoring and Alerting

### Health Checks

**Application Health**:
- API endpoint availability
- Database connectivity
- Authentication service
- Background job processing

**Infrastructure Health**:
- Response time monitoring
- Error rate tracking
- Resource utilization
- Security incident detection

### Alerts Configuration

**Critical Alerts** (Immediate notification):
- Application downtime
- Database connection failures
- Security breaches
- Deployment failures

**Warning Alerts** (15-minute delay):
- High error rates
- Slow response times
- Resource usage spikes
- Test failures

**Info Alerts** (Hourly digest):
- Successful deployments
- Performance metrics
- Usage statistics

### Notification Channels

```yaml
notifications:
  slack:
    channels:
      - "#dev-alerts" (Critical)
      - "#dev-general" (Warning/Info)
  email:
    recipients:
      - "tech-lead@company.com"
      - "devops@company.com"
```

## Performance Monitoring

### Key Metrics

**Core Web Vitals**:
- Largest Contentful Paint (LCP) < 2.5s
- First Input Delay (FID) < 100ms
- Cumulative Layout Shift (CLS) < 0.1

**Application Metrics**:
- API response times
- Database query performance
- Bundle size tracking
- Memory usage

**Business Metrics**:
- User engagement
- Feature adoption
- Error rates by feature
- Performance by user segment

### Performance Gates

**Build-time Checks**:
- Bundle size increase > 5% (Warning)
- Bundle size increase > 10% (Failure)
- Unused code detection
- Performance budget enforcement

**Runtime Monitoring**:
- Real User Monitoring (RUM)
- Synthetic monitoring
- Error tracking
- Performance regression detection

## Rollback Procedures

### Automatic Rollback

**Triggers**:
- Health check failures
- Error rate > 5%
- Critical security alerts
- Database connection failures

**Process**:
1. Detect failure condition
2. Trigger rollback workflow
3. Deploy previous stable version
4. Verify system health
5. Notify team

### Manual Rollback

**Scenarios**:
- Business-critical bugs
- Data corruption issues
- Security vulnerabilities
- Performance degradation

**Commands**:
```bash
# Emergency rollback
./scripts/rollback.sh --version=v1.2.1 --environment=production

# Gradual rollback (canary)
./scripts/rollback.sh --version=v1.2.1 --percentage=50
```

## Quality Gates

### Pre-merge Gates

1. **Code Quality**: ESLint, Prettier, TypeScript
2. **Test Coverage**: ≥ 90% coverage required
3. **Security**: No high/critical vulnerabilities
4. **Performance**: Bundle size within limits
5. **Documentation**: Updated for new features

### Pre-deployment Gates

1. **All Tests Pass**: Unit, integration, E2E
2. **Security Scan**: Clean security report
3. **Database Migration**: Successfully tested
4. **Performance**: No significant regressions
5. **Manual Approval**: For production deployments

### Post-deployment Gates

1. **Health Checks**: All services operational
2. **Performance**: Metrics within thresholds  
3. **Error Rates**: Below acceptable limits
4. **User Feedback**: No critical issues reported

## Troubleshooting

### Common CI/CD Issues

#### Build Failures

**Symptoms**:
- TypeScript compilation errors
- Missing dependencies
- Configuration issues

**Solutions**:
```bash
# Check dependencies
npm ci
npm run type-check

# Verify configuration
npm run build:debug
```

#### Test Failures

**Symptoms**:
- Flaky tests
- Environment issues
- Timeout errors

**Solutions**:
```bash
# Run tests locally
npm run test:verbose
npm run test:debug

# Check test environment
npm run test:ci -- --verbose
```

#### Deployment Issues

**Symptoms**:
- Vercel deployment failures
- Environment variable issues
- Database migration errors

**Solutions**:
```bash
# Check deployment logs
vercel logs harry-school-crm

# Verify environment variables
vercel env ls

# Test migrations locally
supabase db reset --local
```

### Performance Issues

#### Slow Build Times

**Optimizations**:
- Use npm ci instead of npm install
- Leverage build caching
- Optimize Docker layers
- Parallel job execution

#### Failed E2E Tests

**Debugging**:
- Check Puppeteer traces
- Review screenshot artifacts
- Verify test environment setup
- Analyze network requests

## Maintenance

### Regular Tasks

**Weekly**:
- Review CI/CD metrics
- Update dependencies
- Security scan reports
- Performance optimization

**Monthly**:
- Rotate secrets
- Review and update documentation
- Analyze deployment success rates
- Optimize pipeline performance

**Quarterly**:
- Review and update CI/CD strategy
- Evaluate new tools and services
- Conduct post-mortem reviews
- Update disaster recovery procedures

### Cost Optimization

**Strategies**:
- Use efficient build caching
- Optimize test execution time
- Right-size runner instances
- Monitor resource usage

**Cost Monitoring**:
- Track GitHub Actions minutes
- Monitor Vercel usage
- Review third-party service costs
- Implement cost alerts

## Security Considerations

### Pipeline Security

**Access Control**:
- Branch protection rules
- Required reviews
- Admin restrictions
- Audit logging

**Secret Management**:
- Encrypted storage
- Limited access scope
- Regular rotation
- Usage monitoring

### Supply Chain Security

**Dependencies**:
- Dependency scanning
- License compliance
- Version pinning
- Security advisories

**Build Environment**:
- Isolated build environments
- Reproducible builds
- Artifact signing
- Provenance tracking

## Future Improvements

### Planned Enhancements

**Short-term** (Next 3 months):
- Implement blue-green deployments
- Add canary deployment support
- Enhance monitoring dashboards
- Improve rollback automation

**Medium-term** (Next 6 months):
- Multi-region deployment
- Advanced performance monitoring
- Automated security patching
- Infrastructure as Code

**Long-term** (Next 12 months):
- AI-powered testing
- Predictive deployment analysis
- Advanced chaos engineering
- Zero-downtime migrations

### Metrics and KPIs

**Success Metrics**:
- Deployment frequency: Target 2-3 deployments/week
- Lead time: Target < 4 hours
- MTTR (Mean Time to Recovery): Target < 30 minutes
- Change failure rate: Target < 5%

**Quality Metrics**:
- Build success rate: Target > 95%
- Test pass rate: Target > 98%
- Security scan pass rate: Target 100%
- Performance regression rate: Target < 2%