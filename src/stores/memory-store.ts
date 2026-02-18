import type { OAuthTokens, ProviderName } from "../types/index.js";
import type { TokenStore } from "../core/token-store.js";

/**
 * In-memory token store — great for development and tests.
 * ⚠️  Tokens are lost when the process restarts.
 */
export class MemoryTokenStore implements TokenStore {
  private store = new Map<string, OAuthTokens>();

  private key(userId: string, provider: ProviderName): string {
    return `${provider}::${userId}`;
  }

  async save(userId: string, provider: ProviderName, tokens: OAuthTokens): Promise<void> {
    this.store.set(this.key(userId, provider), { ...tokens });
  }

  async get(userId: string, provider: ProviderName): Promise<OAuthTokens | null> {
    const t = this.store.get(this.key(userId, provider));
    return t ? { ...t } : null;
  }

  async delete(userId: string, provider: ProviderName): Promise<void> {
    this.store.delete(this.key(userId, provider));
  }

  async has(userId: string, provider: ProviderName): Promise<boolean> {
    return this.store.has(this.key(userId, provider));
  }

  /** For tests: number of entries currently stored. */
  get size(): number {
    return this.store.size;
  }

  /** For tests: clear everything. */
  clear(): void {
    this.store.clear();
  }
}
