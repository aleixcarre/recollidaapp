import './globals.css';
import 'leaflet/dist/leaflet.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ca">
      <head>
        {/* El teu Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Apple Touch Icon (per a dispositius iOS) */}
        <link rel="apple-touch-icon" href="/icon-192.png" />
        
        {/* Registre del Service Worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .catch(err => console.error('Error al registrar el Service Worker:', err));
                });
              }
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}