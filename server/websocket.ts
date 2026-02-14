// WebSocket Server for Egg Counting System
// Run with: npx ts-node --esm server/websocket.ts
// Or: node --loader ts-node/esm server/websocket.ts

import { WebSocketServer, WebSocket } from 'ws'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PORT = parseInt(process.env.WS_PORT || '3001')
const IOT_API_KEY = process.env.IOT_API_KEY || 'your-iot-secret-key'
const EGGS_PER_RACK = 30

const wss = new WebSocketServer({ port: PORT })

// Track connected clients
const clients = new Set<WebSocket>()

function calculateRacks(eggCount: number) {
  return {
    racks: Math.floor(eggCount / EGGS_PER_RACK),
    remainingEggs: eggCount % EGGS_PER_RACK
  }
}

async function broadcastEggUpdate() {
  try {
    const eggCount = await prisma.eggCount.findFirst()
    if (!eggCount) return

    const { racks, remainingEggs } = calculateRacks(eggCount.count)
    
    const message = JSON.stringify({
      event: 'egg:updated',
      data: {
        count: eggCount.count,
        racks,
        remainingEggs,
        lastUpdated: eggCount.lastUpdated
      }
    })

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })
  } catch (error) {
    console.error('Error broadcasting egg update:', error)
  }
}

async function handleEggIncrement(increment: number = 1) {
  try {
    // Get or create egg count
    let eggCount = await prisma.eggCount.findFirst()
    
    if (!eggCount) {
      eggCount = await prisma.eggCount.create({
        data: { count: 0 }
      })
    }

    const previousCount = eggCount.count
    const newCount = previousCount + increment

    // Update egg count
    await prisma.eggCount.update({
      where: { id: eggCount.id },
      data: { count: newCount }
    })

    // Log the action
    await prisma.eggLog.create({
      data: {
        action: 'INCREMENT',
        previousCount,
        newCount
      }
    })

    console.log(`🥚 Egg count: ${previousCount} -> ${newCount}`)

    // Broadcast update to all clients
    await broadcastEggUpdate()
  } catch (error) {
    console.error('Error handling egg increment:', error)
  }
}

wss.on('connection', (ws) => {
  console.log('📱 New client connected')
  clients.add(ws)

  // Send current count on connection
  broadcastEggUpdate()

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString())
      console.log('📩 Received:', data)

      if (data.event === 'egg:increment') {
        // Verify API key for IoT devices
        if (data.data?.apiKey !== IOT_API_KEY) {
          ws.send(JSON.stringify({ error: 'Invalid API key' }))
          return
        }

        await handleEggIncrement(data.data?.increment || 1)
      } else if (data.event === 'egg:broadcast') {
        // Broadcast update request from API
        if (data.data?.apiKey !== IOT_API_KEY) {
          ws.send(JSON.stringify({ error: 'Invalid API key' }))
          return
        }
        
        await broadcastEggUpdate()
      }
    } catch (error) {
      console.error('Error parsing message:', error)
    }
  })

  ws.on('close', () => {
    console.log('📴 Client disconnected')
    clients.delete(ws)
  })

  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
    clients.delete(ws)
  })
})

console.log(`WebSocket server running on ws://localhost:${PORT}`)
console.log(` IoT API Key: ${IOT_API_KEY.substring(0, 4)}...`)
