import { describe, it, expect, beforeEach } from "vitest";
import { MemoryTokenStore } from "../../src/stores/memory-store.js";
import type { OAuthTokens, ProviderName } from "../../src/types/index.js";

describe("MemoryTokenStore", () => {
  let store: MemoryTokenStore;

  const userId = "user-1";
  const provider: ProviderName = "garmin";

  const tokens: OAuthTokens = {
    accessToken: "access-abc",
    refreshToken: "refresh-xyz",
    expiresAt: new Date(Date.now() + 3600 * 1000),
    scope: "WELLNESS_READ",
    tokenType: "Bearer",
  };

  beforeEach(() => {
    store = new MemoryTokenStore();
  });

  it("should save and retrieve tokens", async () => {
    await store.save(userId, provider, tokens);
    const result = await store.get(userId, provider);
    expect(result).toEqual(tokens);
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
    expect(await store.has(userId, provider)).toBe(false);
  });

  it("should isolate tokens by user and provider", async () => {
    const fitbitProvider: ProviderName = "fitbit";
    const fitbitTokens: OAuthTokens = { ...tokens, accessToken: "fitbit-tok" };

    await store.save(userId, provider, tokens);
    await store.save(userId, fitbitProvider, fitbitTokens);
    await store.save("user-2", provider, { ...tokens, accessToken: "u2-tok" });

    expect((await store.get(userId, provider))?.accessToken).toBe("access-abc");
    expect((await store.get(userId, fitbitProvider))?.accessToken).toBe("fitbit-tok");
    expect((await store.get("user-2", provider))?.accessToken).toBe("u2-tok");
  });

  it("should track size correctly", async () => {
    expect(store.size).toBe(0);
    await store.save(userId, provider, tokens);
    expect(store.size).toBe(1);
    await store.save(userId, "fitbit", tokens);
    expect(store.size).toBe(2);
    await store.delete(userId, provider);
    expect(store.size).toBe(1);
  });

  it("should clear all tokens", async () => {
    await store.save(userId, provider, tokens);
    await store.save("user-2", "fitbit", tokens);
    expect(store.size).toBe(2);
    store.clear();
    expect(store.size).toBe(0);
  });
});
