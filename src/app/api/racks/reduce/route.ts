import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { calculateRacks, EGGS_PER_RACK } from '@/lib/utils'
import { ApiResponse, ReduceRacksRequest } from '@/types'
import { broadcastEggUpdate } from '@/lib/websocket'

// POST /api/racks/reduce - Reduce rack count (SUPERADMIN only)
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is SUPERADMIN
    const currentUser = await prisma.user.findUnique({
      where: { id: (session.user as { id: string }).id }
    })

    if (currentUser?.role !== 'SUPERADMIN') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only SUPERADMIN can perform this action' },
        { status: 403 }
      )
    }

    const body: ReduceRacksRequest = await request.json()
    const { amount } = body

    if (!amount || amount <= 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Amount must be a positive number' },
        { status: 400 }
      )
    }

    // Get current egg count
    const eggCount = await prisma.eggCount.findFirst()
    
    if (!eggCount) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No egg count record found' },
        { status: 404 }
      )
    }

    const previousCount = eggCount.count
    const { racks: currentRacks } = calculateRacks(previousCount)

    if (amount > currentRacks) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Cannot reduce more racks than available' },
        { status: 400 }
      )
    }

    const eggsToReduce = amount * EGGS_PER_RACK
    const newCount = Math.max(0, previousCount - eggsToReduce)

    // Update egg count
    const updated = await prisma.eggCount.update({
      where: { id: eggCount.id },
      data: { count: newCount }
    })

    // Log the action
    await prisma.eggLog.create({
      data: {
        action: 'REDUCE_RACKS',
        previousCount,
        newCount,
        userId: currentUser.id
      }
    })

    const { racks: newRacks, remainingEggs } = calculateRacks(newCount)

    // Broadcast update via WebSocket
    broadcastEggUpdate({
      count: newCount,
      racks: newRacks,
      remainingEggs,
      lastUpdated: updated.lastUpdated
    })

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          previousCount,
          newCount,
          previousRacks: currentRacks,
          newRacks,
          eggsReduced: eggsToReduce
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error reducing rack count:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
