import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ClientLayout from '@/components/ClientLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sentry Home Security | IoT Admin Portal',
  description: 'Real-time ESP32/ESP-NOW & MQTT Smart Home Security Management Portal'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 antialiased min-h-screen flex selection:bg-cyan-500/30 selection:text-cyan-200`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
