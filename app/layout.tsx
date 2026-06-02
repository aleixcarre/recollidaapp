import './globals.css';
import 'leaflet/dist/leaflet.css';
import { Inter } from 'next/font/google';
// Canviem la ruta de l'import perquè ara està a components/ a l'arrel
import ManifestLoader from '../components/ManifestLoader'; 

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ca">
      <head>
        {/* El ManifestLoader injectarà el link correcte */}
      </head>
      <body className={inter.className}>
        <ManifestLoader />
        {children}
      </body>
    </html>
  );
}