"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/features/auth";
import { useOrders, useProcessOrder } from "@/features/orders";
import { OrderStatus, EggShopOrder } from "@/types";
import { Button } from "@/components/ui";
import {
  Loader2,
  ClipboardCheck,
  Check,
  X,
  ChevronLeft,
  Phone,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EGGS_PER_RACK } from "@/lib/utils";

type FilterStatus = "ALL" | OrderStatus;

export default function ApprovalPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, isSuperAdmin } = useAuth();
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const processOrderMutation = useProcessOrder();

  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Auth guard
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) router.push("/login");
      else if (!isSuperAdmin) router.push("/");
    }
  }, [authLoading, isAuthenticated, isSuperAdmin, router]);

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </main>
    );
  }

  if (!isAuthenticated || !isSuperAdmin) return null;

  const filteredOrders =
    filter === "ALL"
      ? orders
      : orders?.filter((o) => o.status === filter);

  const pendingCount = orders?.filter(
    (o) => o.status === OrderStatus.PENDING
  ).length ?? 0;

  const handleApprove = async (orderId: string) => {
    setMessage(null);
    try {
      const result = await processOrderMutation.mutateAsync({
        id: orderId,
        data: { action: "APPROVE" },
      });

      if (result.success) {
        setMessage({ type: "success", text: "Pesanan berhasil disetujui!" });
      } else {
        setMessage({
          type: "error",
          text: result.error || "Gagal menyetujui pesanan",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan" });
    }
  };

  const handleReject = async () => {
    if (!rejectingId || !rejectReason.trim()) return;
    setMessage(null);

    try {
      const result = await processOrderMutation.mutateAsync({
        id: rejectingId,
        data: { action: "REJECT", rejectedReason: rejectReason.trim() },
      });

      if (result.success) {
        setMessage({ type: "success", text: "Pesanan berhasil ditolak." });
        setRejectingId(null);
        setRejectReason("");
      } else {
        setMessage({
          type: "error",
          text: result.error || "Gagal menolak pesanan",
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

  const filterButtons: { label: string; value: FilterStatus }[] = [
    { label: "Semua", value: "ALL" },
    { label: `Menunggu (${pendingCount})`, value: OrderStatus.PENDING },
    { label: "Disetujui", value: OrderStatus.APPROVED },
    { label: "Ditolak", value: OrderStatus.REJECTED },
  ];

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Persetujuan Pesanan
              </h1>
              {pendingCount > 0 && (
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  {pendingCount} menunggu
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm ml-12">
              Setujui atau tolak pesanan telur dari pembeli
            </p>
          </div>
          <Link href="/dashboard">
            <Button
              variant="primary"
              className="rounded-full px-8 bg-gradient-to-r from-[#0FA6E5] to-[#8BC5E0]"
            >
              Dasbor
            </Button>
          </Link>
        </div>

        {/* Message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`mb-6 p-4 rounded-xl border text-sm ${
                message.type === "success"
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-4 h-4 text-gray-400" />
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                filter === btn.value
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          {ordersLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
            </div>
          ) : !filteredOrders || filteredOrders.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Tidak ada pesanan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Pembeli
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      No HP
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Jumlah
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredOrders.map((order: EggShopOrder) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                            {order.user?.username?.[0]?.toUpperCase() || "?"}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {order.user?.username || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {order.phoneNumber}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-900">
                        {order.count}{" "}
                        {order.orderType === "RAK" ? (
                          <span className="text-gray-400 font-normal">
                            rak ({order.count * EGGS_PER_RACK} butir)
                          </span>
                        ) : (
                          <span className="text-gray-400 font-normal">
                            butir
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="py-4 px-6">
                        {order.status === OrderStatus.PENDING ? (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleApprove(order.id)}
                              disabled={processOrderMutation.isPending}
                              className="bg-green-500 hover:bg-green-600 shadow-green-500/20 text-xs rounded-lg"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Setujui
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setRejectingId(order.id)}
                              disabled={processOrderMutation.isPending}
                              className="text-xs rounded-lg"
                            >
                              <X className="w-3.5 h-3.5" />
                              Tolak
                            </Button>
                          </div>
                        ) : order.status === OrderStatus.REJECTED ? (
                          <span className="text-xs text-gray-400">
                            {order.rejectedReason}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">
                            oleh {order.approvedBy?.username || "-"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => {
              setRejectingId(null);
              setRejectReason("");
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tolak Pesanan
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Berikan alasan penolakan agar pembeli mengetahui alasannya.
              </p>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm resize-none"
                rows={3}
                placeholder="Alasan penolakan..."
                autoFocus
              />

              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  className="flex-1 rounded-xl"
                  onClick={() => {
                    setRejectingId(null);
                    setRejectReason("");
                  }}
                >
                  Batal
                </Button>
                <Button
                  variant="danger"
                  className="flex-1 rounded-xl"
                  onClick={handleReject}
                  disabled={
                    !rejectReason.trim() || processOrderMutation.isPending
                  }
                  isLoading={processOrderMutation.isPending}
                >
                  Tolak Pesanan
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
