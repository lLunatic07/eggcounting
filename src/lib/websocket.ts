import { EggCountData } from '@/types'

// WebSocket clients storage (for server-side broadcasting)
// This will be initialized by the WebSocket server
let wsClients: Set<{ send: (data: string) => void }> = new Set()

export function setWsClients(clients: Set<{ send: (data: string) => void }>) {
  wsClients = clients
}

export function getWsClients() {
  return wsClients
}

/**
 * Broadcast egg update to all connected WebSocket clients
 */
export function broadcastEggUpdate(data: EggCountData) {
  const message = JSON.stringify({
    event: 'egg:updated',
    data
  })

  wsClients.forEach((client) => {
    try {
      client.send(message)
    } catch (error) {
      console.error('Error sending WebSocket message:', error)
    }
  })
}

// Note: The WebSocket server runs on a separate port (3001)
// since Next.js API routes don't support WebSocket natively.
// See server/websocket.ts for the WebSocket server implementation.

import WebSocket from 'ws'

export async function triggerWebSocketUpdate() {
  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'
  const IOT_API_KEY = process.env.IOT_API_KEY || 'your-iot-secret-key'

  return new Promise<void>((resolve, reject) => {
    try {
      const ws = new WebSocket(WS_URL)

      ws.on('open', () => {
        ws.send(JSON.stringify({
          event: 'egg:broadcast',
          data: { apiKey: IOT_API_KEY }
        }))
        
        // Close after ensuring send, or allow 'close' to handle it.
        // Actually best to wait a tick or just close. 
        // For 'ws' library, send is synchronous mostly but async on the socket. 
        // Safer to close after a small delay or trust it flushes.
        ws.close()
        resolve()
      })

      ws.on('error', (error) => {
        console.error('Bridge WebSocket error:', error)
        // Resolve anyway to not block API response if WS is down
        resolve()
      })
    } catch (error) {
       console.error('Bridge connection error:', error)
       resolve()
    }
  })
}
