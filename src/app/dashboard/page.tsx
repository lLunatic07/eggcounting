'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEggCount } from '@/hooks/useEggCount'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const { data: eggData, isConnected, refetch } = useEggCount()
  const router = useRouter()
  
  const [reduceEggsAmount, setReduceEggsAmount] = useState('')
  const [reduceRacksAmount, setReduceRacksAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Memuat...</div>
      </main>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  const userRole = (session?.user as { role?: string })?.role

  const handleReduceEggs = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reduceEggsAmount || isProcessing) return

    setIsProcessing(true)
    setMessage(null)

    try {
      const response = await fetch('/api/eggs/reduce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseInt(reduceEggsAmount) })
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: 'success', text: `Berhasil mengurangi ${reduceEggsAmount} telur` })
        setReduceEggsAmount('')
        refetch()
      } else {
        setMessage({ type: 'error', text: result.error || 'Gagal mengurangi telur' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReduceRacks = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reduceRacksAmount || isProcessing) return

    setIsProcessing(true)
    setMessage(null)

    try {
      const response = await fetch('/api/racks/reduce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseInt(reduceRacksAmount) })
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: 'success', text: `Berhasil mengurangi ${reduceRacksAmount} rak (${result.data.eggsReduced} telur)` })
        setReduceRacksAmount('')
        refetch()
      } else {
        setMessage({ type: 'error', text: result.error || 'Gagal mengurangi rak' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-700/50 backdrop-blur-sm bg-gray-900/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <span className="text-3xl">🥚</span>
              <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Dashboard Admin
              </h1>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              <span className="text-amber-400">{(session?.user as { username?: string })?.username}</span>
              <span className="ml-2 px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs">
                {userRole}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors border border-red-500/30 text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Connection status */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-400">
            {isConnected ? 'Connected to real-time updates' : 'Reconnecting...'}
          </span>
        </div>

        {/* Current count display */}
        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 mb-8">
          <h2 className="text-lg font-semibold text-gray-200 mb-4">Status Saat Ini</h2>
          {eggData ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-amber-500/10 rounded-xl p-4 text-center border border-amber-500/20">
                <div className="text-3xl font-bold text-amber-400 tabular-nums">{eggData.count}</div>
                <div className="text-sm text-amber-200/60 mt-1">Total Telur</div>
              </div>
              <div className="bg-amber-500/10 rounded-xl p-4 text-center border border-amber-500/20">
                <div className="text-3xl font-bold text-amber-400 tabular-nums">{eggData.racks}</div>
                <div className="text-sm text-amber-200/60 mt-1">Rak Penuh</div>
              </div>
              <div className="bg-amber-500/10 rounded-xl p-4 text-center border border-amber-500/20">
                <div className="text-3xl font-bold text-amber-400 tabular-nums">{eggData.remainingEggs}</div>
                <div className="text-sm text-amber-200/60 mt-1">Sisa Telur</div>
              </div>
            </div>
          ) : (
            <div className="animate-pulse bg-gray-700 h-20 rounded-xl"></div>
          )}
        </div>

        {/* Message display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-500/20 border-green-500/50 text-green-400' 
              : 'bg-red-500/20 border-red-500/50 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Admin controls - only for SUPERADMIN */}
        {userRole === 'SUPERADMIN' ? (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Reduce eggs */}
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
                <span>🥚</span> Kurangi Telur
              </h3>
              <form onSubmit={handleReduceEggs} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Jumlah Telur</label>
                  <input
                    type="number"
                    min="1"
                    max={eggData?.count || 0}
                    value={reduceEggsAmount}
                    onChange={(e) => setReduceEggsAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
                    placeholder="Masukkan jumlah"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isProcessing || !reduceEggsAmount}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Memproses...' : 'Kurangi Telur'}
                </button>
              </form>
            </div>

            {/* Reduce racks */}
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
                <span>📦</span> Kurangi Rak
              </h3>
              <form onSubmit={handleReduceRacks} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Jumlah Rak (1 rak = 30 telur)</label>
                  <input
                    type="number"
                    min="1"
                    max={eggData?.racks || 0}
                    value={reduceRacksAmount}
                    onChange={(e) => setReduceRacksAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
                    placeholder="Masukkan jumlah"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isProcessing || !reduceRacksAmount}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Memproses...' : 'Kurangi Rak'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Akses Terbatas</h3>
            <p className="text-gray-400">
              Anda tidak memiliki akses untuk mengelola jumlah telur. 
              Hanya SUPERADMIN yang dapat melakukan operasi ini.
            </p>
          </div>
        )}

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-amber-400 hover:text-amber-300 transition-colors">
            ← Kembali ke Monitoring Publik
          </Link>
        </div>
      </div>
    </main>
  )
}
