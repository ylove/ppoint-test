import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Header } from '@/components/layout/header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: '%s | RxView',
    default: 'RxView - AI-Enhanced Drug Information',
  },
  description: 'Comprehensive prescription drug information with AI-powered insights for healthcare professionals and patients.',
  keywords: ['prescription drugs', 'medication information', 'drug labels', 'healthcare', 'FDA'],
  authors: [{ name: 'RxView Team' }],
  creator: 'RxView',
  publisher: 'RxView',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'RxView - AI-Enhanced Drug Information',
    description: 'Comprehensive prescription drug information with AI-powered insights.',
    siteName: 'RxView',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RxView - AI-Enhanced Drug Information',
    description: 'Comprehensive prescription drug information with AI-powered insights.',
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
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-50 flex flex-col`}>
        <Header />
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}