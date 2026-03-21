import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import basketballCourt from "../src/assets/basketballCourt.jpeg";
import { MapPin, Clock, Users, Bell, Shield, Calendar, ArrowRight, Activity, ChevronDown } from "lucide-react";

const HomePage: React.FC = () => {
  const [isScrolled, setIsScrolled]     = useState(false);
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection observer for features section
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setFeaturesVisible(true); },
      { threshold: 0.15 }
    );
    if (featuresRef.current) observer.observe(featuresRef.current);
    return () => observer.disconnect();
  }, []);

  const features = [
    {
      title: "Real-time Location",
      desc: "Find basketball courts near you with GPS-based search and live availability updates.",
      icon: <MapPin className="w-5 h-5" />,
      color: "text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/20",
    },
    {
      title: "Instant Booking",
      desc: "Reserve your court time instantly with our smart booking system. No more waiting in line.",
      icon: <Clock className="w-5 h-5" />,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Player Count",
      desc: "See how many players are currently on each court and plan your games accordingly.",
      icon: <Users className="w-5 h-5" />,
      color: "text-green-400",
      bg: "bg-green-500/10 border-green-500/20",
    },
    {
      title: "Smart Notifications",
      desc: "Get alerts about upcoming bookings, availability changes, and community events.",
      icon: <Bell className="w-5 h-5" />,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Secure Check-in",
      desc: "Seamless and safe check-ins to make your experience smooth and stress-free.",
      icon: <Shield className="w-5 h-5" />,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
    },
    {
      title: "Schedule Management",
      desc: "Easily manage your bookings and coordinate with friends for pickup games.",
      icon: <Calendar className="w-5 h-5" />,
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/20",
    },
  ];


  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        .font-barlow  { font-family: 'Barlow Condensed', sans-serif; }
        .font-mono-dm { font-family: 'DM Mono', monospace; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0d0d1a; }
        ::-webkit-scrollbar-thumb { background: #f97316; border-radius: 2px; }

        @keyframes float-up {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-y {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(6px); }
        }
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(249,115,22,0.5); }
          70%  { box-shadow: 0 0 0 12px rgba(249,115,22,0); }
          100% { box-shadow: 0 0 0 0 rgba(249,115,22,0); }
        }
        @keyframes scan-line {
          0%   { top: 0%; }
          100% { top: 100%; }
        }

        .hero-label  { animation: fade-in 0.6s ease forwards; }
        .hero-h1     { animation: float-up 0.7s 0.1s ease both; }
        .hero-sub    { animation: float-up 0.7s 0.25s ease both; }
        .hero-btns   { animation: float-up 0.7s 0.4s ease both; }
        .hero-stats  { animation: float-up 0.7s 0.55s ease both; }
        .scroll-cue  { animation: bounce-y 1.6s ease-in-out infinite; }
        .nav-slide   { animation: slide-down 0.4s ease forwards; }

        .feat-card { opacity: 0; transform: translateY(28px); transition: opacity 0.5s ease, transform 0.5s ease, border-color 0.2s; }
        .feat-card.visible { opacity: 1; transform: translateY(0); }
        .feat-card:hover { border-color: rgba(249,115,22,0.25) !important; }

        .grain-overlay::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 1;
        }

        .cta-pulse { animation: pulse-ring 2s ease-in-out infinite; }
        .scan::after {
          content: '';
          position: absolute;
          left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(249,115,22,0.4), transparent);
          animation: scan-line 3s linear infinite;
        }
      `}</style>

      <div className="w-screen overflow-x-hidden bg-[#0d0d1a] font-mono-dm">

        {/* ── Navbar ── */}
        <header
          className={`fixed top-0 left-0 w-full z-30 transition-all duration-400 nav-slide ${
            isScrolled
              ? "bg-[#0d0d1a]/95 backdrop-blur-md border-b border-orange-500/10"
              : ""
          }`}
        >
          <div className="flex items-center justify-between px-8 py-4 max-w-7xl mx-auto">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Activity size={16} className="text-white" />
              </div>
              <span className="font-barlow text-lg font-bold text-white tracking-widest uppercase">
                Court<span className="text-orange-500">Watch</span>
              </span>
            </div>

            {/* Nav links */}
            <nav className="hidden md:flex items-center gap-8 text-[12px] tracking-widest uppercase">
              {["Find Courts", "Book Now", "About"].map((item) => (
                <Link
                  key={item}
                  to="/signin"
                  className="text-slate-400 hover:text-orange-400 transition-colors duration-150"
                >
                  {item}
                </Link>
              ))}
            </nav>

            {/* Auth buttons */}
            <div className="flex items-center gap-3">
              <Link
                to="/signin"
                className="text-[12px] tracking-widest uppercase text-slate-400 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signin"
                className="cta-pulse px-4 py-2 rounded-lg bg-orange-500 text-white text-[12px] tracking-widest uppercase font-medium hover:bg-orange-600 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </header>

        {/* ── Hero ── */}
        <section
          className="grain-overlay relative w-screen h-screen bg-cover bg-center bg-no-repeat scan"
          style={{ backgroundImage: `url(${basketballCourt})` }}
        >
          {/* Dark gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d1a]/80 via-black/50 to-[#0d0d1a]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d1a]/60 via-transparent to-[#0d0d1a]/40" />

          {/* Orange side accent */}
          <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-transparent via-orange-500/60 to-transparent" />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6 pt-20">

            <h1 className="hero-h1 font-barlow text-[56px] md:text-[80px] lg:text-[96px] font-black text-white leading-none tracking-tight uppercase mb-6">
              Find &amp; Book<br />
              <span className="text-orange-500">Basketball</span><br />
              Courts Near You
            </h1>

            <p className="hero-sub text-slate-400 text-[13px] md:text-sm tracking-wider max-w-xl leading-relaxed mb-10">
              Real-time court availability, instant booking, and location-based
              check-ins. Never miss your shot again.
            </p>

            <div className="hero-btns flex items-center gap-4 mb-16">
              <Link
                to="/signin"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 text-white text-[12px] tracking-widest uppercase font-medium hover:bg-orange-600 transition-colors"
              >
                Find Courts Now <ArrowRight size={14} />
              </Link>
              <Link
                to="/signin"
                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-[12px] tracking-widest uppercase hover:bg-white/10 hover:border-white/20 transition-all"
              >
                Join Community
              </Link>
            </div>
            
          </div>
        </section>

        {/* ── Features Section ── */}
        <section className="relative py-24 px-6 md:px-16 bg-[#0d0d1a]">
          {/* Section label */}
          <div className="flex flex-col items-center text-center mb-16">
            <h2 className="font-barlow text-[48px] md:text-[64px] font-black text-white uppercase leading-none tracking-tight mb-4">
              Everything You<br />
              <span className="text-orange-500">Need to Play</span>
            </h2>
            <p className="text-slate-500 text-[13px] tracking-wider max-w-xl leading-relaxed">
              Everything you need to find, book, and play on the best basketball
              courts in your area.
            </p>
          </div>

          {/* Grid */}
          <div
            ref={featuresRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto"
          >
            {features.map((feature, i) => (
              <div
                key={i}
                className={`feat-card ${featuresVisible ? "visible" : ""} bg-gradient-to-br from-[#12122a] to-[#0f0f1e] border border-slate-700/30 rounded-2xl p-6`}
                style={{ transitionDelay: featuresVisible ? `${i * 80}ms` : "0ms" }}
              >
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border mb-5 ${feature.bg} ${feature.color}`}>
                  {feature.icon}
                </div>
                <h3 className="font-barlow text-xl font-bold text-slate-100 uppercase tracking-wide mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-500 text-[12px] tracking-wide leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="relative py-24 px-6 overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-3xl" />
          {/* Side accents */}
          <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-orange-500/30 to-transparent" />
          <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-orange-500/30 to-transparent" />

          <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
            

            <h2 className="font-barlow text-[52px] md:text-[72px] font-black text-white uppercase leading-none tracking-tight mb-6">
              Your Court<br />
              <span className="text-orange-500">Awaits</span>
            </h2>

            <p className="text-slate-400 text-[13px] tracking-wider leading-relaxed mb-10 max-w-md">
              Join thousands of players already using CourtWatch to find and book courts in seconds.
            </p>

            <Link
              to="/signin"
              className="flex items-center gap-2 px-8 py-4 rounded-xl bg-orange-500 text-white text-[12px] tracking-widest uppercase font-medium hover:bg-orange-600 transition-colors"
            >
              Get Started Free <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-orange-500/10 py-8 px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 max-w-7xl mx-auto">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 bg-orange-500 rounded-md flex items-center justify-center">
                <Activity size={12} className="text-white" />
              </div>
              <span className="font-barlow text-sm font-bold text-white tracking-widest uppercase">
                Court<span className="text-orange-500">Watch</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-600 tracking-widest uppercase">
              © {new Date().getFullYear()} CourtWatch. All rights reserved.
            </p>
            <div className="flex gap-6 text-[10px] text-slate-600 tracking-widest uppercase">
              <a href="#" className="hover:text-slate-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-slate-400 transition-colors">Terms</a>
              <a href="#" className="hover:text-slate-400 transition-colors">Contact</a>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
};

export default HomePage;
