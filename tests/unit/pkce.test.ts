import { describe, it, expect } from "vitest";
import { generatePKCE, generateState } from "../../src/utils/pkce.js";

describe("PKCE Utils", () => {
  describe("generateState", () => {
    it("should generate a base64url-safe state string", () => {
      const state = generateState();
      expect(state.length).toBeGreaterThanOrEqual(32);
      expect(state).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it("should generate unique states", () => {
      const states = new Set(Array.from({ length: 100 }, () => generateState()));
      expect(states.size).toBe(100);
    });
  });

  describe("generatePKCE", () => {
    it("should return codeVerifier and codeChallenge", () => {
      const pkce = generatePKCE();
      expect(pkce.codeVerifier).toBeDefined();
      expect(pkce.codeChallenge).toBeDefined();
      expect(pkce.codeVerifier).not.toBe(pkce.codeChallenge);
    });

    it("should produce a base64url-safe code verifier (43–128 chars)", () => {
      const { codeVerifier } = generatePKCE();
      expect(codeVerifier.length).toBeGreaterThanOrEqual(43);
      expect(codeVerifier.length).toBeLessThanOrEqual(128);
      // base64url chars only
      expect(codeVerifier).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it("should produce a base64url-safe code challenge", () => {
      const { codeChallenge } = generatePKCE();
      expect(codeChallenge).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it("should produce different pairs each time", () => {
      const a = generatePKCE();
      const b = generatePKCE();
      expect(a.codeVerifier).not.toBe(b.codeVerifier);
      expect(a.codeChallenge).not.toBe(b.codeChallenge);
    });
  });
});
