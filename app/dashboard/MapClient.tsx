'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase' // CORRECCIÓ: Ara apunta bé al fitxer

// 🏭 DEPOT
const DEPOT = {
  id: 'depot-root',
  client_name: 'Magatzem Central',
  latitude: 42.1172952,
  longitude: 2.772177,
}

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

function FixMap({ useMap }: { useMap: any }) {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => { if (map) map.invalidateSize() }, 200)
    return () => clearTimeout(t)
  }, [map])
  return null
}

export default function MapClient({ pickups: initialPickups }: { pickups: any[] }) {
  const [pickups, setPickups] = useState(initialPickups)
  const [Map, setMap] = useState<any>(null)
  const [route, setRoute] = useState<any[]>([])
  const [loadingRoute, setLoadingRoute] = useState(false)

  // 🚀 REALTIME: Sincronització automàtica
  useEffect(() => {
    setPickups(initialPickups)
    
    const channel = supabase
      .channel('realtime-pickups')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pickups' },
        (payload) => {
          setPickups((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel) };
  }, [initialPickups]);

  // 🗺️ Càrrega dinàmica
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

  const validPoints = useMemo(() => {
    return (pickups || []).filter((p) => {
      if (!p || !p.latitude || !p.longitude) return false
      const estat = (p.status || '').toLowerCase()
      return estat !== 'fet' && estat !== 'done' && estat !== 'completed'
    })
  }, [pickups])

  const sorted = useMemo(() => sortByNearest(validPoints), [validPoints])
  const routePoints = useMemo(() => [DEPOT, ...sorted], [sorted])

  useEffect(() => {
    const getRoute = async () => {
      if (routePoints.length < 2) { setRoute([]); return }
      setLoadingRoute(true)
      try {
        const coords = routePoints.map((p) => [p.longitude, p.latitude])
        const res = await fetch('/calcular-ruta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coordinates: coords }),
        })
        const data = await res.json()
        if (data?.features?.[0]?.geometry?.coordinates) {
          const line = data.features[0].geometry.coordinates.map((c: any) => [c[1], c[0]])
          setRoute(line)
        }
      } catch (err) { console.error(err); setRoute([]) } finally { setLoadingRoute(false) }
    }
    getRoute()
  }, [routePoints])

  if (!Map) return <p style={{ padding: '20px' }}>Carregant mapa...</p>
  const { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } = Map

  return (
    <div style={{ height: '500px', width: '100%', position: 'relative' }}>
      {loadingRoute && <div style={{ position: 'absolute', top: 10, left: 50, zIndex: 1000, background: 'white', padding: '4px 8px', borderRadius: '4px' }}>🔄 Recalculant ruta...</div>}
      <MapContainer center={[DEPOT.latitude, DEPOT.longitude]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <FixMap useMap={useMap} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[DEPOT.latitude, DEPOT.longitude]}><Popup><b>🏭 Magatzem Central</b></Popup></Marker>
        {sorted.map((p, idx) => (
          <Marker key={p.id || idx} position={[p.latitude, p.longitude]}>
            <Popup><b>Nº {idx + 1}: {p.client_name}</b></Popup>
          </Marker>
        ))}
        {route.length > 1 && <Polyline positions={route} color="#3b82f6" weight={5} />}
      </MapContainer>
    </div>
  )
}