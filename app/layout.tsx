import './globals.css';
import 'leaflet/dist/leaflet.css';
import { Inter } from 'next/font/google';
import ManifestLoader from './components/ManifestLoader';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ca">
      <head>
        {/* El ManifestLoader ja injecta el manifest dinàmic */}
      </head>
      <body className={inter.className}>
        <ManifestLoader />
        {children}
        
        {/* Registre forçat del Service Worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(reg => console.log('SW registrat:', reg))
                    .catch(err => console.log('Error SW:', err));
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}