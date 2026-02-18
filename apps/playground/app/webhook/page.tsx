'use client'

import { useState } from 'react'

interface WebhookLog {
  timestamp: string
  verified: boolean
  provider: string
  payload: any
  signature?: string
  error?: string
}

export default function WebhookTester() {
  const [payload, setPayload] = useState(`{
  "userId": "demo-user",
  "activityId": "12345",
  "type": "activity",
  "timestamp": "${new Date().toISOString()}"
}`)
  const [signature, setSignature] = useState('')
  const [provider, setProvider] = useState<'garmin' | 'fitbit'>('garmin')
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [loading, setLoading] = useState(false)

  const webhookUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/webhook`
    : '/api/webhook'

  const sendWebhook = async () => {
    setLoading(true)
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      // Add provider-specific signature headers
      if (signature) {
        if (provider === 'garmin') {
          headers['X-Garmin-Signature'] = signature
        } else if (provider === 'fitbit') {
          headers['X-Fitbit-Signature'] = signature
        }
      }

      const res = await fetch('/api/webhook', {
        method: 'POST',
        headers,
        body: payload,
      })

      const result = await res.json()

      const log: WebhookLog = {
        timestamp: new Date().toISOString(),
        verified: res.ok && result.verified !== false,
        provider,
        payload: JSON.parse(payload),
        signature: signature || undefined,
        error: res.ok ? undefined : result.error,
      }

      setLogs([log, ...logs])
    } catch (err) {
      const log: WebhookLog = {
        timestamp: new Date().toISOString(),
        verified: false,
        provider,
        payload: {},
        error: String(err),
      }
      setLogs([log, ...logs])
    } finally {
      setLoading(false)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  const examplePayloads = {
    garmin: {
      activity: `{
  "userId": "demo-user",
  "summaryId": "12345678",
  "activityType": "RUNNING",
  "startTimeInSeconds": ${Math.floor(Date.now() / 1000)},
  "durationInSeconds": 3600,
  "distanceInMeters": 10000
}`,
      sleep: `{
  "userId": "demo-user",
  "sleepId": "87654321",
  "sleepStartTime": "${new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()}",
  "sleepEndTime": "${new Date().toISOString()}",
  "totalSleepSeconds": 28800
}`,
    },
    fitbit: {
      activity: `{
  "ownerId": "demo-user",
  "ownerType": "user",
  "subscriptionId": "1",
  "collectionType": "activities",
  "date": "${new Date().toISOString().split('T')[0]}"
}`,
      sleep: `{
  "ownerId": "demo-user",
  "ownerType": "user",
  "subscriptionId": "1",
  "collectionType": "sleep",
  "date": "${new Date().toISOString().split('T')[0]}"
}`,
    },
  }

  const loadExample = (type: 'activity' | 'sleep') => {
    setPayload(examplePayloads[provider][type])
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Webhook Tester
        </h1>
        <p className="text-gray-600">
          Test webhook payloads, verify signatures, and see handler logs
        </p>
      </div>

      {/* Webhook URL Display */}
      <div className="card">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Webhook Endpoint URL
        </label>
        <div className="flex items-center space-x-2">
          <code className="flex-1 bg-gray-100 px-4 py-2 rounded-md text-sm">
            {webhookUrl}
          </code>
          <button
            onClick={() => navigator.clipboard.writeText(webhookUrl)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
          >
            Copy
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Configure this URL in your Garmin/Fitbit developer console
        </p>
      </div>

      {/* Webhook Form */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Send Test Webhook</h2>
        
        {/* Provider Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Provider
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="garmin"
                checked={provider === 'garmin'}
                onChange={(e) => setProvider(e.target.value as 'garmin')}
                className="mr-2"
              />
              Garmin
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="fitbit"
                checked={provider === 'fitbit'}
                onChange={(e) => setProvider(e.target.value as 'fitbit')}
                className="mr-2"
              />
              Fitbit
            </label>
          </div>
        </div>

        {/* Example Payloads */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Load Example
          </label>
          <div className="flex space-x-2">
            <button
              onClick={() => loadExample('activity')}
              className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm"
            >
              Activity
            </button>
            <button
              onClick={() => loadExample('sleep')}
              className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded text-sm"
            >
              Sleep
            </button>
          </div>
        </div>

        {/* Payload Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Webhook Payload (JSON)
          </label>
          <textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            rows={10}
            className="w-full px-4 py-2 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder='{"userId": "demo-user", ...}'
          />
        </div>

        {/* Signature Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Signature (optional)
          </label>
          <input
            type="text"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Leave empty to skip verification"
          />
          <p className="text-xs text-gray-500 mt-1">
            If WEBHOOK_SECRET is set, the signature will be verified
          </p>
        </div>

        {/* Send Button */}
        <button
          onClick={sendWebhook}
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Send Webhook'}
        </button>
      </div>

      {/* Webhook Logs */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Webhook Logs</h2>
          <button
            onClick={clearLogs}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
          >
            Clear Logs
          </button>
        </div>

        {logs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No webhooks sent yet. Send a test webhook above to see logs.
          </p>
        ) : (
          <div className="space-y-4">
            {logs.map((log, idx) => (
              <div
                key={idx}
                className={`border-l-4 p-4 rounded-r ${
                  log.verified
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {log.verified ? '✅' : '❌'}
                    </span>
                    <span className="font-semibold capitalize">
                      {log.provider}
                    </span>
                    {log.signature && (
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                        Signed
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-600">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {log.error && (
                  <div className="mb-2 text-sm text-red-700">
                    <strong>Error:</strong> {log.error}
                  </div>
                )}

                <div className="code-block text-xs">
                  {JSON.stringify(log.payload, null, 2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
