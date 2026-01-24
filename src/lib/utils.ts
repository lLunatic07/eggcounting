import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const EGGS_PER_RACK = 30

/**
 * Calculate racks from egg count
 */
export function calculateRacks(eggCount: number) {
  return {
    racks: Math.floor(eggCount / EGGS_PER_RACK),
    remainingEggs: eggCount % EGGS_PER_RACK
  }
}

/**
 * Calculate eggs to reduce when reducing racks
 */
export function reduceByRack(currentCount: number, racksToReduce: number) {
  const eggsToReduce = racksToReduce * EGGS_PER_RACK
  return Math.max(0, currentCount - eggsToReduce)
}

/**
 * Verify IoT API key
 */
export function verifyIotApiKey(apiKey: string | null): boolean {
  return apiKey === process.env.IOT_API_KEY
}
