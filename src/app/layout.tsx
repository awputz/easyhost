import type { Metadata } from "next"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "EZ-Host.ai - AI-Powered Hosting for Everyone",
  description: "The modern way to share documents, images, and interactive content. No tech skills required. Your AI assistant guides you every step of the way.",
  keywords: ["file hosting", "document sharing", "AI hosting", "easy hosting", "file sharing"],
  authors: [{ name: "EZ-Host.ai" }],
  openGraph: {
    title: "EZ-Host.ai - AI-Powered Hosting for Everyone",
    description: "Host anything. Zero tech skills required.",
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
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
