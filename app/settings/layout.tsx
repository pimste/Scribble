import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Instellingen - Scribble',
  description: 'Beheer je profiel en voorkeuren',
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
