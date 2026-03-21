import React, { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, SlidersHorizontal, MapPin, Users, Layers, X, Clock, CheckCircle, Zap, ArrowRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Court {
  id: number;
  name: string;
  photo: string | null;
  distance: number;
  surface: string;
  players: number;
  status: "AVAILABLE" | "BUSY" | "CLOSED";
}

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

type Toast = { id: string; message: string; type: "success" | "info" | "error" };

// ─── Constants ────────────────────────────────────────────────────────────────

const SOCKET_URL = "http://localhost:8080";
const API_BASE   = "http://localhost:8080/api";
const uid = () => Math.random().toString(36).slice(2, 9);

// ─── Status helpers ───────────────────────────────────────────────────────────

const statusConfig = (status: Court["status"]) => {
  switch (status) {
    case "AVAILABLE": return { dot: "bg-green-500", badge: "bg-green-500/10 text-green-400 border-green-500/20",  label: "Available" };
    case "BUSY":      return { dot: "bg-orange-500", badge: "bg-orange-500/10 text-orange-400 border-orange-500/20", label: "Busy" };
    case "CLOSED":    return { dot: "bg-slate-500",  badge: "bg-slate-500/10 text-slate-400 border-slate-500/20",   label: "Closed" };
  }
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  const styles = {
    success: "border-green-500/25 text-green-400",
    info:    "border-blue-500/25 text-blue-400",
    error:   "border-red-500/25 text-red-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      className={`flex items-center gap-3 px-4 py-3 bg-[#0f0f1e] border rounded-xl shadow-xl text-xs ${styles[toast.type]}`}
    >
      <CheckCircle size={13} className="shrink-0" />
      <span className="text-slate-200 text-[11px] font-mono">{toast.message}</span>
      <button onClick={() => onDismiss(toast.id)} className="text-slate-600 hover:text-slate-400 ml-1">
        <X size={11} />
      </button>
    </motion.div>
  );
};

// ─── Booking Modal ─────────────────────────────────────────────────────────────

const BookingModal: React.FC<{
  court: Court;
  onClose: () => void;
  onBooked: (msg: string) => void;
}> = ({ court, onClose, onBooked }) => {
  const [timeslot, setTimeslot] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  // Get user id from token (simple decode)
  const getUserId = (): number | null => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.userId;
    } catch { return null; }
  };

  const slots = [
    "08:00 AM - 09:00 AM", "09:00 AM - 10:00 AM", "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM", "12:00 PM - 01:00 PM", "01:00 PM - 02:00 PM",
    "02:00 PM - 03:00 PM", "03:00 PM - 04:00 PM", "04:00 PM - 05:00 PM",
    "05:00 PM - 06:00 PM", "06:00 PM - 07:00 PM", "07:00 PM - 08:00 PM",
  ];

  const handleBook = async () => {
    if (!timeslot) return setError("Please select a time slot.");
    const user_id = getUserId();
    if (!user_id) return setError("Not logged in. Please sign in.");
    setLoading(true); setError("");
    try {
      await axios.post(`${API_BASE}/bookings`, {
        user_id,
        court_id: court.id,
        timeslot,
        status: "available",
      });
      onBooked(`Booked ${court.name} · ${timeslot}`);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Booking failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const s = statusConfig(court.status);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 24 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#0f0f1e] border border-orange-500/20 rounded-2xl w-full max-w-md overflow-hidden"
      >
        {/* Court image header */}
        <div className="relative h-36 overflow-hidden">
          {court.photo ? (
            <img src={`${SOCKET_URL}${court.photo}`} alt={court.name}
              className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-800/60 to-slate-900/60 flex items-center justify-center">
              <MapPin size={36} className="text-slate-700" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1e] via-black/30 to-transparent" />
          <button onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <X size={14} />
          </button>
          <div className="absolute bottom-3 left-4">
            <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full border tracking-widest ${s.badge}`}>
              <span className={`w-1 h-1 rounded-full ${s.dot}`} />{s.label.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="p-5">
          <h3 className="font-barlow text-xl font-bold text-slate-100 uppercase tracking-wide mb-1">{court.name}</h3>
          <div className="flex items-center gap-4 text-[11px] text-slate-500 mb-5">
            <span className="flex items-center gap-1"><MapPin size={10} /> {court.distance} mi</span>
            <span className="flex items-center gap-1"><Layers size={10} /> {court.surface || "—"}</span>
            <span className="flex items-center gap-1"><Users size={10} /> {court.players} playing</span>
          </div>

          {court.status !== "AVAILABLE" && (
            <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-400 text-[11px] tracking-wide">
              This court is currently {court.status.toLowerCase()}. You can still book a future slot.
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-[11px] tracking-wide">
              {error}
            </div>
          )}

          {/* Time slot picker */}
          <div className="mb-5">
            <label className="block text-[9px] text-slate-500 tracking-[0.18em] uppercase mb-2">
              <Clock size={9} className="inline mr-1" />Select Time Slot
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {slots.map(slot => (
                <button key={slot} type="button"
                  onClick={() => setTimeslot(slot)}
                  className={[
                    "py-2 px-2 rounded-lg text-[10px] tracking-wide border transition-all text-left",
                    timeslot === slot
                      ? "bg-orange-500/15 border-orange-500/50 text-orange-400"
                      : "bg-[#0a0a18] border-slate-700/50 text-slate-500 hover:border-slate-600 hover:text-slate-400",
                  ].join(" ")}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleBook}
            disabled={loading || !timeslot}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl text-[12px] tracking-widest uppercase transition-colors"
          >
            {loading ? "Booking…" : <><ArrowRight size={14} /> Confirm Booking</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const UserDashboard: React.FC = () => {
  const [courts, setCourts]           = useState<Court[]>([]);
  const [search, setSearch]           = useState("");
  const [surfaceFilter, setSurface]   = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading]         = useState(true);
  const [socketStatus, setSocketStatus] = useState<ConnectionStatus>("connecting");
  const [toasts, setToasts]           = useState<Toast[]>([]);
  const [bookingCourt, setBookingCourt] = useState<Court | null>(null);
  const [flashIds, setFlashIds]       = useState<Set<number>>(new Set());

  const socketRef  = useRef<Socket | null>(null);
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

  const flashCard = (ids: number[]) => {
    setFlashIds(new Set(ids));
    setTimeout(() => setFlashIds(new Set()), 1400);
  };

  // Initial fetch
  useEffect(() => {
    axios.get(`${API_BASE}/courts`)
      .then(res => setCourts(res.data || []))
      .catch(() => addToastRef.current("Failed to load courts", "error"))
      .finally(() => setLoading(false));
  }, []);

  // Socket
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketStatus("connected");
      addToastRef.current("Connected to live server", "success");
    });
    socket.on("disconnect", () => setSocketStatus("disconnected"));
    socket.on("connect_error", () => setSocketStatus("error"));

    socket.on("courtsUpdated", (updated: Court[]) => {
      setCourts(prev => {
        const changedIds = updated
          .filter(u => {
            const old = prev.find(p => p.id === u.id);
            return !old || old.status !== u.status || old.players !== u.players;
          })
          .map(u => u.id);
        if (changedIds.length > 0) {
          flashCard(changedIds);
          addToastRef.current(`${changedIds.length} court${changedIds.length > 1 ? "s" : ""} updated`, "info");
        }
        return updated;
      });
    });

    return () => { socket.disconnect(); };
  }, []);

  // Filtered courts
  const filtered = courts.filter(c => {
    const matchSearch  = c.name.toLowerCase().includes(search.toLowerCase());
    const matchSurface = surfaceFilter === "all" || c.surface?.toLowerCase() === surfaceFilter;
    const matchStatus  = statusFilter  === "all" || c.status === statusFilter;
    return matchSearch && matchSurface && matchStatus;
  });

  const surfaces = ["all", ...Array.from(new Set(courts.map(c => c.surface?.toLowerCase()).filter(Boolean)))];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=DM+Mono:wght@400;500&display=swap');
        .font-barlow  { font-family: 'Barlow Condensed', sans-serif; }
        .font-mono-dm { font-family: 'DM Mono', monospace; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0d0d1a; }
        ::-webkit-scrollbar-thumb { background: #f97316; border-radius: 2px; }
        @keyframes flash-ring {
          0%   { box-shadow: 0 0 0 0 rgba(249,115,22,0.6); }
          70%  { box-shadow: 0 0 0 10px rgba(249,115,22,0); }
          100% { box-shadow: 0 0 0 0 rgba(249,115,22,0); }
        }
        .flash-ring { animation: flash-ring 1.2s ease-out; }
        .card-img { transition: transform 0.5s ease; }
        .court-card:hover .card-img { transform: scale(1.05); }
      `}</style>

      {/* Toast stack */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-72">
        <AnimatePresence>
          {toasts.map(t => <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />)}
        </AnimatePresence>
      </div>

      {/* Booking modal */}
      <AnimatePresence>
        {bookingCourt && (
          <BookingModal
            court={bookingCourt}
            onClose={() => setBookingCourt(null)}
            onBooked={msg => addToast(msg, "success")}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-[#0d0d1a] font-mono-dm px-8 py-6">

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[10px] text-orange-400 tracking-[0.2em] uppercase">CourtWatch</p>
              {/* Live indicator */}
              
            </div>
            <h1 className="font-barlow text-[36px] font-black text-white uppercase leading-none tracking-tight">
              Explore Courts
            </h1>
            <p className="text-slate-500 text-[11px] tracking-wider mt-1">
              {filtered.length} court{filtered.length !== 1 ? "s" : ""} 
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search courts…"
              className="w-full bg-[#0f0f1e] border border-slate-700/50 rounded-xl pl-9 pr-4 py-2.5 text-slate-200 text-xs font-mono placeholder-slate-600 focus:outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/15 transition-all"
            />
          </div>

          {/* Surface filter */}
          <div className="relative flex items-center gap-2">
            <SlidersHorizontal size={12} className="text-slate-600 shrink-0" />
            <select
              value={surfaceFilter}
              onChange={e => setSurface(e.target.value)}
              className="bg-[#0f0f1e] border border-slate-700/50 rounded-xl px-3 py-2.5 text-slate-400 text-xs font-mono focus:outline-none focus:border-orange-500/40 transition-all appearance-none cursor-pointer pr-8"
            >
              {surfaces.map(s => (
                <option key={s} value={s}>{s === "all" ? "All Surfaces" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="flex gap-1.5">
            {[
              { val: "all",       label: "All" },
              { val: "AVAILABLE", label: "Available" },
              { val: "BUSY",      label: "Busy" },
              { val: "CLOSED",    label: "Closed" },
            ].map(opt => (
              <button key={opt.val}
                onClick={() => setStatusFilter(opt.val)}
                className={[
                  "px-3 py-2 rounded-xl text-[10px] tracking-widest uppercase border transition-all",
                  statusFilter === opt.val
                    ? "bg-orange-500/15 border-orange-500/40 text-orange-400"
                    : "bg-transparent border-slate-700/50 text-slate-500 hover:border-slate-600",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-600">
            <div className="w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-4" />
            <p className="text-[11px] tracking-widest uppercase">Loading courts…</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-600">
            <MapPin size={36} className="mb-3 opacity-30" />
            <p className="text-[11px] tracking-widest uppercase">No courts found</p>
            <p className="text-[10px] mt-1 opacity-60">Try adjusting your filters</p>
          </div>
        )}

        {/* Court Grid */}
        {!loading && filtered.length > 0 && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            initial="hidden"
            animate="show"
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
          >
            {filtered.map(court => {
              const s = statusConfig(court.status);
              const isFlashing = flashIds.has(court.id);
              return (
                <motion.div
                  key={court.id}
                  variants={{ hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }}
                  className={`court-card bg-gradient-to-br from-[#12122a] to-[#0f0f1e] border rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:border-orange-500/25 ${
                    isFlashing ? "border-orange-500/50 flash-ring" : "border-orange-500/[0.1]"
                  }`}
                >
                  {/* Photo */}
                  <div className="relative h-44 overflow-hidden bg-slate-900/40">
                    {court.photo ? (
                      <img
                        src={`${SOCKET_URL}${court.photo}`}
                        alt={court.name}
                        className="card-img h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <MapPin size={32} className="text-slate-700" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1e] via-transparent to-transparent" />

                    {/* Status badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full border tracking-widest ${s.badge}`}>
                        <span className={`w-1 h-1 rounded-full ${s.dot} ${court.status === "AVAILABLE" ? "animate-pulse" : ""}`} />
                        {s.label.toUpperCase()}
                      </span>
                    </div>

                    {/* Flash updated chip */}
                    {isFlashing && (
                      <div className="absolute top-3 left-3">
                        <span className="flex items-center gap-1 text-[8px] text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded-full animate-pulse">
                          <Zap size={8} /> UPDATED
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-barlow text-xl font-bold text-slate-100 uppercase tracking-wide leading-tight mb-3">
                      {court.name}
                    </h3>

                    <div className="space-y-1.5 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-slate-500 tracking-[0.15em] uppercase">Surface</span>
                        <span className="text-[11px] text-slate-300">{court.surface || "—"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-slate-500 tracking-[0.15em] uppercase">Distance</span>
                        <span className="text-[11px] text-slate-300">{court.distance} mi</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-slate-500 tracking-[0.15em] uppercase">Players Now</span>
                        <span className="text-[11px] text-slate-300 flex items-center gap-1">
                          <Users size={10} className="text-orange-500" />{court.players}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setBookingCourt(court)}
                      disabled={court.status === "CLOSED"}
                      className={[
                        "mt-auto w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] tracking-widest uppercase transition-all border",
                        court.status === "CLOSED"
                          ? "bg-slate-700/20 border-slate-700/30 text-slate-600 cursor-not-allowed"
                          : "bg-orange-500/10 border-orange-500/25 text-orange-400 hover:bg-orange-500/20 hover:border-orange-500/50",
                      ].join(" ")}
                    >
                      {court.status === "CLOSED" ? "Court Closed" : <><ArrowRight size={12} /> Book Now</>}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </>
  );
};

export default UserDashboard;
