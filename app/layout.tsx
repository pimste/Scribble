import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Scribble - Chat met Ouderlijk Toezicht",
  description: "Veilige chat-app met ouderlijk toezicht en uitnodigingsverbindingen",
  openGraph: {
    title: "Scribble - Chat met Ouderlijk Toezicht",
    description: "Veilige chat-app met ouderlijk toezicht en uitnodigingsverbindingen",
    locale: "nl_NL",
  },
  twitter: {
    card: "summary_large_image",
    title: "Scribble - Chat met Ouderlijk Toezicht",
    description: "Veilige chat-app met ouderlijk toezicht en uitnodigingsverbindingen",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="system" storageKey="scribble-ui-theme">
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}


