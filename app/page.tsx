'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [clientName, setClientName] = useState('')
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null) // 👈 Nou estat

  useEffect(() => {
    const saved = localStorage.getItem('client_name')
    if (saved) setClientName(saved)

    // 🧠 Detectar si l'app es pot instal·lar
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    })
  }, [])

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
    }
  }

  const sendPickup = async () => {
    // ... (el teu codi actual de sendPickup es queda igual)
    if (!clientName) { alert('Introdueix el nom de l’empresa'); return }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { error } = await supabase.from('pickups').insert([
          { client_name: clientName, status: 'pending', latitude: position.coords.latitude, longitude: position.coords.longitude },
        ])
        if (error) alert('Error enviant')
        else alert('Recollida enviada ✔')
        setLoading(false)
      },
      () => { alert('No s’ha pogut obtenir la ubicació'); setLoading(false) }
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 15, padding: 20 }}>
      
      {/* 📥 BOTÓ D'INSTAL·LACIÓ (Només surt si és possible) */}
      {deferredPrompt && (
        <button 
          onClick={handleInstall}
          style={{ padding: '10px 20px', background: '#0070f3', color: 'white', borderRadius: 10, border: 'none', marginBottom: 20 }}
        >
          📥 Instal·lar App al mòbil
        </button>
      )}

      <input
        type="text"
        placeholder="Nom de l’empresa"
        value={clientName}
        onChange={(e) => { setClientName(e.target.value); localStorage.setItem('client_name', e.target.value) }}
        style={{ padding: 15, fontSize: 18, borderRadius: 10, border: '1px solid gray', width: '100%', maxWidth: 260 }}
      />

      <button
        onClick={sendPickup}
        disabled={loading}
        style={{ padding: 30, fontSize: 24, background: 'green', color: 'white', borderRadius: 20, border: 'none', width: '100%', maxWidth: 260 }}
      >
        {loading ? 'Enviant...' : 'DEMANAR RECOLLIDA'}
      </button>

      {/* Instruccions per si el botó no surt */}
      {!deferredPrompt && (
        <p style={{ fontSize: 12, color: 'gray', marginTop: 20, textAlign: 'center' }}>
          Per tenir-ho sempre a mà: clica els 3 puntets del navegador i selecciona "Instal·lar aplicació" o "Afegir a la pantalla d'inici".
        </p>
      )}
    </div>
  )
}