'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [clientName, setClientName] = useState('')

  const sendPickup = async () => {
    if (!clientName) {
      alert('Introdueix el nom de l’empresa')
      return
    }

    setLoading(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude

        const { error } = await supabase.from('pickups').insert([
          {
            client_name: clientName,   // 👈 ARA ÉS DINÀMIC
            status: 'pending',
            latitude,
            longitude
          }
        ])

        if (error) {
          console.log(error)
          alert('Error enviant')
        } else {
          alert('Recollida enviada ✔')
          setClientName('')
        }

        setLoading(false)
      },

      (error) => {
        console.log(error)
        alert('No s’ha pogut obtenir la ubicació')
        setLoading(false)
      }
    )
  }

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 15
      }}
    >
      <input
        type="text"
        placeholder="Nom de l’empresa"
        value={clientName}
        onChange={(e) => setClientName(e.target.value)}
        style={{
          padding: 15,
          fontSize: 18,
          borderRadius: 10,
          border: '1px solid gray',
          width: 250
        }}
      />

      <button
        onClick={sendPickup}
        style={{
          padding: 30,
          fontSize: 24,
          background: 'green',
          color: 'white',
          borderRadius: 20,
          border: 'none'
        }}
      >
        {loading ? 'Enviant...' : 'DEMANAR RECOLLIDA'}
      </button>
    </div>
  )
}