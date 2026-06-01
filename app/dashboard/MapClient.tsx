'use client'

import { useEffect, useMemo, useState } from 'react'

// 🏭 DEPOT
const DEPOT = {
  id: 'depot-root',
  client_name: 'Magatzem Central',
  latitude: 42.1172952,
  longitude: 2.772177,
}

// 📏 distància simple (MVP)
function distance(a: any, b: any) {
  return Math.hypot(
    a.latitude - b.latitude,
    a.longitude - b.longitude
  )
}

// 🧠 Nearest Neighbor (Corregit per començar des del DEPOT)
function sortByNearest(points: any[]) {
  if (!points?.length) return []

  const remaining = [...points]
  const result: any[] = []

  // ARREGLAT: El punt de partida de la lògica sempre ha de ser el Magatzem
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
    currentPoint = nextPoint // El nou punt de referència és l'últim visitat
    remaining.splice(nearestIndex, 1)
  }

  return result
}

export default function MapClient({ pickups }: { pickups: any[] }) {
  const [Map, setMap] = useState<any>(null)
  const [route, setRoute] = useState<any[]>([])
  const [loadingRoute, setLoadingRoute] = useState(false)

  // 🗺️ load leaflet client-side i arreglar icones buides
  useEffect(() => {
    const loadMap = async () => {
      // Importem Leaflet global primer per solucionar les icones fallides de Next.js
      const LIcon = await import('leaflet')
      await import('leaflet/dist/leaflet.css')

      // Fix per evitar icones trencades a producció/Vercel
      delete (LIcon.Icon.Default.prototype as any)._getIconUrl
      LIcon.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      })

      const L = await import('react-leaflet')

      setMap({
        MapContainer: L.MapContainer,
        TileLayer: L.TileLayer,
        Marker: L.Marker,
        Popup: L.Popup,
        useMap: L.useMap,
        Polyline: L.Polyline,
      })
    }

    loadMap()
  }, [])

  // 📍 punts vàlids
  const validPoints = useMemo(() => {
    return (pickups || []).filter(
      (p) => p && p.latitude && p.longitude
    )
  }, [pickups])

  // 🧠 ordre optimitzat
  const sorted = useMemo(() => {
    return sortByNearest(validPoints)
  }, [validPoints])

  // 🧭 ruta completa estable (S'assegura que comença i acaba/passa per l'ordre correcte)
  const routePoints = useMemo(() => {
    return [DEPOT, ...sorted]
  }, [sorted])

  // 🛣️ obtenir ruta real de la teva API
  useEffect(() => {
    const getRoute = async () => {
      // Si només hi ha el magatzem, no hi ha ruta que traçar
      if (routePoints.length < 2) {
        setRoute([])
        return
      }

      setLoadingRoute(true)

      try {
        const coords = routePoints.map((p) => [
          p.longitude, // [long, lat] és l'estàndard GeoJSON de l'API
          p.latitude,
        ])

        const res = await fetch('/api/route', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            coordinates: coords,
          }),
        })

        if (!res.ok) throw new Error('Error en la resposta del servidor')
        const data = await res.json()

        // Validació robusta del GeoJSON retornat pel teu endpoint
        if (!data?.features?.[0]?.geometry?.coordinates) {
          console.warn("L'API no ha retornat coordenades vàlides.")
          setRoute([])
          return
        }

        // ARREGLAT: Invertim a [lat, lon] per a que Leaflet ho entengui correctament
        const line = data.features[0].geometry.coordinates.map(
          (c: any) => [c[1], c[0]]
        )

        setRoute(line)
      } catch (err) {
        console.error('Error ruta:', err)
        setRoute([])
      } finally {
        setLoadingRoute(false)
      }
    }

    getRoute()
  }, [routePoints])

  if (!Map) return <p style={{ padding: '20px' }}>Carregant mapa...</p>

  const {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
    useMap,
  } = Map

  // Força a Leaflet a re-calcular la mida del div (soluciona talls grisos a StackBlitz)
  function FixMap() {
    const map = useMap()
    useEffect(() => {
      const t = setTimeout(() => {
        map.invalidateSize()
      }, 200)
      return () => clearTimeout(t)
    }, [map])
    return null
  }

  return (
    <div style={{ height: '500px', width: '100%', position: 'relative' }}>
      {loadingRoute && (
        <div style={{
          position: 'absolute', 
          top: 10, 
          left: 50, 
          zIndex: 1000, 
          background: 'white', 
          padding: '4px 8px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          🔄 Calculant ruta real...
        </div>
      )}

      <MapContainer
        center={[DEPOT.latitude, DEPOT.longitude]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <FixMap />

        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* 🏭 DEPOT */}
        <Marker position={[DEPOT.latitude, DEPOT.longitude]}>
          <Popup><b>🏭 Magatzem Central</b></Popup>
        </Marker>

        {/* 📍 punts de recollida */}
        {sorted.map((p, idx) => (
          <Marker key={p.id || idx} position={[p.latitude, p.longitude]}>
            <Popup>
              <b>Nº {idx + 1}: {p.client_name || 'Client'}</b>
              <br />
              Estat: {p.status