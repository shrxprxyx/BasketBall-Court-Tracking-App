import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import signinimage from "./assets/signinimage.png";
<<<<<<< HEAD

const SignIn: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const API_URL = "http://192.168.29.125:8080/api/auth"; 
=======
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
>>>>>>> 068dd01 (added bookingspage, userdashboard)

  const redirectByRole = (userRole: string) => {
    if (userRole === "admin") navigate("/admin-dashboard");
    else navigate("/user-dashboard");
  };

<<<<<<< HEAD
  // Sign Up / Sign In
=======
>>>>>>> 068dd01 (added bookingspage, userdashboard)
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (isSignUp) {
        await axios.post(`${API_URL}/register`, { name, email, password, role });
<<<<<<< HEAD
        alert("Account created! Please log in.");
        setIsSignUp(false);
=======
        setIsSignUp(false);
        setError("");
>>>>>>> 068dd01 (added bookingspage, userdashboard)
      } else {
        const response = await axios.post(`${API_URL}/login`, { email, password });
        const { user, token } = response.data;
        localStorage.setItem("token", token);
        redirectByRole(user.role);
      }
    } catch (err: any) {
<<<<<<< HEAD
      setError(err.response?.data?.message || err.message);
=======
      setError(err.response?.data?.error || err.response?.data?.message || "Something went wrong.");
>>>>>>> 068dd01 (added bookingspage, userdashboard)
    }
    setLoading(false);
  };

<<<<<<< HEAD
  // Password Reset (optional)
=======
>>>>>>> 068dd01 (added bookingspage, userdashboard)
  const handleResetPassword = async () => {
    if (!email) return setError("Enter your email first.");
    setLoading(true);
    setError("");
    try {
<<<<<<< HEAD
      await axios.post(`${API_URL}/reset-password`, { email }); // Optional backend endpoint
      alert("Password reset email sent!");
=======
      await axios.post(`${API_URL}/reset-password`, { email });
>>>>>>> 068dd01 (added bookingspage, userdashboard)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    }
    setLoading(false);
  };

<<<<<<< HEAD
  return (
    <div className="relative flex items-center justify-center min-h-screen bg-[#5a1f0b] overflow-hidden bg-cover bg-center">

      <div className="absolute inset-0">
        <div className="absolute top-[-50px] left-[-50px] w-96 h-96 bg-blue-700/40 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-[-60px] right-[-60px] w-96 h-96 bg-purple-600/30 rounded-full filter blur-3xl"></div>
        <div className="absolute top-1/3 left-1/2 w-64 h-64 bg-pink-500/20 rounded-full filter blur-2xl"></div>
      </div>

      <div
        className="relative z-10 w-full max-w-5xl flex rounded-xl shadow-xl overflow-hidden bg-white/20 backdrop-blur-xl border border-white/30"
        style={{ height: "700px" }}
      >
        <button
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 bg-orange-400 cursor-pointer px-4 py-2 rounded-lg hover:bg-orange-500 z-20"
      >
        ← Go Back
      </button>
        {/* Left: Image */}
        <div className="w-1/2 hidden md:block">
          <img src={signinimage} alt="Basketball" className="h-full w-full object-cover" />
        </div>

        {/* Right: Form */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center text-white">
          <h1 className="text-3xl font-bold mb-6 text-center md:text-left">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>

          {error && <p className="text-red-400 mb-2">{error}</p>}

          <form className="flex flex-col gap-4" onSubmit={handleEmailAuth}>
            {isSignUp && (
              <input
                type="text"
                placeholder="Name"
                className="p-3 rounded bg-white/20 border border-white/40 placeholder-white text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            <input
              type="email"
              placeholder="Email"
              className="p-3 rounded bg-white/20 border border-white/40 placeholder-white text-white focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="p-3 rounded bg-white/20 border border-white/40 placeholder-white text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {!isSignUp && (
              <div className="flex items-center justify-between text-sm text-gray-200 my-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="accent-orange-500 cursor-pointer" />
                  Remember me
                </label>
                <button
                  type="button"
                  className="hover:underline cursor-pointer"
                  onClick={handleResetPassword}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {isSignUp && (
              <div className="flex gap-4 justify-center md:justify-start my-2">
                <button
                  type="button"
                  onClick={() => setRole("user")}
                  className={`flex-1 p-2 rounded transition ${
                    role === "user" ? "bg-orange-500 text-white" : "bg-white/20 text-white"
                  }`}
                >
                  User
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`flex-1 p-2 rounded transition ${
                    role === "admin" ? "bg-orange-500 text-white" : "bg-white/20 text-white"
                  }`}
                >
                  Admin
                </button>
              </div>
            )}

            <button
              type="submit"
              className={`p-3 rounded cursor-pointer text-white font-semibold mt-2 ${
                loading ? "bg-gray-400" : "bg-orange-400 hover:bg-orange-500"
              }`}
              disabled={loading}
            >
              {loading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center md:text-left text-gray-300 text-sm">
            {isSignUp ? "Already have an account?" : "Don’t have an account?"}{" "}
            <span
              className="text-orange-400 hover:underline cursor-pointer"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
=======
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
>>>>>>> 068dd01 (added bookingspage, userdashboard)
