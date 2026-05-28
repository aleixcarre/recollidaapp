'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export default function Dashboard() {
  const [pickups, setPickups] = useState<any[]>([])

  useEffect(() => {
    fetchPickups()
  }, [])

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

  const pending = pickups.filter(p => p.status === 'pending')
  const done = pickups.filter(p => p.status === 'done')

  return (
    <div style={{ padding: 30 }}>

      <h1>🚛 DASHBOARD OPERARIS</h1>

      {/* 🟢 MAPA */}
      <div style={{ height: 400, marginBottom: 30 }}>
        <MapContainer
          center={[41.98, 2.82]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {pickups.map((p) =>
            p.latitude && p.longitude ? (
              <Marker key={p.id} position={[p.latitude, p.longitude]}>
                <Popup>
                  <b>{p.client_name}</b><br />
                  {p.status}
                </Popup>
              </Marker>
            ) : null
          )}
        </MapContainer>
      </div>

      {/* 🟠 PENDENTS */}
      <h2>PENDENTS</h2>
      {pending.length === 0 && <p>No hi ha pendents</p>}

      {pending.map((p) => (
        <div key={p.id} style={{ border: '1px solid orange', padding: 10, marginBottom: 10 }}>
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
        <div key={p.id} style={{ border: '1px solid green', padding: 10, marginBottom: 10 }}>
          <p><b>Client:</b> {p.client_name}</p>
          <p><b>Lat:</b> {p.latitude}</p>
          <p><b>Lng:</b> {p.longitude}</p>
        </div>
      ))}

    </div>
  )
}
