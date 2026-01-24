'use client'

import { useEggCount } from '@/features/eggs'

export function EggCounter() {
  const { data, isConnected, isLoading } = useEggCount()

  if (isLoading || !data) {
    return (
      <div className="animate-pulse bg-gray-800 rounded-2xl p-8 text-center">
        <div className="h-20 bg-gray-700 rounded mb-4"></div>
        <div className="h-8 bg-gray-700 rounded w-32 mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Connection status indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
        <span className="text-xs text-gray-400">
          {isConnected ? 'Live' : 'Reconnecting...'}
        </span>
      </div>

      {/* Main counter display */}
      <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 backdrop-blur-lg rounded-3xl p-8 border border-amber-500/30 shadow-2xl">
        <div className="text-center">
          <div className="text-8xl font-bold text-amber-400 mb-2 tabular-nums animate-pulse-slow">
            {data.count.toLocaleString()}
          </div>
          <div className="text-xl text-amber-200/70 font-medium">
            Total Telur
          </div>
        </div>

        {/* Rack counter */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="bg-amber-900/30 rounded-xl p-4 text-center border border-amber-500/20">
            <div className="text-4xl font-bold text-amber-300 tabular-nums">
              {data.racks}
            </div>
            <div className="text-sm text-amber-200/60 mt-1">Rak Penuh</div>
            <div className="text-xs text-amber-200/40 mt-1">(@ 30 telur)</div>
          </div>
          <div className="bg-amber-900/30 rounded-xl p-4 text-center border border-amber-500/20">
            <div className="text-4xl font-bold text-amber-300 tabular-nums">
              {data.remainingEggs}
            </div>
            <div className="text-sm text-amber-200/60 mt-1">Sisa Telur</div>
            <div className="text-xs text-amber-200/40 mt-1">(belum 1 rak)</div>
          </div>
        </div>

        {/* Last updated */}
        <div className="mt-6 text-center text-sm text-amber-200/50">
          Terakhir diperbarui: {new Date(data.lastUpdated).toLocaleString('id-ID')}
        </div>
      </div>
    </div>
  )
}
