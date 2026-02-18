import type { OAuthTokens, ProviderName } from "../types/index.js";
import type { TokenStore } from "../core/token-store.js";

// ---------------------------------------------------------------------------
// Minimal Prisma type contract — no dependency on @prisma/client.
//
// We only need a client that has a model with these CRUD methods.
// This works with ANY Prisma-generated client that includes the
// `WearableToken` model from our schema snippet.
// ---------------------------------------------------------------------------

/** The shape of a row in the wearable_tokens table */
export interface WearableTokenRow {
  userId: string;
  provider: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
  scope: string | null;
  tokenType: string;
  updatedAt: Date;
}

/**
 * Minimal Prisma delegate contract.
 *
 * We type it loosely so it works with any version of @prisma/client
 * without importing it as a dependency.
 */
export interface PrismaWearableTokenDelegate {
  upsert(args: {
    where: { userId_provider: { userId: string; provider: string } };
    create: Omit<WearableTokenRow, "updatedAt">;
    update: Omit<WearableTokenRow, "userId" | "provider" | "updatedAt">;
  }): Promise<unknown>;

  findUnique(args: {
    where: { userId_provider: { userId: string; provider: string } };
  }): Promise<WearableTokenRow | null>;

  delete(args: {
    where: { userId_provider: { userId: string; provider: string } };
  }): Promise<unknown>;

  count(args: {
    where: { userId: string; provider: string };
  }): Promise<number>;
}

/**
 * Any Prisma client that has a `wearableToken` model.
 *
 * ```ts
 * import { PrismaClient } from "@prisma/client";
 * import { PrismaTokenStore } from "@the-governor-hq/wearable-sdk/stores";
 *
 * const prisma = new PrismaClient();
 * const store = new PrismaTokenStore(prisma);
 * ```
 */
export interface PrismaClientLike {
  wearableToken: PrismaWearableTokenDelegate;
}

// ---------------------------------------------------------------------------
// PrismaTokenStore — production-ready, database-agnostic token storage.
//
// Works with Postgres, MySQL, SQLite, MongoDB — any Prisma datasource.
// ---------------------------------------------------------------------------

/**
 * Prisma-backed token store.
 *
 * **This is the recommended store for production.**
 *
 * 1. Copy the schema from `prisma/wearable-token.prisma` into your Prisma schema
 * 2. Run `npx prisma migrate dev`
 * 3. Pass your PrismaClient:
 *
 * ```ts
 * import { PrismaClient } from "@prisma/client";
 * import { WearableSDK } from "@the-governor-hq/wearable-sdk";
 * import { PrismaTokenStore } from "@the-governor-hq/wearable-sdk/stores";
 *
 * const prisma = new PrismaClient();
 *
 * const sdk = new WearableSDK({
 *   tokenStore: new PrismaTokenStore(prisma),
 *   providers: { ... },
 * });
 * ```
 */
export class PrismaTokenStore implements TokenStore {
  private delegate: PrismaWearableTokenDelegate;

  constructor(prismaClient: PrismaClientLike) {
    this.delegate = prismaClient.wearableToken;
  }

  async save(userId: string, provider: ProviderName, tokens: OAuthTokens): Promise<void> {
    const data = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      scope: tokens.scope,
      tokenType: tokens.tokenType,
    };

    await this.delegate.upsert({
      where: { userId_provider: { userId, provider } },
      create: { userId, provider, ...data },
      update: data,
    });
  }

  async get(userId: string, provider: ProviderName): Promise<OAuthTokens | null> {
    const row = await this.delegate.findUnique({
      where: { userId_provider: { userId, provider } },
    });

    if (!row) return null;

    return {
      accessToken: row.accessToken,
      refreshToken: row.refreshToken,
      expiresAt: new Date(row.expiresAt),
      scope: row.scope,
      tokenType: row.tokenType,
    };
  }

  async delete(userId: string, provider: ProviderName): Promise<void> {
    try {
      await this.delegate.delete({
        where: { userId_provider: { userId, provider } },
      });
    } catch {
      // Row may not exist — ignore P2025 (Record not found)
    }
  }

  async has(userId: string, provider: ProviderName): Promise<boolean> {
    const count = await this.delegate.count({
      where: { userId, provider },
    });
    return count > 0;
  }
}
