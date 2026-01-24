'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface LoginCredentials {
  identifier: string
  password: string
}

/**
 * Hook for authentication
 */
export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const user = session?.user as {
    id?: string
    username?: string
    role?: string
  } | undefined

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn('credentials', {
        identifier: credentials.identifier,
        password: credentials.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email/username atau password salah')
        return false
      }

      router.push('/dashboard')
      router.refresh()
      return true
    } catch {
      setError('Terjadi kesalahan, silakan coba lagi')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return {
    user,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading' || isLoading,
    error,
    login,
    logout,
    isSuperAdmin: user?.role === 'SUPERADMIN',
  }
}
