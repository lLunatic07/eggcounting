'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, useCallback } from 'react'
import { eggsApi } from './api'
import { EggCountData } from '@/types'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'

// Query key
export const eggsKeys = {
  all: ['eggs'] as const,
  count: () => [...eggsKeys.all, 'count'] as const,
}

/**
 * Hook to get egg count with real-time updates via WebSocket
 */
export function useEggCount() {
  const queryClient = useQueryClient()
  const [isConnected, setIsConnected] = useState(false)

  // Initial data fetch with TanStack Query
  const query = useQuery({
    queryKey: eggsKeys.count(),
    queryFn: eggsApi.getCount,
  })

  // WebSocket for real-time updates
  useEffect(() => {
    let ws: WebSocket | null = null
    let reconnectTimeout: NodeJS.Timeout

    const connect = () => {
      try {
        ws = new WebSocket(WS_URL)

        ws.onopen = () => {
          setIsConnected(true)
        }

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            if (message.event === 'egg:updated') {
              // Update cache with new data
              queryClient.setQueryData<EggCountData>(eggsKeys.count(), message.data)
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err)
          }
        }

        ws.onclose = () => {
          setIsConnected(false)
          reconnectTimeout = setTimeout(connect, 5000)
        }

        ws.onerror = () => {
          setIsConnected(false)
        }
      } catch {
        reconnectTimeout = setTimeout(connect, 5000)
      }
    }

    connect()

    return () => {
      if (ws) ws.close()
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
    }
  }, [queryClient])

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    isConnected,
    refetch: query.refetch,
  }
}

/**
 * Hook to reduce eggs
 */
export function useReduceEggs() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (amount: number) => eggsApi.reduceEggs(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eggsKeys.count() })
    },
  })
}

/**
 * Hook to reduce racks
 */
export function useReduceRacks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (amount: number) => eggsApi.reduceRacks(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eggsKeys.count() })
    },
  })
}
