# Vercel Deployment Configuration Guide

This guide explains how to set up Token Toilet for deployment on Vercel with proper staging and production environments.

## Overview

Token Toilet uses Vercel for deployment with the following environment strategy:

- **Production Environment**: `main` branch deployments → `tokentoilet.vercel.app`
- **Staging Environment**: Pull request deployments → Preview URLs with staging configuration
- **Development Environment**: Local development → `localhost:3000`

## Project Configuration

### vercel.json

The `vercel.json` file configures:

- Build commands using pnpm
- Security headers for production deployment
- Git deployment settings for main and staging branches
- Health check endpoint routing

### Environment Variables

Environment variables are managed through three approaches:

1. **Vercel Project Settings** (Recommended)
   - Configure sensitive variables in Vercel dashboard
   - Set different values for Production, Preview, and Development environments
   - Use for API keys, secrets, and environment-specific URLs

2. **Environment Files** (Reference/Backup)
   - `.env.production` - Production environment reference
   - `.env.staging` - Staging environment reference
   - `.env.example` - Template with all available variables

3. **Build-time Configuration**
   - `NEXT_BUILD_ENV_*` variables control build optimization
   - Automatically set based on deployment environment

## Required Environment Variables

### Essential Variables (Must Set in Vercel)

```bash
# Application URL
NEXT_PUBLIC_APP_URL=https://tokentoilet.vercel.app  # Production
NEXT_PUBLIC_APP_URL=https://tokentoilet-staging.vercel.app  # Preview

# WalletConnect Project ID (same for both environments)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### Optional RPC Overrides

```bash
# Ethereum Mainnet
NEXT_PUBLIC_ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Polygon Mainnet
NEXT_PUBLIC_POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Arbitrum One
NEXT_PUBLIC_ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

### Feature Flags by Environment

**Production:**
```bash
NEXT_PUBLIC_ENABLE_TESTNET_MODE=false
NEXT_PUBLIC_ENABLE_DEBUG_MODE=false
NEXT_PUBLIC_VERCEL_ENV=production
NEXT_PUBLIC_VERCEL_TARGET_ENV=production
```

**Staging/Preview:**
```bash
NEXT_PUBLIC_ENABLE_TESTNET_MODE=true
NEXT_PUBLIC_ENABLE_DEBUG_MODE=true
NEXT_PUBLIC_VERCEL_ENV=preview
NEXT_PUBLIC_VERCEL_TARGET_ENV=staging
```

## Deployment Setup

### 1. Vercel Project Setup

1. **Connect Repository**: Link GitHub repository to Vercel
2. **Framework Detection**: Vercel auto-detects Next.js
3. **Build Settings**:
   - Build Command: `pnpm build` (configured in vercel.json)
   - Install Command: `pnpm bootstrap` (configured in vercel.json)
   - Output Directory: `.next` (Next.js default)

### 2. Environment Variable Configuration

Navigate to Project Settings → Environment Variables:

**Production Environment:**
- Set production values for all required variables
- Use production RPC endpoints and URLs
- Disable debug modes

**Preview Environment:**
- Set staging values for development-friendly configuration
- Enable debug and testnet modes for testing
- Use staging RPC endpoints if available

**Development Environment:**
- Set local development values
- Enable all debug features
- Use local URLs and development endpoints

### 3. Branch Configuration

The vercel.json configuration enables:
- **Automatic deployments** for `main` branch → Production
- **Preview deployments** for all pull requests → Staging
- **Manual deployments** disabled for other branches

### 4. Security Configuration

Production deployments include security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## CI/CD Integration

The GitHub Actions pipeline integrates with Vercel deployments:

1. **Quality Gates**: Linting, type checking, testing, security audit
2. **Build Verification**: Production build with artifact upload
3. **Deployment Readiness**: All checks must pass before deployment
4. **Environment-Specific Deployments**: Automatic staging for PRs, production for main

## Monitoring and Debugging

### Vercel Analytics

Enable analytics in Vercel dashboard for:
- Performance monitoring
- Error tracking
- User engagement metrics

### Environment Detection

The application can detect its environment using:

```typescript
// Environment detection
const isProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
const isStaging = process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV === 'staging'
const isPreview = process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'

// Feature flags based on environment
const enableDebugMode = process.env.NEXT_PUBLIC_ENABLE_DEBUG_MODE === 'true'
const enableTestnetMode = process.env.NEXT_PUBLIC_ENABLE_TESTNET_MODE === 'true'
```

### Debugging Deployment Issues

1. **Build Failures**: Check build logs in Vercel dashboard
2. **Environment Variables**: Verify all required variables are set
3. **RPC Connectivity**: Test RPC endpoints from deployment environment
4. **Type Errors**: Ensure TypeScript compilation passes locally
5. **Dependency Issues**: Verify pnpm bootstrap works correctly

## Best Practices

### Environment Variable Management

1. **Use Vercel Dashboard**: Set sensitive variables through Vercel UI
2. **Environment-Specific Values**: Different values for production/preview
3. **Validation**: All variables validated through Zod schemas in `env.ts`
4. **Documentation**: Keep .env.example updated with all variables

### Deployment Workflow

1. **Development**: Local development with .env.local
2. **Feature Branches**: Create PR for automatic staging deployment
3. **Review**: Test staging deployment before merging
4. **Production**: Merge to main for automatic production deployment
5. **Monitoring**: Check deployment health and performance

### Security Considerations

1. **Environment Isolation**: Separate staging and production configurations
2. **Secret Management**: Use Vercel's secure environment variable storage
3. **RPC Security**: Use dedicated RPC endpoints for production
4. **Header Security**: Security headers automatically applied in production
5. **Access Control**: Proper GitHub permissions for deployment secrets

## Troubleshooting

### Common Issues

**Build Failures:**
- Check pnpm cache and dependencies
- Verify TypeScript compilation
- Ensure environment variables are set

**Runtime Errors:**
- Validate environment variable values
- Check RPC endpoint connectivity
- Verify WalletConnect configuration

**Performance Issues:**
- Monitor Vercel analytics
- Check RPC response times
- Optimize build configuration

### Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Environment Variables Guide](../development/environment-setup.md)
- [GitHub Actions Workflow](.github/workflows/ci.yaml)
