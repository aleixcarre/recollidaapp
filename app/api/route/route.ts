import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { coordinates } = await req.json()

    if (!coordinates || coordinates.length < 2) {
      return NextResponse.json(
        { error: 'Not enough coordinates' },
        { status: 400 }
      )
    }

    const response = await fetch(
      'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: process.env.ORS_API_KEY!,
        },
        body: JSON.stringify({
          coordinates,
        }),
      }
    )

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error('Route API error:', error)

    return NextResponse.json(
      { error: 'Route error' },
      { status: 500 }
    )
  }
}