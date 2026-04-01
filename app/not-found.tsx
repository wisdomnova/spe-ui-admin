"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-lg"
      >
        {/* Large 404 */}
        <div className="relative mb-8">
          <h1 className="text-[12rem] font-black text-gray-100 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center">
              <span className="text-4xl">🔍</span>
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-3">
          Page Not Found
        </h2>
        <p className="text-gray-400 font-medium mb-10 max-w-sm mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved to a different location.
        </p>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
          <Link
            href="/"
            className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all"
          >
            <Home size={16} />
            Overview
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
