import { NextRequest, NextResponse } from 'next/server'
import { sdk } from '@/lib/sdk'

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const provider = params.provider as 'garmin' | 'fitbit'

    if (!code || !state) {
      throw new Error('Missing code or state parameter')
    }

    // Handle the OAuth callback
    const result = await sdk.handleCallback(provider, code, state)

    // Redirect back to home with query params so the UI can display the result
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin
    const redirectUrl = new URL('/', baseUrl)
    redirectUrl.searchParams.set('success', 'true')
    redirectUrl.searchParams.set('provider', provider)

    return NextResponse.redirect(redirectUrl, { status: 302 })
  } catch (error) {
    console.error('OAuth callback error:', error)
    
    // Redirect to home with error
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin
    const redirectUrl = new URL('/', baseUrl)
    redirectUrl.searchParams.set('error', String(error))
    return NextResponse.redirect(redirectUrl, { status: 302 })
  }
}
