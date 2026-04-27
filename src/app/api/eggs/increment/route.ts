import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateRacks, verifyIotApiKey } from '@/lib/utils'
import { ApiResponse } from '@/types'
import { triggerWebSocketUpdate } from '@/lib/websocket'

// POST /api/eggs/increment - Increment egg count (IoT)
// Menerima dua mode:
//   1. { totalCount: N } — ESP kirim jumlah absolut, server hitung selisih (IDEMPOTENT, retry-safe)
//   2. { increment: N }  — fallback mode lama (TIDAK retry-safe)
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

    // Get or create egg count
    let eggCount = await prisma.eggCount.findFirst()
    
    if (!eggCount) {
      eggCount = await prisma.eggCount.create({
        data: { count: 0 }
      })
    }

    const previousCount = eggCount.count
    let newCount: number

    if (body.totalCount !== undefined) {
      // ✅ Mode idempotent: ESP kirim total absolut
      // Server hanya update kalau totalCount > count saat ini
      // Retry berapa kali pun, hasilnya tetap sama
      const totalCount = Number(body.totalCount)

      if (totalCount <= previousCount) {
        // Sudah diproses sebelumnya (retry dari ESP), skip
        const { racks, remainingEggs } = calculateRacks(previousCount)
        return NextResponse.json<ApiResponse>(
          {
            success: true,
            data: {
              previousCount,
              newCount: previousCount,
              racks,
              remainingEggs,
              skipped: true
            }
          },
          { status: 200 }
        )
      }

      newCount = totalCount
    } else {
      // Fallback: mode increment lama (backward compatible)
      const increment = body.increment || 1
      newCount = previousCount + increment
    }

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

    const { racks, remainingEggs } = calculateRacks(newCount)

    // Broadcast update via WebSocket
    await triggerWebSocketUpdate()

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
