import './globals.css';
import 'leaflet/dist/leaflet.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Recollidapp',
  description: 'Sistema de gestió i optimització de recollides',
  // Deixem el manifest per defecte aquí, s'actualitzarà al client
  manifest: '/manifest.json',
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ca">
      <head>
        {/* Script per canviar el manifest segons la ruta */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (window.location.pathname.startsWith('/dashboard')) {
                  var link = document.createElement('link');
                  link.rel = 'manifest';
                  link.href = '/manifest-operari.json';
                  document.head.appendChild(link);
                } else {
                  var link = document.createElement('link');
                  link.rel = 'manifest';
                  link.href = '/manifest.json';
                  document.head.appendChild(link);
                }
              })();
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