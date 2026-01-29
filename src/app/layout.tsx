import type { Metadata } from "next"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "Pagelink - Don't send files. Send Pagelinks.",
  description: "Create beautiful documents in seconds with AI. Share them instantly with a link. No signup required to start.",
  keywords: ["document creation", "AI documents", "pitch deck", "investment memo", "proposal", "one-pager"],
  authors: [{ name: "Pagelink" }],
  openGraph: {
    title: "Pagelink - Don't send files. Send Pagelinks.",
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
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
