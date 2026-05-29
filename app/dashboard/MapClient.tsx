'use client'

import { useEffect, useState } from 'react'

// 🏭 Punt base (MAGATZEM)
const DEPOT = {
  latitude: 42.1172952,
  longitude: 2.772177,
}

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

  // 🗺️ Leaflet només client-side
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

  // 📍 punts vàlids
  const validPoints = (pickups || []).filter(
    (p) => p.latitude && p.longitude
  )

  // 🧠 ordre optimitzat
  const sorted = sortByNearest(validPoints)

  // 🧭 ruta completa (DEPOT + punts)
  const routePoints = [DEPOT, ...sorted]

  // 🛣️ ruta real per carreteres (OpenRouteService)
  useEffect(() => {
    const getRoute = async () => {
      if (routePoints.length < 2) return

      try {
        const coords = routePoints.map((p) => [
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
          routePoints[0]
            ? [routePoints[0].latitude, routePoints[0].longitude]
            : [42.1172952, 2.772177]
        }
        zoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        <FixMap />

        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* 🏭 magatzem */}
        <Marker position={[DEPOT.latitude, DEPOT.longitude]}>
          <Popup>🏭 Magatzem</Popup>
        </Marker>

        {/* 📍 punts clients */}
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