'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [loading, setLoading] = useState(false)

  const sendPickup = async () => {
    setLoading(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude

        const { error } = await supabase.from('pickups').insert([
          {
            client_name: 'Client MVP',
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
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <button
        onClick={sendPickup}
        style={{
          padding: 40,
          fontSize: 28,
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