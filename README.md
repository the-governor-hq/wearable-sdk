# @the-governor-hq/wearable-sdk

> **Work in progress.** This SDK is under active development and not yet intended for public or production use.

Ship wearable OAuth in 15 minutes.

TypeScript-first SDK for connecting to Garmin, Fitbit, and more. One `npm install`, three API calls, done.

**NEW:** 🎮 **OAuth Server Kit** — Not just an SDK! Includes a runnable playground for instant testing.

---

**👉 [GET STARTED NOW](GET_STARTED.md)** | [Quick Start](QUICKSTART.md) | [Setup Guide](SETUP_GUIDE.md) | [Playground Docs](apps/playground/README.md)

---

## ⚡ Try It Now

```bash
npm run dev
```
<img height="361" alt="image" src="https://github.com/user-attachments/assets/feaa5f99-dca6-4c57-b4b8-d55d9717b0b9" />
<img height="361" alt="image" src="https://github.com/user-attachments/assets/c878d00b-a370-4c9f-b442-8db17ea492d6" />

Opens an interactive playground at http://localhost:3001 with:
- **Big OAuth buttons** → Connect Garmin / Fitbit instantly
- **Visual flow** → See redirect URLs, state, scopes, token results
- **Token management** → View stored tokens + refresh button
- **Webhook tester** → Paste payloads, verify signatures, see handler logs

**With ngrok tunnel:**
```bash
npm run dev:tunnel  # Exposes local server + prints callback URLs
```

➡️ [Full Playground Documentation](apps/playground/README.md)

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
- **🎮 Interactive Playground** — Test OAuth flows without writing code

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

## Express Example (~50 lines)

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

### Advanced: Custom Token Store

If you don't use Prisma, you can implement the `TokenStore` interface directly:

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

## 📚 Documentation

- **[Quick Start Guide](QUICKSTART.md)** — Get up and running in 3 minutes
- **[Setup Guide](SETUP_GUIDE.md)** — Visual setup guide with diagrams
- **[Playground README](apps/playground/README.md)** — Detailed playground documentation
- **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)** — Technical overview of what was built

## Provider Notes

### Garmin

- Requires a **Garmin Connect Developer** account
- Uses OAuth 2.0 + PKCE (code challenge S256)
- API access requires legal entity / enterprise approval
- Supports webhooks for real-time push notifications

### Fitbit

- Free public API — register at [dev.fitbit.com](https://dev.fitbit.com)
- Uses OAuth 2.0 with Basic Auth + optional PKCE
- Rate limit: 150 requests/hour (personal apps)
- Sleep data available via v1.2 API

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
## Acknowledgements

This SDK was built with the assistance of AI tools, including **Claude Opus 4.6**, **Claude Sonnet 4.5**, and **Gemini 3.0**.

## License

MIT — The Governor HQ



