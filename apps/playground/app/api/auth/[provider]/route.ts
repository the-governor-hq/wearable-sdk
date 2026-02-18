import { NextRequest, NextResponse } from 'next/server'
import { sdk } from '@/lib/sdk'

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'demo-user'
    const provider = params.provider as 'garmin' | 'fitbit'

    const result = sdk.getAuthUrl(provider, userId)

    return NextResponse.json({
      provider,
      userId,
      state: result.state,
      url: result.url,
      scopes: result.scopes || [],
    })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 400 }
    )
  }
}
