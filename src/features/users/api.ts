import axios from '@/lib/axios'

export interface CreateUserRequest {
  email?: string
  username: string
  password?: string
  role?: 'SUPERADMIN' | 'USER'
}

export const createUser = async (data: CreateUserRequest) => {
  const response = await axios.post('/users', data)
  return response.data
}
