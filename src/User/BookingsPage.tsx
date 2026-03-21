import React, { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarCheck, Clock, MapPin, User, Wifi, WifiOff,
  CheckCircle, X, Zap, Trash2, RefreshCw, Users,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Booking {
  id: number | string;
  user: string;
  court: string;
  timeslot: string;
  status: string;
}

type Toast = { id: string; message: string; type: "success" | "info" | "error" };
type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE   = "http://localhost:8080/api";
const SOCKET_URL = "http://localhost:8080";
const uid = () => Math.random().toString(36).slice(2, 9);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusConfig = (status?: string) => {
  switch ((status || "").toLowerCase()) {
    case "available":
      return { dot: "bg-green-500",  badge: "bg-green-500/10 text-green-400 border-green-500/20"  };
    case "occupied":
    case "busy":
      return { dot: "bg-red-500",    badge: "bg-red-500/10 text-red-400 border-red-500/20"    };
    case "pending":
      return { dot: "bg-amber-500",  badge: "bg-amber-500/10 text-amber-400 border-amber-500/20"  };
    case "cancelled":
      return { dot: "bg-slate-500",  badge: "bg-slate-500/10 text-slate-400 border-slate-500/20"  };
    default:
      return { dot: "bg-blue-500",   badge: "bg-blue-500/10 text-blue-400 border-blue-500/20"   };
  }
};

const getUserName = (): string | null => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.name || payload.email || null;
  } catch { return null; }
};

