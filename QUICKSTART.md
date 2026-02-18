# OAuth Server Kit - Quick Start Guide

Get your Garmin & Fitbit OAuth playground running in 3 minutes.

## Prerequisites

- Node.js 18+
- npm or pnpm
- OAuth credentials from Garmin and/or Fitbit

## Step 1: Get OAuth Credentials

### Garmin

1. Go to https://developer.garmin.com/
2. Sign in and create a new application
3. Note your Client ID and Client Secret

### Fitbit

1. Go to https://dev.fitbit.com/apps
2. Register a new application
3. Note your Client ID and Client Secret

## Step 2: Configure the Playground

```bash
# Navigate to playground
cd apps/playground

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# Use your favorite editor (code .env, nano .env, etc.)
```

Example `.env`:

```env
DATABASE_URL="file:../../dev.db"

GARMIN_CLIENT_ID=abc123...
GARMIN_CLIENT_SECRET=xyz789...

FITBIT_CLIENT_ID=def456...
FITBIT_CLIENT_SECRET=uvw012...

NEXT_PUBLIC_BASE_URL=http://localhost:3001
```

## Step 3: Run the Playground

From the **root directory**:

```bash
npm run dev
```

This will:
- Install dependencies automatically
- Start the playground on http://localhost:3001
- Use a shared SQLite database

## Step 4: Test OAuth Flows

1. Open http://localhost:3001
2. Enter a user ID (e.g., "demo-user")
3. Click "Connect Garmin" or "Connect Fitbit"
4. **You'll get a redirect error** — that's expected! Read below.

## Step 5: Set Up Real Callbacks (Optional)

For **local testing**, OAuth callbacks won't work because providers can't reach `localhost`.

### Option A: Use ngrok (Recommended)

```bash
# In a NEW terminal (keep `npm run dev` running)
npm run dev:tunnel
```

This will:
- Start ngrok on port 3001
- Print your public URL (e.g., `https://abc123.ngrok.io`)
- Show formatted callback URLs

**Then:**

1. Copy the callback URLs from the terminal
2. Add them to your provider console:
   - **Garmin**: Developer Console → Your App → OAuth Redirect URIs
   - **Fitbit**: Application Settings → OAuth 2.0 → Redirect URL
3. Update `apps/playground/.env`:
   ```env
   NEXT_PUBLIC_BASE_URL=https://abc123.ngrok.io
   ```
4. Restart the playground (`npm run dev`)

### Option B: Deploy to Production

Deploy the playground to Vercel, Railway, or any Node.js host, then use the production URL.

## Step 6: Test Webhooks

1. Go to http://localhost:3001/webhook
2. Select a provider (Garmin or Fitbit)
3. Click "Load Example" → "Activity" or "Sleep"
4. Click "Send Webhook"
5. See the verification result and logs

## Troubleshooting

### "Port already in use"

```bash
npx kill-port 3001
```

### "Database locked"

```bash
# Windows (PowerShell)
Get-Process node | Stop-Process -Force

# Mac/Linux
pkill node
```

### "OAuth redirect URI mismatch"

Make sure:
1. `NEXT_PUBLIC_BASE_URL` in `.env` matches your actual URL
2. Callback URLs in provider consoles match exactly:
   - Garmin: `{BASE_URL}/api/auth/garmin/callback`
   - Fitbit: `{BASE_URL}/api/auth/fitbit/callback`

### "Module not found"

```bash
# From root directory
cd apps/playground
npm install
```

## Next Steps

### Use the SDK in Your App

```typescript
import { WearableSDK } from "@the-governor-hq/wearable-sdk";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sdk = new WearableSDK({
  prisma,
  providers: {
    garmin: {
      clientId: process.env.GARMIN_CLIENT_ID!,
      clientSecret: process.env.GARMIN_CLIENT_SECRET!,
      redirectUri: "https://yourapp.com/auth/garmin/callback",
    },
  },
});

// Generate auth URL
const { url } = sdk.getAuthUrl("garmin", userId);

// Handle callback
const result = await sdk.handleCallback("garmin", code, state);

// Fetch data
const activities = await sdk.getActivities("garmin", { userId });
```

### Explore the Playground Code

- **OAuth Flow**: `apps/playground/app/page.tsx`
- **API Routes**: `apps/playground/app/api/`
- **SDK Instance**: `apps/playground/lib/sdk.ts`

### Read the Docs

- [Main README](../../README.md) - Full SDK documentation
- [Playground README](../playground/README.md) - Detailed playground guide

## Commands Reference

```bash
# Start playground
npm run dev

# Start ngrok tunnel
npm run dev:tunnel

# Build SDK
npm run build

# Run tests
npm test

# Build SDK in watch mode
npm run dev:sdk
```

## Support

- 📖 Documentation: [README.md](../../README.md)
- 🐛 Issues: [GitHub Issues](https://github.com/the-governor-hq/wearable-sdk/issues)
- 💬 Questions: Open a discussion on GitHub

---

**Happy building! 🚀**
