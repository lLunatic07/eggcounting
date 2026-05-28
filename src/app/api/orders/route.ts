import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { calculateRacks, EGGS_PER_RACK } from '@/lib/utils'
import { ApiResponse } from '@/types'

// GET /api/orders - Get orders (USER: own orders, SUPERADMIN: all orders)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Anda harus login terlebih dahulu' },
        { status: 401 }
      )
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: (session.user as { id: string }).id }
    })

    if (!currentUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      )
    }

    // SUPERADMIN sees all orders, USER sees only own orders
    const whereClause = currentUser.role === 'SUPERADMIN'
      ? {}
      : { userId: currentUser.id }

    const orders = await prisma.eggShopOrder.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, username: true }
        },
        approvedBy: {
          select: { id: true, username: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json<ApiResponse>(
      { success: true, data: orders },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    )
  }
}

// POST /api/orders - Create a new order (authenticated users)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Anda harus login terlebih dahulu' },
        { status: 401 }
      )
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: (session.user as { id: string }).id }
    })

    if (!currentUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { phoneNumber, count, orderType } = body

    // Validation
    if (!phoneNumber || !phoneNumber.trim()) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Nomor HP wajib diisi' },
        { status: 400 }
      )
    }

    if (!count || count <= 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Jumlah harus lebih dari 0' },
        { status: 400 }
      )
    }

    if (!orderType || !['BUTIR', 'RAK'].includes(orderType)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Jenis pesanan harus BUTIR atau RAK' },
        { status: 400 }
      )
    }

    // Check stock availability
    const eggCount = await prisma.eggCount.findFirst()
    const currentStock = eggCount?.count ?? 0
    const { racks: currentRacks } = calculateRacks(currentStock)

    const eggsNeeded = orderType === 'RAK' ? count * EGGS_PER_RACK : count

    if (eggsNeeded > currentStock) {
      const message = orderType === 'RAK'
        ? `Stok tidak mencukupi. Rak tersedia: ${currentRacks}, diminta: ${count}`
        : `Stok tidak mencukupi. Telur tersedia: ${currentStock}, diminta: ${count}`
      return NextResponse.json<ApiResponse>(
        { success: false, error: message },
        { status: 400 }
      )
    }

    // Create order
    const order = await prisma.eggShopOrder.create({
      data: {
        userId: currentUser.id,
        phoneNumber: phoneNumber.trim(),
        count,
        orderType,
      },
      include: {
        user: {
          select: { id: true, username: true }
        }
      }
    })

    return NextResponse.json<ApiResponse>(
      { success: true, data: order },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    )
  }
}
