import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import './globals.css';

export const metadata: Metadata = {
  title: 'LMMS',
  description: 'Laundry Marketing Management System',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LMMS',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const primaryColor = h.get('x-lmms-primary-color') ?? '#0f172a';
  const logoUrl = h.get('x-lmms-logo-url');

  return (
    <html lang="ar" dir="rtl">
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `:root { --lmms-primary: ${primaryColor}; }`,
          }}
        />
      </head>
      <body>
        {logoUrl && (
          <div className="hidden" data-lmms-logo={logoUrl} />
        )}
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js')); }`,
          }}
        />
      </body>
    </html>
  );
}
