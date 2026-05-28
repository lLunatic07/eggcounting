'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Mail, User, Lock, ArrowRight, RefreshCw } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import axios from 'axios'

type Step = 'register' | 'otp'

export default function RegisterPage() {
  const router = useRouter()

  // Step state
  const [step, setStep] = useState<Step>('register')

  // Form fields
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // OTP fields
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Status
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Timer
  const [countdown, setCountdown] = useState(300) // 5 minutes
  const [canResend, setCanResend] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Countdown timer
  useEffect(() => {
    if (step !== 'otp') return
    if (countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [step, countdown])

  // Resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) {
      setCanResend(true)
      return
    }

    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [resendCooldown])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // Handle send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Client-side validation
    if (!username.trim()) {
      setError('Username wajib diisi')
      return
    }

    if (!email.trim()) {
      setError('Email wajib diisi')
      return
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter')
      return
    }

    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok')
      return
    }

    setIsLoading(true)

    try {
      await axios.post('/api/auth/register/send-otp', {
        username: username.trim(),
        email: email.trim(),
        password,
      })

      setStep('otp')
      setCountdown(300)
      setCanResend(false)
      setResendCooldown(60)
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error)
      } else {
        setError('Terjadi kesalahan. Silakan coba lagi.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return // Only digits

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1) // Take last digit only
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      otpRefs.current[5]?.focus()
    }
  }

  // Handle verify OTP
  const handleVerifyOtp = useCallback(async () => {
    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      setError('Masukkan 6 digit kode OTP')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await axios.post('/api/auth/register/verify-otp', {
        email: email.trim(),
        otpCode,
      })

      setSuccess('Akun berhasil dibuat! Mengalihkan ke halaman login...')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error)
      } else {
        setError('Gagal memverifikasi OTP. Silakan coba lagi.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [otp, email, router])

  // Auto-submit when 6 digits are filled
  useEffect(() => {
    if (otp.every((d) => d !== '') && step === 'otp') {
      handleVerifyOtp()
    }
  }, [otp, step, handleVerifyOtp])

  // Handle resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return
    setIsLoading(true)
    setError(null)

    try {
      await axios.post('/api/auth/register/send-otp', {
        username: username.trim(),
        email: email.trim(),
        password,
      })

      setOtp(['', '', '', '', '', ''])
      setCountdown(300)
      setCanResend(false)
      setResendCooldown(60)
      setSuccess('Kode OTP baru telah dikirim!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error)
      } else {
        setError('Gagal mengirim ulang OTP.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen relative flex items-center justify-center overflow-hidden font-sans">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/18929387_rm218batch4-ning-40.jpg" 
          alt="Background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Back to Home Link */}
      <motion.div 
        className="absolute top-0 left-0 w-full p-6 sm:p-8 z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Link 
          href="/" 
          className="flex items-center gap-1 text-sm font-medium text-white hover:opacity-80 transition-opacity drop-shadow-md"
        >
          <ChevronLeft className="w-4 h-4" />
          Home page
        </Link>
      </motion.div>

      {/* Register Card - Glassmorphism */}
      <motion.div 
        className="relative z-20 w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.5,
          ease: [0.16, 1, 0.3, 1]
        }}
      >
        <div className="bg-white/30 backdrop-blur-xl border border-white/40 p-8 md:p-10 rounded-2xl shadow-2xl">
          <AnimatePresence mode="wait">
            {step === 'register' ? (
              <motion.div
                key="register-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Header */}
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Create Account ✨
                  </h1>
                  <p className="text-gray-700 font-medium text-sm">
                    Join us! Fill in your details to get started.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <Input
                    label="Username"
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    variant="light"
                    className="bg-white/60 border-transparent focus:bg-white"
                    leftIcon={<User className="w-4 h-4" />}
                    required
                  />

                  <Input
                    label="Email"
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    variant="light"
                    className="bg-white/60 border-transparent focus:bg-white"
                    leftIcon={<Mail className="w-4 h-4" />}
                    required
                  />

                  <Input
                    label="Password"
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    variant="light"
                    className="bg-white/60 border-transparent focus:bg-white"
                    leftIcon={<Lock className="w-4 h-4" />}
                    required
                  />

                  <Input
                    label="Confirm Password"
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    variant="light"
                    className="bg-white/60 border-transparent focus:bg-white"
                    leftIcon={<Lock className="w-4 h-4" />}
                    required
                  />

                  {error && (
                    <motion.div 
                      className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm text-center"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {error}
                    </motion.div>
                  )}

                  <Button
                    type="submit"
                    isLoading={isLoading}
                    className="w-full rounded-full"
                    size="lg"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Send OTP
                  </Button>
                </form>

                {/* Link to Login */}
                <motion.p
                  className="text-center mt-6 text-sm text-gray-700"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    className="font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Sign in
                  </Link>
                </motion.p>
              </motion.div>
            ) : (
              <motion.div
                key="otp-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Header */}
                <div className="text-center mb-8">
                  <motion.div
                    className="w-16 h-16 bg-gradient-to-br from-[#0FA6E5] to-[#8BC5E0] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  >
                    <Mail className="w-7 h-7 text-white" />
                  </motion.div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Verify Email
                  </h1>
                  <p className="text-gray-700 font-medium text-sm">
                    We sent a 6-digit code to
                  </p>
                  <p className="text-blue-600 font-semibold text-sm mt-1">
                    {email}
                  </p>
                </div>

                {/* OTP Input */}
                <div className="flex justify-center gap-2 sm:gap-3 mb-6">
                  {otp.map((digit, index) => (
                    <motion.input
                      key={index}
                      ref={(el) => { otpRefs.current[index] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={index === 0 ? handleOtpPaste : undefined}
                      className="w-11 h-13 sm:w-13 sm:h-15 text-center text-xl sm:text-2xl font-bold rounded-xl border-2 border-white/60 bg-white/60 backdrop-blur-sm text-gray-900 focus:border-[#0FA6E5] focus:ring-2 focus:ring-[#0FA6E5]/30 focus:bg-white outline-none transition-all duration-200 shadow-sm"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    />
                  ))}
                </div>

                {/* Timer */}
                <div className="text-center mb-6">
                  {countdown > 0 ? (
                    <p className="text-sm text-gray-600">
                      Code expires in{' '}
                      <span className="font-bold text-gray-900">{formatTime(countdown)}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-red-500 font-medium">
                      Kode OTP sudah kadaluarsa
                    </p>
                  )}
                </div>

                {/* Error/Success */}
                {error && (
                  <motion.div 
                    className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm text-center mb-4"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </motion.div>
                )}

                {success && (
                  <motion.div 
                    className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-600 text-sm text-center mb-4"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {success}
                  </motion.div>
                )}

                {/* Verify Button */}
                <Button
                  type="button"
                  onClick={handleVerifyOtp}
                  isLoading={isLoading}
                  disabled={otp.some((d) => d === '') || countdown === 0}
                  className="w-full rounded-full mb-4"
                  size="lg"
                >
                  Verify & Create Account
                </Button>

                {/* Resend OTP */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={!canResend || isLoading}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    {canResend
                      ? 'Resend code'
                      : `Resend in ${resendCooldown}s`}
                  </button>
                </div>

                {/* Back to form */}
                <motion.p
                  className="text-center mt-5 text-sm text-gray-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setStep('register')
                      setOtp(['', '', '', '', '', ''])
                      setError(null)
                      setSuccess(null)
                    }}
                    className="font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    ← Back to register form
                  </button>
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </main>
  )
}
