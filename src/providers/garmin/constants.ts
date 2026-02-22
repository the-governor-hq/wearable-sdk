/** Garmin OAuth 2.0 + PKCE constants */

export const GARMIN_AUTHORIZE_URL = "https://connect.garmin.com/oauth2Confirm";
export const GARMIN_TOKEN_URL =
  "https://diauth.garmin.com/di-oauth2-service/oauth/token";

/** Garmin Wellness API base */
export const GARMIN_API_BASE = "https://apis.garmin.com";

/** Available Garmin API scopes */
export const GARMIN_DEFAULT_SCOPES = [
  "WELLNESS_READ",
  "ACTIVITY_READ",
  "SLEEP_READ",
] as const;

/** Garmin data endpoints */
export const GARMIN_ENDPOINTS = {
  /** User ID — GET */
  userId: "/wellness-api/rest/user/id",

  /** Activities — GET ?uploadStartTimeInSeconds=&uploadEndTimeInSeconds= */
  activities: "/wellness-api/rest/activities",

  /** Daily summaries — GET ?uploadStartTimeInSeconds=&uploadEndTimeInSeconds= */
  dailies: "/wellness-api/rest/dailies",

  /** Epoch summaries — GET */
  epochs: "/wellness-api/rest/epochs",

  /** Sleep — GET ?uploadStartTimeInSeconds=&uploadEndTimeInSeconds= */
  sleeps: "/wellness-api/rest/sleeps",

  /** Heart rate — GET */
  heartRates: "/wellness-api/rest/hrs",

  /** Body composition — GET */
  bodyComps: "/wellness-api/rest/bodyComps",

  /** Stress — GET */
  stressDetails: "/wellness-api/rest/stressDetails",

  /** Pulse Ox — GET */
  pulseOx: "/wellness-api/rest/pulseOx",

  /** Respiration — GET */
  respiration: "/wellness-api/rest/respiration",
} as const;
