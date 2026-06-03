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

  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await supabase.from('pickups').select('*').order('created_at', { ascending: false })
      if (data) setPickups(data)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

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
  const routePoints = useMemo(() => [DEPOT, ...sorted], [sorted])

  useEffect(() => {
    const getRoute = async () => {
      if (routePoints.length < 2) { setRoute([]); return }
      try {
        const res = await fetch('/calcular-ruta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coordinates: routePoints.map((p) => [p.longitude, p.latitude]) }),
        })
        const data = await res.json()
        if (data?.features?.[0]?.geometry?.coordinates) {
          setRoute(data.features[0].geometry.coordinates.map((c: any) => [c[1], c[0]]))
        }
      } catch (err) { console.error(err); setRoute([]) }
    }
    getRoute()
  }, [routePoints])

  const markAsDone = async (id: number) => {
    await supabase.from('pickups').update({ status: 'done' }).eq('id', id)
    setPickups(pickups.filter(p => p.id !== id))
  }

  const downloadGPX = () => {
    if (!route || route.length === 0) return;

    // Capçalera estàndard XML/GPX perquè qualsevol dispositiu o aplicació GPS la reconegui nativament
    const gpxHeader = '<?xml version="1.0" encoding="UTF-8"?>\n' +
                      '<gpx version="1.1" creator="AppRutes" ' +
                      'xmlns="http://www.topografix.com/GPX/1/1" ' +
                      'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
                      'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">\n' +
                      '  <rte>\n' +
                      '    <name>Ruta Optimitzada de Recollida</name>\n';

    // Es generen els punts de la ruta de manera vàlida amb tancament xml explícit
    const gpxPoints = route.map(c => `    <rtept lat="${c[0]}" lon="${c[1]}"></rtept>`).join('\n');
    const gpxFooter = '\n  </rte>\n</gpx>';

    // Fem servir el tipus MIME correcte d'un fitxer GPX per a dispositius mòbils/GPS
    const blob = new Blob([gpxHeader + gpxPoints + gpxFooter], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ruta_diaria.gpx';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!Map) return <p style={{ padding: '20px' }}>Carregant mapa...</p>
  const { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } = Map

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px' }}>
      
      {/* 1. SECCIÓ DEL MAPA */}
      <div style={{ height: '400px', width: '100%' }}>
        <MapContainer center={[DEPOT.latitude, DEPOT.longitude]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <FixMap useMap={useMap} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[DEPOT.latitude, DEPOT.longitude]}><Popup><b>🏭 Magatzem Central</b></Popup></Marker>
          {sorted.map((p) => (
            <Marker key={p.id} position={[p.latitude, p.longitude]}><Popup><b>{p.client_name}</b></Popup></Marker>
          ))}
          {route.length > 1 && <Polyline positions={route} color="#3b82f6" weight={5} />}
        </MapContainer>
      </div>

      {/* 2. BOTÓ DE DESCÀRREGA */}
      <button onClick={downloadGPX} style={{ background: '#333', color: 'white', padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
        💾 Descarregar ruta GPX para GPS
      </button>

      {/* 3. FEED NET DE RECOLLIDES (Sense duplicats de codi) */}
      <div style={{ marginTop: '10px' }}>
        <h3 style={{ borderBottom: '2px solid #f59e0b', paddingBottom: '5px', color: '#333' }}>📍 Recollides Pendents</h3>
        
        {sorted.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
            {sorted.map((p) => (
              <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '15px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '16px' }}><b>{p.client_name}</b></span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => markAsDone(p.id)} style={{ background: '#22c55e', color: 'white', padding: '8px 16px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontWeight: '5px' }}>✅ Fet</button>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`} target="_blank" rel="noopener noreferrer" style={{ background: '#4285F4', color: 'white', padding: '8px 16px', borderRadius: '5px', textDecoration: 'none', fontSize: '14px', display: 'inline-flex', alignItems: 'center' }}>📍 Google Maps</a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', background: '#f0fdf4', color: '#166534', borderRadius: '8px', border: '1px solid #bbf7d0', marginTop: '15px' }}>
            🎉 <b>Feina feta! No queden recollides pendents per avui.</b>
          </div>
        )}
      </div>

    </div>
  )
}