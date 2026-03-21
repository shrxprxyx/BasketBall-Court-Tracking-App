import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import signinimage from "./assets/signinimage.png";
import { Activity, ArrowLeft, Eye, EyeOff, User, Shield } from "lucide-react";

const SignIn: React.FC = () => {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole]         = useState("user");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const navigate  = useNavigate();
  const API_URL   = "http://localhost:8080/api/auth";

  const redirectByRole = (userRole: string) => {
    if (userRole === "admin") navigate("/admin-dashboard");
    else navigate("/user-dashboard");
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (isSignUp) {
        await axios.post(`${API_URL}/register`, { name, email, password, role });
        setIsSignUp(false);
        setError("");
      } else {
        const response = await axios.post(`${API_URL}/login`, { email, password });
        const { user, token } = response.data;
        localStorage.setItem("token", token);
        redirectByRole(user.role);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || "Something went wrong.");
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!email) return setError("Enter your email first.");
    setLoading(true);
    setError("");
    try {
      await axios.post(`${API_URL}/reset-password`, { email });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    }
    setLoading(false);
  };

  const inputCls =
    "w-full bg-[#0a0a18] border border-slate-700/60 rounded-xl px-4 py-3 text-slate-200 text-sm font-mono placeholder-slate-600 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20 transition-all";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        .font-barlow  { font-family: 'Barlow Condensed', sans-serif; }
        .font-mono-dm { font-family: 'DM Mono', monospace; }

        @keyframes float-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slide-form {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .anim-fade   { animation: fade-in  0.5s ease forwards; }
        .anim-up     { animation: float-up 0.5s ease forwards; }
        .anim-form   { animation: slide-form 0.4s ease forwards; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0d0d1a; }
        ::-webkit-scrollbar-thumb { background: #f97316; border-radius: 2px; }

        .role-btn-active  { background: rgba(249,115,22,0.15); border-color: rgba(249,115,22,0.5); color: #f97316; }
        .role-btn-inactive { background: transparent; border-color: rgba(148,163,184,0.15); color: rgba(148,163,184,0.5); }
        .role-btn-inactive:hover { border-color: rgba(148,163,184,0.3); color: rgba(148,163,184,0.8); }
      `}</style>

      <div className="relative flex min-h-screen bg-[#0d0d1a] font-mono-dm overflow-hidden">

        {/* Background glows */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-500/[0.03] rounded-full blur-3xl pointer-events-none" />

        {/* ── Left panel — image ── */}
        <div className="hidden lg:flex w-1/2 relative overflow-hidden">
          <img
            src={signinimage}
            alt="Basketball court"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d1a]/20 via-black/40 to-[#0d0d1a]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a] via-transparent to-[#0d0d1a]/60" />

          {/* Left edge accent */}
          <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-orange-500/40 to-transparent" />

          {/* Branding overlay */}
          <div className="relative z-10 flex flex-col justify-between p-10 w-full">
            {/* Logo */}
            <div className="flex items-center gap-2.5 anim-fade">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Activity size={16} className="text-white" />
              </div>
              <span className="font-barlow text-lg font-bold text-white tracking-widest uppercase">
                Court<span className="text-orange-500">Watch</span>
              </span>
            </div>

            {/* Bottom tagline */}
            <div className="anim-up">
              <p className="text-slate-500 text-[12px] tracking-wider leading-relaxed max-w-xs">
                Real-time availability, instant booking, and location-based check-ins.
              </p>
            </div>
          </div>
        </div>

        {/* ── Right panel — form ── */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 py-12 relative z-10">

          {/* Go back */}
          <button
            onClick={() => navigate("/")}
            className="absolute top-6 right-6 flex items-center gap-2 text-[10px] text-slate-500 hover:text-slate-300 tracking-widest uppercase transition-colors"
          >
            <ArrowLeft size={12} /> Back
          </button>

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Activity size={16} className="text-white" />
            </div>
            <span className="font-barlow text-lg font-bold text-white tracking-widest uppercase">
              Court<span className="text-orange-500">Watch</span>
            </span>
          </div>

          <div className="max-w-sm w-full mx-auto">

            {/* Heading */}
            <div className="mb-8">
              <p className="text-[10px] text-orange-400 tracking-[0.2em] uppercase mb-2">
                {isSignUp ? "Get started" : "Welcome back"}
              </p>
              <h1 className="font-barlow text-[42px] font-black text-white uppercase leading-none tracking-tight">
                {isSignUp ? "Create\nAccount" : "Sign In"}
              </h1>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-[11px] tracking-wide">
                {error}
              </div>
            )}

            {/* Success hint after signup */}
            <form onSubmit={handleEmailAuth} className="anim-form space-y-4">

              {/* Name (signup only) */}
              {isSignUp && (
                <div>
                  <label className="block text-[9px] text-slate-500 tracking-[0.18em] uppercase mb-1.5">Full Name</label>
                  <input
                    type="text"
                    placeholder="John Smith"
                    className={inputCls}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-[9px] text-slate-500 tracking-[0.18em] uppercase mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className={inputCls}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[9px] text-slate-500 tracking-[0.18em] uppercase mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    className={`${inputCls} pr-11`}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Remember me / Forgot password */}
              {!isSignUp && (
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => setRememberMe(v => !v)}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer ${
                        rememberMe
                          ? "bg-orange-500 border-orange-500 "
                          : "bg-transparent border-slate-600"
                      }`}
                    >
                      {rememberMe && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 tracking-wide">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="text-[11px] text-orange-500/70 cursor-pointer hover:text-orange-400 tracking-wide transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Role selector (signup only) */}
              {isSignUp && (
                <div>
                  <label className="block text-[9px] text-slate-500 tracking-[0.18em] uppercase mb-2">Account Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { val: "user",  label: "Player",  icon: <User size={13} /> },
                      { val: "admin", label: "Admin",   icon: <Shield size={13} /> },
                    ].map(opt => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setRole(opt.val)}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[11px] tracking-widest uppercase transition-all ${
                          role === opt.val ? "role-btn-active" : "role-btn-inactive"
                        }`}
                      >
                        {opt.icon} {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl cursor-pointer bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[12px] tracking-widest uppercase font-medium transition-colors mt-2"
              >
                {loading ? "Processing…" : isSignUp ? "Create Account" : "Sign In"}
              </button>
            </form>

            {/* Toggle */}
            <p className="mt-6 text-center text-[12px] text-slate-500 tracking-wide">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => { setIsSignUp(v => !v); setError(""); }}
                className="text-orange-400 cursor-pointer hover:text-orange-300 transition-colors"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignIn;
