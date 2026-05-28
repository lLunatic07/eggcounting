'use client'

import React, { useState } from 'react'
import { useCreateUser } from '@/features/users'
import { Button, Input } from '@/components/ui'
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import axios from 'axios'

export default function CreateUserPage() {
  const createUserMutation = useCreateUser()
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'USER' as 'USER' | 'SUPERADMIN' // Default role
  })
  
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    try {
      await createUserMutation.mutateAsync({
        username: formData.username,
        email: formData.email || undefined,
        password: formData.password,
        role: formData.role
      })
      
      setMessage({ type: 'success', text: 'Pengguna berhasil dibuat!' })
      setFormData({ username: '', email: '', password: '', role: 'USER' }) // Reset form
      
      // Optional: Redirect after success
      // setTimeout(() => router.push('/dashboard'), 2000)
    } catch (error: unknown) {
      setMessage({ 
        type: 'error', 
        text: axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : 'Gagal membuat pengguna'
      })
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
           <h1 className="text-2xl font-bold text-gray-900">
              Buat Pengguna
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Tambahkan admin atau pengguna baru ke sistem
            </p>
        </div>

        {/* Form Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[1.5rem] p-8 shadow-sm border border-gray-100"
        >
          {message && (
             <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-100' 
                : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Nama Pengguna"
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="cth. budi"
              variant="light"
              className="bg-gray-50"
              required
            />

            <Input
              label="Email (Opsional)"
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="cth. budi@example.com"
              variant="light"
               className="bg-gray-50"
            />

            <Input
              label="Kata Sandi"
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimal 6 karakter"
              variant="light"
               className="bg-gray-50"
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">Peran</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'USER' })}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                    formData.role === 'USER'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Pengguna Reguler
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'SUPERADMIN' })}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                    formData.role === 'SUPERADMIN'
                      ? 'bg-amber-50 border-amber-500 text-amber-700 ring-1 ring-amber-500'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Admin Utama
                </button>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full rounded-xl"
                size="lg"
                isLoading={createUserMutation.isPending}
                leftIcon={<UserPlus className="w-4 h-4" />}
              >
                Buat Pengguna
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </main>
  )
}
