/**
 * Next.js API routes example (App Router)
 *
 * File: app/api/auth/[provider]/callback/route.ts
 *
 * In production, extract the SDK instance into a shared module
 * (e.g. lib/wearable.ts) and import it here.
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { WearableSDK } from "@the-governor-hq/wearable-sdk";

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

// ─── GET /api/auth/[provider]/callback → exchange code for tokens ────────────
export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } },
) {
  try {
    const provider = params.provider as "garmin" | "fitbit";
    const code = request.nextUrl.searchParams.get("code")!;
    const state = request.nextUrl.searchParams.get("state")!;

    const result = await sdk.handleCallback(provider, code, state);

    // Redirect to dashboard after successful connection
    return NextResponse.redirect(
      new URL(
        `/dashboard?connected=${result.provider}&providerUserId=${result.providerUserId}`,
        request.url,
      ),
    );
  } catch (err) {
    return NextResponse.json(
      { error: "OAuth callback failed", details: String(err) },
      { status: 400 },
    );
  }
}
