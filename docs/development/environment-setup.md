# Environment Setup Guide

This guide explains how to configure environment variables for the Token Toilet Web3 DeFi application.

## Quick Setup

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Set required variables:**
   - `NEXT_PUBLIC_APP_URL`: Your application URL (use `http://localhost:3000` for development)
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: Get this from [WalletConnect Cloud](https://cloud.walletconnect.com)

3. **Start the development server:**
   ```bash
   pnpm dev
   ```

## Environment Variables Reference

### Required Variables

#### `NEXT_PUBLIC_APP_URL`
- **Type**: URL string
- **Description**: The base URL of your application
- **Development**: `http://localhost:3000`
- **Production**: `https://your-domain.com`
- **Validation**: Must be a valid URL format

#### `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- **Type**: Hex string (32+ characters)
- **Description**: WalletConnect v2 project identifier
- **How to get**: Visit [WalletConnect Cloud](https://cloud.walletconnect.com)
- **Validation**: Must be a valid hexadecimal string

### Optional RPC Endpoint Overrides

By default, the application uses public RPC endpoints. You can override these for better performance:

#### `NEXT_PUBLIC_ETHEREUM_RPC_URL`
- **Default**: Public Ethereum RPC
- **Example**: `https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY`
- **Providers**: Alchemy, Infura, Ankr, etc.

#### `NEXT_PUBLIC_POLYGON_RPC_URL`
- **Default**: Public Polygon RPC
- **Example**: `https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY`

#### `NEXT_PUBLIC_ARBITRUM_RPC_URL`
- **Default**: Public Arbitrum RPC
- **Example**: `https://arb-mainnet.g.alchemy.com/v2/YOUR_API_KEY`

### Optional Feature Flags

#### `NEXT_PUBLIC_ENABLE_ANALYTICS`
- **Type**: Boolean string ("true" or "false")
- **Default**: "true"
- **Description**: Enables analytics tracking through WalletConnect

#### `NEXT_PUBLIC_ENABLE_TESTNETS`
- **Type**: Boolean string ("true" or "false")
- **Default**: "false"
- **Description**: Enables testnet networks for development

## Environment Validation

The application uses [@t3-oss/env-nextjs](https://env.t3.gg/) for environment variable validation:

- **Automatic validation**: Variables are validated at build time and runtime
- **Type safety**: All environment variables are properly typed
- **Error handling**: Clear error messages for invalid or missing variables

### Skipping Validation

For testing or CI environments, you can skip validation:

```bash
SKIP_ENV_VALIDATION=true pnpm build
```

## RPC Provider Setup

### Alchemy Setup
1. Visit [Alchemy Dashboard](https://dashboard.alchemy.com/)
2. Create a new app for each network (Ethereum, Polygon, Arbitrum)
3. Copy the HTTP URLs to your `.env.local`

### Infura Setup
1. Visit [Infura Dashboard](https://infura.io/dashboard)
2. Create a new project
3. Enable Ethereum, Polygon, and Arbitrum networks
4. Use the provided endpoints

### Rate Limiting Considerations
- Public RPCs have rate limits
- For production, use dedicated RPC providers
- Consider implementing retry logic for RPC failures

## Security Best Practices

### Environment Files
- **Never commit** `.env.local` or `.env` files to version control
- Use `.env.example` for documentation only
- Store sensitive values in your deployment platform's environment variables

### RPC Security
- **Always use HTTPS** for RPC endpoints in production
- **Rotate API keys** regularly
- **Monitor usage** to detect unusual activity

### WalletConnect Security
- **Keep Project ID public** - it's safe to expose
- **Monitor project usage** in WalletConnect Cloud dashboard
- **Rotate Project ID** if compromised

## Deployment Configurations

### Vercel
Set environment variables in the Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add all required `NEXT_PUBLIC_*` variables

### Production Checklist
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain
- [ ] `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` configured
- [ ] Custom RPC endpoints configured (recommended)
- [ ] Analytics enabled (`NEXT_PUBLIC_ENABLE_ANALYTICS=true`)
- [ ] Testnets disabled (`NEXT_PUBLIC_ENABLE_TESTNETS=false`)

## Troubleshooting

### Common Issues

#### "Environment validation failed"
- Check all required variables are set
- Verify WalletConnect Project ID format (must be hex)
- Ensure URLs use proper format (http/https)

#### "WalletConnect connection failed"
- Verify `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is correct
- Check project is active in WalletConnect Cloud
- Ensure domain is added to allowed origins

#### "RPC connection failed"
- Verify custom RPC URLs are accessible
- Check API keys are valid and not expired
- Test RPC endpoints independently

### Getting Help

1. **Check the browser console** for detailed error messages
2. **Verify environment variables** are loaded correctly
3. **Test with default settings** (remove custom RPC URLs)
4. **Review the example configuration** in `.env.example`

## Related Files

- `env.ts` - Environment validation schema
- `lib/web3/config.ts` - Web3 configuration using environment variables
- `.env.example` - Example environment configuration
- `.gitignore` - Ensures environment files aren't committed
