import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Account aanmaken - Scribble',
  description: 'Maak een Scribble-account aan',
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
