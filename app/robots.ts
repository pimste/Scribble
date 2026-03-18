import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/chat', '/settings', '/parent', '/invite'],
    },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://scribble.app'}/sitemap.xml`,
  }
}
