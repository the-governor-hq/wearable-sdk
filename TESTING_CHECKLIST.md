# OAuth Server Kit - Testing Checklist

Use this checklist to verify the playground is working correctly.

## Pre-Flight Checks

```bash
npm run check
```

Should pass or show warnings (not errors).

## Basic Setup Tests

### ✅ Installation
- [ ] `npm install` in root directory completes successfully
- [ ] `cd apps/playground && npm install` completes successfully
- [ ] No build errors

### ✅ Configuration
- [ ] `.env` file exists in `apps/playground/`
- [ ] All required environment variables are set:
  - `GARMIN_CLIENT_ID`
  - `GARMIN_CLIENT_SECRET`
  - `FITBIT_CLIENT_ID`
  - `FITBIT_CLIENT_SECRET`
  - `NEXT_PUBLIC_BASE_URL`
- [ ] Database file `dev.db` exists (run `npx prisma db push` if not)

### ✅ Startup
- [ ] `npm run dev` starts without errors
- [ ] Playground opens at http://localhost:3001
- [ ] No console errors in browser
- [ ] Navigation works (OAuth Flow ↔ Webhook Tester)

## OAuth Flow Tests

### ✅ UI Elements
- [ ] User ID input field is visible
- [ ] "Connect Garmin" button is visible and styled (blue)
- [ ] "Connect Fitbit" button is visible and styled (teal)
- [ ] Page layout is responsive

### ✅ Local OAuth Initiation (will fail at callback)
- [ ] Enter a user ID (e.g., "test-user")
- [ ] Click "Connect Garmin"
- [ ] OAuth state details appear:
  - [ ] Provider name shown
  - [ ] State parameter shown
  - [ ] Scopes list shown
  - [ ] Redirect URL shown
- [ ] Browser redirects to Garmin login page
- [ ] After login, redirect fails (expected - callback URL is localhost)

### ✅ With ngrok Tunnel
- [ ] Run `npm run dev:tunnel` in separate terminal
- [ ] ngrok URL is printed
- [ ] Callback URLs are printed
- [ ] Add callback URLs to provider consoles:
  - [ ] Garmin Developer Console
  - [ ] Fitbit Developer Console
- [ ] Update `NEXT_PUBLIC_BASE_URL` in `.env` to ngrok URL
- [ ] Restart playground
- [ ] Click "Connect Garmin" or "Connect Fitbit"
- [ ] Complete OAuth flow
- [ ] Callback succeeds ✅
- [ ] Success message appears
- [ ] Tokens automatically appear in "Stored Tokens" section

### ✅ Token Management
- [ ] Stored tokens section shows:
  - [ ] Provider name
  - [ ] User ID and Provider User ID
  - [ ] Truncated access token
  - [ ] Truncated refresh token (if available)
  - [ ] Expiry time
  - [ ] Scopes
  - [ ] "Refresh Token" button
- [ ] Click "Refresh Token" button
- [ ] Token refreshes successfully (or shows error if not supported)
- [ ] Click "Refresh List" button
- [ ] Token list updates

## Webhook Tester Tests

### ✅ UI Elements
- [ ] Navigate to /webhook
- [ ] Webhook endpoint URL is shown
- [ ] "Copy" button works
- [ ] Provider selection (Garmin/Fitbit) works
- [ ] "Load Example" buttons work:
  - [ ] Activity loads correct JSON
  - [ ] Sleep loads correct JSON
- [ ] Payload textarea is editable
- [ ] Signature input field is visible
- [ ] "Send Webhook" button is visible

### ✅ Webhook Sending
- [ ] Select provider (Garmin)
- [ ] Click "Load Example" → "Activity"
- [ ] Click "Send Webhook"
- [ ] Webhook log appears with:
  - [ ] Timestamp
  - [ ] ✅ or ❌ indicator
  - [ ] Provider name
  - [ ] Payload display
