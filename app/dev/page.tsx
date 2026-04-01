"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Terminal } from "lucide-react";

export default function DevLoginPage() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "INVALID_ACCESS_KEY");
        setIsLoading(false);
        return;
      }

      // Cookie is set by the API - redirect
      window.location.href = "/dev/dashboard";
    } catch {
      setError("Connection error");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 font-mono">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <Terminal className="text-blue-500 mx-auto mb-4" size={32} />
          <h1 className="text-xl font-black text-white uppercase tracking-[0.3em]">Dev Access</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
            <input 
              type="password" 
              required
              placeholder="ENTER DEV ACCESS KEY"
              className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-12 pr-4 py-4 text-xs font-bold text-blue-500 outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-700"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-400 text-[10px] font-bold text-center uppercase tracking-wider">{error}</p>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white rounded-xl py-4 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-500 transition-all disabled:opacity-50"
          >
            {isLoading ? "V_CHECKING..." : "V_ACCESS"}
          </button>
        </form>

        <div className="mt-12 text-center">
          <a 
            href="/login" 
            className="text-[10px] font-black text-gray-700 uppercase tracking-[0.2em] hover:text-white transition-colors"
          >
            ← Back to Staff Login
          </a>
        </div>
      </motion.div>
    </div>
  );
}
