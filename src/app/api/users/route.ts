import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { CreateUserRequest, ApiResponse } from '@/types'

// POST /api/users - Create new user (SUPERADMIN only)
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
        { success: false, error: 'Only SUPERADMIN can create users' },
        { status: 403 }
      )
    }

    const body: CreateUserRequest = await request.json()
    const { email, username, password, role } = body

    // Validate input

    if (!username || !password || !role) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Username, password, and role are required' },
        { status: 400 }
      )
    }

    // Check if email or username already exists
    const orConditions: any[] = [{ username }]
    if (email) {
      orConditions.push({ email })
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: orConditions
      }
    })

    if (existingUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Email or username already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: (email || null) as any,
        username,
        password: hashedPassword,
        role
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true
      }
    })

    return NextResponse.json<ApiResponse>(
      { success: true, data: newUser },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
