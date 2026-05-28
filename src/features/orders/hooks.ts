'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi } from './api'
import { CreateOrderRequest, ProcessOrderRequest } from '@/types'

// Query keys
export const ordersKeys = {
  all: ['orders'] as const,
  list: () => [...ordersKeys.all, 'list'] as const,
}

/**
 * Hook to get orders list
 */
export function useOrders() {
  return useQuery({
    queryKey: ordersKeys.list(),
    queryFn: ordersApi.getOrders,
  })
}

/**
 * Hook to create a new order
 */
export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateOrderRequest) => ordersApi.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.list() })
    },
  })
}

/**
 * Hook to process (approve/reject) an order
 */
export function useProcessOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProcessOrderRequest }) =>
      ordersApi.processOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.list() })
      // Also invalidate egg count since approve reduces stock
      queryClient.invalidateQueries({ queryKey: ['eggs'] })
    },
  })
}
