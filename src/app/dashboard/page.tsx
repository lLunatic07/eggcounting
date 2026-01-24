"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/features/dashboard";
import { useAuth } from "@/features/auth";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { LayoutGrid, Egg, AlertTriangle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, isSuperAdmin } = useAuth();
  const {
    eggData,
    isConnected,
    message,
    handleReduceEggs,
    handleReduceRacks,
    isReducingEggs,
    isReducingRacks,
  } = useDashboard();

  const [reduceEggsAmount, setReduceEggsAmount] = useState("");
  const [reduceRacksAmount, setReduceRacksAmount] = useState("");

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) router.push("/login");
      else if (!isSuperAdmin) router.push("/");
    }
  }, [authLoading, isAuthenticated, isSuperAdmin, router]);

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </main>
    );
  }

  if (!isAuthenticated || !isSuperAdmin) return null;

  const onReduceEggs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reduceEggsAmount) return;
    const success = await handleReduceEggs(parseInt(reduceEggsAmount));
    if (success) setReduceEggsAmount("");
  };

  const onReduceRacks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reduceRacksAmount) return;
    const success = await handleReduceRacks(parseInt(reduceRacksAmount));
    if (success) setReduceRacksAmount("");
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Content */}
        <div className="flex items-center justify-between mb-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Monitoring Dashboard
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage egg counts and racks
            </p>
          </div>
          <Link href="/">
            <Button
              variant="primary"
              className="rounded-full px-8 bg-gradient-to-r from-[#0FA6E5] to-[#8BC5E0]"
            >
              Home
            </Button>
          </Link>
        </div>

        {/* Connection status */}
        <div className="flex items-center gap-2 mb-8">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isConnected
                ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                : "bg-red-500"
            }`}
          ></div>
          <span className="text-sm font-medium text-gray-500">
            {isConnected
              ? "Real-time Updates Active"
              : "Connecting to sensor..."}
          </span>
        </div>

        {/* Current Status Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[1.5rem] p-6 shadow-xl border border-gray-100"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Telur</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1 tabular-nums">
                  <AnimatedCounter value={eggData?.count ?? 0} />
                </h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Egg className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <div className="text-xs text-green-600 bg-green-50 inline-block px-2 py-1 rounded-md font-medium">
              Live counting
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[1.5rem] p-6 shadow-xl border border-gray-100"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500 font-medium">Rak Penuh</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1 tabular-nums">
                  <AnimatedCounter value={eggData?.racks ?? 0} />
                </h3>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl">
                <LayoutGrid className="w-6 h-6 text-orange-500" />
              </div>
            </div>
            <div className="text-xs text-gray-400">30 telur / rak</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-[1.5rem] p-6 shadow-xl border border-gray-100"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500 font-medium">Sisa Telur</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1 tabular-nums">
                  <AnimatedCounter value={eggData?.remainingEggs ?? 0} />
                </h3>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-purple-500" />
              </div>
            </div>
            <div className="text-xs text-gray-400">Belum masuk rak</div>
          </motion.div>
        </div>

        {/* Message display */}
        {message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className={`mb-8 p-4 rounded-xl border ${
              message.type === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {message.text}
          </motion.div>
        )}

        {/* Admin controls */}
        <h2 className="text-lg font-bold text-gray-900 mb-6">Admin Actions</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Reduce eggs */}
          <div className="bg-white rounded-[1.5rem] p-8 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <span className="p-2 bg-red-50 rounded-lg text-red-500">
                <Egg className="w-5 h-5" />
              </span>
              Kurangi Telur Manual
            </h3>
            <form onSubmit={onReduceEggs} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah per butir
                </label>
                <input
                  type="number"
                  min="1"
                  max={eggData?.count || 0}
                  value={reduceEggsAmount}
                  onChange={(e) => setReduceEggsAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="0"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                disabled={isReducingEggs || !reduceEggsAmount}
                isLoading={isReducingEggs}
                className="w-full rounded-xl bg-gradient-to-r from-[#0FA6E5] to-[#8BC5E0] hover:opacity-90 text-white shadow-lg shadow-blue-400/30"
              >
                Kurangi Telur
              </Button>
            </form>
          </div>

          {/* Reduce racks */}
          <div className="bg-white rounded-[1.5rem] p-8 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <span className="p-2 bg-red-50 rounded-lg text-red-500">
                <LayoutGrid className="w-5 h-5" />
              </span>
              Kurangi Rak Manual
            </h3>
            <form onSubmit={onReduceRacks} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah rak
                </label>
                <input
                  type="number"
                  min="1"
                  max={eggData?.racks || 0}
                  value={reduceRacksAmount}
                  onChange={(e) => setReduceRacksAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="0"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                disabled={isReducingRacks || !reduceRacksAmount}
                isLoading={isReducingRacks}
                className="w-full rounded-xl bg-gradient-to-r from-[#0FA6E5] to-[#8BC5E0] hover:opacity-90 text-white shadow-lg shadow-blue-400/30"
              >
                Kurangi Rak
              </Button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
