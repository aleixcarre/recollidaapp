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

    if (!error) fetchPickups()
  }

  const pending = pickups.filter((p) => p.status === 'pending')
  const done = pickups.filter((p) => p.status === 'done')

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
          }}
        >
          Entrar
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: 30 }}>

      <h1>🚛 DASHBOARD OPERARIS</h1>

      {/* 🗺️ MAPA */}
      <MapClient pickups={pickups} />

      {/* 🟠 PENDENTS */}
      <h2>PENDENTS</h2>

      {pending.length === 0 && <p>No hi ha pendents</p>}

      {pending.map((p) => (
        <div
          key={p.id}
          style={{
            border: '1px solid orange',
            padding: 10,
            marginBottom: 10,
          }}
        >
          <p><b>Client:</b> {p.client_name}</p>
          <p><b>Lat:</b> {p.latitude}</p>
          <p><b>Lng:</b> {p.longitude}</p>

          <button onClick={() => markAsDone(p.id)}>
            ✔ Marcar com feta
          </button>
        </div>
      ))}

      {/* 🟢 COMPLETADES */}
      <h2 style={{ marginTop: 30 }}>COMPLETADES</h2>

      {done.length === 0 && <p>No hi ha completades</p>}

      {done.map((p) => (
        <div
          key={p.id}
          style={{
            border: '1px solid green',
            padding: 10,
            marginBottom: 10,
          }}
        >
          <p><b>Client:</b> {p.client_name}</p>
          <p><b>Lat:</b> {p.latitude}</p>
          <p><b>Lng:</b> {p.longitude}</p>
        </div>
      ))}
    </div>
  )
}