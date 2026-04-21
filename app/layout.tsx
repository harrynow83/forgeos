import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AppShell } from '@/components/app-shell'
import { ToastProvider } from '@/components/ToastProvider'
import { PrinterProvider } from '@/lib/printer-context'
import './globals.css'

const geist = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: 'ForgeOS - 3D Printer Control System',
  description: 'Local-first operating system for controlling 3D printers',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="bg-background">
      <body className={`${geist.className} ${geistMono.className} antialiased`}>
        <PrinterProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </PrinterProvider>

        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}