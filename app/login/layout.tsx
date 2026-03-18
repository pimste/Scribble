import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Inloggen - Scribble',
  description: 'Log in op je Scribble-account',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
