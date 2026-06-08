import admin from './firebase-admin'

export async function sendNotification(
  title: string,
  body: string
) {
  try {
    await admin.messaging().send({
      topic: 'operaris',
      notification: {
        title,
        body,
      },
    })

    console.log('Notificació enviada')
  } catch (error) {
    console.error('Error enviant notificació:', error)
  }
}