import { describe, it, expect } from "vitest";
import {
  WearableSDKError,
  OAuthError,
  TokenExpiredError,
  TokenRefreshError,
  InvalidStateError,
  ProviderAPIError,
  RateLimitError,
  ProviderNotConfiguredError,
  MissingTokenError,
} from "../../src/core/errors.js";

describe("Error hierarchy", () => {
  it("all errors should extend WearableSDKError", () => {
    expect(new OAuthError("test")).toBeInstanceOf(WearableSDKError);
    expect(new TokenExpiredError("garmin", "u1")).toBeInstanceOf(WearableSDKError);
    expect(new TokenRefreshError("garmin", "u1")).toBeInstanceOf(WearableSDKError);
    expect(new InvalidStateError()).toBeInstanceOf(WearableSDKError);
    expect(new ProviderAPIError("garmin", 500, "fail")).toBeInstanceOf(WearableSDKError);
    expect(new RateLimitError("garmin", 60)).toBeInstanceOf(WearableSDKError);
    expect(new ProviderNotConfiguredError("garmin")).toBeInstanceOf(WearableSDKError);
    expect(new MissingTokenError("garmin", "u1")).toBeInstanceOf(WearableSDKError);
  });

  it("errors should have correct names", () => {
    expect(new OAuthError("test").name).toBe("OAuthError");
    expect(new RateLimitError("garmin", 60).name).toBe("RateLimitError");
  });

  it("RateLimitError should store retryAfterSeconds", () => {
    const err = new RateLimitError("garmin", 120);
    expect(err.retryAfterSeconds).toBe(120);
    expect(err.provider).toBe("garmin");
  });

  it("ProviderAPIError should store statusCode and body", () => {
    const err = new ProviderAPIError("fitbit", 403, "forbidden");
    expect(err.statusCode).toBe(403);
    expect(err.responseBody).toBe("forbidden");
    expect(err.provider).toBe("fitbit");
  });
});
