import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Shield, Search, ClipboardCheck, Bot, Zap, ArrowRight, Activity, Map, Database } from "lucide-react";

const features = [
  { icon: Shield, title: "Automated Compliance", desc: "Real-time tracking of investment, employment, and construction milestones against allotment terms." },
  { icon: ClipboardCheck, title: "Document Library", desc: "Centralized repository for allotment orders, lease deeds, NOCs, and environmental clearances." },
  { icon: Bot, title: "AI Compliance Assistant", desc: "Chat with your data. Ask about over-due refunds, defaulting plots, and subsidy statuses instantly." },
  { icon: Zap, title: "Proactive Alerts", desc: "Automated prior-alerts for lease expiries, caution deposit refunds, and show-cause notices." },
  { icon: Map, title: "Portfolio Overview", desc: "Bird's-eye view of all industrial plots, filtered by compliant, pending, or defaulting status." },
  { icon: Database, title: "Offline Capable", desc: "Your monitoring data stays in your browser — private, secure, and always fast." },
];

const Landing = () => {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#F2F2F7" }}>

      {/* Dynamic background gradient bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[100px] opacity-40 mix-blend-multiply" style={{ background: "#007AFF" }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-30 mix-blend-multiply" style={{ background: "#34C759" }} />
        <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] rounded-full blur-[90px] opacity-20 mix-blend-multiply" style={{ background: "#FF9F0A" }} />
      </div>

      {/* macOS-style menubar */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          height: 52,
          background: "rgba(255, 255, 255, 0.75)",
          backdropFilter: "blur(24px) saturate(1.8)",
          WebkitBackdropFilter: "blur(24px) saturate(1.8)",
          borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
        }}
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
            </div>
            <div className="flex items-center gap-2 px-3 border-l border-black/10">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold tracking-tight text-slate-900">ResearchHub AI</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <motion.button
                className="text-xs px-5 py-2 rounded-full font-semibold transition-all hover:bg-black/5 text-slate-900"
                whileTap={{ scale: 0.97 }}
              >
                Sign In
              </motion.button>
            </Link>
            <Link to="/register">
              <motion.button
                className="text-xs px-5 py-2 rounded-full font-bold text-white shadow-sm transition-all bg-gradient-to-br from-blue-600 to-indigo-600"
                whileHover={{ y: -1, boxShadow: "0 4px 12px rgba(0,122,255,0.3)" }}
                whileTap={{ scale: 0.97 }}
              >
                Get Started
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 z-10 w-full flex flex-col items-center">
        <div className="max-w-7xl mx-auto text-center flex flex-col items-center w-full">
          <motion.div
            className="inline-flex items-center justify-center gap-2 px-4 py-1.5 mx-auto rounded-full mb-8 shadow-sm backdrop-blur-md bg-white/80 border border-black/5"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          >
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-900">Industrial Plot Monitoring</span>
          </motion.div>

          <motion.h1
            className="text-6xl md:text-7xl lg:text-8xl font-black leading-[1.1] tracking-tighter text-slate-900 w-full text-center"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }}
          >
            Zero Defaulters.<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-blue-600 to-indigo-600">
              Complete Compliance.
            </span>
          </motion.h1>

          <motion.p
            className="text-xl mt-8 max-w-2xl mx-auto leading-relaxed font-medium text-slate-600 text-center"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          >
            Automated monitoring software for SIDCO, TIDCO, and SIPCOT industrial plots. Track investment commitments,
            employment targets, and lease conditions in real-time with an AI-powered assistant.
          </motion.p>

          <motion.div
            className="flex items-center justify-center gap-4 mt-10 w-full"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          >
            <Link to="/register">
              <motion.button
                className="px-8 py-4 rounded-2xl font-semibold text-white shadow-lg flex items-center gap-2 bg-gradient-to-br from-blue-600 to-indigo-600"
                whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,122,255,0.3)" }}
                whileTap={{ scale: 0.95 }}
              >
                Access Dashboard <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Hero Showcase Image */}
      <section className="px-6 pb-24 z-10 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="rounded-[2.5rem] overflow-hidden shadow-2xl relative bg-white border-8 border-white/80"
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8 }}
          >
            <div className="aspect-[16/9] bg-gray-100 relative flex items-center justify-center overflow-hidden">
              {/* Decorative Dashboard Mockup */}
              <div className="absolute inset-0 p-8 grid grid-cols-4 gap-6 bg-slate-50">
                <div className="col-span-1 space-y-4">
                  <div className="h-10 rounded-xl bg-white shadow-sm w-full" />
                  <div className="h-10 rounded-xl bg-blue-500/10 shadow-sm w-full" />
                  <div className="h-10 rounded-xl bg-white shadow-sm w-full" />
                  <div className="h-10 rounded-xl bg-white shadow-sm w-full" />
                </div>
                <div className="col-span-3 space-y-6">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="h-32 rounded-2xl bg-white shadow-sm" />
                    <div className="h-32 rounded-2xl bg-white shadow-sm" />
                    <div className="h-32 rounded-2xl bg-white shadow-sm" />
                  </div>
                  <div className="h-[400px] rounded-2xl bg-white shadow-sm w-full border border-gray-100" />
                </div>
              </div>

              {/* Central Floating Play / Badge */}
              <div className="absolute z-10 bg-white/90 backdrop-blur-md px-6 py-4 rounded-3xl flex items-center gap-4 shadow-xl border border-white/40">
                <div className="w-12 h-12 rounded-full grid place-items-center bg-green-500/15">
                  <Shield className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="font-bold text-lg text-slate-900">100% Compliant</p>
                  <p className="text-sm font-medium text-slate-500">All targets achieved</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 relative z-10 bg-white w-full">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-20 w-full"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 w-full text-center">
              Automating the <span className="text-blue-600">Monitoring Lifecycle</span>
            </h2>
            <p className="text-lg mt-4 max-w-2xl mx-auto font-medium text-slate-600 text-center">
              Eliminate manual paperwork. Our automation engine actively monitors lease timelines, investment
              commitments, and subsidy elegibility to generate prioritized alerts.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="p-8 rounded-3xl transition-all duration-300 hover:shadow-lg border border-transparent hover:border-black/5 bg-slate-50"
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }} whileHover={{ y: -4 }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm bg-white">
                  <f.icon className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="font-bold text-xl mb-3 tracking-tight text-slate-900">{f.title}</h3>
                <p className="font-medium leading-relaxed text-slate-600">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 opacity-60 text-slate-900" />
            <span className="font-bold tracking-tight opacity-60 text-slate-900">PlotGuardian AI</span>
          </div>
          <p className="text-xs font-semibold opacity-50 text-slate-900">
            Developed for effective monitoring of industrial plot implementation.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
