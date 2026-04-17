import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  PlusCircle, Trash2, Edit3, Box, MapPin,
  Users, Bookmark, Settings, X, Check,
  Activity, ImageIcon, Zap,
  Pointer,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

type Court = {
  id: number;
  name: string;
  surface: string;
  status: string;
  distance: number;
  players: number;
  photo: string | null;
};

const API_BASE = "http://localhost:8080/api";

const statusConfig = (status?: string) => {
  switch ((status || "").toUpperCase()) {
    case "AVAILABLE":
      return { dot: "bg-green-500", badge: "bg-green-500/10 text-green-400 border-green-500/20", label: "AVAILABLE" };
    case "BUSY":
    case "OCCUPIED":
      return { dot: "bg-red-500",   badge: "bg-red-500/10 text-red-400 border-red-500/20",     label: "BUSY" };
    case "CLOSED":
    case "MAINTENANCE":
      return { dot: "bg-amber-500", badge: "bg-amber-500/10 text-amber-400 border-amber-500/20", label: "CLOSED" };
    default:
      return { dot: "bg-slate-500", badge: "bg-slate-500/10 text-slate-400 border-slate-500/20", label: status || "—" };
  }
};

const inputCls =
  "w-full bg-[#0d0d1a] border border-slate-700/50 rounded-lg px-3 py-2.5 text-slate-200 text-xs font-mono placeholder-slate-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all";

const labelCls = "block text-[9px] text-slate-500 tracking-[0.18em] uppercase mb-1.5 font-medium";

