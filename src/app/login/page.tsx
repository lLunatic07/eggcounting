'use client'

import { useState } from 'react'
import { useAuth } from '@/features/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { Button, Input } from '@/components/ui'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoading, error } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await login({ identifier, password })
    if (success) {
      router.push('/dashboard')
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
        {/* Overlay agar text tetap terbaca jika background terlalu terang */}
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

      {/* Login Card - Glassmorphism */}
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
          {/* Header */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome Back!
            </h1>
            <p className="text-gray-700 font-medium text-sm">
              We missed you! Please enter your details.
            </p>
          </motion.div>

          {/* Form */}
          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Input
              label="Email or Username"
              type="text"
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your Email or Username"
              variant="light"
              className="bg-white/60 border-transparent focus:bg-white"
              required
            />

            <Input
              label="Password"
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Password"
              variant="light"
              className="bg-white/60 border-transparent focus:bg-white"
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
            >
              Sign in
            </Button>
          </motion.form>
        </div>
      </motion.div>
    </main>
  )
}
