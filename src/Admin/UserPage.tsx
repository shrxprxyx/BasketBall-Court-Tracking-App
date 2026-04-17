import React, { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Shield, User, Mail, Wifi, WifiOff,
  CheckCircle, X, Zap, Trash2, RefreshCw, Activity,
  Box, MapPin, Bookmark, Settings, Crown, UserCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserType {
  id: number | string;
  name: string;
  email: string;
  role: string;
}

type Toast = { id: string; message: string; type: "success" | "info" | "error" };
type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE   = "http://localhost:8080/api";
const SOCKET_URL = "http://localhost:8080";
const uid = () => Math.random().toString(36).slice(2, 9);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getAvatarHue = (name: string) =>
  (name.charCodeAt(0) * 37 + (name.charCodeAt(1) || 0) * 17) % 360;

// ─── Toast ────────────────────────────────────────────────────────────────────

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  const colors = { success: "text-green-400", info: "text-blue-400", error: "text-red-400" };

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      className="flex items-center gap-3 px-4 py-3 bg-[#0f0f1e] border border-slate-700/40 rounded-xl shadow-xl"
    >
      <CheckCircle size={13} className={`shrink-0 ${colors[toast.type]}`} />
      <span className="text-slate-200 text-[11px] font-mono">{toast.message}</span>
      <button onClick={() => onDismiss(toast.id)} className="text-slate-600 hover:text-slate-400 ml-1">
        <X size={11} />
      </button>
    </motion.div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const AdminUsersPage: React.FC = () => {
  const [users, setUsers]               = useState<UserType[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [roleFilter, setRoleFilter]     = useState<"all" | "user" | "admin">("all");
  const [socketStatus, setSocketStatus] = useState<ConnectionStatus>("connecting");
  const [toasts, setToasts]             = useState<Toast[]>([]);
  const [flashIds, setFlashIds]         = useState<Set<number | string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<UserType | null>(null);
  const [activeNav, setActiveNav]       = useState("users");

  const socketRef   = useRef<Socket | null>(null);
  const addToastRef = useRef<(msg: string, type?: Toast["type"]) => void>(() => {});

  const addToast = useCallback((message: string, type: Toast["type"] = "info") => {
    setToasts(prev => {
      if (prev.some(t => t.message === message)) return prev;
      return [...prev.slice(-4), { id: uid(), message, type }];
    });
  }, []);

  useEffect(() => { addToastRef.current = addToast; }, [addToast]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const flashRows = (ids: (number | string)[]) => {
    setFlashIds(new Set(ids));
    setTimeout(() => setFlashIds(new Set()), 1400);
  };

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/users`);
      setUsers(res.data || []);
    } catch {
      addToastRef.current("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Socket ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
    });
    socketRef.current = socket;

    socket.on("connect",       () => setSocketStatus("connected"));
    socket.on("disconnect",    () => setSocketStatus("disconnected"));
    socket.on("connect_error", () => setSocketStatus("error"));

    socket.on("usersUpdated", (updated: UserType[]) => {
      setUsers(prev => {
        const newIds = updated
          .filter(u => !prev.find(p => p.id === u.id))
          .map(u => u.id);
        if (newIds.length > 0) {
          flashRows(newIds);
          addToastRef.current(`${newIds.length} new user${newIds.length > 1 ? "s" : ""} registered`, "success");
        } else {
          addToastRef.current("User list updated", "info");
        }
        return updated;
      });
    });

    return () => { socket.disconnect(); };
  }, []);

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${API_BASE}/users/${deleteTarget.id}`);
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
      addToast("User removed", "success");
      setDeleteTarget(null);
    } catch {
      addToast("Failed to remove user", "error");
    }
  };

  // ── Filtered list ──────────────────────────────────────────────────────────

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const adminCount = users.filter(u => u.role === "admin").length;
  const userCount  = users.filter(u => u.role === "user").length;

  const navItems = [
    { id: "dashboard", icon: <Box size={16} />,      label: "Dashboard", to: "/admin-dashboard" },
    { id: "courts",    icon: <MapPin size={16} />,    label: "Courts",    to: "/admin/courts"    },
    { id: "users",     icon: <Users size={16} />,     label: "Users",     to: "/admin/UserPage"     },
    { id: "bookings",  icon: <Bookmark size={16} />,  label: "Bookings",  to: "#"                },
    { id: "settings",  icon: <Settings size={16} />,  label: "Settings",  to: "#"                },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=DM+Mono:wght@400;500&display=swap');
        .font-barlow  { font-family: 'Barlow Condensed', sans-serif; }
        .font-mono-dm { font-family: 'DM Mono', monospace; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0d0d1a; }
        ::-webkit-scrollbar-thumb { background: #f97316; border-radius: 2px; }
        @keyframes flash-row {
          0%   { background: rgba(249,115,22,0.1); }
          100% { background: transparent; }
        }
        .flash-row { animation: flash-row 1.4s ease-out; }
        .live-dot { animation: pulse-dot 1.5s ease-in-out infinite; }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes flash-ring {
          0%   { box-shadow: 0 0 0 0 rgba(249,115,22,0.5); }
          70%  { box-shadow: 0 0 0 8px rgba(249,115,22,0); }
          100% { box-shadow: 0 0 0 0 rgba(249,115,22,0); }
        }
        .flash-card { animation: flash-ring 1.1s ease-out; }
      `}</style>

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-72">
        <AnimatePresence>
          {toasts.map(t => <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />)}
        </AnimatePresence>
      </div>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0f0f1e] border border-red-500/20 rounded-2xl p-6 w-full max-w-sm text-center font-mono-dm"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-xl font-barlow font-black"
                style={{ background: `linear-gradient(135deg, hsl(${getAvatarHue(deleteTarget.name)},60%,35%), hsl(${getAvatarHue(deleteTarget.name)+30},60%,25%))` }}
              >
                {deleteTarget.name[0].toUpperCase()}
              </div>
              <h3 className="font-barlow text-lg font-bold text-slate-100 uppercase tracking-wider mb-1">Remove User?</h3>
              <p className="text-slate-400 text-xs mb-0.5 tracking-wide">{deleteTarget.name}</p>
              <p className="text-slate-600 text-[11px] mb-5">{deleteTarget.email}</p>
              <div className="flex gap-3">
                <button onClick={handleDelete}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-[11px] tracking-widest uppercase transition-colors">
                  Remove
                </button>
                <button onClick={() => setDeleteTarget(null)}
                  className="flex-1 bg-slate-700/50 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-[11px] tracking-widest uppercase transition-colors">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-h-screen bg-[#0d0d1a] font-mono-dm">

        {/* ── Sidebar ── */}
        <aside className="w-[220px] bg-[#0f0f1e] border-r border-orange-500/10 flex flex-col sticky top-0 h-screen py-7 shrink-0">
          <div className="px-6 pb-8 border-b border-orange-500/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shrink-0">
                <Activity size={16} className="text-white" />
              </div>
              <div>
                <p className="font-barlow text-white text-[13px] font-bold tracking-widest uppercase leading-tight">Court</p>
                <p className="font-barlow text-orange-500 text-[11px] tracking-[0.18em] uppercase leading-tight">Admin</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 pt-5">
            <p className="text-[9px] text-slate-500/50 tracking-[0.2em] uppercase px-3 pb-3">Navigation</p>
            {navItems.map(item => (
              <Link
                key={item.id}
                to={item.to}
                onClick={() => setActiveNav(item.id)}
                className={[
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-0.5 text-[12px] tracking-[0.06em] no-underline transition-all duration-150",
                  activeNav === item.id
                    ? "text-orange-500 bg-orange-500/10 border-l-2 border-orange-500"
                    : "text-slate-400/70 border-l-2 border-transparent hover:bg-orange-500/5 hover:text-orange-400",
                ].join(" ")}
              >
                {item.icon}{item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* ── Main ── */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">

          {/* Header */}
          <header className="flex justify-between items-center py-6 border-b border-orange-500/[0.08] mb-7 sticky top-0 bg-[#0d0d1a] z-10">
            <div>
              <h1 className="font-barlow text-[28px] font-extrabold text-slate-100 tracking-wide uppercase">
                Users
              </h1>
              <p className="text-[11px] text-slate-500/50 mt-0.5 tracking-widest">
                {users.length} REGISTERED · UPDATES LIVE
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchUsers}
                className="flex cursor-pointer items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 px-4 py-2 rounded-xl text-[10px] tracking-widest uppercase transition-colors"
              >
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
          </header>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Total Users",  value: users.length,  icon: <Users size={18} />,     color: "text-orange-500" },
              { label: "Admins",       value: adminCount,    icon: <Crown size={18} />,      color: "text-amber-400"  },
              { label: "Players",      value: userCount,     icon: <UserCheck size={18} />,  color: "text-green-400"  },
            ].map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="bg-gradient-to-br from-[#12122a] to-[#0f0f1e] border border-orange-500/[0.1] rounded-2xl p-5 flex items-center gap-4"
              >
                <div className={`w-11 h-11 bg-orange-500/10 border border-orange-500/15 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 tracking-[0.15em] uppercase">{s.label}</p>
                  <p className="font-barlow text-4xl font-black text-slate-100 leading-none mt-0.5">{s.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Search + filter */}
          <div className="flex gap-3 mb-5">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full bg-[#0f0f1e] border border-slate-700/50 rounded-xl pl-9 pr-4 py-2.5 text-slate-200 text-xs font-mono placeholder-slate-600 focus:outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/15 transition-all"
              />
            </div>
            <div className="flex gap-1.5">
              {(["all", "user", "admin"] as const).map(r => (
                <button key={r}
                  onClick={() => setRoleFilter(r)}
                  className={[
                    "px-4 py-2 cursor-pointer rounded-xl text-[10px] tracking-widest uppercase border transition-all",
                    roleFilter === r
                      ? "bg-orange-500/15 border-orange-500/40 text-orange-400"
                      : "bg-transparent border-slate-700/50 text-slate-500 hover:border-slate-600",
                  ].join(" ")}
                >
                  {r === "all" ? "All" : r === "admin" ? "Admins" : "Players"}
                </button>
              ))}
            </div>
          </div>

          {/* User grid */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-600">
              <Users size={36} className="mb-3 opacity-30" />
              <p className="text-[11px] tracking-widest uppercase">No users found</p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
              initial="hidden"
              animate="show"
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
            >
              {filtered.map(user => {
                const hue       = getAvatarHue(user.name);
                const isNew     = flashIds.has(user.id);
                const isAdmin   = user.role === "admin";

                return (
                  <motion.div
                    key={user.id}
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
                    className={`group bg-gradient-to-br from-[#12122a] to-[#0f0f1e] border rounded-2xl p-5 flex items-center gap-4 transition-all duration-200 hover:border-orange-500/25 ${
                      isNew ? "border-orange-500/50 flash-card" : "border-orange-500/[0.08]"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-barlow font-black"
                        style={{ background: `linear-gradient(135deg, hsl(${hue},60%,35%), hsl(${hue+30},60%,25%))` }}
                      >
                        {user.name[0].toUpperCase()}
                      </div>
                      {isAdmin && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                          <Crown size={8} className="text-white" />
                        </div>
                      )}
                      {isNew && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center animate-pulse">
                          <Zap size={8} className="text-white" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-slate-100 text-sm font-medium truncate">{user.name}</p>
                      </div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Mail size={9} className="text-slate-600 shrink-0" />
                        <p className="text-slate-500 text-[11px] truncate">{user.email}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full border tracking-widest ${
                        isAdmin
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      }`}>
                        {isAdmin ? <Crown size={8} /> : <User size={8} />}
                        {user.role.toUpperCase()}
                      </span>
                    </div>

                    {/* ID + delete */}
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <span className="text-[9px] text-slate-700 font-mono">#{user.id}</span>
                      <button
                        onClick={() => setDeleteTarget(user)}
                        className="w-7 cursor-pointer h-7 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-slate-600 hover:text-red-400 flex items-center justify-center transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Footer count */}
          {!loading && filtered.length > 0 && (
            <p className="text-[10px] text-slate-700 tracking-widest uppercase mt-6 text-center">
              Showing {filtered.length} of {users.length} users
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminUsersPage;