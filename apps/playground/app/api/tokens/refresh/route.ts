import { NextRequest, NextResponse } from 'next/server'
import { sdk } from '@/lib/sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider, userId } = body

    if (!provider || !userId) {
      return NextResponse.json(
        { error: 'provider and userId required' },
        { status: 400 }
      )
    }

    const newToken = await sdk.refreshToken(provider as 'garmin' | 'fitbit', userId)

    return NextResponse.json({
      message: 'Token refreshed successfully',
      token: newToken,
    })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
