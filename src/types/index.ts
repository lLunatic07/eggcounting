export enum Role {
  USER = 'USER',
  SUPERADMIN = 'SUPERADMIN'
}

export interface User {
  id: string
  email: string
  username: string
  role: Role
  createdAt: Date
  updatedAt: Date
}

export interface EggCountData {
  count: number
  racks: number
  remainingEggs: number
  lastUpdated: Date
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface EggUpdateEvent {
  event: 'egg:updated'
  data: EggCountData
}

export interface EggIncrementEvent {
  event: 'egg:increment'
  data: {
    apiKey: string
    increment: number
  }
}

export interface LoginRequest {
  identifier: string // email or username
  password: string
}

export interface CreateUserRequest {
  email: string
  username: string
  password: string
  role: Role
}

export interface ReduceEggsRequest {
  amount: number
}

export interface ReduceRacksRequest {
  amount: number
}
