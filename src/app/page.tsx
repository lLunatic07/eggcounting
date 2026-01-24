"use client";

import { Navbar } from "@/components/Navbar";
import { useEggCount } from "@/features/eggs";
import { LayoutGrid, Egg, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { data, isLoading } = useEggCount();

  // Default values if loading or no data
  const eggCount = data?.count ?? 0;
  const rackCount = data?.racks ?? 0;

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans">
      <Navbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#4F46E5] mb-2">
            Stok Telur Tersedia
          </h2>
          <p className="text-gray-500">
            List telur yang tersedia per butir dan per rak
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Card Butir */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-[2rem] p-12 text-center shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-20 h-20 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <Egg className="w-10 h-10 text-[#0FA6E5]" strokeWidth={2.5} />
            </div>

            {isLoading ? (
              <div className="h-16 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
              </div>
            ) : (
              <div className="text-6xl font-bold text-gray-900 mb-4 tabular-nums">
                {eggCount}
              </div>
            )}

            <div className="text-3xl font-bold text-gray-800 mb-2">Butir</div>
            <div className="text-gray-400">Telur Per Butir</div>
          </motion.div>

          {/* Card Rak */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-[2rem] p-12 text-center shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-20 h-20 mx-auto bg-orange-50 rounded-full flex items-center justify-center mb-6">
              <LayoutGrid
                className="w-10 h-10 text-orange-400"
                strokeWidth={2.5}
              />
            </div>

            {isLoading ? (
              <div className="h-16 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
              </div>
            ) : (
              <div className="text-6xl font-bold text-gray-900 mb-4 tabular-nums">
                {rackCount}
              </div>
            )}

            <div className="text-3xl font-bold text-gray-800 mb-2">Rak</div>
            <div className="text-gray-400">Telur Per Rak</div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
