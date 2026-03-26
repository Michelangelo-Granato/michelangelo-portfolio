import './global.css'
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Navbar } from './components/nav'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Footer from './components/footer'
import { baseUrl } from './sitemap'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Michelangelo Granato - Portfolio',
    template: '%s | Michelangelo Granato',
  },
  description: 'Portfolio of Michelangelo Granato, a full-stack developer building clean systems and thoughtful digital products.',
  openGraph: {
    title: 'Michelangelo Granato - Portfolio',
    description: 'Full-stack development, selected projects, photography, and writing by Michelangelo Granato.',
    url: baseUrl,
    siteName: 'Michelangelo Granato',
    locale: 'en_US',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

const cx = (...classes) => classes.filter(Boolean).join(' ')

interface LayoutProps {
  children: React.ReactNode
}
const Layout: React.FC<LayoutProps> = ({
  children,
}) => {
  return (
    <html
      lang="en"
      className={cx(
        'bg-transparent text-[var(--ink)]',
        GeistSans.variable,
        GeistMono.variable
      )}
    >
      <body className="antialiased">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-[var(--surface-2)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
        >
          Skip to content
        </a>
        <main id="content" className="min-w-0 px-4 pb-10 pt-24 md:px-6 md:pt-28">
          <Navbar />
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
            {children}
          </div>
          <Footer />
          <Analytics />
          <SpeedInsights />
        </main>
      </body>
    </html>
  )
}

export default Layout;