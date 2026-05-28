// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'

export default function MapClient({ pickups }) {
  const [Map, setMap] = useState(null)

  useEffect(() => {
    const loadMap = async () => {
      const L = await import('react-leaflet')

      setMap({
        MapContainer: L.MapContainer,
        TileLayer: L.TileLayer,
        Marker: L.Marker,
        Popup: L.Popup,
      })
    }

    loadMap()
  }, [])

  if (!Map) {
    return <p>Carregant mapa...</p>
  }

  const { MapContainer, TileLayer, Marker, Popup } = Map

  return (
    <div style={{ height: 400, marginBottom: 30 }}>
      <MapContainer
        center={[41.98, 2.82]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {pickups?.map((p) =>
          p.latitude && p.longitude ? (
            <Marker
              key={p.id}
              position={[p.latitude, p.longitude]}
            >
              <Popup>
                <b>{p.client_name}</b>
                <br />
                {p.status}
              </Popup>
            </Marker>
          ) : null
        )}
      </MapContainer>
    </div>
  )
}