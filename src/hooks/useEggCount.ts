'use client'

import { useState, useEffect, useCallback } from 'react'
import { EggCountData } from '@/types'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'

export function useEggCount() {
  const [data, setData] = useState<EggCountData | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInitialData = useCallback(async () => {
    try {
      const response = await fetch('/api/eggs')
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      }
    } catch (err) {
      console.error('Error fetching initial data:', err)
    }
  }, [])

  useEffect(() => {
    // Fetch initial data via HTTP
    fetchInitialData()

    // Connect to WebSocket
    let ws: WebSocket | null = null
    let reconnectTimeout: NodeJS.Timeout

    const connect = () => {
      try {
        ws = new WebSocket(WS_URL)

        ws.onopen = () => {
          console.log('WebSocket connected')
          setIsConnected(true)
          setError(null)
        }

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            if (message.event === 'egg:updated') {
              setData(message.data)
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err)
          }
        }

        ws.onclose = () => {
          console.log('WebSocket disconnected')
          setIsConnected(false)
          // Attempt to reconnect after 5 seconds
          reconnectTimeout = setTimeout(connect, 5000)
        }

        ws.onerror = (err) => {
          console.error('WebSocket error:', err)
          setError('Connection error')
          setIsConnected(false)
        }
      } catch (err) {
        console.error('Error connecting to WebSocket:', err)
        setError('Failed to connect')
        reconnectTimeout = setTimeout(connect, 5000)
      }
    }

    connect()

    return () => {
      if (ws) {
        ws.close()
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
    }
  }, [fetchInitialData])

  return { data, isConnected, error, refetch: fetchInitialData }
}
