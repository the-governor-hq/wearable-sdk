import { NextRequest, NextResponse } from 'next/server'
import { tokenStore } from '@/lib/sdk'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter required' },
        { status: 400 }
      )
    }

    // Get all tokens for this user from the token store
    const allTokens = tokenStore.getAllTokens()
    const tokens = allTokens.filter(token => token.userId === userId)

    return NextResponse.json({ tokens })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
