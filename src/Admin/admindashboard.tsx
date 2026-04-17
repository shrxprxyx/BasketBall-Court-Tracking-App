import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import io, { Socket } from "socket.io-client";
import {
  Bell, User, MapPin, Bookmark, Users, Settings,
  Box, Activity, Wifi, WifiOff, RefreshCw,
  CheckCircle, AlertCircle, Info, X, Zap,
} from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type Court = {
  id: number;
  name: string;
  location?: string;
  status?: string;
  players?: number;
  distance?: number;
  photo?: string | null;
};

type UserType = {
  id: number | string;
  name: string;
  email: string;
  role: string;
};

type Booking = {
  id: string | number;
  user: string;
  court: string;
  timeslot: string;
  status: string;
};

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

type Toast = {
  id: string;
  message: string;
  type: "success" | "info" | "warning" | "error";
  timestamp: Date;
};

type LiveEvent = {
  id: string;
  message: string;
  type: "users" | "courts" | "bookings";
  timestamp: Date;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const weeklyData = [
  { day: "Mon", value: 25 },
  { day: "Tue", value: 32 },
  { day: "Wed", value: 28 },
  { day: "Thu", value: 35 },
  { day: "Fri", value: 40 },
  { day: "Sat", value: 48 },
  { day: "Sun", value: 45 },
];

const API_BASE = "http://localhost:8080/api";
const SOCKET_URL = "http://localhost:8080";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusConfig = (status?: string) => {
  switch ((status || "").toLowerCase()) {
    case "available":
      return { dot: "bg-green-500", badge: "bg-green-500/10 text-green-400" };
    case "occupied":
      return { dot: "bg-red-500", badge: "bg-red-500/10 text-red-400" };
    case "maintenance":
      return { dot: "bg-amber-500", badge: "bg-amber-500/10 text-amber-400" };
    default:
      return { dot: "bg-slate-500", badge: "bg-slate-500/10 text-slate-400" };
  }
};

const uid = () => Math.random().toString(36).slice(2, 9);

const fmtTime = (d: Date) =>
  d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

// ─── Sub-components ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#1a1a2e] border border-orange-500/30 rounded-lg px-4 py-2 text-slate-100 text-xs font-mono">
        <p className="text-orange-400 font-bold">{label}</p>
        <p>{payload[0].value} bookings</p>
      </div>
    );
  }
  return null;
};

// Toast notification
const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 4500);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  const icons = {
    success: <CheckCircle size={14} className="text-green-400 shrink-0" />,
    info: <Info size={14} className="text-blue-400 shrink-0" />,
    warning: <AlertCircle size={14} className="text-amber-400 shrink-0" />,
    error: <AlertCircle size={14} className="text-red-400 shrink-0" />,
  };
  const colors = {
    success: "border-green-500/30 bg-green-500/5",
    info: "border-blue-500/30 bg-blue-500/5",
    warning: "border-amber-500/30 bg-amber-500/5",
    error: "border-red-500/30 bg-red-500/5",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 60, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`flex items-start gap-2.5 px-3.5 py-3 rounded-xl border text-xs font-mono-dm shadow-xl ${colors[toast.type]}`}
      style={{ background: "#0f0f1e" }}
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <p className="text-slate-200 text-[11px] leading-snug">{toast.message}</p>
        <p className="text-slate-500 text-[9px] mt-0.5 tracking-wider">{fmtTime(toast.timestamp)}</p>
      </div>
      <button onClick={() => onDismiss(toast.id)} className="text-slate-500 hover:text-slate-300 transition-colors ml-1 mt-0.5">
        <X size={12} />
      </button>
    </motion.div>
  );
};


// ─── Main Component ───────────────────────────────────────────────────────────

