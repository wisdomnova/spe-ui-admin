"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Home, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to your error reporting service in production
    console.error("[App Error]", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-lg"
      >
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center">
            <AlertTriangle size={40} className="text-red-500" />
          </div>
        </div>

        <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-3">
          Something Went Wrong
        </h2>
        <p className="text-gray-400 font-medium mb-4 max-w-sm mx-auto">
          An unexpected error occurred. This has been logged and we&apos;ll look into it.
        </p>

        {/* Error digest for debugging */}
        {error.digest && (
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-10">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-gray-900 hover:bg-gray-800 shadow-xl transition-all"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
          <Link
            href="/"
            className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all"
          >
            <Home size={16} />
            Overview
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
