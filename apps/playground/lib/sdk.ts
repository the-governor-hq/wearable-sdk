import { WearableSDK } from '@the-governor-hq/wearable-sdk'
import { MemoryTokenStore } from '@the-governor-hq/wearable-sdk/stores'
import type { OAuthTokens, ProviderName } from '@the-governor-hq/wearable-sdk'

// Extended memory store with getAllTokens capability
class PlaygroundTokenStore extends MemoryTokenStore {
  private tokenList: Array<OAuthTokens & { userId: string; provider: ProviderName }> = []

  async save(userId: string, provider: ProviderName, tokens: OAuthTokens): Promise<void> {
    await super.save(userId, provider, tokens)
    
    // Update token list
    const index = this.tokenList.findIndex(
      t => t.userId === userId && t.provider === provider
    )
    if (index >= 0) {
      this.tokenList[index] = { ...tokens, userId, provider }
    } else {
      this.tokenList.push({ ...tokens, userId, provider })
    }
  }

  async delete(userId: string, provider: ProviderName): Promise<void> {
    await super.delete(userId, provider)
    
    // Remove from token list
    this.tokenList = this.tokenList.filter(
      t => !(t.userId === userId && t.provider === provider)
    )
  }

  getAllTokens(): Array<OAuthTokens & { userId: string; provider: ProviderName }> {
    return [...this.tokenList]
  }
}

// Use extended memory store for playground
export const tokenStore = new PlaygroundTokenStore()

export const sdk = new WearableSDK({
  tokenStore,
  debug: true,
  providers: {
    garmin: {
      clientId: process.env.GARMIN_CLIENT_ID!,
      clientSecret: process.env.GARMIN_CLIENT_SECRET!,
      redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/garmin/callback`,
    },
    fitbit: {
      clientId: process.env.FITBIT_CLIENT_ID!,
      clientSecret: process.env.FITBIT_CLIENT_SECRET!,
      redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/fitbit/callback`,
    },
  },
})
