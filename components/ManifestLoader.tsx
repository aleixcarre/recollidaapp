'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ManifestLoader() {
  const pathname = usePathname();

  useEffect(() => {
    const isDashboard = pathname.startsWith('/dashboard');
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = isDashboard ? '/operari.json' : '/manifest.json';
    document.head.appendChild(link);
  }, [pathname]);

  return null;
}