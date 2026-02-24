# @the-governor-hq/wearable-sdk

Ship wearable OAuth in 15 minutes.

TypeScript-first SDK for connecting to Garmin, Fitbit, and more. One `npm install`, three API calls, done.

Includes a runnable **OAuth Server Kit** playground for instant testing.

---

## Try It Now

```bash
npm run dev
```

<img height="361" alt="image" src="https://github.com/user-attachments/assets/feaa5f99-dca6-4c57-b4b8-d55d9717b0b9" />
<img height="361" alt="image" src="https://github.com/user-attachments/assets/c878d00b-a370-4c9f-b442-8db17ea492d6" />

Opens an interactive playground at http://localhost:3001 with:
- **Big OAuth buttons** — Connect Garmin / Fitbit instantly
- **Visual flow** — See redirect URLs, state, scopes, token results
- **Token management** — View stored tokens + refresh button
- **Webhook tester** — Paste payloads, verify signatures, see handler logs

**With ngrok tunnel:**
```bash
npm run dev:tunnel  # Exposes local server + prints callback URLs
```

---

## Features

- **Passport.js-like DX** — Strategy pattern per provider, one-line Prisma storage
- **Prisma-first storage** — Pass your `PrismaClient`, tokens persist to any database Prisma supports
- **OAuth 2.0 + PKCE** — Secure authorization flows out of the box
- **Auto token refresh** — Tokens refresh transparently before they expire
- **Normalized data** — Activities, sleep, dailies in a consistent schema
- **Raw data preserved** — Every response includes the original provider payload
- **2-month backfill** — One call to fetch historical data
- **Zero dependencies** (almost) — Only `zod` in production
- **ESM + CJS** — Works everywhere
- **Interactive Playground** — Test OAuth flows without writing code

---

## Table of Contents

