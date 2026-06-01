import './globals.css';
import 'leaflet/dist/leaflet.css'
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Gestió de Recollides',
  description: 'Sistema d’optimització de rutes per a operaris',
  manifest: '/manifest.json', // 👈 Afegim el manifest aquí de forma segura
  openGraph: {
    images: [
      {
        url: 'https://bolt.new/static/og_default.png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      {
        url: 'https://bolt.new/static/og_default.png',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ca">
      <body className={inter.className}>
        {children}

        {/* 🚀 Executem el registre del Service Worker de forma neta i directa des de l'HTML */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(reg) { console.log('Service Worker actiu!', reg); })
                    .catch(function(err) { console.error('Error amb el SW:', err); });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}