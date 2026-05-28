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
  email?: string
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

// --- Order / Shop Types ---

export enum OrderStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface EggShopOrder {
  id: string
  userId: string
  user?: { id: string; username: string }
  phoneNumber: string
  count: number
  orderType: 'BUTIR' | 'RAK'
  status: OrderStatus
  approvedById?: string | null
  approvedBy?: { id: string; username: string } | null
  approvedAt?: string | null
  rejectedReason?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateOrderRequest {
  phoneNumber: string
  count: number
  orderType: 'BUTIR' | 'RAK'
}

export interface ProcessOrderRequest {
  action: 'APPROVE' | 'REJECT'
  rejectedReason?: string
}

// --- Register / OTP Types ---

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface VerifyOtpRequest {
  email: string
  otpCode: string
}

