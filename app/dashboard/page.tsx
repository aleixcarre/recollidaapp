'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import dynamic from 'next/dynamic'

const MapClient = dynamic(() => import('./MapClient'), {
  ssr: false,
})

// 🏭 DEPOT (Punt de partida i retorn de la ruta per defecte)
const DEPOT = {
  latitude: 42.1172952,
  longitude: 2.772177,
}

// 📏 Càlcul de distància simple per ordenar els punts abans d'exportar-los
function distance(a: any, b: any) {
  return Math.hypot(a.latitude - b.latitude, a.longitude - b.longitude)
}

function sortByNearest(points: any[]) {
  if (!points?.length) return []
  const remaining = [...points]
  const result: any[] = []
  let currentPoint = DEPOT

  while (remaining.length) {
    let nearestIndex = 0
    let nearestDistance = Infinity
    for (let i = 0; i < remaining.length; i++) {
      const d = distance(remaining[i], currentPoint)
      if (d < nearestDistance) {
        nearestDistance = d
        nearestIndex = i
      }
    }
    const nextPoint = remaining[nearestIndex]
    result.push(nextPoint)
    currentPoint = nextPoint
    remaining.splice(nearestIndex, 1)
  }
  return result
}

export default function Dashboard() {
  const [pickups, setPickups] = useState<any[]>([])
  const [authorized, setAuthorized] = useState(false)
  const [password, setPassword] = useState('')
  const [exporting, setExporting] = useState(false)

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

  // Filtrem i ordenem per proximitat
  const pending = pickups.filter((p) => p.status === 'pending')
  const sortedPending = sortByNearest(pending)

  // 💾 FUNCIÓ ASSEGURADA: Demana la carretera real i genera el traçat mil·limètric en el GPX
  const downloadGPX = async () => {
    if (sortedPending.length === 0) return alert('No hi ha rutes per exportar')
    
    setExporting(true)

    try {
      // 1. Preparem els punts ordenats partint del magatzem central
      const routePoints = [DEPOT, ...sortedPending]
      const coords = routePoints.map((p) => [p.longitude, p.latitude])

      // 2. Truquem a la teva API de rutes reals (OpenRouteService / OSRM)
      const res = await fetch('/calcular-ruta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinates: coords }),
      })

      if (!res.ok) throw new Error('Error en obtenir el traçat de la carretera')
      const data = await res.json()

      // Obtenim la llista de micro-coordenades que formen cada revolt del carrer
      const streetCoordinates = data?.features?.[0]?.geometry?.coordinates
      if (!streetCoordinates || streetCoordinates.length === 0) {
        throw new Error('No s’han trobat geometries de carrer demanades')
      }

      // 3. Generem l'XML oficial amb el format <trkseg> (Track Segment), que és el que pinta la línia contínua al GPS
      let gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="RecollidaApp" 
  xmlns="http://www.topografix.com/GPX/1/1" 
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <trk>
    <name>Ruta Real de Recollida</name>
    <trkseg>
`

      // Recorrem totes les coordenades reals de la carretera i les afegim com a punts de traçat (trkpt)
      streetCoordinates.forEach((c: [number, number]) => {
        gpxContent += `      <trkpt lat="${c[1]}" lon="${c[0]}"></trkpt>\n`
      })

      gpxContent += `    </trkseg>
  </trk>
</gpx>`

      // 4. Executem la descàrrega del fitxer amb el tipus MIME correcte
      const blob = new Blob([gpxContent], { type: 'application/gpx+xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `ruta_traçat_real_${new Date().toISOString().split('T')[0]}.gpx`
      link.click()
      URL.revokeObjectURL(url)

    } catch (err) {
      console.error(err)
      alert('Error en generar el fitxer amb el traçat real dels carrers.')
    } finally {
      setExporting(false)
    }
  }

  const openInGoogleMaps = () => {
    if (sortedPending.length === 0) return alert('No hi ha punts per obrir')

    const origin = `${DEPOT.latitude},${DEPOT.longitude}`
    const destination = `${DEPOT.latitude},${DEPOT.longitude}`
    const waypoints = sortedPending.map(p => `${p.latitude},${p.longitude}`).join('|')
    
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${encodeURIComponent(waypoints)}&travelmode=driving`
    window.open(url, '_blank')
  }

  const login = () => {
    if (password === process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD) {
      setAuthorized(true)
    } else {
      alert('Contrasenya incorrecta')
    }
  }

  if (!authorized) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
        <h1>🔒 Dashboard Operaris</h1>
        <input
          type="password"
          placeholder="Contrasenya"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 15, fontSize: 18, borderRadius: 10, border: '1px solid gray' }}
        />
        <button onClick={login} style={{ padding: 15, fontSize: 18, backgroundColor: 'black', color: 'white', borderRadius: 10, cursor: 'pointer' }}>
          Entrar
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: 30, fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>

      <h1 style={{ marginBottom: 20 }}>🚛 DASHBOARD OPERARIS</h1>

      {/* 🗺️ MAPA */}
      <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: 30 }}>
        <MapClient pickups={pickups} />
      </div>

      {/* 📥 ACCIONS DE DESCÀRREGA I GPS */}
      {sortedPending.length > 0 && (
        <div style={{ 
          display: 'flex', 
          gap: '15px', 
          marginBottom: '30px', 
          backgroundColor: '#f1f5f9', 
          padding: '15px', 
          borderRadius: '10px' 
        }}>
          <button 
            onClick={openInGoogleMaps}
            style={{
              flex: 1, padding: '14px', fontSize: '15px', backgroundColor: '#4285F4', 
              color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
            }}
          >
            📱 Obrir ruta al mòbil (Google Maps)
          </button>
          
          <button 
            onClick={downloadGPX}
            disabled={exporting}
            style={{
              flex: 1, padding: '14px', fontSize: '15px', backgroundColor: '#0f172a', 
              color: 'white', border: 'none', borderRadius: '8px', cursor: exporting ? 'not-allowed' : 'pointer', fontWeight: 'bold',
              opacity: exporting ? 0.6 : 1
            }}
          >
            {exporting ? '🔄 Processant carrers...' : '💾 Descarregar fitxer .GPX (GPS)'}
          </button>
        </div>
      )}

      {/* 🟠 RUTES I SERVEIS PENDENTS */}
      <h2 style={{ color: '#e67e22', borderBottom: '2px solid #f39c12', paddingBottom: 10 }}>
        📍 PRÒXIMES RECOLLIDES PENDENTS
      </h2>

      {sortedPending.length === 0 && (
        <p style={{ textAlign: 'center', color: 'gray', padding: '20px', fontSize: '18px' }}>
          🎉 Feina feta! No queden recollides pendents per avui.
        </p>
      )}

      <div style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
        {sortedPending.map((p, idx) => (
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
              <p style={{ margin: '0 0 5px 0', fontSize: '18px' }}><b>Nº {idx + 1}:</b> {p.client_name}</p>
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