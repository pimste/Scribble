import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ouderlijk toezicht - Scribble',
  description: 'Monitor en beheer chatactiviteit',
}

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
