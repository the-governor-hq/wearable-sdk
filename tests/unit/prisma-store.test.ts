import { describe, it, expect, beforeEach, vi } from "vitest";
import { PrismaTokenStore } from "../../src/stores/prisma-store.js";
import type { PrismaClientLike, WearableTokenRow } from "../../src/stores/prisma-store.js";
import type { OAuthTokens, ProviderName } from "../../src/types/index.js";

// ---------------------------------------------------------------------------
// Mock Prisma client — simulates the wearableToken delegate in memory
// ---------------------------------------------------------------------------

function createMockPrismaClient(): PrismaClientLike {
  const rows = new Map<string, WearableTokenRow>();

  const key = (userId: string, provider: string) => `${provider}::${userId}`;

  return {
    wearableToken: {
      upsert: vi.fn(async (args) => {
        const { userId, provider } = args.where.userId_provider;
        const k = key(userId, provider);
        const existing = rows.get(k);
        if (existing) {
          const updated = { ...existing, ...args.update, updatedAt: new Date() };
          rows.set(k, updated);
          return updated;
        }
        const created = { ...args.create, createdAt: new Date(), updatedAt: new Date() };
        rows.set(k, created as WearableTokenRow);
        return created;
      }),

      findUnique: vi.fn(async (args) => {
        const { userId, provider } = args.where.userId_provider;
        return rows.get(key(userId, provider)) ?? null;
      }),

      delete: vi.fn(async (args) => {
        const { userId, provider } = args.where.userId_provider;
        const k = key(userId, provider);
        if (!rows.has(k)) {
          throw Object.assign(new Error("Record not found"), { code: "P2025" });
        }
        rows.delete(k);
        return {};
      }),

      count: vi.fn(async (args) => {
        const { userId, provider } = args.where;
        return rows.has(key(userId, provider)) ? 1 : 0;
      }),
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PrismaTokenStore", () => {
  let prisma: PrismaClientLike;
  let store: PrismaTokenStore;

  const userId = "user-42";
  const provider: ProviderName = "garmin";

  const tokens: OAuthTokens = {
    accessToken: "access-123",
    refreshToken: "refresh-456",
    expiresAt: new Date(Date.now() + 3600 * 1000),
    scope: "WELLNESS_READ",
    tokenType: "Bearer",
  };

  beforeEach(() => {
    prisma = createMockPrismaClient();
    store = new PrismaTokenStore(prisma);
  });

  it("should save and retrieve tokens", async () => {
    await store.save(userId, provider, tokens);
    const result = await store.get(userId, provider);

    expect(result).not.toBeNull();
    expect(result!.accessToken).toBe("access-123");
    expect(result!.refreshToken).toBe("refresh-456");
    expect(result!.scope).toBe("WELLNESS_READ");
    expect(result!.tokenType).toBe("Bearer");
  });

  it("should call prisma.upsert with the right shape", async () => {
    await store.save(userId, provider, tokens);

    expect(prisma.wearableToken.upsert).toHaveBeenCalledWith({
      where: { userId_provider: { userId, provider } },
      create: expect.objectContaining({
        userId,
        provider,
        accessToken: "access-123",
        refreshToken: "refresh-456",
      }),
      update: expect.objectContaining({
        accessToken: "access-123",
        refreshToken: "refresh-456",
      }),
    });
  });

  it("should return null for missing tokens", async () => {
    const result = await store.get("unknown", provider);
    expect(result).toBeNull();
  });

  it("should report has correctly", async () => {
    expect(await store.has(userId, provider)).toBe(false);
    await store.save(userId, provider, tokens);
    expect(await store.has(userId, provider)).toBe(true);
  });

  it("should delete tokens", async () => {
    await store.save(userId, provider, tokens);
    await store.delete(userId, provider);
    expect(await store.get(userId, provider)).toBeNull();
  });

  it("should not throw when deleting non-existent tokens", async () => {
    // The Prisma store swallows P2025
    await expect(store.delete("ghost", provider)).resolves.not.toThrow();
  });

  it("should update existing tokens (upsert)", async () => {
    await store.save(userId, provider, tokens);

    const updated: OAuthTokens = {
      ...tokens,
      accessToken: "new-access",
      refreshToken: "new-refresh",
    };
    await store.save(userId, provider, updated);

    const result = await store.get(userId, provider);
    expect(result!.accessToken).toBe("new-access");
    expect(result!.refreshToken).toBe("new-refresh");
  });

  it("should isolate tokens by user and provider", async () => {
    const fitbitTokens: OAuthTokens = { ...tokens, accessToken: "fitbit-tok" };

    await store.save(userId, provider, tokens);
    await store.save(userId, "fitbit", fitbitTokens);

    expect((await store.get(userId, provider))!.accessToken).toBe("access-123");
    expect((await store.get(userId, "fitbit"))!.accessToken).toBe("fitbit-tok");
  });
});
