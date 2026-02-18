'use client'

import { useState, useEffect } from 'react'

interface OAuthState {
  provider: string
  userId: string
  state: string
  url: string
  scopes: string[]
}

interface TokenData {
  provider: string
  userId: string
  providerUserId: string
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  scopes?: string[]
}

export default function Home() {
  const [userId, setUserId] = useState('demo-user')
  const [oauthState, setOauthState] = useState<OAuthState | null>(null)
  const [callbackResult, setCallbackResult] = useState<any>(null)
  const [tokens, setTokens] = useState<TokenData[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check URL params for callback success/error
    const params = new URLSearchParams(window.location.search)
    const success = params.get('success')
    const error = params.get('error')
    const provider = params.get('provider')

    if (success && provider) {
      setCallbackResult({
        success: true,
        message: `Successfully connected to ${provider}!`,
        provider,
      })
      // Clear URL params
      window.history.replaceState({}, '', '/')
      // Reload tokens after successful OAuth
      loadTokens()
    } else if (error) {
      setCallbackResult({
        success: false,
        error,
      })
      // Clear URL params
      window.history.replaceState({}, '', '/')
    } else {
      // Initial load
      loadTokens()
    }
  }, [])

  const loadTokens = async () => {
    try {
      const res = await fetch(`/api/tokens?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setTokens(data.tokens || [])
      }
    } catch (err) {
      console.error('Failed to load tokens:', err)
    }
  }

  const initiateOAuth = async (provider: 'garmin' | 'fitbit') => {
    setLoading(true)
    setCallbackResult(null)
    setOauthState(null)
    
    try {
      const res = await fetch(`/api/auth/${provider}?userId=${userId}`)
      const data = await res.json()
      
      setOauthState(data)
      
      // Redirect to provider
      window.location.href = data.url
    } catch (err) {
      console.error('Failed to initiate OAuth:', err)
    } finally {
      setLoading(false)
    }
  }

  const refreshToken = async (provider: string, userId: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/tokens/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, userId }),
      })
      const data = await res.json()
      
      if (res.ok) {
        alert('Token refreshed successfully!')
        await loadTokens()
      } else {
        alert(`Failed to refresh token: ${data.error}`)
      }
    } catch (err) {
      alert(`Error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          OAuth Server Kit
        </h1>
        <p className="text-gray-600">
          Test Garmin &amp; Fitbit OAuth flows instantly
        </p>
      </div>

      {/* User ID Input */}
      <div className="card max-w-md mx-auto">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          User ID (for testing)
        </label>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="demo-user"
        />
      </div>

      {/* OAuth Buttons */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <button
          onClick={() => initiateOAuth('garmin')}
          disabled={loading || !userId}
          className="h-32 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center space-y-2"
        >
          <div className="text-4xl">🏃</div>
          <div className="text-xl font-bold">Connect Garmin</div>
        </button>

        <button
          onClick={() => initiateOAuth('fitbit')}
          disabled={loading || !userId}
          className="h-32 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center space-y-2"
        >
          <div className="text-4xl">💪</div>
          <div className="text-xl font-bold">Connect Fitbit</div>
        </button>
      </div>

      {/* OAuth State Display */}
      {oauthState && (
        <div className="card max-w-4xl mx-auto">
          <h2 className="text-lg font-semibold mb-4">OAuth Request Details</h2>
          <div className="space-y-3">
            <div>
              <span className="font-medium">Provider:</span> {oauthState.provider}
            </div>
            <div>
              <span className="font-medium">State:</span>
              <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-sm">
                {oauthState.state}
              </code>
            </div>
            <div>
              <span className="font-medium">Scopes:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {oauthState.scopes.map((scope) => (
                  <span
                    key={scope}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                  >
                    {scope}
                  </span>
                ))}
              </div>
            </div>
            <div className="pt-2">
              <span className="font-medium">Redirect URL:</span>
              <div className="code-block mt-2 break-all">
                {oauthState.url}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Callback Result */}
      {callbackResult && (
        <div className="card max-w-4xl mx-auto">
          <h2 className="text-lg font-semibold mb-4">
            {callbackResult.error ? '❌ Error' : '✅ Connection Successful'}
          </h2>
          <div className="code-block">
            {JSON.stringify(callbackResult, null, 2)}
          </div>
        </div>
      )}

      {/* Stored Tokens */}
      <div className="card max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Stored Tokens</h2>
          <button
            onClick={loadTokens}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
          >
            Refresh List
          </button>
        </div>

        {tokens.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No tokens stored yet. Connect a provider above to get started.
          </p>
        ) : (
          <div className="space-y-4">
            {tokens.map((token, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-semibold text-lg capitalize">
                      {token.provider}
                    </div>
                    <div className="text-sm text-gray-600">
                      User: {token.userId} • Provider ID: {token.providerUserId}
                    </div>
                  </div>
                  <button
                    onClick={() => refreshToken(token.provider, token.userId)}
                    disabled={loading}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm disabled:opacity-50"
                  >
                    Refresh Token
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Access Token:</span>
                    <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                      {token.accessToken.substring(0, 50)}...
                    </code>
                  </div>
                  {token.refreshToken && (
                    <div>
                      <span className="font-medium">Refresh Token:</span>
                      <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                        {token.refreshToken.substring(0, 50)}...
                      </code>
                    </div>
                  )}
                  {token.expiresAt && (
                    <div>
                      <span className="font-medium">Expires:</span>
                      <span className="ml-2">
                        {new Date(token.expiresAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {token.scopes && token.scopes.length > 0 && (
                    <div>
                      <span className="font-medium">Scopes:</span>
                      <span className="ml-2 text-xs">
                        {token.scopes.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
