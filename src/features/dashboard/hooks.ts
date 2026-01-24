'use client'

import { useEggCount, useReduceEggs, useReduceRacks } from '@/features/eggs'
import { useAuth } from '@/features/auth'
import { useState } from 'react'

/**
 * Hook for dashboard functionality
 */
export function useDashboard() {
  const { user, logout, isSuperAdmin, isLoading: authLoading } = useAuth()
  const { data: eggData, isConnected, isLoading: eggsLoading } = useEggCount()
  
  const reduceEggsMutation = useReduceEggs()
  const reduceRacksMutation = useReduceRacks()

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleReduceEggs = async (amount: number) => {
    setMessage(null)
    try {
      const result = await reduceEggsMutation.mutateAsync(amount)
      if (result.success) {
        setMessage({ type: 'success', text: `Berhasil mengurangi ${amount} telur` })
        return true
      } else {
        setMessage({ type: 'error', text: result.error || 'Gagal mengurangi telur' })
        return false
      }
    } catch {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' })
      return false
    }
  }

  const handleReduceRacks = async (amount: number) => {
    setMessage(null)
    try {
      const result = await reduceRacksMutation.mutateAsync(amount)
      if (result.success) {
        setMessage({ type: 'success', text: `Berhasil mengurangi ${amount} rak` })
        return true
      } else {
        setMessage({ type: 'error', text: result.error || 'Gagal mengurangi rak' })
        return false
      }
    } catch {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' })
      return false
    }
  }

  return {
    user,
    eggData,
    isConnected,
    isLoading: authLoading || eggsLoading,
    isSuperAdmin,
    message,
    clearMessage: () => setMessage(null),
    handleReduceEggs,
    handleReduceRacks,
    isReducingEggs: reduceEggsMutation.isPending,
    isReducingRacks: reduceRacksMutation.isPending,
    logout,
  }
}
