import type { SDKLogger } from "../types/index.js";
import { ProviderAPIError, RateLimitError } from "./errors.js";

// ---------------------------------------------------------------------------
// HTTP Client — lightweight fetch wrapper with retries + rate-limit handling
// ---------------------------------------------------------------------------

export interface HttpRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: Record<string, unknown> | string | URLSearchParams;
  /** Content type — defaults to "json". Use "form" for OAuth token endpoints. */
  contentType?: "json" | "form";
  /** Max retries on 5xx / network errors (default: 3) */
  retries?: number;
  /** Timeout in ms (default: 30 000) */
  timeout?: number;
}

export interface HttpResponse<T = unknown> {
  status: number;
  headers: Headers;
  data: T;
}

const DEFAULT_RETRIES = 3;
const DEFAULT_TIMEOUT = 30_000;
const RETRY_BACKOFF_BASE = 500; // ms

/**
 * Minimal fetch-based HTTP client with:
 *  - automatic retries with exponential backoff
 *  - rate-limit detection → RateLimitError
 *  - configurable timeout via AbortController
 */
export class HttpClient {
  constructor(
    private provider: string,
    private logger: SDKLogger,
  ) {}

  async request<T = unknown>(
    url: string,
    options: HttpRequestOptions = {},
  ): Promise<HttpResponse<T>> {
    const {
      method = "GET",
      headers = {},
      contentType = "json",
      retries = DEFAULT_RETRIES,
      timeout = DEFAULT_TIMEOUT,
    } = options;

    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);

        const reqHeaders: Record<string, string> = { ...headers };
        let reqBody: string | undefined;

        if (options.body) {
          if (contentType === "form") {
            reqHeaders["Content-Type"] = "application/x-www-form-urlencoded";
            reqBody =
              options.body instanceof URLSearchParams
                ? options.body.toString()
                : new URLSearchParams(
                    options.body as Record<string, string>,
                  ).toString();
          } else {
            reqHeaders["Content-Type"] = "application/json";
            reqBody = JSON.stringify(options.body);
          }
        }

        this.logger.debug(`${method} ${url} (attempt ${attempt + 1})`, {
          provider: this.provider,
        });

        const response = await fetch(url, {
          method,
          headers: reqHeaders,
          body: reqBody,
          signal: controller.signal,
        });

        clearTimeout(timer);

        // ---- Rate limit ----
        if (response.status === 429) {
          const retryAfterHeader = response.headers.get("Retry-After");
          const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : null;
          const body = await this.safeJson(response);
          throw new RateLimitError(this.provider, retryAfter, body);
        }

        // ---- Server errors → retry ----
        if (response.status >= 500 && attempt < retries) {
          const wait = RETRY_BACKOFF_BASE * 2 ** attempt;
          this.logger.warn(
            `Server error ${response.status} from ${this.provider}, retrying in ${wait}ms…`,
          );
          await sleep(wait);
          continue;
        }

        // ---- Client errors → throw immediately ----
        if (!response.ok) {
          const body = await this.safeJson(response);
          throw new ProviderAPIError(this.provider, response.status, body);
        }

        // ---- Success ----
        const data = (await response.json()) as T;
        return { status: response.status, headers: response.headers, data };
      } catch (err) {
        lastError = err;

        // Don't retry on client errors or rate-limit
        if (err instanceof ProviderAPIError || err instanceof RateLimitError) {
          throw err;
        }

        if (attempt < retries) {
          const wait = RETRY_BACKOFF_BASE * 2 ** attempt;
          this.logger.warn(
            `Request to ${this.provider} failed, retrying in ${wait}ms…`,
            { error: String(err) },
          );
          await sleep(wait);
        }
      }
    }

    throw lastError;
  }

  /** GET shorthand */
  async get<T = unknown>(
    url: string,
    options?: Omit<HttpRequestOptions, "method" | "body">,
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: "GET" });
  }

  /** POST shorthand */
  async post<T = unknown>(
    url: string,
    body?: HttpRequestOptions["body"],
    options?: Omit<HttpRequestOptions, "method" | "body">,
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: "POST", body });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async safeJson(response: Response): Promise<any> {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
