"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LogIn, ShieldCheck, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Login failed");
        setIsLoading(false);
        return;
      }

      // Cookie is set by the API - just redirect
      window.location.href = "/";
    } catch {
      setError("Connection error");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 bg-[#f8faff]">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl shadow-blue-100/20 p-12 border border-gray-100"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Login</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="email" 
                required
                placeholder="admin@speui.org"
                className="w-full bg-gray-50 border-none rounded-2xl pl-14 pr-6 py-4 font-bold text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/5 placeholder-gray-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="password" 
                required
                placeholder="••••••••"
                className="w-full bg-gray-50 border-none rounded-2xl pl-14 pr-6 py-4 font-bold text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/5 placeholder-gray-200"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-xs font-bold text-center">{error}</p>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-gray-950 text-white rounded-2xl py-5 font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
          >
            {isLoading ? "Signing in..." : "Sign in"}
            {!isLoading && <LogIn size={16} />}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-gray-50 text-center">
          <a 
            href="/dev" 
            className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] hover:text-blue-600 transition-colors"
          >
            Dev Access Only
          </a>
        </div>
      </motion.div>
    </div>
  );
}
