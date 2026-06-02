'use client';
import { useState, useEffect } from 'react';

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setShowButton(false);
        }
        setDeferredPrompt(null);
      });
    }
  };

  if (!showButton) return null;

  return (
    <button 
      onClick={handleInstall}
      style={{
        position: 'fixed', bottom: '20px', right: '20px', 
        padding: '15px', backgroundColor: '#000', color: '#fff', 
        borderRadius: '10px', zIndex: 9999
      }}
    >
      Instal·lar Recollidapp
    </button>
  );
}