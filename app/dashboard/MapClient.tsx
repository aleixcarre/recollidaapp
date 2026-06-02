'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

const DEPOT = { id: 'depot-root', client_name: 'Magatzem Central', latitude: 42.1172952, longitude: 2.772177 }

function distance(a: any, b: any) { return Math.hypot(a.latitude - b.latitude, a.longitude - b.longitude) }

function sortByNearest(points: any[]) {
  if (!points?.length) return []
  const remaining = [...points], result = []
  let currentPoint = DEPOT
  while (remaining.length) {
    let nearestIndex = 0, nearestDistance = Infinity
    for (let i = 0; i < remaining.length; i++) {
      const d = distance(remaining[i], currentPoint)
      if (d < nearestDistance) { nearestDistance = d; nearestIndex = i }
    }
    result.push(remaining[nearestIndex])
    currentPoint = remaining[nearestIndex]
    remaining.splice(nearestIndex, 1)
  }
  return result
}

function FixMap({ useMap }: { useMap: any }) {
  const map = useMap()
  useEffect(() => { const t = setTimeout(() => { if (map) map.invalidateSize() }, 200); return () => clearTimeout(t) }, [map])
  return null
}

export default function MapClient({ pickups: initialPickups }: { pickups: any[] }) {
  const [pickups, setPickups] = useState(initialPickups)
  const [Map, setMap] = useState<any>(null)
  const [route, setRoute] = useState<any[]>([])

  // 1. Actualització automàtica cada 5 segons
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await supabase.from('pickups').select('*').order('created_at', { ascending: false })
      if (data) setPickups(data)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // 2. Càrrega Mapa
  useEffect(() => {
    const loadMap = async () => {
      const LIcon = await import('leaflet')
      delete (LIcon.Icon.Default.prototype as any)._getIconUrl
      LIcon.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      })
      const L = await import('react-leaflet')
      setMap({ MapContainer: L.MapContainer, TileLayer: L.TileLayer, Marker: L.Marker, Popup: L.Popup, useMap: L.useMap, Polyline: L.Polyline })
    }
    loadMap()
  }, [])

  const validPoints = useMemo(() => (pickups || []).filter((p) => p.latitude && p.longitude && !['fet', 'done', 'completed'].includes((p.status || '').toLowerCase())), [pickups])
  const sorted = useMemo(() => sortByNearest(validPoints), [validPoints])

  const markAsDone = async (id: number) => {
    await supabase.from('pickups').update({ status: 'done' }).eq('id', id)
    setPickups(pickups.filter(p => p.id !== id))
  }

  if (!Map) return <p style={{ padding: '20px' }}>Carregant mapa...</p>
  const { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } = Map

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px' }}>
      <div style={{ height: '400px', width: '100%' }}>
        <MapContainer center={[DEPOT.latitude, DEPOT.longitude]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <FixMap useMap={useMap} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[DEPOT.latitude, DEPOT.longitude]}><Popup><b>🏭 Magatzem Central</b></Popup></Marker>
          {sorted.map((p, idx) => (
            <Marker key={p.id} position={[p.latitude, p.longitude]}><Popup><b>{p.client_name}</b></Popup></Marker>
          ))}
        </MapContainer>
      </div>

      <h3>Recollides pendents:</h3>
      {sorted.map((p) => (
        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <span><b>{p.client_name}</b></span>
          <button onClick={() => markAsDone(p.id)} style={{ background: 'green', color: 'white', padding: '10px', borderRadius: '5px', border: 'none' }}>
            ✅ Marcar com a fet
          </button>
        </div>
      ))}
    </div>
  )
}