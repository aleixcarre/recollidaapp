'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import dynamic from 'next/dynamic'

const MapClient = dynamic(() => import('./MapClient'), {
  ssr: false,
})

export default function Dashboard() {
  const [pickups, setPickups] = useState<any[]>([])
  const [authorized, setAuthorized] = useState(false)
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (authorized) {
      fetchPickups()
    }
  }, [authorized])

  const fetchPickups = async () => {
    const { data, error } = await supabase
      .from('pickups')
      .select('*')
      .order('id', { ascending: false })

    if (!error) setPickups(data || [])
  }

  const markAsDone = async (id: number) => {
    const { error } = await supabase
      .from('pickups')
      .update({ status: 'done' })
      .eq('id', id)

    // Al fer fetch de nou, s'actualitzarà la llista de Supabase.
    // Com que el mapa i el dashboard només mostren el que respon l'estat,
    // el punt desapareixerà de la pantalla i del mapa a l'acte.
    if (!error) fetchPickups()
  }

  // Mantenim només el filtre de pendents (estat 'pending')
  const pending = pickups.filter((p) => p.status === 'pending')

  const login = () => {
    if (password === process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD) {
      setAuthorized(true)
    } else {
      alert('Contrasenya incorrecta')
    }
  }

  if (!authorized) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <h1>🔒 Dashboard Operaris</h1>

        <input
          type="password"
          placeholder="Contrasenya"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            padding: 15,
            fontSize: 18,
            borderRadius: 10,
            border: '1px solid gray',
          }}
        />

        <button
          onClick={login}
          style={{
            padding: 15,
            fontSize: 18,
            backgroundColor: 'black',
            color: 'white',
            borderRadius: 10,
            cursor: 'pointer'
          }}
        >
          Entrar
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: 30, fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>

      <h1 style={{ marginBottom: 20 }}>🚛 DASHBOARD OPERARIS</h1>

      {/* 🗺️ MAPA (Rep pickups; el mapa ja està programat per ocultar els 'done') */}
      <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: 30 }}>
        <MapClient pickups={pickups} />
      </div>

      {/* 🟠 RUTES I SERVEIS PENDENTS */}
      <h2 style={{ color: '#e67e22', borderBottom: '2px solid #f39c12', paddingBottom: 10 }}>
        📍 PROXIMES RECOLLIDES PENDENTS
      </h2>

      {pending.length === 0 && (
        <p style={{ textAlign: 'center', color: 'gray', padding: '20px', fontSize: '18px' }}>
          🎉 Feina feta! No queden recollides pendents per avui.
        </p>
      )}

      <div style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
        {pending.map((p) => (
          <div
            key={p.id}
            style={{
              border: '1px solid #ffe0b2',
              backgroundColor: '#fffaf0',
              padding: '20px',
              borderRadius: '10px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '15px'
            }}
          >
            <div>
              <p style={{ margin: '0 0 5px 0', fontSize: '18px' }}><b>Client:</b> {p.client_name}</p>
              <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
                🗺️ Coord: {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}
              </p>
            </div>

            <button 
              onClick={() => markAsDone(p.id)}
              style={{
                padding: '10px 20px',
                fontSize: '15px',
                backgroundColor: '#2ecc71',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(46, 204, 113, 0.3)'
              }}
            >
              ✔ Marcar com feta
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}