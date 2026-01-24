import { EggCounter } from '@/components/EggCounter'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-700/50 backdrop-blur-sm bg-gray-900/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🥚</span>
            <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Egg Counter
            </h1>
          </div>
          <Link 
            href="/login" 
            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors border border-amber-500/30"
          >
            Login Admin
          </Link>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Hero section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-amber-200 to-orange-400 bg-clip-text text-transparent">
            Monitoring Real-time
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto">
            Pantau jumlah telur secara real-time menggunakan sistem IoT terintegrasi
          </p>
        </div>

        {/* Egg counter component */}
        <EggCounter />

        {/* Info section */}
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 text-center">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-200 mb-1">Real-time</h3>
            <p className="text-sm text-gray-400">Update otomatis setiap telur terdeteksi</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 text-center">
            <div className="text-2xl mb-2">🔌</div>
            <h3 className="font-semibold text-gray-200 mb-1">IoT Sensor</h3>
            <p className="text-sm text-gray-400">Menggunakan sensor ultrasonik HC-SR04</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 text-center">
            <div className="text-2xl mb-2">📦</div>
            <h3 className="font-semibold text-gray-200 mb-1">Per Rak</h3>
            <p className="text-sm text-gray-400">Otomatis hitung rak (30 telur = 1 rak)</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-700/50 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          Egg Counting System © {new Date().getFullYear()}
        </div>
      </footer>
    </main>
  )
}
