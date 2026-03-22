import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Shield, Edit3, Check, X,
  CalendarCheck, MapPin, Clock, Camera,
  TrendingUp, Award, Activity, LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Booking {
  id: number | string;
  user: string;
  court: string;
  timeslot: string;
  status: string;
}

const API_BASE = "http://localhost:8080/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getUserFromToken = (): { userId: number; name: string; email: string; role: string } | null => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      userId: payload.userId,
      name:   payload.name  || "",
      email:  payload.email || "",
      role:   payload.role  || "user",
    };
  } catch { return null; }
};

const statusConfig = (status?: string) => {
  switch ((status || "").toLowerCase()) {
    case "available": return { dot: "bg-green-500", badge: "bg-green-500/10 text-green-400 border-green-500/20" };
    case "occupied":
    case "busy":      return { dot: "bg-red-500",   badge: "bg-red-500/10 text-red-400 border-red-500/20"   };
    case "pending":   return { dot: "bg-amber-500", badge: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
    default:          return { dot: "bg-blue-500",  badge: "bg-blue-500/10 text-blue-400 border-blue-500/20"  };
  }
};

const getInitials = (name: string) =>
  name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

const getAvatarHue = (name: string) =>
  (name.charCodeAt(0) * 37 + (name.charCodeAt(1) || 0) * 13) % 360;

// ─── Input component ──────────────────────────────────────────────────────────

const Field: React.FC<{
  label: string;
  value: string;
  editing: boolean;
  onChange?: (v: string) => void;
  icon: React.ReactNode;
  type?: string;
  readOnly?: boolean;
}> = ({ label, value, editing, onChange, icon, type = "text", readOnly = false }) => (
  <div>
    <label className="block text-[9px] text-slate-500 tracking-[0.18em] uppercase mb-1.5 font-medium">{label}</label>
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">{icon}</div>
      <input
        type={type}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        readOnly={!editing || readOnly}
        className={[
          "w-full bg-[#0a0a18] border rounded-xl pl-9 pr-4 py-2.5 text-sm font-mono transition-all",
          editing && !readOnly
            ? "border-orange-500/50 text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500/20"
            : "border-slate-700/40 text-slate-400 cursor-default focus:outline-none",
          readOnly ? "opacity-60" : "",
        ].join(" ")}
      />
    </div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

const ProfilePage: React.FC = () => {
  const navigate  = useNavigate();
  const tokenData = getUserFromToken();

  const [profile, setProfile]     = useState<UserProfile | null>(null);
  const [bookings, setBookings]   = useState<Booking[]>([]);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState("");

  // Edit state
  const [editName,  setEditName]  = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPw,    setEditPw]    = useState("");
  const [editPwConfirm, setEditPwConfirm] = useState("");

  // Avatar upload
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Load ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!tokenData) { navigate("/signin"); return; }

    const fetchAll = async () => {
      try {
        const [usersRes, bookingsRes] = await Promise.all([
          axios.get(`${API_BASE}/users`),
          axios.get(`${API_BASE}/bookings`),
        ]);

        const me = (usersRes.data as UserProfile[]).find(u => u.id === tokenData.userId);
        if (me) {
          setProfile(me);
          setEditName(me.name);
          setEditEmail(me.email);
        } else {
          // Fallback to token data
          const fallback = { id: tokenData.userId, name: tokenData.name, email: tokenData.email, role: tokenData.role };
          setProfile(fallback);
          setEditName(fallback.name);
          setEditEmail(fallback.email);
        }

        const myBookings = (bookingsRes.data as Booking[]).filter(
          b => b.user?.toLowerCase() === (me?.name || tokenData.name)?.toLowerCase()
        );
        setBookings(myBookings);
      } catch {
        setError("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);// eslint-disable-line

  // ── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!profile) return;
    if (editPw && editPw !== editPwConfirm) {
      setError("Passwords do not match.");
      return;
    }
    setSaving(true); setError("");
    try {
      // PUT /api/users/:id — update name/email (add this endpoint if needed)
      await axios.put(`${API_BASE}/users/${profile.id}`, {
        name:     editName,
        email:    editEmail,
        ...(editPw ? { password: editPw } : {}),
      });
      setProfile(p => p ? { ...p, name: editName, email: editEmail } : p);
      setEditing(false);
      setEditPw(""); setEditPwConfirm("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!profile) return;
    setEditName(profile.name);
    setEditEmail(profile.email);
    setEditPw(""); setEditPwConfirm("");
    setError("");
    setEditing(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── Stats ───────────────────────────────────────────────────────────────────

  const stats = {
    total:     bookings.length,
    confirmed: bookings.filter(b => b.status.toLowerCase() === "available").length,
    pending:   bookings.filter(b => b.status.toLowerCase() === "pending").length,
    courts:    new Set(bookings.map(b => b.court)).size,
  };

  const recentBookings = bookings.slice(0, 5);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0d0d1a]">
      <div className="w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
    </div>
  );

  const displayName  = profile?.name  || tokenData?.name  || "User";
  const displayEmail = profile?.email || tokenData?.email || "";
  const displayRole  = profile?.role  || tokenData?.role  || "user";
  const hue          = getAvatarHue(displayName);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=DM+Mono:wght@400;500&display=swap');
        .font-barlow  { font-family: 'Barlow Condensed', sans-serif; }
        .font-mono-dm { font-family: 'DM Mono', monospace; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0d0d1a; }
        ::-webkit-scrollbar-thumb { background: #f97316; border-radius: 2px; }
        @keyframes float-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-up { animation: float-up 0.4s ease forwards; }
      `}</style>

      <div className="min-h-screen bg-[#0d0d1a] font-mono-dm px-8 py-6">

        {/* ── Header ── */}
        <div className="mb-8">
          <p className="text-[10px] text-orange-400 tracking-[0.2em] uppercase mb-1">CourtWatch</p>
          <h1 className="font-barlow text-[36px] font-black text-white uppercase leading-none tracking-tight">
            My Profile
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left column ── */}
          <div className="lg:col-span-1 space-y-5">

            {/* Avatar card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-[#12122a] to-[#0f0f1e] border border-orange-500/[0.1] rounded-2xl p-6 text-center"
            >
              {/* Avatar */}
              <div className="relative inline-block mb-4">
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-barlow font-black mx-auto overflow-hidden"
                  style={{ background: avatarPreview ? "transparent" : `linear-gradient(135deg, hsl(${hue},60%,35%), hsl(${hue+30},60%,25%))` }}
                >
                  {avatarPreview
                    ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                    : getInitials(displayName)
                  }
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1.5 -right-1.5 w-7 h-7 cursor-pointer bg-orange-500 hover:bg-orange-600 rounded-lg flex items-center justify-center transition-colors shadow-lg"
                >
                  <Camera size={13} className="text-white" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>

              <h2 className="font-barlow text-2xl font-bold text-slate-100 uppercase tracking-wide leading-tight">
                {displayName}
              </h2>
              <p className="text-slate-500 text-[11px] tracking-wider mt-1">{displayEmail}</p>

              <div className="mt-3 inline-flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1">
                <Shield size={10} className="text-orange-400" />
                <span className="text-[10px] text-orange-400 tracking-widest uppercase">{displayRole}</span>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-700/30 mt-5 pt-5">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <p className="font-barlow text-2xl font-black text-slate-100">{stats.total}</p>
                    <p className="text-[9px] text-slate-600 tracking-widest uppercase mt-0.5">Bookings</p>
                  </div>
                  <div>
                    <p className="font-barlow text-2xl font-black text-slate-100">{stats.courts}</p>
                    <p className="text-[9px] text-slate-600 tracking-widest uppercase mt-0.5">Courts</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-gradient-to-br from-[#12122a] to-[#0f0f1e] border border-orange-500/[0.1] rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={13} className="text-orange-500" />
                <h3 className="font-barlow text-sm font-bold text-slate-100 uppercase tracking-wider">Activity</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Total Bookings",  value: stats.total,     color: "text-slate-100" },
                  { label: "Confirmed",       value: stats.confirmed, color: "text-green-400" },
                  { label: "Pending",         value: stats.pending,   color: "text-amber-400" },
                  { label: "Unique Courts",   value: stats.courts,    color: "text-blue-400"  },
                ].map(s => (
                  <div key={s.label} className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 tracking-[0.12em] uppercase">{s.label}</span>
                    <span className={`font-barlow text-xl font-bold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── Right column ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Edit profile card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="bg-gradient-to-br from-[#12122a] to-[#0f0f1e] border border-orange-500/[0.1] rounded-2xl p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <User size={13} className="text-orange-500" />
                  <h3 className="font-barlow text-base font-bold text-slate-100 uppercase tracking-wider">
                    Account Details
                  </h3>
                </div>
                <div className="flex gap-2">
                  <AnimatePresence mode="wait">
                    {saved && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-1.5 text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg"
                      >
                        <Check size={11} /> Saved!
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {!editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex cursor-pointer items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 px-4 py-2 rounded-xl text-[10px] tracking-widest uppercase transition-colors"
                    >
                      <Edit3 size={12} /> Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center cursor-pointer gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-[10px] tracking-widest uppercase transition-colors"
                      >
                        <Check size={12} /> {saving ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex cursor-pointer items-center gap-2 bg-slate-700/40 hover:bg-slate-700/60 text-slate-400 px-4 py-2 rounded-xl text-[10px] tracking-widest uppercase transition-colors"
                      >
                        <X size={12} /> Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-[11px] tracking-wide">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Full Name"  value={editing ? editName  : displayName}  editing={editing} onChange={setEditName}  icon={<User size={13} />} />
                <Field label="Email"      value={editing ? editEmail : displayEmail} editing={editing} onChange={setEditEmail} icon={<Mail size={13} />} type="email" />
                <Field label="Role"       value={displayRole} editing={false} icon={<Shield size={13} />} readOnly />
                <Field label="Member ID"  value={`#${profile?.id || tokenData?.userId || "—"}`} editing={false} icon={<Activity size={13} />} readOnly />

                {editing && (
                  <>
                    <Field label="New Password"     value={editPw}          editing={editing} onChange={setEditPw}          icon={<Shield size={13} />} type="password" />
                    <Field label="Confirm Password" value={editPwConfirm}   editing={editing} onChange={setEditPwConfirm}   icon={<Shield size={13} />} type="password" />
                  </>
                )}
              </div>

              {editing && (
                <p className="text-[10px] text-slate-600 tracking-wider mt-4">
                  Leave password fields empty to keep your current password.
                </p>
              )}
            </motion.div>

            {/* Recent bookings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-[#12122a] to-[#0f0f1e] border border-orange-500/[0.1] rounded-2xl p-6"
            >
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <CalendarCheck size={13} className="text-orange-500" />
                  <h3 className="font-barlow text-base font-bold text-slate-100 uppercase tracking-wider">
                    Recent Bookings
                  </h3>
                </div>
                <button
                  onClick={() => navigate("/bookings")}
                  className="text-[10px] cursor-pointer text-orange-400 hover:text-orange-300 tracking-widest uppercase transition-colors"
                >
                  View All →
                </button>
              </div>

              {recentBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-600">
                  <CalendarCheck size={28} className="mb-3 opacity-30" />
                  <p className="text-[11px] tracking-widest uppercase">No bookings yet</p>
                  <button
                    onClick={() => navigate("/user-dashboard")}
                    className="mt-3 text-[10px] text-orange-500/70 hover:text-orange-400 tracking-widest uppercase transition-colors"
                  >
                    Find a court →
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentBookings.map((b, i) => {
                    const s = statusConfig(b.status);
                    return (
                      <motion.div
                        key={b.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + i * 0.05 }}
                        className="flex items-center gap-4 px-4 py-3 bg-[#0a0a18] border border-slate-700/30 rounded-xl hover:border-orange-500/15 transition-colors"
                      >
                        <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center shrink-0">
                          <MapPin size={13} className="text-orange-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-200 text-xs font-medium truncate">{b.court}</p>
                          <p className="text-slate-600 text-[10px] flex items-center gap-1 mt-0.5">
                            <Clock size={9} />{b.timeslot}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full border tracking-widest shrink-0 ${s.badge}`}>
                          <span className={`w-1 h-1 rounded-full shrink-0 ${s.dot}`} />
                          {b.status.toUpperCase()}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Danger zone */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-[#1a0f0f] to-[#0f0f1e] border border-red-500/[0.12] rounded-2xl p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-xs font-medium">Sign out of your account</p>
                  <p className="text-slate-600 text-[10px] tracking-wide mt-0.5">You'll need to sign back in to continue.</p>
                </div>
                <button
                  onClick={() => { localStorage.removeItem("token"); navigate("/signin"); }}
                  className="flex items-center cursor-pointer gap-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 px-4 py-2 rounded-xl text-[10px] tracking-widest uppercase transition-colors shrink-0 ml-4"
                >
                  <LogOut size={12} /> Sign Out
                </button>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;