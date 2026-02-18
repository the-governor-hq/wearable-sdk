/**
 * Next.js API routes example (App Router)
 *
 * File: app/api/auth/[provider]/route.ts
 *
 * Setup:
 *   1. Copy prisma/wearable-token.prisma into your schema.prisma
 *   2. npx prisma migrate dev --name add-wearable-tokens
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { WearableSDK } from "@the-governor-hq/wearable-sdk";

// Initialize once — reuse across requests
const prisma = new PrismaClient();

const sdk = new WearableSDK({
  prisma,
  providers: {
    garmin: {
      clientId: process.env.GARMIN_CLIENT_ID!,
      clientSecret: process.env.GARMIN_CLIENT_SECRET!,
      redirectUri: `${process.env.NEXT_PUBLIC_URL}/api/auth/garmin/callback`,
    },
    fitbit: {
      clientId: process.env.FITBIT_CLIENT_ID!,
      clientSecret: process.env.FITBIT_CLIENT_SECRET!,
      redirectUri: `${process.env.NEXT_PUBLIC_URL}/api/auth/fitbit/callback`,
    },
  },
});

// ─── GET /api/auth/[provider] → redirect to consent screen ──────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } },
) {
  const provider = params.provider as "garmin" | "fitbit";

  // In production, get userId from your auth session (e.g. NextAuth)
  const userId = request.nextUrl.searchParams.get("userId") ?? "demo-user";

  const { url } = sdk.getAuthUrl(provider, userId);
  return NextResponse.redirect(url);
}