const AdminDashboard: React.FC = () => {
  const [courts, setCourts] = useState<Court[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState("dashboard");

  // Real-time state
  const [socketStatus, setSocketStatus] = useState<ConnectionStatus>("connecting");
  const [socketId, setSocketId] = useState<string | null>(null);
  const [lastPing, setLastPing] = useState<Date | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [showEventFeed, setShowEventFeed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Flash states for tables
  const [flashCourts, setFlashCourts] = useState(false);
  const [flashUsers, setFlashUsers] = useState(false);
  const [flashBookings, setFlashBookings] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const lastConnErrRef = useRef<number>(0); // throttle connect_error toasts

  // ── Helpers ──────────────────────────────────────────────────────────────

  const addToast = useCallback((message: string, type: Toast["type"] = "info") => {
    setToasts(prev => {
      // Deduplicate: skip if same message already visible
      if (prev.some(t => t.message === message)) return prev;
      return [...prev.slice(-4), { id: uid(), message, type, timestamp: new Date() }];
    });
  }, []);

  // Stable ref so fetch useEffect can use it without being in deps
  const addToastRef = useRef(addToast);
  useEffect(() => { addToastRef.current = addToast; }, [addToast]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addLiveEvent = useCallback((message: string, type: LiveEvent["type"]) => {
    setLiveEvents(prev => [{ id: uid(), message, type, timestamp: new Date() }, ...prev.slice(0, 49)]);
    setUnreadCount(c => c + 1);
  }, []);

  const flashTable = (which: "courts" | "users" | "bookings") => {
    if (which === "courts") { setFlashCourts(true); setTimeout(() => setFlashCourts(false), 1200); }
    if (which === "users")  { setFlashUsers(true);  setTimeout(() => setFlashUsers(false),  1200); }
    if (which === "bookings"){ setFlashBookings(true); setTimeout(() => setFlashBookings(false), 1200); }
  };

  // ── Initial fetch ─────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courtRes, userRes, bookingRes] = await Promise.all([
          axios.get(`${API_BASE}/courts`),
          axios.get(`${API_BASE}/users`),
          axios.get(`${API_BASE}/bookings`),
        ]);
        setCourts(courtRes.data || []);
        setUsers(userRes.data || []);
        setBookings(bookingRes.data || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        addToastRef.current("Failed to load initial data", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []); // stable ref — no deps needed

  // ── Socket.IO ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketStatus("connected");
      setSocketId(socket.id ?? null);
      setLastPing(new Date());
      addToast("Connected to live server", "success");
      addLiveEvent("Socket connected", "users");
    });

    socket.on("disconnect", (reason) => {
      setSocketStatus("disconnected");
      setSocketId(null);
      addToast(`Disconnected: ${reason}`, "error");
      addLiveEvent(`Disconnected (${reason})`, "users");
    });

    socket.on("connect_error", () => {
      setSocketStatus("error");
      const now = Date.now();
      if (now - lastConnErrRef.current > 5000) {
        lastConnErrRef.current = now;
        addToast("Connection error — retrying…", "warning");
      }
    });

    socket.on("reconnecting", () => {
      setSocketStatus("connecting");
    });

    // ── Data events ──

    socket.on("usersUpdated", (updatedUsers: UserType[]) => {
      setUsers(updatedUsers);
      setLastPing(new Date());
      flashTable("users");
      addToast(`Users updated · ${updatedUsers.length} total`, "info");
      addLiveEvent(`Users list updated (${updatedUsers.length} users)`, "users");
    });

    socket.on("courtsUpdated", (updatedCourts: Court[]) => {
      setCourts(updatedCourts);
      setLastPing(new Date());
      flashTable("courts");
      addToast(`Courts updated · ${updatedCourts.length} total`, "info");
      addLiveEvent(`Courts list updated (${updatedCourts.length} courts)`, "courts");
    });

    // bookingsUpdated — wire up once backend emits it (see bookings.js update below)
    socket.on("bookingsUpdated", (updatedBookings: Booking[]) => {
      setBookings(updatedBookings);
      setLastPing(new Date());
      flashTable("bookings");
      addToast(`New booking activity · ${updatedBookings.length} total`, "success");
      addLiveEvent(`Bookings updated (${updatedBookings.length} bookings)`, "bookings");
    });

    return () => {
      socket.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loading screen ────────────────────────────────────────────────────────

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0d0d1a] text-orange-500 font-mono text-sm tracking-widest">
        <div className="w-10 h-10 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-4" />
        LOADING DASHBOARD
      </div>
    );

  // ── Data ──────────────────────────────────────────────────────────────────

  const navItems = [
    { id: "dashboard", icon: <Box size={16} />, label: "Dashboard", to: "#" },
    { id: "courts",   icon: <MapPin size={16} />, label: "Courts",    to: "/admin/courts" },
    { id: "users",    icon: <Users size={16} />,  label: "Users",     to: "/admin/UserPage" },
    { id: "bookings", icon: <Bookmark size={16} />, label: "Bookings", to: "#" },
    { id: "settings", icon: <Settings size={16} />, label: "Settings", to: "#" },
  ];

  const stats = [
    { label: "Total Courts",   value: courts.length,   icon: <MapPin size={20} />,     flash: flashCourts },
    { label: "Total Users",    value: users.length,    icon: <Users size={20} />,  flash: flashUsers },
    { label: "Total Bookings", value: bookings.length, icon: <Bookmark size={20} />,    flash: flashBookings },
  ];

  const today = new Date()
    .toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    .toUpperCase();

  const eventTypeColor: Record<LiveEvent["type"], string> = {
    users: "text-blue-400",
    courts: "text-orange-400",
    bookings: "text-green-400",
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        .font-barlow  { font-family: 'Barlow Condensed', sans-serif; }
        .font-mono-dm { font-family: 'DM Mono', monospace; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0d0d1a; }
        ::-webkit-scrollbar-thumb { background: #f97316; border-radius: 2px; }
        .stat-card:hover .stat-icon { transform: scale(1.1) rotate(-5deg); }
        .live-dot { animation: pulse-dot 1.5s ease-in-out infinite; }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes flash-ring {
          0%   { box-shadow: 0 0 0 0 rgba(249,115,22,0.6); }
          70%  { box-shadow: 0 0 0 8px rgba(249,115,22,0); }
          100% { box-shadow: 0 0 0 0 rgba(249,115,22,0); }
        }
        .flash-ring { animation: flash-ring 1.1s ease-out; }
      `}</style>

      {/* ── Toast stack ── */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-72">
        <AnimatePresence>
          {toasts.map(t => (
            <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
          ))}
        </AnimatePresence>
      </div>

      <div className="flex min-h-screen bg-[#0d0d1a] font-mono-dm">

        {/* ── Sidebar ── */}
        <aside className="w-[220px] bg-[#0f0f1e] border-r border-orange-500/10 flex flex-col sticky top-0 h-screen py-7 shrink-0">

          {/* Logo */}
          <div className="px-6 pb-8 border-b border-orange-500/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shrink-0">
                <Activity size={16} className="text-white" />
              </div>
              <div>
                <p className="text-white text-[13px] font-bold tracking-widest uppercase leading-tight">Court</p>
                <p className="text-orange-500 text-[11px] tracking-[0.18em] uppercase leading-tight">Admin</p>
              </div>
            </div>
          </div>

          {/* Nav */}
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
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* ── Main Content ── */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">

          {/* Header */}
          <header className="flex justify-between items-center py-6 border-b border-orange-500/[0.08] mb-7 sticky top-0 bg-[#0d0d1a] z-10">
            <div>
              <h1 className="font-barlow text-[28px] font-extrabold text-slate-100 tracking-wide uppercase">
                Dashboard Overview
              </h1>
              <p className="text-[11px] text-slate-500/50 mt-0.5 tracking-widest">{today}</p>
            </div>

            <div className="flex items-center gap-3">

              {/* Live event feed toggle */}
              <button
                onClick={() => { setShowEventFeed(v => !v); setUnreadCount(0); }}
                className="relative bg-orange-500/10 border border-orange-500/20 rounded-lg p-2 cursor-pointer flex items-center hover:bg-orange-500/20 transition-colors"
              >
                <Zap size={16} className="text-orange-500" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Bell */}
              <button className="relative bg-orange-500/10 border border-orange-500/20 rounded-lg p-2 cursor-pointer flex items-center hover:bg-orange-500/20 transition-colors">
                <Bell size={16} className="text-orange-500" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-[#0d0d1a]" />
              </button>

              {/* Admin pill */}
              <div className="flex items-center gap-2.5 bg-orange-500/[0.08] border border-orange-500/15 rounded-xl px-3.5 py-2">
                <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shrink-0">
                  <User size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-slate-100 text-[12px] font-medium leading-tight">Admin</p>
                </div>
              </div>
            </div>
          </header>

          {/* ── Live Event Feed Panel ── */}
          <AnimatePresence>
            {showEventFeed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden mb-6"
              >
                <div className="bg-gradient-to-br from-[#12122a] to-[#0f0f1e] border border-orange-500/[0.15] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-orange-500" />
                      <h3 className="font-barlow text-sm font-bold text-slate-100 tracking-wider uppercase">Live Event Feed</h3>
                      <span className="live-dot w-1.5 h-1.5 rounded-full bg-green-400 block" />
                    </div>
                    <button
                      onClick={() => setLiveEvents([])}
                      className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-300 tracking-widest transition-colors"
                    >
                      <RefreshCw size={10} /> CLEAR
                    </button>
                  </div>

                  {liveEvents.length === 0 ? (
                    <p className="text-slate-600 text-[11px] tracking-widest py-2">Waiting for events…</p>
                  ) : (
                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {liveEvents.map(ev => (
                        <div key={ev.id} className="flex items-center gap-3 text-[11px] border-b border-slate-700/20 pb-1.5">
                          <span className="text-slate-600 font-mono shrink-0">{fmtTime(ev.timestamp)}</span>
                          <span className={`shrink-0 uppercase text-[9px] tracking-widest ${eventTypeColor[ev.type]}`}>
                            [{ev.type}]
                          </span>
                          <span className="text-slate-300">{ev.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {stats.map((card, i) => (
              <motion.div
                key={i}
                className={`stat-card relative overflow-hidden bg-gradient-to-br from-[#12122a] to-[#0f0f1e] border rounded-2xl p-6 cursor-default transition-all duration-300 ${
                  card.flash
                    ? "border-orange-500/60 flash-ring"
                    : "border-orange-500/[0.12]"
                }`}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.12),transparent_70%)]" />
                {card.flash && (
                  <div className="absolute top-2 right-2">
                    <span className="flex items-center gap-1 text-[8px] text-orange-400 tracking-widest bg-orange-500/10 px-1.5 py-0.5 rounded-full animate-pulse">
                      <Zap size={8} /> UPDATED
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] text-slate-400/60 tracking-[0.15em] uppercase mb-2.5">{card.label}</p>
                    <p className="font-barlow text-[48px] font-extrabold text-slate-100 leading-none">{card.value}</p>
                    <p className="flex items-center gap-1 text-[10px] text-green-400 mt-2">
                    </p>
                  </div>
                  <div className="stat-icon w-11 h-11 bg-orange-500/[0.12] border border-orange-500/20 rounded-xl flex items-center justify-center text-orange-500 transition-transform duration-200">
                    {card.icon}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── Chart ── */}
          <motion.div
            className="bg-gradient-to-br from-[#12122a] to-[#0f0f1e] border border-orange-500/[0.12] rounded-2xl p-6 mb-6"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-barlow text-lg font-bold text-slate-100 tracking-wide uppercase">
                  Weekly Booking Trend
                </h3>
                <p className="text-[10px] text-slate-500/40 tracking-widest mt-0.5">COURT ACTIVITY THIS WEEK</p>
              </div>
              <div className="flex gap-2">
                {["1W", "1M", "3M"].map((p, i) => (
                  <button
                    key={p}
                    className={[
                      "text-[10px] tracking-wider px-2.5 py-1 rounded-md cursor-pointer border transition-colors",
                      i === 0
                        ? "bg-orange-500/15 border-orange-500/40 text-orange-500"
                        : "bg-transparent border-slate-500/10 text-slate-500/40 hover:border-slate-500/30",
                    ].join(" ")}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                <XAxis dataKey="day" tick={{ fill: "rgba(148,163,184,0.4)", fontSize: 10, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(148,163,184,0.4)", fontSize: 10, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} fill="url(#orangeGrad)"
                  dot={{ fill: "#f97316", r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#f97316", stroke: "rgba(249,115,22,0.3)", strokeWidth: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* ── Courts & Users ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

            {/* Courts Table */}
            <motion.div
              className={`bg-gradient-to-br from-[#12122a] to-[#0f0f1e] border rounded-2xl p-6 transition-all duration-300 ${
                flashCourts ? "border-orange-500/50 flash-ring" : "border-orange-500/[0.12]"
              }`}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            >
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <h3 className="font-barlow text-base font-bold text-slate-100 tracking-wider uppercase">Courts</h3>
                  {flashCourts && <Zap size={12} className="text-orange-400 animate-pulse" />}
                </div>
                <span className="text-[10px] text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">
                  {courts.length} TOTAL
                </span>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {["Name", "Status", "Players"].map(h => (
                      <th key={h} className="text-left text-[9px] text-slate-400/40 tracking-[0.18em] uppercase pb-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {courts.map((c) => {
                    const s = statusConfig(c.status);
                    return (
                      <tr key={c.id} className="group border-t border-slate-400/[0.06] hover:bg-orange-500/[0.02]">
                        <td className="py-2.5 text-slate-200 text-xs font-medium">{c.name}</td>
                        <td>
                          <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full tracking-widest ${s.badge}`}>
                            <span className={`w-1 h-1 rounded-full shrink-0 ${s.dot}`} />
                            {(c.status || "—").toUpperCase()}
                          </span>
                        </td>
                        <td className="text-slate-400/60 text-xs">{c.players ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </motion.div>

            {/* Users Table */}
            <motion.div
              className={`bg-gradient-to-br from-[#12122a] to-[#0f0f1e] border rounded-2xl p-6 transition-all duration-300 ${
                flashUsers ? "border-orange-500/50 flash-ring" : "border-orange-500/[0.12]"
              }`}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            >
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <h3 className="font-barlow text-base font-bold text-slate-100 tracking-wider uppercase">Users</h3>
                  {flashUsers && <Zap size={12} className="text-orange-400 animate-pulse" />}
                </div>
                <span className="text-[10px] text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">
                  {users.length} TOTAL
                </span>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {["Name", "Email", "Role"].map(h => (
                      <th key={h} className="text-left text-[9px] text-slate-400/40 tracking-[0.18em] uppercase pb-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="group border-t border-slate-400/[0.06] hover:bg-orange-500/[0.02]">
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] text-white font-bold shrink-0"
                            style={{ background: `hsl(${(u.name.charCodeAt(0) * 15) % 360}, 55%, 38%)` }}
                          >
                            {u.name[0]}
                          </div>
                          <span className="text-slate-200 text-xs font-medium">{u.name}</span>
                        </div>
                      </td>
                      <td className="text-slate-400/50 text-[11px]">{u.email}</td>
                      <td>
                        <span className={`text-[9px] tracking-widest uppercase ${u.role === "admin" ? "text-orange-500" : "text-slate-400/60"}`}>
                          {u.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </div>

          {/* ── Bookings ── */}
          <motion.div
            className={`bg-gradient-to-br from-[#12122a] to-[#0f0f1e] border rounded-2xl p-6 transition-all duration-300 ${
              flashBookings ? "border-orange-500/50 flash-ring" : "border-orange-500/[0.12]"
            }`}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          >
            <div className="flex justify-between items-center mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-barlow text-base font-bold text-slate-100 tracking-wider uppercase">Recent Bookings</h3>
                  {flashBookings && <Zap size={12} className="text-orange-400 animate-pulse" />}
                </div>
                <p className="text-[9px] text-slate-400/30 tracking-[0.12em] mt-0.5">LATEST ACTIVITY</p>
              </div>
              <button className="bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-lg px-3.5 py-1.5 text-[10px] tracking-widest uppercase cursor-pointer hover:bg-orange-500/20 transition-colors">
                View All →
              </button>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["User", "Court", "Time Slot", "Status"].map(h => (
                    <th key={h} className="text-left text-[9px] text-slate-400/40 tracking-[0.18em] uppercase pb-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const s = statusConfig(b.status);
                  return (
                    <tr key={b.id} className="group border-t border-slate-400/[0.06] hover:bg-orange-500/[0.02]">
                      <td className="py-3 text-slate-200 text-xs">{b.user}</td>
                      <td className="text-slate-400/70 text-xs">{b.court}</td>
                      <td className="text-slate-400/50 text-[11px] font-mono">{b.timeslot}</td>
                      <td>
                        <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full tracking-widest ${s.badge}`}>
                          <span className={`w-1 h-1 rounded-full shrink-0 ${s.dot}`} />
                          {(b.status || "—").toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>

        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
