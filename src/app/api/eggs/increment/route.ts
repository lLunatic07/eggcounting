import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateRacks, verifyIotApiKey } from '@/lib/utils'
import { ApiResponse } from '@/types'
import { broadcastEggUpdate } from '@/lib/websocket'

// POST /api/eggs/increment - Increment egg count (IoT)
export async function POST(request: NextRequest) {
  try {
    // Verify IoT API key
    const apiKey = request.headers.get('X-API-Key')
    
    if (!verifyIotApiKey(apiKey)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const increment = body.increment || 1

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
    const updated = await prisma.eggCount.update({
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

    const { racks, remainingEggs } = calculateRacks(newCount)

    // Broadcast update via WebSocket
    broadcastEggUpdate({
      count: newCount,
      racks,
      remainingEggs,
      lastUpdated: updated.lastUpdated
    })

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          previousCount,
          newCount,
          racks,
          remainingEggs
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error incrementing egg count:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
