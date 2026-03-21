import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutGrid, Map, CalendarCheck, User, LogOut, Activity, Zap } from "lucide-react";

const Sidebar: React.FC = () => {
  const navigate     = useNavigate();
  const [showLogout, setShowLogout] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  const navItems = [
    { to: "/user-dashboard", icon: <LayoutGrid size={16} />, label: "Dashboard" },
    { to: "/map",            icon: <Map size={16} />,         label: "Court Map" },
    { to: "/bookings",       icon: <CalendarCheck size={16} />, label: "Bookings" },
    { to: "/profile",        icon: <User size={16} />,         label: "Profile"  },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=DM+Mono:wght@400;500&display=swap');
        .font-barlow  { font-family: 'Barlow Condensed', sans-serif; }
        .font-mono-dm { font-family: 'DM Mono', monospace; }
        .live-dot { animation: pulse-dot 1.5s ease-in-out infinite; }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      <aside className="font-mono-dm w-[220px] bg-[#0f0f1e] border-r border-orange-500/10 flex flex-col sticky top-0 h-screen py-7 shrink-0">

        {/* Logo */}
        <div className="px-6 pb-8 border-b border-orange-500/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shrink-0">
              <Activity size={16} className="text-white" />
            </div>
            <div>
              <p className="font-barlow text-white text-[13px] font-bold tracking-widest uppercase leading-tight">Court</p>
              <p className="font-barlow text-orange-500 text-[11px] tracking-[0.18em] uppercase leading-tight">Watch</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pt-5">
          <p className="text-[9px] text-slate-500/50 tracking-[0.2em] uppercase px-3 pb-3">Menu</p>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => [
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-0.5 text-[12px] tracking-[0.06em] no-underline transition-all duration-150",
                isActive
                  ? "text-orange-500 bg-orange-500/10 border-l-2 border-orange-500"
                  : "text-slate-400/70 border-l-2 border-transparent hover:bg-orange-500/5 hover:text-orange-400",
              ].join(" ")}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Pro plan box */}
        <div className="mx-3 mb-3 bg-gradient-to-br from-[#12122a] to-[#0f0f1e] border border-orange-500/15 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Zap size={11} className="text-orange-400" />
            <p className="text-[10px] text-orange-400 tracking-widest uppercase font-medium">Pro Plan</p>
          </div>
          <p className="text-[9px] text-slate-600 tracking-wider mb-3">Expires in 12 days</p>
          <button className="w-full bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 py-1.5 rounded-lg text-[10px] tracking-widest uppercase transition-colors">
            Upgrade
          </button>
        </div>

        {/* Bottom */}
        <div className="px-4 pt-3 border-t border-orange-500/10 space-y-3">
          <button
            onClick={() => setShowLogout(true)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[12px] tracking-[0.06em] text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all"
          >
            <LogOut size={14} /> Log Out
          </button>
          <div className="flex items-center gap-2 px-3">
            <span className="live-dot w-1.5 h-1.5 rounded-full bg-green-500 block" />
            <span className="text-[10px] text-slate-500/50 tracking-[0.15em]">LIVE</span>
          </div>
        </div>
      </aside>

      {/* Logout confirm modal */}
      {showLogout && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#0f0f1e] border border-red-500/20 rounded-2xl p-6 w-full max-w-xs text-center font-mono-dm">
            <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut size={18} className="text-red-400" />
            </div>
            <h3 className="font-barlow text-lg font-bold text-slate-100 uppercase tracking-wider mb-1">Log Out?</h3>
            <p className="text-slate-500 text-xs mb-5 tracking-wide">You'll need to sign in again.</p>
            <div className="flex gap-3">
              <button onClick={handleLogout}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl text-[11px] tracking-widest uppercase transition-colors">
                Log Out
              </button>
              <button onClick={() => setShowLogout(false)}
                className="flex-1 bg-slate-700/50 hover:bg-slate-700 text-slate-300 py-2 rounded-xl text-[11px] tracking-widest uppercase transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;