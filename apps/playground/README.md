# OAuth Server Kit Playground

Interactive playground for testing Garmin & Fitbit OAuth integrations with the Wearable SDK.

## Features

- 🔐 **OAuth Flow Testing**: Connect Garmin & Fitbit with visual feedback
- 🔑 **Token Management**: View stored tokens, refresh tokens on-demand
- 🪝 **Webhook Tester**: Test webhook payloads with signature verification
- 🌐 **Tunnel Support**: Easily expose local server with ngrok
- 📊 **Real-time Logs**: See OAuth state, scopes, and callback results

## Quick Start

### 1. Set up environment variables

```bash
cd apps/playground
cp .env.example .env
```

Edit `.env` with your OAuth credentials:

```env
GARMIN_CLIENT_ID=your-garmin-client-id
GARMIN_CLIENT_SECRET=your-garmin-client-secret
FITBIT_CLIENT_ID=your-fitbit-client-id
FITBIT_CLIENT_SECRET=your-fitbit-client-secret
NEXT_PUBLIC_BASE_URL=http://localhost:3001
```

### 2. Run the playground

From the root directory:

```bash
npm run dev
```

This will:
- Install dependencies
- Start the playground on http://localhost:3001
- Use the shared database at `dev.db`

### 3. Test OAuth flows

1. Open http://localhost:3001
2. Enter a user ID (e.g., "demo-user")
3. Click "Connect Garmin" or "Connect Fitbit"
4. Complete the OAuth flow
5. See stored tokens and refresh them

## Using with ngrok (for real callbacks)

To test with actual Garmin/Fitbit callbacks, you need a public URL:

### Option 1: npm run dev:tunnel

```bash
# In a separate terminal
npm run dev:tunnel
```

This will:
- Start ngrok tunnel on port 3001
- Print the public URL
- Show formatted callback URLs to configure in provider consoles

### Option 2: Manual ngrok

```bash
ngrok http 3001
```

Then update `.env`:

```env
NEXT_PUBLIC_BASE_URL=https://your-ngrok-url.ngrok.io
```

## Webhook Testing

1. Navigate to http://localhost:3001/webhook
2. Select provider (Garmin or Fitbit)
3. Load an example payload or paste your own
4. Send the webhook
5. See verification results and logs

### Webhook Signature Verification

Set `WEBHOOK_SECRET` in `.env` to enable signature verification:

```env
WEBHOOK_SECRET=your-webhook-secret
```

The webhook handler will verify:
- Garmin: `X-Garmin-Signature` header (HMAC-SHA256)
- Fitbit: `X-Fitbit-Signature` header (HMAC-SHA1)

## File Structure

```
apps/playground/
├── app/
│   ├── page.tsx              # OAuth flow UI
│   ├── webhook/
│   │   └── page.tsx          # Webhook tester UI
│   ├── layout.tsx            # Layout with navigation
│   ├── globals.css           # Styles
│   └── api/
│       ├── auth/
│       │   └── [provider]/
│       │       ├── route.ts           # Initiate OAuth
│       │       └── callback/
│       │           └── route.ts       # Handle OAuth callback
│       ├── tokens/
│       │   ├── route.ts               # List tokens
│       │   └── refresh/
│       │       └── route.ts           # Refresh token
│       └── webhook/
│           └── route.ts               # Webhook handler
├── lib/
│   └── sdk.ts                # SDK instance
├── .env                      # Environment variables
├── package.json
└── README.md
```

## Configuration in Provider Consoles

### Garmin

1. Go to https://developer.garmin.com/
2. Create an application
3. Set OAuth callback URL:
   - Local: `http://localhost:3001/api/auth/garmin/callback`
   - Tunnel: `https://your-ngrok-url.ngrok.io/api/auth/garmin/callback`
4. Copy Client ID and Client Secret to `.env`

### Fitbit

1. Go to https://dev.fitbit.com/apps
2. Create an application
3. Set OAuth 2.0 Redirect URL:
   - Local: `http://localhost:3001/api/auth/fitbit/callback`
   - Tunnel: `https://your-ngrok-url.ngrok.io/api/auth/fitbit/callback`
4. Set Webhook Subscription URL (optional):
   - `https://your-ngrok-url.ngrok.io/api/webhook`
5. Copy Client ID and Client Secret to `.env`

## Tips

- Use different user IDs to test multiple accounts
- Refresh tokens to test token refresh logic
- Check the browser console for detailed logs
- Use the webhook tester to verify your webhook handler before deploying
- The playground shares the same database as your main app (useful for testing)

## Troubleshooting

**Port already in use:**
```bash
# Kill the process using port 3001
npx kill-port 3001
```

**Database locked:**
```bash
# Stop all Node processes
Get-Process node | Stop-Process -Force
```

**OAuth redirect mismatch:**
- Make sure `NEXT_PUBLIC_BASE_URL` matches your actual URL
- Check that callback URLs in provider consoles match exactly

## Next Steps

Once you've tested the OAuth flows:
1. Use the SDK in your own app (see main README)
2. Deploy your app with proper OAuth callbacks
3. Set up webhook endpoints for real-time data

## Support

For issues and questions:
- GitHub Issues: https://github.com/the-governor-hq/wearable-sdk/issues
- Documentation: https://github.com/the-governor-hq/wearable-sdk
