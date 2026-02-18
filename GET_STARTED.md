# 🚀 Getting Started - OAuth Server Kit

Your Wearable SDK is now a complete **OAuth Server Kit**!

## What's New?

✅ **Interactive Playground** - Full Next.js app for testing OAuth flows  
✅ **Visual OAuth Testing** - See every step of the authentication process  
✅ **Token Management UI** - View and refresh tokens with one click  
✅ **Webhook Tester** - Test webhook payloads and signature verification  
✅ **Tunnel Support** - One command to expose your local server via ngrok  
✅ **Comprehensive Docs** - 5 detailed guides to help you get started  

## Quick Start (3 Steps)

### Step 1: Configure

```bash
cd apps/playground
cp .env.example .env
```

Edit `.env` with your OAuth credentials:
- Get Garmin credentials from: https://developer.garmin.com/
- Get Fitbit credentials from: https://dev.fitbit.com/apps

### Step 2: Run

```bash
npm run dev
```

Opens the playground at: **http://localhost:3001**

### Step 3: Test

1. Enter a user ID
2. Click "Connect Garmin" or "Connect Fitbit"
3. See the OAuth flow in action!

**Note:** For real OAuth callbacks, you'll need a public URL. See Step 4 below.

## Optional Step 4: Enable Real Callbacks

For OAuth callbacks to work, providers need to reach your server:

```bash
# In a separate terminal
npm run dev:tunnel
```

This will:
- Start ngrok tunnel
- Print your public URL
- Show formatted callback URLs

Then:
1. Copy the callback URLs
2. Add them to your provider console
3. Update `NEXT_PUBLIC_BASE_URL` in `.env`
4. Restart the playground

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Detailed setup guide
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Visual guide with diagrams  
- **[apps/playground/README.md](apps/playground/README.md)** - Playground reference
- **[TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)** - Verify everything works
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Technical details

## 🎯 What You Can Do

### OAuth Flow Page (`/`)
- ✅ Connect Garmin or Fitbit with big buttons
- ✅ See redirect URL, state, scopes in real-time
- ✅ View token exchange results
- ✅ Manage stored tokens
- ✅ Refresh tokens with one click

### Webhook Tester (`/webhook`)
- ✅ Test webhook payloads
- ✅ Verify signatures (HMAC-SHA256 for Garmin, HMAC-SHA1 for Fitbit)
- ✅ See handler logs
- ✅ Load example payloads

## 📋 Available Commands

| Command | What It Does |
|---------|--------------|
| `npm run dev` | Start playground (port 3001) |
| `npm run dev:tunnel` | Start ngrok + print URLs |
| `npm run check` | Verify setup is correct |
| `npm run build` | Build SDK for production |
| `npm test` | Run test suite |

## 🔧 Pre-Flight Check

Before starting, run:

```bash
npm run check
```

This verifies:
- ✅ Node.js version (18+)
- ✅ Playground directory exists
- ✅ `.env` file is configured
- ✅ Database is ready

## 🎨 File Structure

```
wearable-sdk/
├── apps/
│   └── playground/          ← 🆕 NEW! OAuth testing playground
│       ├── app/
│       │   ├── page.tsx            (OAuth UI)
│       │   ├── webhook/page.tsx    (Webhook tester)
│       │   └── api/               (API routes)
│       └── lib/sdk.ts              (SDK instance)
│
├── scripts/
│   ├── tunnel.js            ← 🆕 NEW! ngrok helper
│   └── check-setup.js       ← 🆕 NEW! Setup verifier
│
├── QUICKSTART.md            ← 🆕 NEW! Setup guide
├── SETUP_GUIDE.md           ← 🆕 NEW! Visual guide
├── TESTING_CHECKLIST.md     ← 🆕 NEW! Test checklist
└── IMPLEMENTATION_SUMMARY.md ← 🆕 NEW! Tech overview
```

## 🎓 Learning Path

1. **Start:** Run `npm run dev` and explore the UI
2. **Configure:** Add OAuth credentials to `.env`
3. **Test:** Try the OAuth flow with ngrok
4. **Learn:** Read the code in `apps/playground/`
5. **Use:** Integrate the SDK into your own app

## 💡 Tips

- Use different user IDs to test multiple accounts
- Check browser console for detailed logs
- Test webhooks before deploying
- Reference playground code for production apps
- The playground shares the same database as your SDK

## 🐛 Troubleshooting

### Port Already in Use
```bash
npx kill-port 3001
```

### Database Locked
```bash
Get-Process node | Stop-Process -Force
```

### OAuth Redirect Mismatch
Make sure `NEXT_PUBLIC_BASE_URL` matches your actual URL and provider console settings.

### Module Not Found
```bash
cd apps/playground && npm install
```

## 🎉 Success!

If you see this when you run `npm run dev`:

```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3001
  - Ready in Xs
```

You're ready to test OAuth! 🚀

## 📞 Need Help?

- 📖 Read the docs (links above)
- 🐛 Check [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)
- 💬 Open an issue: https://github.com/the-governor-hq/wearable-sdk/issues

---

**Built with ❤️ by The Governor HQ**

Enjoy your OAuth Server Kit! 🎮
