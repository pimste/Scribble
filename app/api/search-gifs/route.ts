import { NextResponse } from 'next/server'

// Tenor API configuration
// Get your free API key at: https://developers.google.com/tenor/guides/quickstart
const TENOR_API_KEY = process.env.TENOR_API_KEY || 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ' // This is a demo key
const TENOR_API_URL = 'https://tenor.googleapis.com/v2'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const limit = searchParams.get('limit') || '20'

  if (!query) {
    return NextResponse.json({ error: 'Query parameter required' }, { status: 400 })
  }

  try {
    // Search GIFs using Tenor API
    // contentfilter=high ensures only G-rated content for child safety
    const response = await fetch(
      `${TENOR_API_URL}/search?q=${encodeURIComponent(query)}&key=${TENOR_API_KEY}&limit=${limit}&contentfilter=high&media_filter=gif`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch GIFs from Tenor')
    }

    const data = await response.json()

    // Transform Tenor response to simplified format
    const gifs = data.results.map((result: any) => ({
      id: result.id,
      title: result.content_description || result.itemurl,
      url: result.media_formats.gif.url,
      preview: result.media_formats.tinygif.url,
      width: result.media_formats.gif.dims[0],
      height: result.media_formats.gif.dims[1],
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