- [ ] Repeat for Fitbit
- [ ] Repeat for Sleep type

### ✅ Signature Verification (Optional)
- [ ] Set `WEBHOOK_SECRET` in `.env`
- [ ] Restart playground
- [ ] Send webhook with correct signature
- [ ] Verify ✅ appears
- [ ] Send webhook with wrong signature
- [ ] Verify ❌ appears

### ✅ Logs
- [ ] Multiple webhooks create multiple log entries
- [ ] Logs show newest first
- [ ] "Clear Logs" button works
- [ ] Logs persist during session

## Error Handling Tests

### ✅ Navigation
- [ ] Go to /nonexistent-page
- [ ] Custom 404 page appears
- [ ] Links back to home work

### ✅ Missing Configuration
- [ ] Remove OAuth credentials from `.env`
- [ ] Try to initiate OAuth
- [ ] Error message appears (should fail gracefully)
- [ ] Restore credentials

### ✅ Network Errors
- [ ] Stop the playground server
- [ ] Try to refresh tokens from a saved page
- [ ] Error is handled gracefully

## Integration Tests

### ✅ Multiple Users
- [ ] Connect with user ID "user-1"
- [ ] Connect with user ID "user-2"
- [ ] Both tokens appear when filtering by user ID
- [ ] Tokens stored correctly in database

### ✅ Multiple Providers
- [ ] Connect both Garmin and Fitbit for same user
- [ ] Both tokens appear in list
- [ ] Each has correct provider name
- [ ] Refresh works for both

### ✅ Database Inspection
```bash
npx prisma studio
```
- [ ] Opens at http://localhost:5555
- [ ] `WearableToken` table exists
- [ ] Tokens from playground are visible
- [ ] All fields populated correctly

## Performance Tests

### ✅ Load Time
- [ ] Initial page load < 2 seconds
- [ ] OAuth initiation < 1 second
- [ ] Token refresh < 3 seconds
- [ ] Webhook send < 1 second

### ✅ Responsiveness
- [ ] UI responsive on mobile (or small browser window)
- [ ] Buttons are tappable
- [ ] Code blocks scroll horizontally
- [ ] No layout breaks

## Documentation Tests

### ✅ README Files
- [ ] Main [README.md](../README.md) mentions playground
- [ ] [QUICKSTART.md](../QUICKSTART.md) is clear and accurate
- [ ] [apps/playground/README.md](../apps/playground/README.md) is comprehensive
- [ ] [SETUP_GUIDE.md](../SETUP_GUIDE.md) is helpful

### ✅ Code Examples
- [ ] Code samples in docs are correct
- [ ] Environment variable examples work
- [ ] Command examples run without errors

## Production Readiness Tests

### ✅ Build
```bash
cd apps/playground
npm run build
```
- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] No Next.js build warnings

### ✅ Production Start
```bash
npm run start
```
- [ ] Starts successfully
- [ ] All features work in production mode

### ✅ Type Safety
```bash
npm run typecheck
```
- [ ] No TypeScript errors in SDK
- [ ] No TypeScript errors in playground

## Cleanup Tests

### ✅ Disconnect
- [ ] Implement disconnect UI (future feature)
- [ ] Or manually delete tokens from database
- [ ] Tokens are removed
- [ ] Re-connection works

## Success Criteria

All checkboxes above should be checked ✅ for a fully working OAuth Server Kit.

## Troubleshooting

If any test fails, refer to:
- [QUICKSTART.md](../QUICKSTART.md) - Setup instructions
- [apps/playground/README.md](../apps/playground/README.md) - Playground docs
- [SETUP_GUIDE.md](../SETUP_GUIDE.md) - Visual guide

## Report Issues

If you find bugs:
1. Note which test(s) failed
2. Capture error messages
3. Open an issue: https://github.com/the-governor-hq/wearable-sdk/issues

---

**Happy Testing! 🧪**
