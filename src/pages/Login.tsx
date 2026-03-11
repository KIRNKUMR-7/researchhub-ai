import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Eye, EyeOff, LogIn, CheckCircle2, AlertTriangle, Clock, TrendingUp, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const floatingStats = [
  { icon: CheckCircle2, label: "Compliant Plots", value: "3,842", color: "#B5FF4D", delay: 0 },
  { icon: AlertTriangle, label: "Pending Review", value: "621", color: "#FFB547", delay: 0.15 },
  { icon: TrendingUp, label: "₹ Invested (Cr)", value: "1,204", color: "#B5FF4D", delay: 0.3 },
  { icon: Clock, label: "Defaulting", value: "48", color: "#FF6B6B", delay: 0.45 },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("demo@plotguardian.in");
  const [password, setPassword] = useState("password");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) navigate("/dashboard");
    else setError(result.error ?? "Login failed.");
  };

  return (
    <div className="min-h-screen flex overflow-hidden">

      {/* ── LEFT: Dark immersive branding panel ── */}
      <div className="hidden lg:flex lg:w-[52%] flex-col relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0A1610 0%, #0F1F16 50%, #0A1A12 100%)" }}>

        {/* Animated grid overlay */}
        <div className="absolute inset-0 animated-grid opacity-60 pointer-events-none" />

        {/* Lime spotlight */}
        <motion.div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(181,255,77,0.1) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(27,60,42,0.4) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }} />

        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <motion.div className="flex items-center gap-3"
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "#B5FF4D" }}>
              <Shield className="w-5 h-5" style={{ color: "#0F1F16" }} />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-none tracking-tight">ResearchHub</h2>
              <p className="text-[11px] font-medium tracking-widest uppercase" style={{ color: "rgba(181,255,77,0.5)" }}>Compliance Platform</p>
            </div>
          </motion.div>

          {/* Hero text */}
          <motion.div className="mt-auto mb-12"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
            <div className="mb-4">
              <span className="text-xs font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full"
                style={{ background: "rgba(181,255,77,0.12)", color: "#B5FF4D", border: "1px solid rgba(181,255,77,0.2)" }}>
                AI-Powered
              </span>
            </div>
            <h1 className="text-5xl font-bold text-white leading-[1.1] tracking-tight mb-6">
              Monitor.<br />
              <span style={{ color: "#B5FF4D" }}>Comply.</span><br />
              Automate.
            </h1>
            <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.4)", maxWidth: 380 }}>
              Automate compliance tracking for allotted industrial plots — investment commitments, lease deed terms, caution deposits, and land cost subsidies.
            </p>
          </motion.div>

          {/* Floating stat cards */}
          <div className="grid grid-cols-2 gap-3">
            {floatingStats.map((stat) => (
              <motion.div key={stat.label}
                className="p-4 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={mounted ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ delay: stat.delay + 0.5, type: "spring", damping: 20, stiffness: 260 }}
                whileHover={{ scale: 1.02, background: "rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}18` }}>
                    <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>{stat.label}</span>
                </div>
                <p className="text-2xl font-bold stat-number" style={{ color: stat.color }}>{stat.value}</p>
              </motion.div>
            ))}
          </div>

          <motion.p className="mt-8 text-xs" style={{ color: "rgba(255,255,255,0.15)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
            SIDCO · TIDCO · SIPCOT · TIIC — Tamil Nadu Industrial Compliance
          </motion.p>
        </div>
      </div>

      {/* ── RIGHT: Login form ── */}
      <div className="flex-1 flex items-center justify-center p-8 relative" style={{ background: "#F5F7F2" }}>
        <div className="absolute inset-0 dot-bg opacity-50 pointer-events-none" />

        <motion.div className="relative w-full max-w-sm"
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#B5FF4D" }}>
              <Shield className="w-4 h-4" style={{ color: "#0F1F16" }} />
            </div>
            <span className="font-bold text-lg" style={{ color: "#0F1F16" }}>ResearchHub AI</span>
          </div>

          {/* Form card */}
          <div className="rounded-3xl overflow-hidden"
            style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 8px 40px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(255,255,255,0.9) inset" }}>

            {/* Card header */}
            <div className="p-6 pb-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "linear-gradient(to bottom, rgba(181,255,77,0.04), transparent)" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center pulse-glow" style={{ background: "#1B3C2A" }}>
                  <Shield className="w-5 h-5" style={{ color: "#B5FF4D" }} />
                </div>
                <div>
                  <p className="font-bold text-base" style={{ color: "#1D1D1F", letterSpacing: "-0.02em" }}>Sign in to ResearchHub</p>
                  <p className="text-xs" style={{ color: "#8A8A8E" }}>Compliance Monitoring Platform</p>
                </div>
              </div>
            </div>

            {/* Form body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              <AnimatePresence>
                {error && (
                  <motion.div className="flex items-center gap-2 p-3 rounded-xl text-xs font-semibold"
                    style={{ background: "rgba(255,59,48,0.08)", color: "#C0302B", border: "1px solid rgba(255,59,48,0.2)" }}
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "#6E6E73" }}>Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="mac-input" placeholder="officer@sidco.tn.gov.in"
                  onFocus={e => { e.target.style.borderColor = "rgba(27,60,42,0.55)"; e.target.style.boxShadow = "0 0 0 3.5px rgba(181,255,77,0.18)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(0,0,0,0.09)"; e.target.style.boxShadow = "none"; }} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#6E6E73" }}>Password</label>
                  <button type="button" className="text-[11px] font-semibold" style={{ color: "#1B3C2A" }}>Forgot password?</button>
                </div>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                    className="mac-input pr-10" placeholder="Enter your password"
                    onFocus={e => { e.target.style.borderColor = "rgba(27,60,42,0.55)"; e.target.style.boxShadow = "0 0 0 3.5px rgba(181,255,77,0.18)"; }}
                    onBlur={e => { e.target.style.borderColor = "rgba(0,0,0,0.09)"; e.target.style.boxShadow = "none"; }} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: "#AEAEB2" }}>
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <motion.button type="submit" disabled={loading}
                className="w-full py-3 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: "#1B3C2A" }}
                whileHover={!loading ? { scale: 1.01, background: "#264D37" } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : <><LogIn className="w-4 h-4" /> Sign In</>}
              </motion.button>

              <div className="text-center pt-1">
                <p className="text-[11px]" style={{ color: "#AEAEB2" }}>
                  Demo pre-filled · or{" "}
                  <Link to="/register" className="font-semibold" style={{ color: "#1B3C2A" }}>create account</Link>
                </p>
              </div>
            </form>
          </div>

          <p className="text-center text-[11px] mt-6" style={{ color: "#C7C7CC" }}>
            Government of Tamil Nadu · Industrial Compliance Division
          </p>
        </motion.div>
      </div>
    </div>
  );
}
