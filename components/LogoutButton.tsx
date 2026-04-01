"use client";

import { LogOut, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function LogoutButton({ collapsed }: { collapsed?: boolean }) {
  const [showConsent, setShowConsent] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <>
      <button 
        onClick={() => setShowConsent(true)}
        title={collapsed ? "Logout" : undefined}
        className={`w-full flex items-center ${collapsed ? "justify-center px-2 py-4" : "gap-4 px-8 py-4"} text-gray-400 hover:text-red-600 transition-all group overflow-hidden relative outline-none`}
      >
        <div className={`relative z-10 flex items-center ${collapsed ? "" : "gap-4"}`}>
          <LogOut size={20} />
          {!collapsed && <span className="font-black text-[10px] uppercase tracking-[0.2em]">Logout</span>}
        </div>
        <div className="absolute inset-0 bg-red-50 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
      </button>

      <AnimatePresence>
        {showConsent && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConsent(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-10 overflow-hidden text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mx-auto mb-6">
                <LogOut size={32} />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">End Session?</h2>
              <p className="text-gray-500 font-bold mb-8 text-sm uppercase tracking-widest text-[10px]">Confirm you wish to exit the portal</p>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowConsent(false)}
                  className="bg-gray-50 text-gray-400 rounded-xl py-4 font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all outline-none flex items-center justify-center gap-2"
                >
                  <X size={16} />
                  Wait
                </button>
                <button 
                  onClick={handleLogout}
                  className="bg-red-600 text-white rounded-xl py-4 font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-100 outline-none flex items-center justify-center gap-2"
                >
                  <Check size={16} />
                  Logout
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

