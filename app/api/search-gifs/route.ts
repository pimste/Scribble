import { NextResponse } from 'next/server'

// GIPHY API configuration
// Get your free API key at: https://developers.giphy.com/
const GIPHY_API_KEY = process.env.GIPHY_API_KEY || ''
const GIPHY_API_URL = 'https://api.giphy.com/v1/gifs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const limit = searchParams.get('limit') || '20'

  if (!query) {
    return NextResponse.json({ error: 'Query parameter required' }, { status: 400 })
  }

  if (!GIPHY_API_KEY) {
    return NextResponse.json(
      { error: 'GIPHY API key not configured' },
      { status: 500 }
    )
  }

  try {
    // Search GIFs using GIPHY API
    // rating=g ensures only G-rated content for child safety
    const response = await fetch(
      `${GIPHY_API_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=${limit}&rating=g&lang=en`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch GIFs from GIPHY')
    }

    const data = await response.json()

    // Transform GIPHY response to simplified format
    const gifs = data.data.map((result: any) => ({
      id: result.id,
      title: result.title || 'GIF',
      url: result.images.fixed_height.url,
      preview: result.images.fixed_height_small.url,
      width: parseInt(result.images.fixed_height.width),
      height: parseInt(result.images.fixed_height.height),
    }))

    return NextResponse.json({ gifs })
  } catch (error) {
    console.error('Error searching GIFs:', error)
    return NextResponse.json(
      { error: 'Failed to search GIFs' },
      { status: 500 }
    )
  }
}