const AdminCourts: React.FC = () => {
  const [courts, setCourts]           = useState<Court[]>([]);
  const [loading, setLoading]         = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Add form
  const [name, setName]       = useState("");
  const [surface, setSurface] = useState("");
  const [status, setStatus]   = useState("AVAILABLE");
  const [distance, setDistance] = useState<number | "">("");
  const [players, setPlayers]   = useState<number | "">("");
  const [photo, setPhoto]       = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Edit form
  const [editName, setEditName]         = useState("");
  const [editSurface, setEditSurface]   = useState("");
  const [editStatus, setEditStatus]     = useState("AVAILABLE");
  const [editDistance, setEditDistance] = useState(0);
  const [editPlayers, setEditPlayers]   = useState(0);

  const fetchCourts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/courts`);
      setCourts(res.data);
    } catch (err) {
      console.error("Error fetching courts:", err);
    }
  };

  useEffect(() => { fetchCourts(); }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPhoto(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  };

  const handleAddCourt = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("surface", surface);
    formData.append("status", status);
    formData.append("distance", String(distance));
    formData.append("players", String(players));
    if (photo) formData.append("photo", photo);
    try {
      await axios.post(`${API_BASE}/admin/court`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setName(""); setSurface(""); setStatus("AVAILABLE");
      setDistance(""); setPlayers(""); setPhoto(null); setPhotoPreview(null);
      setShowAddForm(false);
      fetchCourts();
    } catch (err) {
      console.error("Error adding court:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${API_BASE}/admin/court/${id}`);
      setDeleteConfirm(null);
      fetchCourts();
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  const handleEditClick = (court: Court) => {
    setEditingCourt(court);
    setEditName(court.name);
    setEditSurface(court.surface);
    setEditStatus(court.status);
    setEditDistance(court.distance);
    setEditPlayers(court.players);
  };

  const handleUpdateCourt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourt) return;
    try {
      await axios.put(`${API_BASE}/admin/court/${editingCourt.id}`, {
        name: editName, surface: editSurface,
        status: editStatus, distance: editDistance, players: editPlayers,
      });
      setEditingCourt(null);
      fetchCourts();
    } catch (err) {
      console.error("Error updating:", err);
    }
  };

  const navItems = [
    { id: "dashboard", icon: <Box size={16} />,      label: "Dashboard", to: "/admin-dashboard" },
    { id: "courts",    icon: <MapPin size={16} />,    label: "Courts",    to: "/admin/courts" },
    { id: "users",     icon: <Users size={16} />,     label: "Users",     to: "/admin/UserPage" },
    { id: "bookings",  icon: <Bookmark size={16} />,  label: "Bookings",  to: "#" },
    { id: "settings",  icon: <Settings size={16} />,  label: "Settings",  to: "#" },
  ];

  const statusOptions = ["AVAILABLE", "BUSY", "CLOSED"];

  const selectCls =
    "w-full bg-[#0d0d1a] border border-slate-700/50 rounded-lg px-3 py-2.5 text-slate-200 text-xs font-mono focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all appearance-none cursor-pointer";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        .font-barlow  { font-family: 'Barlow Condensed', sans-serif; }
        .font-mono-dm { font-family: 'DM Mono', monospace; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0d0d1a; }
        ::-webkit-scrollbar-thumb { background: #f97316; border-radius: 2px; }
        .live-dot { animation: pulse-dot 1.5s ease-in-out infinite; }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .card-hover:hover { border-color: rgba(249,115,22,0.3) !important; }
      `}</style>

      <div className="flex min-h-screen bg-[#0d0d1a] font-mono-dm">

        {/* ── Sidebar ── */}
        <aside className="w-[220px] bg-[#0f0f1e] border-r border-orange-500/10 flex flex-col sticky top-0 h-screen py-7 shrink-0">
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

          <nav className="flex-1 px-3 pt-5">
            <p className="text-[9px] text-slate-500/50 tracking-[0.2em] uppercase px-3 pb-3">Navigation</p>
            {navItems.map(item => (
              <Link
                key={item.id}
                to={item.to}
                className={[
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-0.5 text-[12px] tracking-[0.06em] no-underline transition-all duration-150",
                  item.id === "courts"
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
                Manage Courts
              </h1>
              <p className="text-[11px] text-slate-500/50 mt-0.5 tracking-widest">
                {courts.length} COURT{courts.length !== 1 ? "S" : ""} TOTAL
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(v => !v)}
              className={[
                "flex items-center cursor-pointer gap-2 px-4 py-2.5 rounded-xl text-[11px] tracking-widest uppercase font-medium transition-all duration-200 border",
                showAddForm
                  ? "bg-orange-500/20 border-orange-500/40 text-orange-400 cursor-pointer"
                  : "bg-orange-500 border-orange-500 text-white hover:bg-orange-600 cursor-pointer",
              ].join(" ")}
            >
              {showAddForm ? <X size={14} /> : <PlusCircle size={14} />}
              {showAddForm ? "Cancel" : "Add Court"}
            </button>
          </header>

          {/* ── Add Court Form ── */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden mb-6"
              >
                <form
                  onSubmit={handleAddCourt}
                  className="bg-gradient-to-br from-[#12122a] to-[#0f0f1e] border border-orange-500/20 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-2 mb-6">
                    <Zap size={14} className="text-orange-500" />
                    <h3 className="font-barlow text-base font-bold text-slate-100 tracking-wider uppercase">New Court</h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
                    <div className="lg:col-span-1">
                      <label className={labelCls}>Court Name</label>
                      <input className={inputCls} placeholder="e.g. Court A" value={name}
                        onChange={e => setName(e.target.value)} required />
                    </div>
                    <div>
                      <label className={labelCls}>Surface</label>
                      <input className={inputCls} placeholder="e.g. Hardwood" value={surface}
                        onChange={e => setSurface(e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>Status</label>
                      <select className={selectCls} value={status} onChange={e => setStatus(e.target.value)}>
                        {statusOptions.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Distance (mi)</label>
                      <input className={inputCls} type="number" placeholder="0.0" value={distance}
                        onChange={e => setDistance(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className={labelCls}>Players Now</label>
                      <input className={inputCls} type="number" placeholder="0" value={players}
                        onChange={e => setPlayers(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className={labelCls}>Photo</label>
                      <label className="flex items-center gap-2 w-full bg-[#0d0d1a] border border-slate-700/50 rounded-lg px-3 py-2.5 text-slate-500 text-xs cursor-pointer hover:border-orange-500/40 transition-all">
                        <ImageIcon size={12} />
                        <span className="truncate">{photo ? photo.name : "Choose file…"}</span>
                        <input type="file" className="hidden" onChange={handlePhotoChange} />
                      </label>
                    </div>
                  </div>

                  {photoPreview && (
                    <div className="mb-4">
                      <img src={photoPreview} alt="preview"
                        className="h-24 w-40 object-cover rounded-lg border border-orange-500/20" />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center cursor-pointer gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-[11px] tracking-widest uppercase transition-colors"
                  >
                    <PlusCircle size={14} />
                    {loading ? "Adding…" : "Add Court"}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Edit Court Modal ── */}
          <AnimatePresence>
            {editingCourt && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                onClick={() => setEditingCourt(null)}
              >
                <motion.div
                  initial={{ scale: 0.92, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.92, opacity: 0, y: 20 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                  onClick={e => e.stopPropagation()}
                  className="bg-[#0f0f1e] border border-orange-500/20 rounded-2xl p-6 w-full max-w-lg"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                      <Edit3 size={14} className="text-orange-500" />
                      <h3 className="font-barlow text-base font-bold text-slate-100 tracking-wider uppercase">
                        Edit Court
                      </h3>
                    </div>
                    <button onClick={() => setEditingCourt(null)}
                      className="text-slate-500 hover:text-slate-300 transition-colors">
                      <X size={16} />
                    </button>
                  </div>

                  <form onSubmit={handleUpdateCourt} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Court Name</label>
                        <input className={inputCls} value={editName} onChange={e => setEditName(e.target.value)} />
                      </div>
                      <div>
                        <label className={labelCls}>Surface</label>
                        <input className={inputCls} value={editSurface} onChange={e => setEditSurface(e.target.value)} />
                      </div>
                      <div>
                        <label className={labelCls}>Status</label>
                        <select className={selectCls} value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                          {statusOptions.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Distance (mi)</label>
                        <input className={inputCls} type="number" value={editDistance}
                          onChange={e => setEditDistance(Number(e.target.value))} />
                      </div>
                      <div>
                        <label className={labelCls}>Players Now</label>
                        <input className={inputCls} type="number" value={editPlayers}
                          onChange={e => setEditPlayers(Number(e.target.value))} />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button type="submit"
                        className="flex cursor-pointer items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-[11px] tracking-widest uppercase transition-colors">
                        <Check size={14} /> Save Changes
                      </button>
                      <button type="button" onClick={() => setEditingCourt(null)}
                        className="flex cursor-pointer items-center gap-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-xl text-[11px] tracking-widest uppercase transition-colors">
                        <X size={14} /> Cancel
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Delete Confirm Modal ── */}
          <AnimatePresence>
            {deleteConfirm !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                onClick={() => setDeleteConfirm(null)}
              >
                <motion.div
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.92, opacity: 0 }}
                  onClick={e => e.stopPropagation()}
                  className="bg-[#0f0f1e] border border-red-500/20 rounded-2xl p-6 w-full max-w-sm text-center"
                >
                  <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 size={20} className="text-red-400" />
                  </div>
                  <h3 className="font-barlow  text-lg font-bold text-slate-100 uppercase tracking-wider mb-2">
                    Delete Court?
                  </h3>
                  <p className="text-slate-500 text-xs mb-6 tracking-wide">This action cannot be undone.</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleDelete(deleteConfirm)}
                      className="flex-1 cursor-pointer bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-[11px] tracking-widest uppercase transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 cursor-pointer bg-slate-700/50 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-[11px] tracking-widest uppercase transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Court Cards Grid ── */}
          {courts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-600">
              <MapPin size={40} className="mb-4 opacity-30" />
              <p className="text-[11px] tracking-widest uppercase">No courts yet</p>
              <p className="text-[10px] mt-1 tracking-wider opacity-60">Click "Add Court" to get started</p>
            </div>
          ) : (
            <motion.div
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
              initial="hidden"
              animate="show"
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
            >
              {courts.map((court) => {
                const s = statusConfig(court.status);
                return (
                  <motion.div
                    key={court.id}
                    variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }}
                    className="card-hover group bg-gradient-to-br from-[#12122a] to-[#0f0f1e] border border-orange-500/[0.1] rounded-2xl overflow-hidden flex flex-col transition-all duration-200"
                  >
                    {/* Photo */}
                    {court.photo ? (
                      <div className="relative h-40 overflow-hidden">
                        <img
                          src={`http://localhost:8080${court.photo}`}
                          alt={court.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1e] via-transparent to-transparent" />
                        {/* Status badge overlaid on photo */}
                        <div className="absolute top-3 right-3">
                          <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full border tracking-widest ${s.badge}`}>
                            <span className={`w-1 h-1 rounded-full shrink-0 ${s.dot}`} />
                            {s.label}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-32 bg-gradient-to-br from-slate-800/30 to-slate-900/30 flex items-center justify-center relative">
                        <MapPin size={32} className="text-slate-700" />
                        <div className="absolute top-3 right-3">
                          <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full border tracking-widest ${s.badge}`}>
                            <span className={`w-1 h-1 rounded-full shrink-0 ${s.dot}`} />
                            {s.label}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Body */}
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-barlow text-xl font-bold text-slate-100 tracking-wide uppercase mb-3">
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
                            <Users size={10} className="text-orange-500" />
                            {court.players}
                          </span>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-slate-700/30 pt-4 mt-auto flex gap-3">
                        <button
                          onClick={() => handleEditClick(court)}
                          className="flex-1 flex cursor-pointer items-center justify-center gap-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 py-2 rounded-lg text-[10px] tracking-widest uppercase transition-colors"
                        >
                          <Edit3 size={11} /> Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(court.id)}
                          className="flex-1 cursor-pointer flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 py-2 rounded-lg text-[10px] tracking-widest uppercase transition-colors"
                        >
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminCourts;
