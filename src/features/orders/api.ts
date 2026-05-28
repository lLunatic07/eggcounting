import api from '@/lib/axios'
import { EggShopOrder, ApiResponse, CreateOrderRequest, ProcessOrderRequest } from '@/types'

export const ordersApi = {
  // Get orders (user sees own, admin sees all)
  getOrders: async (): Promise<EggShopOrder[]> => {
    const { data } = await api.get<ApiResponse<EggShopOrder[]>>('/orders')
    if (!data.success) throw new Error(data.error)
    return data.data!
  },

  // Create a new order
  createOrder: async (orderData: CreateOrderRequest): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>('/orders', orderData)
    return data
  },

  // Approve or reject an order (SUPERADMIN only)
  processOrder: async (id: string, processData: ProcessOrderRequest): Promise<ApiResponse> => {
    const { data } = await api.patch<ApiResponse>(`/orders/${id}`, processData)
    return data
  },
}
