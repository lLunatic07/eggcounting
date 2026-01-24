import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateRacks } from '@/lib/utils'
import { ApiResponse, EggCountData } from '@/types'

// GET /api/eggs - Get current egg count (Public)
export async function GET() {
  try {
    // Get or create egg count record
    let eggCount = await prisma.eggCount.findFirst()
    
    if (!eggCount) {
      eggCount = await prisma.eggCount.create({
        data: { count: 0 }
      })
    }

    const { racks, remainingEggs } = calculateRacks(eggCount.count)

    const data: EggCountData = {
      count: eggCount.count,
      racks,
      remainingEggs,
      lastUpdated: eggCount.lastUpdated
    }

    return NextResponse.json<ApiResponse<EggCountData>>(
      { success: true, data },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching egg count:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
