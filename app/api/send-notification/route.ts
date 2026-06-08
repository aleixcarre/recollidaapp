import { NextResponse } from 'next/server'
import { sendNotification } from '../../../lib/firebase/sendNotification'

export async function POST(req: Request) {
  try {
    const { clientName } = await req.json()

    await sendNotification(
      'Nova recollida 🚛',
      `Nova comanda de ${clientName}`
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error enviant notificació:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}