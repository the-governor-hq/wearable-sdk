/**
 * Express.js example — Garmin + Fitbit OAuth in ~50 lines
 *
 * Setup:
 *   1. Copy prisma/wearable-token.prisma into your schema.prisma
 *   2. npx prisma migrate dev --name add-wearable-tokens
 *   3. npx tsx examples/express/server.ts
 *
 * Requires: express, @prisma/client, @the-governor-hq/wearable-sdk
 */

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
    fitbit: {
      clientId: process.env.FITBIT_CLIENT_ID!,
      clientSecret: process.env.FITBIT_CLIENT_SECRET!,
      redirectUri: "http://localhost:3000/auth/fitbit/callback",
    },
  },
});

const app = express();

// ─── Connect ─────────────────────────────────────────────────────────────────
// GET /auth/:provider → redirect to provider consent screen
app.get("/auth/:provider", (req, res) => {
  const provider = req.params.provider as "garmin" | "fitbit";
  const userId = req.query.userId as string ?? "demo-user";

  const { url } = sdk.getAuthUrl(provider, userId);
  res.redirect(url);
});

// ─── Callback ────────────────────────────────────────────────────────────────
// GET /auth/:provider/callback → exchange code for tokens
app.get("/auth/:provider/callback", async (req, res) => {
  try {
    const provider = req.params.provider as "garmin" | "fitbit";
    const { code, state } = req.query as { code: string; state: string };

    const result = await sdk.handleCallback(provider, code, state);
    res.json({
      message: `Connected to ${result.provider}!`,
      providerUserId: result.providerUserId,
    });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

// ─── Fetch Data ──────────────────────────────────────────────────────────────
// GET /data/:provider/activities?userId=...&startDate=...&endDate=...
app.get("/data/:provider/activities", async (req, res) => {
  try {
    const provider = req.params.provider as "garmin" | "fitbit";
    const { userId, startDate, endDate } = req.query as Record<string, string>;

    const activities = await sdk.getActivities(provider, {
      userId,
      startDate,
      endDate,
    });
    res.json(activities);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

// ─── Backfill ────────────────────────────────────────────────────────────────
// POST /data/:provider/backfill?userId=...
app.post("/data/:provider/backfill", async (req, res) => {
  try {
    const provider = req.params.provider as "garmin" | "fitbit";
    const userId = req.query.userId as string;

    const data = await sdk.backfill(provider, {
      userId,
      daysBack: 60, // 2 months
    });

    res.json({
      activities: data.activities.length,
      sleep: data.sleep.length,
      dailies: data.dailies.length,
    });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

// ─── Connection Health ───────────────────────────────────────────────────────
app.get("/health/:userId", async (req, res) => {
  const health = await sdk.getConnectionHealthAll(req.params.userId);
  res.json(health);
});

app.listen(3000, () => {
  console.log("🚀 Wearable SDK demo running on http://localhost:3000");
  console.log("");
  console.log("Connect Garmin:  http://localhost:3000/auth/garmin?userId=demo");
  console.log("Connect Fitbit:  http://localhost:3000/auth/fitbit?userId=demo");
});
