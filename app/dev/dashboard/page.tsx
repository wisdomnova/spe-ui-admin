"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  UserPlus, 
  Trash2, 
  Mail, 
  Lock, 
  X,
  Check,
  Zap,
  Calendar,
  Newspaper,
  UserCircle2,
  Users,
  Briefcase,
  Vote,
  Loader2
} from "lucide-react";

type AdminRole = "admin" | "programs" | "editorial" | "dni" | "overall" | "partnership" | "electoral";

const ADMIN_ROLES: AdminRole[] = ["admin", "programs", "editorial", "dni", "overall", "partnership", "electoral"];

const ROLE_STYLES: Record<string, string> = {
  admin:       "bg-blue-600 text-white",
  programs:    "bg-orange-100 text-orange-600",
  editorial:   "bg-purple-100 text-purple-600",
  dni:         "bg-pink-100 text-pink-600",
  overall:     "bg-emerald-100 text-emerald-600",
  partnership: "bg-amber-100 text-amber-600",
  electoral:   "bg-sky-100 text-sky-600",
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  admin:       <Zap size={10} />,
  programs:    <Calendar size={10} />,
  editorial:   <Newspaper size={10} />,
  dni:         <UserCircle2 size={10} />,
  overall:     <Users size={10} />,
  partnership: <Briefcase size={10} />,
  electoral:   <Vote size={10} />,
};

interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  created_at: string;
}

export default function DevDashboard() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "programs" as AdminRole
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch admin users from API
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {
      console.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const handleAddUser = async () => {
    if (!formData.email || !formData.password) return;
    setSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || "Failed to create user");
        setSubmitting(false);
        return;
      }

      const newUser = await res.json();
      setUsers([newUser, ...users]);
      setShowAddModal(false);
      setFormData({ email: "", password: "", role: "programs" });
    } catch {
      setFormError("Connection error");
    } finally {
      setSubmitting(false);
    }
  };

  const removeUser = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
      }
    } catch {
      console.error("Failed to delete user");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-12">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        <header className="flex items-end justify-between mb-12">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Access Management</h1>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-2">Manage chapter administrators</p>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="bg-white text-gray-400 p-4 border border-gray-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-red-600 hover:border-red-100 transition-all flex items-center gap-3"
            >
              Logout
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-gray-800 transition-all flex items-center gap-3"
            >
              <UserPlus size={16} />
              Add Administrator
            </button>
          </div>
        </header>

        {/* Custom Logout Confirmation */}
        <AnimatePresence>
          {showLogoutConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/5 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-gray-100 p-10 rounded-[3rem] max-w-sm w-full shadow-2xl"
              >
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mb-6">
                  <Shield size={24} />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">End Dev Session?</h3>
                <p className="text-gray-500 mb-8 font-medium leading-relaxed">
                  You are about to exit the developer management portal.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-200 hover:bg-red-700 transition-all"
                  >
                    Logout
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-gray-300" size={24} />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 font-bold text-sm">No administrators yet</p>
              <p className="text-gray-300 text-xs mt-1">Add your first admin above</p>
            </div>
          ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/30">
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Assigned Role</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Created</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="group hover:bg-gray-50/50 transition-all">
                  <td className="px-10 py-6 font-bold text-gray-900 text-sm">{user.email}</td>
                  <td className="px-10 py-6">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${ROLE_STYLES[user.role] || "bg-gray-100 text-gray-600"}`}>
                      {ROLE_ICONS[user.role]}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-xs font-bold text-gray-400">{user.created_at?.split('T')[0]}</td>
                  <td className="px-10 py-6">
                    <button 
                      onClick={() => removeUser(user.id)}
                      className="p-3 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all outline-none"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </motion.div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">New Manager</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                    <input 
                      type="email" 
                      placeholder="admin@speui.org"
                      className="w-full bg-gray-100 border-none rounded-2xl pl-12 pr-4 py-4 font-bold text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/10 placeholder-gray-300"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      className="w-full bg-gray-100 border-none rounded-2xl pl-12 pr-4 py-4 font-bold text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/10 placeholder-gray-300"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ADMIN_ROLES.map((r) => (
                      <button
                        key={r}
                        onClick={() => setFormData({...formData, role: r})}
                        className={`py-3 rounded-xl border font-black text-[9px] uppercase tracking-widest transition-all ${
                          formData.role === r 
                            ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100" 
                            : "bg-white border-gray-100 text-gray-400 hover:bg-gray-50"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={handleAddUser}
                  disabled={submitting}
                  className="w-full bg-gray-900 text-white rounded-2xl py-5 font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {submitting ? "Creating..." : "Authorize Manager"}
                </button>

                {formError && (
                  <p className="text-red-500 text-xs font-bold text-center mt-2">{formError}</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
