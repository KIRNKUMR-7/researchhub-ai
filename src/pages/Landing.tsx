import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Shield, Map, ClipboardCheck, Bot, Zap, ArrowRight, Activity, Database, CheckCircle2, AlertTriangle, Clock, TrendingUp } from "lucide-react";

const features = [
  { icon: Shield, title: "Automated Compliance", desc: "Real-time tracking of investment, employment, and construction milestones against allotment terms.", num: "01" },
  { icon: ClipboardCheck, title: "Document Library", desc: "Centralized repository for allotment orders, lease deeds, NOCs, and environmental clearances.", num: "02" },
  { icon: Bot, title: "AI Compliance Assistant", desc: "Chat with your data. Ask about over-due refunds, defaulting plots, and subsidy statuses instantly.", num: "03" },
  { icon: Zap, title: "Proactive Alerts", desc: "Automated prior-alerts for lease expiries, caution deposit refunds, and show-cause notices.", num: "04" },
  { icon: Map, title: "Portfolio Overview", desc: "Bird's-eye view of all industrial plots, filtered by compliant, pending, or defaulting status.", num: "05" },
  { icon: Database, title: "Offline Capable", desc: "Your monitoring data stays in your browser — private, secure, and always fast.", num: "06" },
];

const stats = [
  { icon: CheckCircle2, label: "Compliant Plots", value: "3,842", color: "#B5FF4D" },
  { icon: AlertTriangle, label: "Pending Review", value: "621", color: "#FFB547" },
  { icon: TrendingUp, label: "₹ Invested (Cr)", value: "1,204", color: "#B5FF4D" },
  { icon: Clock, label: "Defaulting", value: "48", color: "#FF6B6B" },
];

const Landing = () => {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#F5F7F2" }}>

      {/* ── NAVBAR ── */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: "rgba(15, 31, 22, 0.95)",
          backdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(181,255,77,0.1)",
        }}
        initial={{ y: -60 }} animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#B5FF4D" }}>
              <Shield className="w-5 h-5" style={{ color: "#0F1F16" }} />
            </div>
            <span className="text-white font-bold text-base tracking-tight">ResearchHub <span style={{ color: "#B5FF4D" }}>AI</span></span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {([
              { label: "Features", id: "features" },
              { label: "Portfolio", id: "portfolio" },
              { label: "Compliance", id: "compliance" },
              { label: "Reports", id: "cta" },
            ] as const).map(item => (
              <button key={item.label}
                className="text-sm font-medium transition-colors bg-transparent border-0 p-0 cursor-pointer"
                style={{ color: "rgba(255,255,255,0.5)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#B5FF4D")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
                onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" })}
              >{item.label}</button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <motion.button
                className="text-sm px-5 py-2 rounded-full font-semibold text-white transition-all"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                whileHover={{ background: "rgba(255,255,255,0.15)" }}
                whileTap={{ scale: 0.97 }}
              >Sign In</motion.button>
            </Link>
            <Link to="/register">
              <motion.button
                className="text-sm px-5 py-2 rounded-full font-bold btn-lime"
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              >Get Started</motion.button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── HERO ── */}
      <section className="relative pt-36 pb-24 px-6 z-10 overflow-hidden" style={{ background: "#0F1F16" }}>
        {/* Animated grid */}
        <div className="absolute inset-0 animated-grid opacity-50 pointer-events-none" />

        {/* Glow orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(181,255,77,0.12) 0%, transparent 70%)" }} />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
            style={{ background: "rgba(181,255,77,0.12)", border: "1px solid rgba(181,255,77,0.25)" }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          >
            <Activity className="w-3.5 h-3.5" style={{ color: "#B5FF4D" }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#B5FF4D" }}>🏆 AI-Powered Industrial Plot Monitoring</span>
          </motion.div>

          <motion.h1
            className="text-6xl md:text-7xl lg:text-8xl font-black leading-[1.05] tracking-tighter text-white mb-6"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }}
          >
            Zero Defaulters.<br />
            <span style={{ color: "#B5FF4D" }}>Complete</span> Compliance.
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium mb-10"
            style={{ color: "rgba(255,255,255,0.5)" }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          >
            The intelligent command center for Government bodies like SIDCO, TIDCO & SIPCOT. Automate compliance tracking and chat with your data using our integrated AI Assistant.
          </motion.p>

          <motion.div
            className="flex flex-wrap items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          >
            <Link to="/register">
              <motion.button
                className="px-8 py-4 rounded-2xl font-bold text-base btn-lime flex items-center gap-2"
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
              >
                Access Dashboard <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
            <Link to="/login">
              <motion.button
                className="px-8 py-4 rounded-2xl font-semibold text-base flex items-center gap-2"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" }}
                whileHover={{ background: "rgba(255,255,255,0.12)" }} whileTap={{ scale: 0.96 }}
              >
                Sign In
              </motion.button>
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mt-16"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
          >
            {stats.map((s, i) => (
              <motion.div key={s.label}
                className="p-4 rounded-2xl text-left"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 + i * 0.1 }}
                whileHover={{ background: "rgba(255,255,255,0.08)" }}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}18` }}>
                  <s.icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <p className="text-2xl font-black stat-number" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
          style={{ background: "linear-gradient(to top, #F5F7F2, transparent)" }} />
      </section>

      {/* ── DASHBOARD MOCKUP (Portfolio) ── */}
      <section id="portfolio" className="py-20 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="rounded-[2.5rem] overflow-hidden shadow-2xl"
            style={{ background: "#1B3C2A", border: "1px solid rgba(181,255,77,0.15)" }}
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7 }}
          >
            {/* Mockup header */}
            <div className="flex items-center gap-2 px-6 py-4 border-b" style={{ borderColor: "rgba(181,255,77,0.1)" }}>
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full" style={{ background: "#B5FF4D" }} />
              <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center gap-2 px-4 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <Shield className="w-3 h-3" style={{ color: "#B5FF4D" }} />
                  <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>plotguardian.in/dashboard</span>
                </div>
              </div>
            </div>

            {/* Mockup content */}
            <div className="p-8 grid grid-cols-4 gap-6">
              <div className="col-span-1 space-y-2">
                {["Dashboard", "Plot Directory", "Compliance", "AI Assistant", "Documents", "Reports"].map((item, i) => (
                  <div key={item} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                    style={{ background: i === 0 ? "#B5FF4D" : "rgba(255,255,255,0.04)", color: i === 0 ? "#0F1F16" : "rgba(255,255,255,0.4)" }}>
                    <div className="w-4 h-4 rounded bg-current opacity-40" />
                    <span className="text-xs font-semibold">{item}</span>
                  </div>
                ))}
              </div>
              <div className="col-span-3 space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Total Plots", val: "154", color: "#B5FF4D" },
                    { label: "Compliant", val: "98", color: "#4ADE80" },
                    { label: "Pending", val: "32", color: "#FFB547" },
                    { label: "Defaulting", val: "24", color: "#FF6B6B" },
                  ].map(s => (
                    <div key={s.label} className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>{s.label}</p>
                      <p className="text-2xl font-black mt-1 stat-number" style={{ color: s.color }}>{s.val}</p>
                    </div>
                  ))}
                </div>
                {/* Charts placeholder */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-36 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="w-24 h-24 rounded-full border-8 flex items-center justify-center" style={{ borderColor: "#B5FF4D", borderRightColor: "#FFB547", borderBottomColor: "#FF6B6B" }}>
                      <span className="text-lg font-black" style={{ color: "#B5FF4D" }}>68%</span>
                    </div>
                  </div>
                  <div className="h-36 rounded-2xl p-4 space-y-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    {[80, 55, 30].map((w, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                          <div className="h-full rounded-full" style={{ width: `${w}%`, background: i === 0 ? "#B5FF4D" : i === 1 ? "#FFB547" : "#FF6B6B" }} />
                        </div>
                        <span className="text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>{w}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6 relative z-10" style={{ background: "#0F1F16" }}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
              style={{ background: "rgba(181,255,77,0.1)", border: "1px solid rgba(181,255,77,0.2)" }}>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#B5FF4D" }}>Platform Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
              Automating the <span style={{ color: "#B5FF4D" }}>Monitoring Lifecycle</span>
            </h2>
            <p className="text-lg mt-4 max-w-2xl mx-auto font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
              Eliminate manual paperwork. Our automation engine actively monitors lease timelines, investment commitments, and subsidy eligibility.
            </p>
          </motion.div>

          <div id="compliance" className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="p-8 rounded-3xl group cursor-pointer"
                style={{ background: "#1B3C2A", border: "1px solid rgba(181,255,77,0.1)" }}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -6, borderColor: "rgba(181,255,77,0.3)" }}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(181,255,77,0.12)" }}>
                    <f.icon className="w-7 h-7" style={{ color: "#B5FF4D" }} />
                  </div>
                  <span className="text-5xl font-black opacity-10 text-white">{f.num}</span>
                </div>
                <h3 className="font-bold text-xl mb-3 text-white">{f.title}</h3>
                <p className="leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="cta" className="py-24 px-6 relative z-10 overflow-hidden" style={{ background: "#F5F7F2" }}>
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-6" style={{ color: "#0F1F16" }}>
              Ready to Monitor<br /> <span style={{ color: "#1B3C2A" }}>Every Plot?</span>
            </h2>
            <p className="text-lg max-w-xl mx-auto font-medium mb-10" style={{ color: "rgba(15,31,22,0.5)" }}>
              Join compliance officers across Tamil Nadu using ResearchHub AI to enforce allotment terms automatically.
            </p>
            <Link to="/register">
              <motion.button
                className="px-10 py-4 rounded-2xl font-bold text-lg btn-lime inline-flex items-center gap-3"
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              >
                Start Monitoring <ArrowRight className="w-6 h-6" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 px-6" style={{ background: "#0F1F16", borderTop: "1px solid rgba(181,255,77,0.08)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#B5FF4D" }}>
              <Shield className="w-4 h-4" style={{ color: "#0F1F16" }} />
            </div>
            <span className="font-bold text-white tracking-tight">ResearchHub <span style={{ color: "#B5FF4D" }}>AI</span></span>
          </div>
          <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.2)" }}>
            SIDCO · TIDCO · SIPCOT · TIIC — Government of Tamil Nadu · Industrial Compliance Division
          </p>
          <div className="flex items-center gap-6">
            {["Privacy", "Terms", "Contact"].map(item => (
              <span key={item} className="text-xs font-semibold cursor-pointer" style={{ color: "rgba(255,255,255,0.25)" }}>{item}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
