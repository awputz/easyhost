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
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
