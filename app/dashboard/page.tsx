'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

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

    if (error) {
      console.log(error)
    } else {
      setPickups(data || [])
    }
  }

  const markAsDone = async (id: number) => {
    const { error } = await supabase
      .from('pickups')
      .update({ status: 'done' })
      .eq('id', id)

    if (!error) {
      fetchPickups()
    }
  }

  const pending = pickups.filter(p => p.status === 'pending')
  const done = pickups.filter(p => p.status === 'done')

  return (
    <div style={{ padding: 30 }}>
      <h1>🚛 DASHBOARD OPERARIS</h1>

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
