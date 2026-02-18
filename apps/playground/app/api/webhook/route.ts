import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const payload = JSON.parse(body)

    // Check for signature verification
    const webhookSecret = process.env.WEBHOOK_SECRET
    let verified = true
    let signatureHeader: string | null = null

    // Check Garmin signature
    const garminSignature = request.headers.get('x-garmin-signature')
    if (garminSignature) {
      signatureHeader = garminSignature
      if (webhookSecret) {
        const hmac = createHmac('sha256', webhookSecret)
        hmac.update(body)
        const expectedSignature = hmac.digest('hex')
        verified = garminSignature === expectedSignature
      }
    }

    // Check Fitbit signature
    const fitbitSignature = request.headers.get('x-fitbit-signature')
    if (fitbitSignature) {
      signatureHeader = fitbitSignature
      if (webhookSecret) {
        const hmac = createHmac('sha1', webhookSecret)
        hmac.update(body + webhookSecret)
        const expectedSignature = hmac.digest('base64')
        verified = fitbitSignature === expectedSignature
      }
    }

    // Log the webhook (in production, you'd save this to a database or queue)
    console.log('📨 Webhook received:', {
      timestamp: new Date().toISOString(),
      verified,
      signature: signatureHeader,
      payload,
    })

    // Process the webhook based on type
    // This is where you'd implement your webhook handling logic
    
    return NextResponse.json({
      success: true,
      verified,
      message: 'Webhook received',
      payload,
    })
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json(
      { error: String(error) },
      { status: 400 }
    )
  }
}

// Handle GET for webhook verification (Fitbit requires this)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const verify = searchParams.get('verify')

  if (verify) {
    // Fitbit webhook verification
    return new NextResponse(verify, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  }

  return NextResponse.json({
    message: 'Webhook endpoint is active',
    url: request.url,
  })
}
