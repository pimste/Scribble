import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vrienden uitnodigen - Scribble',
  description: 'Deel je code om te verbinden',
}

export default function InviteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
