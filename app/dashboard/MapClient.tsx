'use client'

import { useEffect, useMemo, useState } from 'react'

// 🏭 DEPOT
const DEPOT = {
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

// 🧠 Nearest Neighbor (optimitzat)
function sortByNearest(points: any[]) {
  if (!points?.length) return []

  const remaining = [...points]
  const result: any[] = []

  const first = remaining.shift()
  if (!first) return []

  result.push(first)

  while (remaining.length) {
    const last = result[result.length - 1]

    let nearestIndex = 0
    let nearestDistance = Infinity

    for (let i = 0; i < remaining.length; i++) {
      const d = distance(remaining[i], last)
      if (d < nearestDistance) {
        nearestDistance = d
        nearestIndex = i
      }
    }

    result.push(remaining[nearestIndex])
    remaining.splice(nearestIndex, 1)
  }

  return result
}

export default function MapClient({ pickups }: { pickups: any[] }) {
  const [Map, setMap] = useState<any>(null)
  const [route, setRoute] = useState<any[]>([])
  const [loadingRoute, setLoadingRoute] = useState(false)

  // 🗺️ load leaflet client-side
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
  const validPoints = useMemo(() => {
    return (pickups || []).filter(
      (p) => p.latitude && p.longitude
    )
  }, [pickups])

  // 🧠 ordre optimitzat
  const sorted = useMemo(() => {
    return sortByNearest(validPoints)
  }, [validPoints])

  // 🧭 ruta completa estable
  const routePoints = useMemo(() => {
    return [DEPOT, ...sorted]
  }, [sorted])

  // 🛣️ obtenir ruta real
  useEffect(() => {
    const getRoute = async () => {
      if (routePoints.length < 2) return

      setLoadingRoute(true)

      try {
        const coords = routePoints.map((p) => [
          p.longitude,
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

        const data = await res.json()

        if (!data?.features?.length) {
          setRoute([])
          return
        }

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
      const t = setTimeout(() => {
        map.invalidateSize()
      }, 150)

      return () => clearTimeout(t)
    }, [map])

    return null
  }

  return (
    <div style={{ height: '500px', width: '100%' }}>
      {loadingRoute && (
        <p style={{ marginBottom: 8 }}>🔄 Calculant ruta...</p>
      )}

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

        {/* 🏭 DEPOT */}
        <Marker position={[DEPOT.latitude, DEPOT.longitude]}>
          <Popup>🏭 Magatzem</Popup>
        </Marker>

        {/* 📍 pickups */}
        {sorted.map((p) => (
          <Marker key={p.id} position={[p.latitude, p.longitude]}>
            <Popup>
              <b>{p.client_name}</b>
              <br />
              {p.status}
            </Popup>
          </Marker>
        ))}

        {/* 🛣️ ruta */}
        {route.length > 1 && (
          <Polyline positions={route} color="blue" />
        )}
      </MapContainer>
    </div>
  )
}