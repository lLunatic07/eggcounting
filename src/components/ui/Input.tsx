'use client'

import { forwardRef, InputHTMLAttributes, useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  variant?: 'light' | 'dark'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type, leftIcon, rightIcon, variant = 'dark', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const isPassword = type === 'password'

    const labelStyles = variant === 'light' 
      ? 'text-gray-700' 
      : 'text-gray-300'

    const inputStyles = variant === 'light'
      ? 'bg-white border-gray-200 text-gray-900 placeholder-gray-300'
      : 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400'

    const iconStyles = variant === 'light'
      ? 'text-gray-400 hover:text-gray-600'
      : 'text-gray-400 hover:text-gray-300'

    return (
      <div className="space-y-1.5">
        {label && (
          <label className={cn('block text-xs font-bold', labelStyles)}>
            {label}
          </label>
        )}
        <motion.div 
          className="relative"
          animate={{ scale: isFocused ? 1.01 : 1 }}
          transition={{ duration: 0.2 }}
        >
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={isPassword && showPassword ? 'text' : type}
            className={cn(
              'w-full px-4 py-3 rounded-lg border text-sm transition-all duration-200',
              'focus:ring-2 focus:ring-primary focus:border-transparent outline-none',
              'shadow-sm',
              inputStyles,
              leftIcon && 'pl-10',
              (isPassword || rightIcon) && 'pr-10',
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={cn('absolute inset-y-0 right-0 pr-3 flex items-center transition-colors', iconStyles)}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}
          {rightIcon && !isPassword && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
              {rightIcon}
            </div>
          )}
        </motion.div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-500"
          >
            {error}
          </motion.p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
