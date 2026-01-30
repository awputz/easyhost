import type { Metadata } from "next"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "Pagelink - Host anything. Share with one link.",
  description: "Create beautiful documents in seconds with AI. Share them instantly with a link. No signup required to start.",
  keywords: ["document creation", "AI documents", "pitch deck", "investment memo", "proposal", "one-pager", "file hosting"],
  authors: [{ name: "Pagelink" }],
  openGraph: {
    title: "Pagelink - Host anything. Share with one link.",
    description: "Create beautiful documents in seconds with AI. Share them instantly with a link.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* Brand Typography - Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Libre+Franklin:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
