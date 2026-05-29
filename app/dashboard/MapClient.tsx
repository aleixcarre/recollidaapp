'use client'

import { useEffect, useState } from 'react'

// 🧠 Ordenació per proximitat (Nearest Neighbor)
function sortByNearest(points: any[]) {
  if (!points.length) return []

  const remaining = [...points]
  const result: any[] = []

  result.push(remaining.shift())

  while (remaining.length > 0) {
    const last = result[result.length - 1]

    let nearestIndex = 0
    let nearestDistance = Infinity

    remaining.forEach((p, i) => {
      const d = Math.hypot(
        p.latitude - last.latitude,
        p.longitude - last.longitude
      )

      if (d < nearestDistance) {
        nearestDistance = d
        nearestIndex = i
      }
    })

    result.push(remaining[nearestIndex])
    remaining.splice(nearestIndex, 1)
  }

  return result
}

export default function MapClient({ pickups }: { pickups: any[] }) {
  const [Map, setMap] = useState<any>(null)
  const [route, setRoute] = useState<any[]>([])

  // 🗺️ carregar leaflet només client-side
  useEffect(() => {
    const loadMap = async () => {
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

  const validPoints = (pickups || []).filter(
    (p) => p.latitude && p.longitude
  )

  const sorted = sortByNearest(validPoints)

  // 🛣️ ruta real per carreteres (OpenRouteService)
  useEffect(() => {
    const getRoute = async () => {
      if (sorted.length < 2) return

      try {
        const coords = sorted.map((p) => [
          p.longitude,
          p.latitude,
        ])

        const res = await fetch(
          'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: process.env.NEXT_PUBLIC_ORS_API_KEY!,
            },
            body: JSON.stringify({
              coordinates: coords,
            }),
          }
        )

        const data = await res.json()

        const line = data.features[0].geometry.coordinates.map(
          (c: any) => [c[1], c[0]]
        )

        setRoute(line)
      } catch (err) {
        console.log('Error ruta:', err)
      }
    }

    getRoute()
  }, [pickups])

  if (!Map) return <p>Carregant mapa...</p>

  const {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
    useMap,
  } = Map

  function FixMap() {
    const map = useMap()

    useEffect(() => {
      setTimeout(() => {
        map.invalidateSize()
      }, 200)
    }, [map])

    return null
  }

  return (
    <div style={{ height: '500px', width: '100%', marginBottom: 30 }}>
      <MapContainer
        center={
          sorted[0]
            ? [sorted[0].latitude, sorted[0].longitude]
            : [41.98, 2.82]
        }
        zoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        <FixMap />

        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* 📍 punts */}
        {sorted.map((p) => (
          <Marker key={p.id} position={[p.latitude, p.longitude]}>
            <Popup>
              <b>{p.client_name}</b>
              <br />
              {p.status}
            </Popup>
          </Marker>
        ))}

        {/* 🛣️ ruta real */}
        {route.length > 1 && (
          <Polyline positions={route} color="blue" />
        )}
      </MapContainer>
    </div>
  )
}