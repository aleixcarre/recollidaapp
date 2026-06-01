export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { coordinates } = await req.json()

    // 1. Validació bàsica
    if (!coordinates || coordinates.length < 2) {
      return NextResponse.json(
        { error: 'Es necessiten com a mínim 2 punts (Origen i Destí).' },
        { status: 400 }
      )
    }

    // 2. Comprovació de la Clau d'API
    if (!process.env.ORS_API_KEY) {
      console.error("🚨 ERROR: Falta la variable d'entorn ORS_API_KEY");
      return NextResponse.json(
        { error: "Configuració del servidor incompleta (Falta API Key)" },
        { status: 500 }
      )
    }

    // 3. Crida a OpenRouteService
    const response = await fetch(
      'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Assegura't que no hi hagi espais estranys
          Authorization: process.env.ORS_API_KEY.trim(),
        },
        body: JSON.stringify({ 
          coordinates: coordinates 
        }),
      }
    )

    const data = await response.json()

    // 4. CONTROL D'ERRORS D'ORS: Si l'API d'ORS respon un error (codis 400, 401, 403, etc.)
    if (!response.ok) {
      console.error('❌ Error provinent de l\'API d\'OpenRouteService:', data)
      return NextResponse.json(
        { 
          error: 'ORS ha rebutjat la petició', 
          details: data?.error || data 
        },
        { status: response.status }
      )
    }

    // 5. Tot ha anat bé, retornem el GeoJSON net
    return NextResponse.json(data)

  } catch (error) {
    console.error('🔥 Route error crític al servidor de Next.js:', error)
    return NextResponse.json(
      { error: 'Error intern del servidor al processar la ruta' },
      { status: 500 }
    )
  }
}