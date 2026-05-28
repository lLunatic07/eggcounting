"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/features/auth";
import { useEggCount } from "@/features/eggs";
import { useOrders, useCreateOrder } from "@/features/orders";
import { OrderStatus } from "@/types";
import { Button, Input } from "@/components/ui";
import { Egg, LayoutGrid, Loader2, ShoppingCart, Phone, Hash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EGGS_PER_RACK } from "@/lib/utils";

export default function OrderPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: eggData, isLoading: eggLoading } = useEggCount();
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const createOrderMutation = useCreateOrder();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [count, setCount] = useState("");
  const [orderType, setOrderType] = useState<"BUTIR" | "RAK">("BUTIR");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </main>
    );
  }

  if (!isAuthenticated) return null;

  const currentStock = eggData?.count ?? 0;
  const currentRacks = eggData?.racks ?? 0;
  const maxOrder =
    orderType === "RAK" ? currentRacks : currentStock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!phoneNumber.trim()) {
      setMessage({ type: "error", text: "Nomor HP wajib diisi" });
      return;
    }

    const countNum = parseInt(count);
    if (!countNum || countNum <= 0) {
      setMessage({ type: "error", text: "Jumlah harus lebih dari 0" });
      return;
    }

    try {
      const result = await createOrderMutation.mutateAsync({
        phoneNumber: phoneNumber.trim(),
        count: countNum,
        orderType,
      });

      if (result.success) {
        setMessage({
          type: "success",
          text: "Pesanan berhasil dibuat! Menunggu persetujuan admin.",
        });
        setPhoneNumber("");
        setCount("");
      } else {
        setMessage({
          type: "error",
          text: result.error || "Gagal membuat pesanan",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan" });
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Menunggu
          </span>
        );
      case OrderStatus.APPROVED:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
            Disetujui
          </span>
        );
      case OrderStatus.REJECTED:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            Ditolak
          </span>
        );
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Beli Telur
          </h2>
          <p className="text-gray-500">
            Pesan telur online, tunggu persetujuan admin
          </p>
        </div>

        {/* Stock Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Egg className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Stok Telur
                </p>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">
                  {eggLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-gray-300 inline" />
                  ) : (
                    currentStock
                  )}{" "}
                  <span className="text-sm font-normal text-gray-400">
                    butir
                  </span>
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-50 rounded-xl">
                <LayoutGrid className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Stok Rak</p>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">
                  {eggLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-gray-300 inline" />
                  ) : (
                    currentRacks
                  )}{" "}
                  <span className="text-sm font-normal text-gray-400">
                    rak ({EGGS_PER_RACK} butir/rak)
                  </span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Order Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-10"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <span className="p-2 bg-blue-50 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-blue-500" />
            </span>
            Form Pemesanan
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Order Type Toggle */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Jenis Pemesanan
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOrderType("BUTIR");
                    setCount("");
                  }}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 border-2 ${
                    orderType === "BUTIR"
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <Egg
                    className={`w-4 h-4 inline mr-2 ${
                      orderType === "BUTIR"
                        ? "text-blue-500"
                        : "text-gray-400"
                    }`}
                  />
                  Per Butir
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOrderType("RAK");
                    setCount("");
                  }}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 border-2 ${
                    orderType === "RAK"
                      ? "bg-orange-50 border-orange-500 text-orange-700"
                      : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <LayoutGrid
                    className={`w-4 h-4 inline mr-2 ${
                      orderType === "RAK"
                        ? "text-orange-500"
                        : "text-gray-400"
                    }`}
                  />
                  Per Rak
                </button>
              </div>
            </div>

            {/* Count Input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Jumlah {orderType === "BUTIR" ? "Butir" : "Rak"}{" "}
                <span className="text-gray-400 font-normal">
                  (Maks: {maxOrder})
                </span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min="1"
                  max={maxOrder}
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  placeholder={`Masukkan jumlah ${
                    orderType === "BUTIR" ? "butir" : "rak"
                  }`}
                  required
                />
              </div>
              {orderType === "RAK" && count && parseInt(count) > 0 && (
                <p className="text-xs text-gray-400 mt-1.5">
                  = {parseInt(count) * EGGS_PER_RACK} butir telur
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Nomor HP
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  placeholder="08xxxxxxxxxx"
                  required
                />
              </div>
            </div>

            {/* Message */}
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`p-4 rounded-xl border text-sm ${
                    message.type === "success"
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              disabled={createOrderMutation.isPending || !count || !phoneNumber}
              isLoading={createOrderMutation.isPending}
              className="w-full rounded-xl bg-gradient-to-r from-[#0FA6E5] to-[#8BC5E0] hover:opacity-90 text-white shadow-lg shadow-blue-400/30"
            >
              Buat Pesanan
            </Button>
          </form>
        </motion.div>

        {/* My Orders Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Pesanan Saya
          </h3>

          {ordersLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
            </div>
          ) : !orders || orders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Belum ada pesanan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Jumlah
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Jenis
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      No HP
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Keterangan
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 tabular-nums">
                        {order.count}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {order.orderType === "RAK"
                          ? `Rak (${order.count * EGGS_PER_RACK} butir)`
                          : "Butir"}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {order.phoneNumber}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {order.status === OrderStatus.REJECTED
                          ? order.rejectedReason
                          : order.status === OrderStatus.APPROVED
                          ? `Disetujui oleh ${order.approvedBy?.username || "-"}`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
