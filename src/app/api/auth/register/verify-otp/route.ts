import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponse, VerifyOtpRequest } from '@/types'

// POST /api/auth/register/verify-otp
export async function POST(request: NextRequest) {
  try {
    const body: VerifyOtpRequest = await request.json()
    const { email, otpCode } = body

    // Validate input
    if (!email || !otpCode) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Email dan kode OTP wajib diisi' },
        { status: 400 }
      )
    }

    // Find OTP record
    const otpRecord = await prisma.otpVerification.findFirst({
      where: { email, otpCode }
    })

    if (!otpRecord) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Kode OTP salah' },
        { status: 400 }
      )
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      // Clean up expired OTP
      await prisma.otpVerification.delete({
        where: { id: otpRecord.id }
      })

      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Kode OTP sudah kadaluarsa. Silakan kirim ulang.' },
        { status: 400 }
      )
    }

    // Double-check username/email uniqueness before creating user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: otpRecord.username },
          { email: otpRecord.email }
        ]
      }
    })

    if (existingUser) {
      await prisma.otpVerification.delete({
        where: { id: otpRecord.id }
      })

      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Username atau email sudah terdaftar' },
        { status: 400 }
      )
    }

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        email: otpRecord.email,
        username: otpRecord.username,
        password: otpRecord.password,
        role: 'USER',
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      }
    })

    // Delete OTP record
    await prisma.otpVerification.delete({
      where: { id: otpRecord.id }
    })

    return NextResponse.json<ApiResponse>(
      { success: true, data: { message: 'Akun berhasil dibuat!', user: newUser } },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error verifying OTP:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Gagal memverifikasi OTP. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}
