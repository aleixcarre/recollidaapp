import './globals.css';
import 'leaflet/dist/leaflet.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Recollidapp',
  description: 'Sistema de gestió i optimització de recollides',
  themeColor: '#000000',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ca">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var isDashboard = window.location.pathname.startsWith('/dashboard');
                var link = document.createElement('link');
                link.rel = 'manifest';
                link.href = isDashboard ? '/manifest-operari.json' : '/manifest.json';
                document.head.appendChild(link);
              })();

              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}