import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { calculateRacks, EGGS_PER_RACK } from '@/lib/utils'
import { ApiResponse } from '@/types'
import { broadcastEggUpdate } from '@/lib/websocket'

// PATCH /api/orders/[id] - Approve or reject an order (SUPERADMIN only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Anda harus login terlebih dahulu' },
        { status: 401 }
      )
    }

    // Check if user is SUPERADMIN
    const currentUser = await prisma.user.findUnique({
      where: { id: (session.user as { id: string }).id }
    })

    if (currentUser?.role !== 'SUPERADMIN') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Hanya admin utama yang dapat melakukan aksi ini' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { action, rejectedReason } = body

    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Aksi harus setujui atau tolak' },
        { status: 400 }
      )
    }

    // Find the order
    const order = await prisma.eggShopOrder.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true } }
      }
    })

    if (!order) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Pesanan tidak ditemukan' },
        { status: 404 }
      )
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Order sudah diproses sebelumnya' },
        { status: 400 }
      )
    }

    // --- APPROVE ---
    if (action === 'APPROVE') {
      // Check stock availability
      const eggCount = await prisma.eggCount.findFirst()

      if (!eggCount) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Data jumlah telur tidak ditemukan' },
          { status: 404 }
        )
      }

      const previousCount = eggCount.count
      const eggsToReduce = order.orderType === 'RAK'
        ? order.count * EGGS_PER_RACK
        : order.count

      if (eggsToReduce > previousCount) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: `Stok tidak mencukupi. Tersedia: ${previousCount}, dibutuhkan: ${eggsToReduce}` },
          { status: 400 }
        )
      }

      const newCount = previousCount - eggsToReduce

      // Update egg count
      const updated = await prisma.eggCount.update({
        where: { id: eggCount.id },
        data: { count: newCount }
      })

      // Update order status
      const updatedOrder = await prisma.eggShopOrder.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById: currentUser.id,
          approvedAt: new Date(),
        },
        include: {
          user: { select: { id: true, username: true } },
          approvedBy: { select: { id: true, username: true } }
        }
      })

      // Log the action
      await prisma.eggLog.create({
        data: {
          action: 'SHOP_APPROVED',
          previousCount,
          newCount,
          userId: currentUser.id,
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
            order: updatedOrder,
            previousCount,
            newCount,
            eggsReduced: eggsToReduce,
            racks,
            remainingEggs,
          }
        },
        { status: 200 }
      )
    }

    // --- REJECT ---
    if (action === 'REJECT') {
      if (!rejectedReason || !rejectedReason.trim()) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Alasan penolakan wajib diisi' },
          { status: 400 }
        )
      }

      const updatedOrder = await prisma.eggShopOrder.update({
        where: { id },
        data: {
          status: 'REJECTED',
          approvedById: currentUser.id,
          rejectedReason: rejectedReason.trim(),
        },
        include: {
          user: { select: { id: true, username: true } },
          approvedBy: { select: { id: true, username: true } }
        }
      })

      // Log the action
      const eggCount = await prisma.eggCount.findFirst()
      const currentCount = eggCount?.count ?? 0

      await prisma.eggLog.create({
        data: {
          action: 'SHOP_REJECTED',
          previousCount: currentCount,
          newCount: currentCount,
          userId: currentUser.id,
        }
      })

      return NextResponse.json<ApiResponse>(
        { success: true, data: { order: updatedOrder } },
        { status: 200 }
      )
    }

    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Aksi tidak valid' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error processing order:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    )
  }
}
