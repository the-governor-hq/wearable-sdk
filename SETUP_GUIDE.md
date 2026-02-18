# 🎮 OAuth Server Kit - Visual Setup Guide

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│              ⌚ WEARABLE SDK - OAUTH SERVER KIT                 │
│                                                                 │
│  Not just an SDK — a complete OAuth testing playground!        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 One Command to Start

```bash
npm run dev
```

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   🌐  http://localhost:3001                                    │
│                                                                 │
│   ┌─────────────────┐         ┌─────────────────┐             │
│   │                 │         │                 │             │
│   │  🏃  Connect    │         │  💪  Connect   │             │
│   │     Garmin      │         │     Fitbit     │             │
│   │                 │         │                 │             │
│   └─────────────────┘         └─────────────────┘             │
│                                                                 │
│   What you'll see:                                             │
│   ✓ Redirect URL, state, scopes                               │
│   ✓ Token exchange result                                     │
│   ✓ Stored tokens + refresh button                            │
│   ✓ Webhook tester                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 What Got Created

```
wearable-sdk/
│
├── apps/playground/          ← 🆕 NEW! Your OAuth playground
│   ├── app/
│   │   ├── page.tsx         → Main UI: OAuth buttons + token display
│   │   ├── webhook/
│   │   │   └── page.tsx     → Webhook tester
│   │   └── api/
│   │       ├── auth/[provider]/
│   │       │   ├── route.ts        → Initiate OAuth
│   │       │   └── callback/       → Handle OAuth callback
│   │       ├── tokens/
│   │       │   ├── route.ts        → List tokens
│   │       │   └── refresh/        → Refresh token endpoint
│   │       └── webhook/
│   │           └── route.ts        → Webhook handler
│   ├── lib/sdk.ts           → SDK instance (configured)
│   ├── .env                 → Your OAuth credentials
│   ├── package.json
│   └── README.md            → Detailed docs
│
├── scripts/
│   └── tunnel.js            ← 🆕 NEW! ngrok helper
│
├── QUICKSTART.md            ← 🆕 NEW! Step-by-step guide
└── package.json             → Updated with new scripts
```

## 🎯 The Flow

```
┌──────────┐
│  Setup   │  1. Get OAuth credentials from providers
└────┬─────┘  2. Add to apps/playground/.env
     │        3. npm run dev
     ▼
┌──────────┐
│   Dev    │  → Visit http://localhost:3001
└────┬─────┘  → Click "Connect Garmin" or "Connect Fitbit"
     │        → See OAuth flow in action
     ▼
┌──────────┐
│  Local   │  ⚠️ Callbacks won't work on localhost
└────┬─────┘  → Need public URL for real OAuth
     │
     ▼
┌──────────┐
│  Tunnel  │  Run: npm run dev:tunnel
└────┬─────┘  → ngrok provides public URL
     │        → Copy callback URLs to provider consoles
     │        → Update NEXT_PUBLIC_BASE_URL in .env
     ▼
┌──────────┐
│ Success! │  → Full OAuth flow works
└────┬─────┘  → Tokens stored in database
     │        → Webhook testing available
     ▼
┌──────────┐
│   Use    │  → Now use SDK in your own app
└──────────┘  → Reference playground code as example
```

## 🔑 Environment Variables

Copy `apps/playground/.env.example` to `apps/playground/.env`:

```env
# Required for OAuth
GARMIN_CLIENT_ID=________        ← Get from developer.garmin.com
GARMIN_CLIENT_SECRET=________    ← Get from developer.garmin.com
FITBIT_CLIENT_ID=________        ← Get from dev.fitbit.com
FITBIT_CLIENT_SECRET=________    ← Get from dev.fitbit.com

# Required for callbacks
NEXT_PUBLIC_BASE_URL=http://localhost:3001  ← Change to ngrok URL when tunneling

# Optional for webhooks
WEBHOOK_SECRET=________          ← For signature verification

# Database (already configured)
DATABASE_URL="file:../../dev.db"
```

## 📋 Available Commands

| Command | What It Does |
|---------|--------------|
| `npm run dev` | Start playground on port 3001 |
| `npm run dev:tunnel` | Start ngrok + print callback URLs |
| `npm run dev:sdk` | Build SDK in watch mode |
| `npm run build` | Build SDK for production |
| `npm test` | Run test suite |

## 🪝 Webhook Testing

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  http://localhost:3001/webhook                                 │
│                                                                 │
│  1. Select Provider: ( ) Garmin  (•) Fitbit                   │
│                                                                 │
│  2. Load Example:  [Activity] [Sleep]                          │
│                                                                 │
│  3. Paste Payload:                                             │
│     ┌────────────────────────────────────────────────┐        │
│     │ {                                              │        │
│     │   "userId": "demo-user",                       │        │
│     │   "activityId": "12345"                        │        │
│     │ }                                              │        │
│     └────────────────────────────────────────────────┘        │
│                                                                 │
│  4. [Send Webhook]                                             │
│                                                                 │
│  ✅ Result: Verified ✓ | Signature matched                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🎨 Features Highlights

### OAuth Flow Page (`/`)
- ✅ Two big buttons: Connect Garmin / Connect Fitbit
- ✅ Shows redirect URL, state, scopes
- ✅ Displays token exchange result
- ✅ Lists stored tokens with provider ID, expiry
- ✅ Refresh token button for each token
- ✅ Auto-refreshes token list after OAuth

### Webhook Tester (`/webhook`)
- ✅ Provider selection (Garmin/Fitbit)
- ✅ Example payload loader
- ✅ JSON payload editor
- ✅ Signature input (optional)
- ✅ Verification logs
- ✅ Success/error visual indicators

## 🔧 Troubleshooting

```
Problem: Port 3001 already in use
Solution: npx kill-port 3001

Problem: Database locked
Solution: Get-Process node | Stop-Process -Force

Problem: OAuth redirect mismatch
Solution: Check NEXT_PUBLIC_BASE_URL matches callback URL

Problem: "Cannot find module"
Solution: cd apps/playground && npm install
```

## 🎓 Learning Path

1. **Start Here**: Run `npm run dev` and explore the UI
2. **Read Code**: Check `apps/playground/app/page.tsx` for OAuth implementation
3. **Try Webhooks**: Test webhook payloads on `/webhook` page
4. **Use SDK**: Copy pattern from `lib/sdk.ts` to your app
5. **Deploy**: Use the playground as reference for production

## 📞 Support

- 📖 Docs: [README.md](README.md)
- 🚀 Quick Start: [QUICKSTART.md](QUICKSTART.md)
- 🎮 Playground: [apps/playground/README.md](apps/playground/README.md)
- 🐛 Issues: [GitHub Issues](https://github.com/the-governor-hq/wearable-sdk/issues)

---

```
 _______________
< Happy Testing! >
 ---------------
        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||
```
