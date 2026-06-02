import './globals.css';
import 'leaflet/dist/leaflet.css';
import { Inter } from 'next/font/google';
import ManifestLoader from './ManifestLoader'; // Aquesta és la clau!

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ca">
      <head>
      </head>
      <body className={inter.className}>
        <ManifestLoader />
        {children}
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