import { describe, it, expect, vi, beforeEach } from "vitest";
import { WearableSDK } from "../../src/sdk.js";
import { MemoryTokenStore } from "../../src/stores/memory-store.js";
import { ProviderNotConfiguredError } from "../../src/core/errors.js";
import type { ProviderConfig } from "../../src/types/index.js";
import type { PrismaClientLike } from "../../src/stores/prisma-store.js";

describe("WearableSDK", () => {
  const garminConfig: ProviderConfig = {
    clientId: "test-garmin-id",
    clientSecret: "test-garmin-secret",
    redirectUri: "http://localhost:3000/auth/garmin/callback",
  };

  const fitbitConfig: ProviderConfig = {
    clientId: "test-fitbit-id",
    clientSecret: "test-fitbit-secret",
    redirectUri: "http://localhost:3000/auth/fitbit/callback",
  };

  describe("initialization", () => {
    it("should initialize with garmin only", () => {
      const sdk = new WearableSDK({
        providers: { garmin: garminConfig },
      });
      expect(sdk.configuredProviders).toEqual(["garmin"]);
    });

    it("should initialize with fitbit only", () => {
      const sdk = new WearableSDK({
        providers: { fitbit: fitbitConfig },
      });
      expect(sdk.configuredProviders).toEqual(["fitbit"]);
    });

    it("should initialize with both providers", () => {
      const sdk = new WearableSDK({
        providers: { garmin: garminConfig, fitbit: fitbitConfig },
      });
      expect(sdk.configuredProviders).toContain("garmin");
      expect(sdk.configuredProviders).toContain("fitbit");
    });

    it("should throw when accessing unconfigured provider", () => {
      const sdk = new WearableSDK({
        providers: { garmin: garminConfig },
      });
      expect(() => sdk.provider("fitbit")).toThrow(ProviderNotConfiguredError);
    });

    it("should accept custom token store", () => {
      const store = new MemoryTokenStore();
      const sdk = new WearableSDK({
        providers: { garmin: garminConfig },
        tokenStore: store,
      });
      expect(sdk.configuredProviders).toEqual(["garmin"]);
    });

    it("should accept prisma shorthand", () => {
      const mockPrisma: PrismaClientLike = {
        wearableToken: {
          upsert: vi.fn(),
          findUnique: vi.fn(),
          delete: vi.fn(),
          count: vi.fn(),
        },
      };
      const sdk = new WearableSDK({
        providers: { garmin: garminConfig },
        prisma: mockPrisma,
      });
      expect(sdk.configuredProviders).toEqual(["garmin"]);
    });
  });

  describe("getAuthUrl", () => {
    it("should generate auth URL for garmin", () => {
      const sdk = new WearableSDK({
        providers: { garmin: garminConfig },
      });
      const result = sdk.getAuthUrl("garmin", "user-123");
      expect(result.url).toContain("connect.garmin.com");
      expect(result.url).toContain("client_id=test-garmin-id");
      expect(result.url).toContain("code_challenge=");
      expect(result.url).toContain("code_challenge_method=S256");
      expect(result.state).toBeDefined();
      expect(result.state.length).toBeGreaterThanOrEqual(32);
    });

    it("should generate auth URL for fitbit", () => {
      const sdk = new WearableSDK({
        providers: { fitbit: fitbitConfig },
      });
      const result = sdk.getAuthUrl("fitbit", "user-123");
      expect(result.url).toContain("fitbit.com/oauth2/authorize");
      expect(result.url).toContain("client_id=test-fitbit-id");
      expect(result.state).toBeDefined();
    });

    it("should generate unique states per call", () => {
      const sdk = new WearableSDK({
        providers: { garmin: garminConfig },
      });
      const a = sdk.getAuthUrl("garmin", "user-1");
      const b = sdk.getAuthUrl("garmin", "user-1");
      expect(a.state).not.toBe(b.state);
    });
  });

  describe("connection management", () => {
    it("should report disconnected for users without tokens", async () => {
      const sdk = new WearableSDK({
        providers: { garmin: garminConfig },
      });
      const health = await sdk.getConnectionHealth("garmin", "user-x");
      expect(health.status).toBe("disconnected");
    });

    it("should report health for all providers at once", async () => {
      const sdk = new WearableSDK({
        providers: { garmin: garminConfig, fitbit: fitbitConfig },
      });
      const health = await sdk.getConnectionHealthAll("user-x");
      expect(health.garmin.status).toBe("disconnected");
      expect(health.fitbit.status).toBe("disconnected");
    });
  });
});
