'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export default function MapClient({ pickups }: any) {
  return (
    <div style={{ height: 400, marginBottom: 30 }}>
      <MapContainer
        center={[41.98, 2.82] as any}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {pickups?.map((p: any) =>
          p.latitude && p.longitude ? (
            <Marker key={p.id} position={[p.latitude, p.longitude] as any}>
              <Popup>
                <b>{p.client_name}</b><br />
                {p.status}
              </Popup>
            </Marker>
          ) : null
        )}
      </MapContainer>
    </div>
  )
}