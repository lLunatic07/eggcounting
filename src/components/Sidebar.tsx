'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, UserPlus, LogOut, ClipboardCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth'

const menuItems = [
  {
    title: 'Dasbor',
    href: '/dashboard',
    icon: LayoutGrid,
  },
  {
    title: 'Persetujuan',
    href: '/dashboard/approval',
    icon: ClipboardCheck,
  },
  {
    title: 'Buat Pengguna',
    href: '/dashboard/create-user',
    icon: UserPlus,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { logout, user } = useAuth()
  const roleLabel = user?.role === 'SUPERADMIN' ? 'Admin Utama' : 'Pengguna'

  return (
    <>
      <aside className="fixed left-0 top-0 bottom-0 z-40 hidden min-h-screen w-64 flex-col border-r border-gray-100 bg-white md:flex">
        {/* Logo Area */}
        <div className="p-8">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold bg-gradient-to-r from-[#0FA6E5] to-[#8BC5E0] bg-clip-text text-transparent">
              Penghitung Telur
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium text-sm',
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon className={cn(
                  'w-5 h-5',
                  isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-600'
                )} />
                {item.title}
              </Link>
            )
          })}
        </nav>

        {/* User & Logout */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              {user?.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.username}
              </p>
              <p className="text-xs text-gray-500 truncate capitalize">
                {roleLabel}
              </p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>

      <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-gray-100 bg-white/95 px-4 backdrop-blur md:hidden">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold bg-gradient-to-r from-[#0FA6E5] to-[#8BC5E0] bg-clip-text text-transparent">
            Penghitung Telur
          </p>
          <p className="truncate text-xs text-gray-500">
            {user?.username || 'Admin'} · {roleLabel}
          </p>
        </div>
        <button
          onClick={logout}
          className="ml-3 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500 transition-colors hover:bg-red-100"
          aria-label="Keluar"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-3 border-t border-gray-100 bg-white/95 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-w-0 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition-all duration-200',
                isActive 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className={cn(
                'h-5 w-5',
                isActive ? 'text-blue-500' : 'text-gray-400'
              )} />
              <span className="w-full truncate text-center">{item.title}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
