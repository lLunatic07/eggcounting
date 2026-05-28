import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sendOtpEmail, generateOtp } from '@/lib/mailer'
import { ApiResponse, RegisterRequest } from '@/types'

// POST /api/auth/register/send-otp
export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json()
    const { username, email, password } = body

    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Nama pengguna, email, dan kata sandi wajib diisi' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Format email tidak valid' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Kata sandi minimal 6 karakter' },
        { status: 400 }
      )
    }

    // Check if username already exists in User table
    const existingUsername = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUsername) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Nama pengguna sudah digunakan' },
        { status: 400 }
      )
    }

    // Check if email already exists in User table
    const existingEmail = await prisma.user.findFirst({
      where: { email }
    })

    if (existingEmail) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Email sudah terdaftar' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Generate OTP
    const otpCode = generateOtp()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Delete any existing OTP for this email
    await prisma.otpVerification.deleteMany({
      where: { email }
    })

    // Save OTP + registration data
    await prisma.otpVerification.create({
      data: {
        email,
        username,
        password: hashedPassword,
        otpCode,
        expiresAt,
      }
    })

    // Send OTP email
    await sendOtpEmail(email, otpCode)

    return NextResponse.json<ApiResponse>(
      { success: true, data: { message: 'Kode OTP telah dikirim ke email' } },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error sending OTP:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Gagal mengirim OTP. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}
