import './globals.css';
import 'leaflet/dist/leaflet.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

// Hem mogut el themeColor aquí dins per evitar l'error de tipus
export const metadata: Metadata = {
  title: 'Recollidapp',
  description: 'Sistema de gestió i optimització de recollides',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Recollidapp',
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: '#000000', // <-- El posem aquí directament
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ca">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={inter.className}>
        {children}

        {/* Script per registrar el Service Worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then((reg) => console.log('Recollidapp SW registrat'))
                    .catch((err) => console.error('Error SW:', err));
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}