- [Quick Start](#quick-start)
- [Express Example](#express-example)
- [API Reference](#api-reference)
- [Normalized Data Types](#normalized-data-types)
- [Token Storage (Prisma)](#token-storage-prisma)
- [Sub-path Imports](#sub-path-imports)
- [Playground Setup](#playground-setup)
- [Webhook Testing](#webhook-testing)
- [Provider Notes](#provider-notes)
- [Architecture](#architecture)
- [Commands Reference](#commands-reference)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

```bash
npm install @the-governor-hq/wearable-sdk
```

### 1. Add the token model to your Prisma schema

Copy the model from [`prisma/wearable-token.prisma`](prisma/wearable-token.prisma) into your `schema.prisma`, then run:

```bash
npx prisma migrate dev --name add-wearable-tokens
```

### 2. Initialize the SDK with your PrismaClient

```typescript
import { PrismaClient } from "@prisma/client";
import { WearableSDK } from "@the-governor-hq/wearable-sdk";

const prisma = new PrismaClient();

const sdk = new WearableSDK({
  prisma,                    // ← that's it, tokens persist to your DB
  providers: {
    garmin: {
      clientId: process.env.GARMIN_CLIENT_ID!,
      clientSecret: process.env.GARMIN_CLIENT_SECRET!,
      redirectUri: "http://localhost:3000/auth/garmin/callback",
    },
    fitbit: {
      clientId: process.env.FITBIT_CLIENT_ID!,
      clientSecret: process.env.FITBIT_CLIENT_SECRET!,
      redirectUri: "http://localhost:3000/auth/fitbit/callback",
    },
  },
});

// 1. Generate auth URL → redirect user to provider consent screen
const { url, state } = sdk.getAuthUrl("garmin", "user-123");

// 2. Handle callback → tokens saved automatically
const result = await sdk.handleCallback("garmin", code, state);

// 3. Fetch data — tokens refresh automatically
const activities = await sdk.getActivities("garmin", {
  userId: "user-123",
  startDate: "2024-01-01",
  endDate: "2024-01-31",
});
```

---

## Express Example

```typescript
import express from "express";
import { PrismaClient } from "@prisma/client";
import { WearableSDK } from "@the-governor-hq/wearable-sdk";

const prisma = new PrismaClient();

const sdk = new WearableSDK({
  prisma,
  debug: true,
  providers: {
    garmin: {
      clientId: process.env.GARMIN_CLIENT_ID!,
      clientSecret: process.env.GARMIN_CLIENT_SECRET!,
      redirectUri: "http://localhost:3000/auth/garmin/callback",
    },
  },
});

const app = express();

// Connect — redirect to Garmin
app.get("/auth/garmin", (req, res) => {
  const { url } = sdk.getAuthUrl("garmin", "demo-user");
  res.redirect(url);
});

// Callback — exchange code for tokens
app.get("/auth/garmin/callback", async (req, res) => {
  const result = await sdk.handleCallback(
    "garmin",
    req.query.code as string,
    req.query.state as string,
  );
  res.json({ connected: result.provider });
});

// Fetch activities
app.get("/activities", async (req, res) => {
  const data = await sdk.getActivities("garmin", {
    userId: "demo-user",
    startDate: "2024-01-01",
  });
  res.json(data);
});

app.listen(3000);
```

---

## API Reference

### `WearableSDK`

```typescript
new WearableSDK(config: WearableSDKConfig)
```

| Option | Type | Description |
|--------|------|-------------|
| `providers` | `ProvidersConfig` | Provider credentials (garmin, fitbit) |
| `prisma` | `PrismaClient` | Prisma client for token persistence (recommended) |
| `tokenStore` | `TokenStore` | Custom store (overrides `prisma`) |
| `debug` | `boolean` | Enable console logging |
| `logger` | `SDKLogger` | Custom logger |

### OAuth Flow

```typescript
// Generate authorization URL
sdk.getAuthUrl(provider, userId): { url, state }

// Handle OAuth callback
await sdk.handleCallback(provider, code, state): CallbackResult

// Manually refresh tokens
await sdk.refreshTokens(provider, userId): OAuthTokens
```

### Data Fetching

```typescript
// Activities (workouts)
await sdk.getActivities(provider, { userId, startDate?, endDate? })

// Sleep sessions
await sdk.getSleep(provider, { userId, startDate?, endDate? })

// Daily summaries (steps, HR, etc.)
await sdk.getDailies(provider, { userId, startDate?, endDate? })

// Backfill 2 months of history
await sdk.backfill(provider, {
  userId,
  daysBack: 60,
  dataTypes: ["activities", "sleep", "dailies"],
})
```

### Connection Management

```typescript
// Check connection health
await sdk.getConnectionHealth(provider, userId)

// Check all providers
await sdk.getConnectionHealthAll(userId)

// Disconnect
await sdk.disconnect(provider, userId)
await sdk.disconnectAll(userId)
```

---

## Normalized Data Types

### `NormalizedActivity`

```typescript
{
  id: string;
  provider: "garmin" | "fitbit";
  type: string;           // "run", "bike", "swim", "walk", ...
  startTime: string;      // ISO 8601
  endTime: string;
  durationSeconds: number;
  calories?: number;
  distanceMeters?: number;
  steps?: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  source?: string;
  raw: unknown;           // Original provider payload
}
```

### `NormalizedSleep`

```typescript
{
  id: string;
  provider: "garmin" | "fitbit";
  date: string;           // YYYY-MM-DD
  startTime: string;
  endTime: string;
  durationSeconds: number;
  deepSleepSeconds?: number;
  lightSleepSeconds?: number;
  remSleepSeconds?: number;
  awakeSeconds?: number;
  sleepScore?: number;
  stages?: SleepStage[];
  raw: unknown;
}
```

### `NormalizedDaily`

```typescript
{
  id: string;
  provider: "garmin" | "fitbit";
  date: string;          // YYYY-MM-DD
  steps?: number;
  calories?: number;
  distanceMeters?: number;
  activeMinutes?: number;
  restingHeartRate?: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  stressLevel?: number;
  floorsClimbed?: number;
  raw: unknown;
}
```

---

## Token Storage (Prisma)

The SDK uses **Prisma** as its storage abstraction — one client handles Postgres, MySQL, SQLite, MongoDB, or any datasource Prisma supports.

### Setup

1. Copy the model from [`prisma/wearable-token.prisma`](prisma/wearable-token.prisma) into your schema:

```prisma
model WearableToken {
  userId       String
  provider     String
  accessToken  String @db.Text
  refreshToken String? @db.Text
  expiresAt    String?
  scopes       String?
  raw          String? @db.Text
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@id([userId, provider])
  @@map("wearable_tokens")
}
```

2. Migrate:

```bash
npx prisma migrate dev --name add-wearable-tokens
```

3. Pass your `PrismaClient`:

```typescript
import { PrismaClient } from "@prisma/client";
import { WearableSDK } from "@the-governor-hq/wearable-sdk";

const prisma = new PrismaClient();
const sdk = new WearableSDK({ prisma, providers: { /* ... */ } });
```

### Custom Token Store

If you don't use Prisma, implement the `TokenStore` interface directly:

```typescript
import type { TokenStore, OAuthTokens, ProviderName } from "@the-governor-hq/wearable-sdk";

class MyTokenStore implements TokenStore {
  async save(userId: string, provider: ProviderName, tokens: OAuthTokens) { /* ... */ }
  async get(userId: string, provider: ProviderName): Promise<OAuthTokens | null> { /* ... */ }
  async delete(userId: string, provider: ProviderName): Promise<void> { /* ... */ }
  async has(userId: string, provider: ProviderName): Promise<boolean> { /* ... */ }
}

const sdk = new WearableSDK({
  tokenStore: new MyTokenStore(), // overrides prisma
  providers: { /* ... */ },
});
```

### Dev / Testing

With no `prisma` or `tokenStore`, the SDK falls back to an in-memory store (with a console warning). Fine for quick prototyping — tokens are lost on restart.

---

## Sub-path Imports

```typescript
// Main SDK
import { WearableSDK } from "@the-governor-hq/wearable-sdk";

// Stores (Prisma, Memory, or bring your own)
import { PrismaTokenStore, MemoryTokenStore } from "@the-governor-hq/wearable-sdk/stores";

// Just Garmin provider
import { GarminProvider } from "@the-governor-hq/wearable-sdk/garmin";

// Just Fitbit provider
import { FitbitProvider } from "@the-governor-hq/wearable-sdk/fitbit";
```

---

## Playground Setup

The SDK ships with an interactive Next.js playground for testing OAuth flows without writing code.

### Prerequisites

- Node.js 18+
- OAuth credentials from Garmin and/or Fitbit

### Get OAuth Credentials

**Garmin:**
1. Go to https://developer.garmin.com/
2. Sign in and create a new application
3. Note your Client ID and Client Secret

**Fitbit:**
1. Go to https://dev.fitbit.com/apps
2. Register a new application
3. Note your Client ID and Client Secret

### Configure

```bash
cd apps/playground
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="file:../../dev.db"

GARMIN_CLIENT_ID=abc123...
GARMIN_CLIENT_SECRET=xyz789...

FITBIT_CLIENT_ID=def456...
FITBIT_CLIENT_SECRET=uvw012...

NEXT_PUBLIC_BASE_URL=http://localhost:3001
```

### Run

From the root directory:

```bash
npm run dev
```

Opens http://localhost:3001 — enter a user ID, click Connect, and follow the OAuth flow.

### Enable Real Callbacks with ngrok

OAuth providers can't reach `localhost`, so you need a tunnel for real flows:

```bash
# In a separate terminal
npm run dev:tunnel
```

This will print:
```
Public URL:      https://abc123.ngrok.io
Garmin callback: https://abc123.ngrok.io/api/auth/garmin/callback
Fitbit callback: https://abc123.ngrok.io/api/auth/fitbit/callback
Webhook URL:     https://abc123.ngrok.io/api/webhook
```

Then:
1. Copy the callback URLs from the terminal
2. Add them to your provider consoles:
   - **Garmin**: Developer Console → Your App → OAuth Redirect URIs
   - **Fitbit**: Application Settings → OAuth 2.0 → Redirect URL
3. Update `NEXT_PUBLIC_BASE_URL` in `.env` to the ngrok URL
4. Restart the playground

### Playground File Structure

```
apps/playground/
├── app/
│   ├── page.tsx              # OAuth flow UI
│   ├── webhook/page.tsx      # Webhook tester UI
│   ├── layout.tsx            # Layout with navigation
│   └── api/
│       ├── auth/[provider]/
│       │   ├── route.ts             # Initiate OAuth
│       │   └── callback/route.ts    # Handle OAuth callback
│       ├── tokens/
│       │   ├── route.ts             # List tokens
│       │   └── refresh/route.ts     # Refresh token
│       └── webhook/route.ts         # Webhook handler
├── lib/sdk.ts                # Configured SDK instance
└── .env                      # Your credentials
```

---

## Webhook Testing

1. Navigate to http://localhost:3001/webhook
2. Select a provider (Garmin or Fitbit)
3. Click "Load Example" → Activity or Sleep
4. Click "Send Webhook"
5. See the verification result and logs

### Signature Verification

Set `WEBHOOK_SECRET` in `.env` to enable:

```env
WEBHOOK_SECRET=your-webhook-secret
```

The handler verifies:
- **Garmin**: `X-Garmin-Signature` header (HMAC-SHA256)
- **Fitbit**: `X-Fitbit-Signature` header (HMAC-SHA1)

---

## Provider Notes

### Garmin

- Requires a **Garmin Connect Developer** account
- Uses OAuth 2.0 + PKCE (code challenge S256)
- Authorization URL: `https://connect.garmin.com/oauth2Confirm`
- Token URL: `https://diauth.garmin.com/di-oauth2-service/oauth/token`
- API access requires legal entity / enterprise approval
- Supports webhooks for real-time push notifications

### Fitbit

- Free public API — register at [dev.fitbit.com](https://dev.fitbit.com)
- Uses OAuth 2.0 with Basic Auth + optional PKCE
- Rate limit: 150 requests/hour (personal apps)
- Sleep data available via v1.2 API

---

## Architecture

```
src/
├── index.ts            # Barrel exports
├── sdk.ts              # WearableSDK main class
├── types/              # TypeScript types for everything
├── core/
│   ├── base-provider.ts    # Abstract strategy class
│   ├── errors.ts           # Error hierarchy
│   ├── http-client.ts      # Fetch + retries + rate-limit
│   └── token-store.ts      # TokenStore interface
├── providers/
│   ├── garmin/             # Garmin OAuth + Wellness API
│   └── fitbit/             # Fitbit OAuth + Web API
├── stores/
│   └── memory-store.ts     # In-memory store (dev/test)
└── utils/
    ├── pkce.ts             # PKCE generation
    └── logger.ts           # Logger utilities
```

---

## Commands Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start playground (port 3001) |
| `npm run dev:tunnel` | Start ngrok + print callback URLs |
| `npm run dev:sdk` | Build SDK in watch mode |
| `npm run build` | Build SDK for production |
| `npm test` | Run test suite |
| `npm run typecheck` | TypeScript check |
| `npm run check` | Verify setup is correct |

---

## Troubleshooting

**Port already in use:**
```bash
npx kill-port 3001
```

**Database locked:**
```bash
# Windows
Get-Process node | Stop-Process -Force
# Mac/Linux
pkill node
```

**OAuth redirect URI mismatch:**
- Ensure `NEXT_PUBLIC_BASE_URL` in `.env` matches your actual URL
- Callback URLs in provider consoles must match exactly

**Module not found:**
```bash
cd apps/playground && npm install
```

---

## Acknowledgements

This SDK was built with the assistance of AI tools, including **Claude Opus 4.6**, **Claude Sonnet 4.5**, and **Gemini 3.0**.

## License

MIT — The Governor HQ