const getUserId = (): number | null => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.userId ?? null;
  } catch { return null; }
};

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
      className="flex items-center gap-3 px-4 py-3 bg-[#0f0f1e] border border-slate-700/40 rounded-xl shadow-xl text-xs font-mono"
    >
      <CheckCircle size={13} className={`shrink-0 ${colors[toast.type]}`} />
      <span className="text-slate-200 text-[11px]">{toast.message}</span>
      <button onClick={() => onDismiss(toast.id)} className="text-slate-600 hover:text-slate-400 ml-1">
        <X size={11} />
      </button>
    </motion.div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const BookingsPage: React.FC = () => {
  const [bookings, setBookings]         = useState<Booking[]>([]);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState<"mine" | "all">("mine");
  const [socketStatus, setSocketStatus] = useState<ConnectionStatus>("connecting");
  const [toasts, setToasts]             = useState<Toast[]>([]);
  const [flashIds, setFlashIds]         = useState<Set<number | string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);
  const [lastUpdated, setLastUpdated]   = useState<Date | null>(null);

  const socketRef   = useRef<Socket | null>(null);
  const addToastRef = useRef<(msg: string, type?: Toast["type"]) => void>(() => {});

  const currentUser = getUserName();
  const currentUserId = getUserId();

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

  const fetchBookings = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/bookings`);
      setBookings(res.data || []);
      setLastUpdated(new Date());
    } catch {
      addToastRef.current("Failed to load bookings", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // ── Socket ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
    });
    socketRef.current = socket;

    socket.on("connect",    () => { setSocketStatus("connected"); });
    socket.on("disconnect", () => setSocketStatus("disconnected"));
    socket.on("connect_error", () => setSocketStatus("error"));

    socket.on("bookingsUpdated", (updated: Booking[]) => {
      setBookings(prev => {
        // Find new or changed bookings
        const newIds = updated
          .filter(u => {
            const old = prev.find(p => p.id === u.id);
            return !old || old.status !== u.status;
          })
          .map(u => u.id);

        if (newIds.length > 0) {
          flashRows(newIds);
          addToastRef.current(
            newIds.length === 1
              ? "A booking was just updated"
              : `${newIds.length} bookings updated`,
            "info"
          );
        }
        return updated;
      });
      setLastUpdated(new Date());
    });

    return () => { socket.disconnect(); };
  }, []);

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${API_BASE}/bookings/${deleteTarget.id}`);
      addToast("Booking cancelled", "success");
      setDeleteTarget(null);
    } catch {
      addToast("Failed to cancel booking", "error");
    }
  };

  // ── Filtered views ─────────────────────────────────────────────────────────

  const myBookings  = bookings.filter(b =>
    b.user?.toLowerCase() === currentUser?.toLowerCase()
  );
  const displayed   = tab === "mine" ? myBookings : bookings;

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  // ── Stat counts ────────────────────────────────────────────────────────────

  const statCounts = {
    total:     myBookings.length,
    available: myBookings.filter(b => b.status.toLowerCase() === "available").length,
    pending:   myBookings.filter(b => b.status.toLowerCase() === "pending").length,
  };

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
          0%   { background: rgba(249,115,22,0.12); }
          100% { background: transparent; }
        }
        .flash-row { animation: flash-row 1.4s ease-out; }
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
              <div className="w-11 h-11 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={18} className="text-red-400" />
              </div>
              <h3 className="font-barlow text-lg font-bold text-slate-100 uppercase tracking-wider mb-1">Cancel Booking?</h3>
              <p className="text-slate-500 text-xs mb-1 tracking-wide">{deleteTarget.court}</p>
              <p className="text-slate-600 text-[11px] mb-5">{deleteTarget.timeslot}</p>
              <div className="flex gap-3">
                <button onClick={handleDelete}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-[11px] tracking-widest uppercase transition-colors">
                  Cancel Booking
                </button>
                <button onClick={() => setDeleteTarget(null)}
                  className="flex-1 bg-slate-700/50 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-[11px] tracking-widest uppercase transition-colors">
                  Keep
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-[#0d0d1a] font-mono-dm px-8 py-6">

        {/* ── Header ── */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[10px] text-orange-400 tracking-[0.2em] uppercase">CourtWatch</p>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] tracking-widest ${
                socketStatus === "connected"
                  ? "bg-green-500/10 border-green-500/20 text-green-400"
                  : socketStatus === "connecting"
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}>
                {socketStatus === "connected"
                  ? <><Wifi size={9} /><span className="w-1 h-1 rounded-full bg-green-400 block animate-pulse" />LIVE</>
                  : <><WifiOff size={9} />{socketStatus.toUpperCase()}</>
                }
              </div>
            </div>
            <h1 className="font-barlow text-[36px] font-black text-white uppercase leading-none tracking-tight">
              Bookings
            </h1>
            {lastUpdated && (
              <p className="text-slate-600 text-[10px] tracking-wider mt-1">
                Last updated {fmtTime(lastUpdated)}
              </p>
            )}
          </div>

          <button
            onClick={fetchBookings}
            className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 px-4 py-2 rounded-xl text-[10px] tracking-widest uppercase transition-colors"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {/* ── My stats ── */}
        <div className="grid grid-cols-3 gap-4 mb-7">
          {[
            { label: "My Bookings",  value: statCounts.total,     icon: <CalendarCheck size={16} /> },
            { label: "Confirmed",    value: statCounts.available,  icon: <CheckCircle size={16} />   },
            { label: "Pending",      value: statCounts.pending,    icon: <Clock size={16} />          },
          ].map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-gradient-to-br from-[#12122a] to-[#0f0f1e] border border-orange-500/[0.1] rounded-2xl p-5 flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/15 rounded-xl flex items-center justify-center text-orange-500 shrink-0">
                {s.icon}
              </div>
              <div>
                <p className="text-[9px] text-slate-500 tracking-[0.15em] uppercase">{s.label}</p>
                <p className="font-barlow text-3xl font-black text-slate-100 leading-none mt-0.5">{s.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-2 mb-5">
          {[
            { key: "mine", label: "My Bookings", icon: <User size={12} />,  count: myBookings.length },
            { key: "all",  label: "All Bookings", icon: <Users size={12} />, count: bookings.length },
          ].map(t => (
            <button key={t.key}
              onClick={() => setTab(t.key as "mine" | "all")}
              className={[
                "flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] tracking-widest uppercase border transition-all",
                tab === t.key
                  ? "bg-orange-500/15 border-orange-500/40 text-orange-400"
                  : "bg-transparent border-slate-700/40 text-slate-500 hover:border-slate-600",
              ].join(" ")}
            >
              {t.icon} {t.label}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                tab === t.key ? "bg-orange-500/20 text-orange-400" : "bg-slate-700/40 text-slate-600"
              }`}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* ── Table ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-gradient-to-br from-[#12122a] to-[#0f0f1e] border border-orange-500/[0.1] rounded-2xl overflow-hidden"
        >
          {/* Table header */}
          <div className="grid grid-cols-[2fr_2fr_2.5fr_1.5fr_auto] gap-4 px-6 py-3 border-b border-slate-700/30">
            {["User", "Court", "Time Slot", "Status", ""].map(h => (
              <div key={h} className="text-[9px] text-slate-500 tracking-[0.18em] uppercase font-medium">{h}</div>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-7 h-7 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
            </div>
          )}

          {/* Empty */}
          {!loading && displayed.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-600">
              <CalendarCheck size={32} className="mb-3 opacity-30" />
              <p className="text-[11px] tracking-widest uppercase">
                {tab === "mine" ? "You have no bookings yet" : "No bookings found"}
              </p>
              {tab === "mine" && (
                <p className="text-[10px] mt-1 opacity-60">Head to the dashboard to book a court</p>
              )}
            </div>
          )}

          {/* Rows */}
          {!loading && displayed.map((b, i) => {
            const s = statusConfig(b.status);
            const isFlashing = flashIds.has(b.id);
            const isMine = b.user?.toLowerCase() === currentUser?.toLowerCase();

            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className={`grid grid-cols-[2fr_2fr_2.5fr_1.5fr_auto] gap-4 items-center px-6 py-3.5 border-b border-slate-700/[0.15] hover:bg-orange-500/[0.02] transition-colors ${
                  isFlashing ? "flash-row" : ""
                }`}
              >
                {/* User */}
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] text-white font-bold shrink-0"
                    style={{ background: `hsl(${((b.user || "?").charCodeAt(0) * 15) % 360}, 55%, 35%)` }}
                  >
                    {(b.user || "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className="text-slate-200 text-xs font-medium truncate block">{b.user || "—"}</span>
                    {isMine && (
                      <span className="text-[8px] text-orange-400 tracking-widest">YOU</span>
                    )}
                  </div>
                </div>

                {/* Court */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin size={10} className="text-slate-600 shrink-0" />
                  <span className="text-slate-300 text-xs truncate">{b.court || "—"}</span>
                </div>

                {/* Timeslot */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <Clock size={10} className="text-slate-600 shrink-0" />
                  <span className="text-slate-400 text-[11px] font-mono truncate">{b.timeslot || "—"}</span>
                </div>

                {/* Status */}
                <div>
                  <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full border tracking-widest ${s.badge}`}>
                    <span className={`w-1 h-1 rounded-full shrink-0 ${s.dot}`} />
                    {(b.status || "—").toUpperCase()}
                  </span>
                  {isFlashing && (
                    <span className="ml-1.5 inline-flex items-center gap-0.5 text-[8px] text-orange-400">
                      <Zap size={8} />
                    </span>
                  )}
                </div>

                {/* Actions — only show cancel for own bookings */}
                <div className="flex justify-end">
                  {isMine && (
                    <button
                      onClick={() => setDeleteTarget(b)}
                      className="w-7 h-7 rounded-lg bg-red-500/0 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-slate-600 hover:text-red-400 flex items-center justify-center transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Footer count */}
        {!loading && displayed.length > 0 && (
          <p className="text-[10px] text-slate-600 tracking-widest uppercase mt-4 text-center">
            Showing {displayed.length} booking{displayed.length !== 1 ? "s" : ""}
            {tab === "all" && ` · ${myBookings.length} yours`}
          </p>
        )}
      </div>
    </>
  );
};

export default BookingsPage;