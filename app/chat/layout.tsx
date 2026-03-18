import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chat - Scribble',
  description: 'Je berichten',
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
