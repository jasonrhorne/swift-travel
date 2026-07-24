import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ReactErrorBoundary from '@/components/ReactErrorBoundary';
import MonitoringProvider from '@/components/MonitoringProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Swift Travel - AI-Powered Itinerary Generator',
  description:
    'Generate personalized travel itineraries with our multi-agent AI system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MonitoringProvider>
          <ReactErrorBoundary>{children}</ReactErrorBoundary>
        </MonitoringProvider>
      </body>
    </html>
  );
}
