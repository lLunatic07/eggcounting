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
