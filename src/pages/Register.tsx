import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle, ArrowRight, Map, ClipboardCheck, Bot } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const highlights = [
  { icon: Map, text: "Track 150+ industrial plots in real-time" },
  { icon: ClipboardCheck, text: "Automated compliance checks & alerts" },
  { icon: Bot, text: "AI assistant for compliance questions" },
  { icon: Shield, text: "100% private — data stays in your browser" },
];

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await register(name, email, password);
    setLoading(false);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error ?? "Registration failed.");
    }
  };

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColors = ["", "#FF3B30", "#FFB547", "#B5FF4D"];
  const strengthLabels = ["", "Weak", "Good", "Strong"];

  return (
    <div className="min-h-screen flex overflow-hidden">

      {/* ── LEFT: Dark branding panel ── */}
      <div className="hidden lg:flex lg:w-[48%] flex-col relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0A1610 0%, #0F1F16 50%, #0A1A12 100%)" }}>

        <div className="absolute inset-0 animated-grid opacity-50 pointer-events-none" />
        <motion.div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(181,255,77,0.08) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 7, repeat: Infinity }} />

        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <motion.div className="flex items-center gap-3"
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "#B5FF4D" }}>
              <Shield className="w-5 h-5" style={{ color: "#0F1F16" }} />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-none tracking-tight">ResearchHub</h2>
              <p className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: "rgba(181,255,77,0.5)" }}>Compliance Platform</p>
            </div>
          </motion.div>

          <motion.div className="mt-auto mb-10"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="mb-4">
              <span className="text-xs font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full"
                style={{ background: "rgba(181,255,77,0.1)", color: "#B5FF4D", border: "1px solid rgba(181,255,77,0.2)" }}>
                Free Access
              </span>
            </div>
            <h1 className="text-5xl font-black text-white leading-[1.1] tracking-tighter mb-5">
              Start Monitoring<br />
              <span style={{ color: "#B5FF4D" }}>Today.</span>
            </h1>
            <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.4)", maxWidth: 360 }}>
              Join compliance officers across Tamil Nadu enforcing industrial plot allotment terms automatically.
            </p>
          </motion.div>

          {/* Highlights */}
          <div className="space-y-3 mb-8">
            {highlights.map((h, i) => (
              <motion.div key={i} className="flex items-center gap-3"
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(181,255,77,0.12)" }}>
                  <h.icon className="w-4 h-4" style={{ color: "#B5FF4D" }} />
                </div>
                <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>{h.text}</p>
              </motion.div>
            ))}
          </div>

          <motion.p className="text-xs" style={{ color: "rgba(255,255,255,0.15)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
            SIDCO · TIDCO · SIPCOT · TIIC — Tamil Nadu Industrial Compliance
          </motion.p>
        </div>
      </div>

      {/* ── RIGHT: Register form ── */}
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-auto"
        style={{ background: "#F5F7F2" }}>
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
            style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 8px 40px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06)" }}>

            {/* Header */}
            <div className="p-6 pb-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "linear-gradient(to bottom, rgba(181,255,77,0.04), transparent)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "#1B3C2A" }}>
                  <Shield className="w-5 h-5" style={{ color: "#B5FF4D" }} />
                </div>
                <div>
                  <p className="font-bold text-base" style={{ color: "#1D1D1F", letterSpacing: "-0.02em" }}>Create Account</p>
                  <p className="text-xs" style={{ color: "#8A8A8E" }}>Start your compliance journey</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold"
                  style={{ background: "rgba(255,59,48,0.08)", border: "1px solid rgba(255,59,48,0.2)", color: "#C0302B" }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "#6E6E73" }}>Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#AEAEB2" }} />
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Officer Name" required
                    className="mac-input pl-10"
                    onFocus={e => { e.target.style.borderColor = "rgba(27,60,42,0.55)"; e.target.style.boxShadow = "0 0 0 3.5px rgba(181,255,77,0.18)"; }}
                    onBlur={e => { e.target.style.borderColor = "rgba(0,0,0,0.09)"; e.target.style.boxShadow = "none"; }} />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "#6E6E73" }}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#AEAEB2" }} />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="officer@sidco.tn.gov.in" required
                    className="mac-input pl-10"
                    onFocus={e => { e.target.style.borderColor = "rgba(27,60,42,0.55)"; e.target.style.boxShadow = "0 0 0 3.5px rgba(181,255,77,0.18)"; }}
                    onBlur={e => { e.target.style.borderColor = "rgba(0,0,0,0.09)"; e.target.style.boxShadow = "none"; }} />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "#6E6E73" }}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#AEAEB2" }} />
                  <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required
                    className="mac-input pl-10 pr-10"
                    onFocus={e => { e.target.style.borderColor = "rgba(27,60,42,0.55)"; e.target.style.boxShadow = "0 0 0 3.5px rgba(181,255,77,0.18)"; }}
                    onBlur={e => { e.target.style.borderColor = "rgba(0,0,0,0.09)"; e.target.style.boxShadow = "none"; }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#AEAEB2" }}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-1.5 flex-1 rounded-full transition-all"
                          style={{ background: i <= strength ? strengthColors[strength] : "rgba(0,0,0,0.08)" }} />
                      ))}
                    </div>
                    <span className="text-xs font-bold" style={{ color: strengthColors[strength] }}>
                      {strengthLabels[strength]}
                    </span>
                  </div>
                )}
              </div>

              <motion.button type="submit" disabled={loading}
                className="w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: "#1B3C2A", color: "#FFFFFF" }}
                whileHover={!loading ? { scale: 1.01, background: "#264D37" } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}>
                {loading ? "Creating account…" : <><ArrowRight className="w-4 h-4" /> Create Account</>}
              </motion.button>

              <div className="space-y-1.5 pt-1">
                {["Credentials saved securely to cloud", "Access your data from any device"].map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#34C759" }} />
                    <span className="text-xs" style={{ color: "#8A8A8E" }}>{item}</span>
                  </div>
                ))}
              </div>

              <p className="text-center text-xs pt-1" style={{ color: "#AEAEB2" }}>
                Already have an account?{" "}
                <Link to="/login" className="font-bold" style={{ color: "#1B3C2A" }}>Sign in</Link>
              </p>
            </form>
          </div>

          <p className="text-center text-[11px] mt-6" style={{ color: "#C7C7CC" }}>
            Government of Tamil Nadu · Industrial Compliance Division
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
