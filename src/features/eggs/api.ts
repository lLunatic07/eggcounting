import api from '@/lib/axios'
import { EggCountData, ApiResponse } from '@/types'

export const eggsApi = {
  // Get current egg count
  getCount: async (): Promise<EggCountData> => {
    const { data } = await api.get<ApiResponse<EggCountData>>('/eggs')
    if (!data.success) throw new Error(data.error)
    return data.data!
  },

  // Reduce eggs (SUPERADMIN only)
  reduceEggs: async (amount: number): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>('/eggs/reduce', { amount })
    return data
  },

  // Reduce racks (SUPERADMIN only)
  reduceRacks: async (amount: number): Promise<ApiResponse> => {
    const { data } = await api.post<ApiResponse>('/racks/reduce', { amount })
    return data
  },
}
