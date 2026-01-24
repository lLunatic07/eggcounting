"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { useAuth } from "@/features/auth";
import { Menu, X, LogOut, LayoutGrid, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const { user, isAuthenticated, isSuperAdmin, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <header className="bg-white/50 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center h-10">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-2 group">
            <h1 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              Stok telur
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {isSuperAdmin && (
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Dashboard
              </Link>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-6">
                {/* User Info */}
                <div className="flex items-center gap-3 border-l border-gray-200 pl-6">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                    {user?.username?.[0]?.toUpperCase() || "A"}
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm font-semibold text-gray-900 leading-tight">
                      {user?.username}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                      {user?.role?.toLowerCase()}
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  onClick={() => logout()}
                  className="rounded-full px-6 bg-red-500 hover:bg-red-600 text-white flex items-center gap-2 text-xs h-9 shadow-md shadow-red-500/20"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button
                  variant="primary"
                  className="rounded-full px-8 bg-gradient-to-r from-[#0FA6E5] to-[#8BC5E0] text-sm h-10"
                >
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden border-t border-gray-100 bg-white"
          >
            <div className="px-4 py-6 space-y-4">
              {isAuthenticated && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                    {user?.username?.[0]?.toUpperCase() || "A"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-gray-900 truncate">
                      {user?.username}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user?.role?.toLowerCase()}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {isSuperAdmin && (
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 hover:text-blue-600 font-medium transition-colors"
                  >
                    <LayoutGrid className="w-5 h-5" />
                    Dashboard
                  </Link>
                )}

                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-medium transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-[#0FA6E5] to-[#8BC5E0] text-white font-medium shadow-lg shadow-blue-400/20"
                  >
                    <User className="w-5 h-5" />
                    Login ke Akun
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
