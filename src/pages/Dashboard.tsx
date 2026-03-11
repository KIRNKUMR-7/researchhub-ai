import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Shield, Map, ClipboardCheck, Bot, BarChart3,
  TrendingUp, AlertTriangle, CheckCircle2, XCircle,
  ArrowRight, Clock, Plus, Activity
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import AlertsPanel from "../components/AlertsPanel";
import { useAuth } from "../contexts/AuthContext";
import {
  plotDb, complianceDb, documentDb, chatDb, activityDb, seedDemoData,
  type Plot, type ActivityItem
} from "../lib/db";
import { runAutomationChecks, type ComplianceAlert } from "../lib/automationEngine";
import { formatDistanceToNow } from "date-fns";

type SheetType = "total" | "compliant" | "pending" | "defaulting" | null;

const Orb = ({ x, y, size, color, delay }: { x: string; y: string; size: number; color: string; delay: number }) => (
  <motion.div className="absolute rounded-full pointer-events-none"
    style={{ left: x, top: y, width: size, height: size, background: color, filter: "blur(64px)" }}
    animate={{ scale: [1, 1.12, 0.96, 1], opacity: [0.4, 0.6, 0.4], x: [0, 14, -8, 0], y: [0, -12, 8, 0] }}
    transition={{ duration: 9, repeat: Infinity, delay, ease: "easeInOut" }} />
);

const STATUS_CONFIG = {
  compliant: { label: "Compliant", color: "#4ADE80", bg: "rgba(74,222,128,0.12)", icon: CheckCircle2 },
  pending: { label: "Pending", color: "#FFB547", bg: "rgba(255,181,71,0.12)", icon: Clock },
  defaulting: { label: "Defaulting", color: "#FF6B6B", bg: "rgba(255,107,107,0.12)", icon: AlertTriangle },
  closed: { label: "Closed", color: "#8A8A8E", bg: "rgba(138,138,142,0.1)", icon: XCircle },
};


function PlotListSheet({ type, plots, onClose, navigate }: { type: SheetType; plots: Plot[]; onClose: () => void; navigate: (p: string) => void }) {
  const filtered = type === "total" ? plots : plots.filter(p => p.status === type);
  const label = type === "total" ? "All Plots" : STATUS_CONFIG[type!]?.label + " Plots";
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.28)", backdropFilter: "blur(8px)" }} />
      <motion.div className="relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-3xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 32px 80px rgba(0,0,0,0.22)" }}
        initial={{ y: 50, scale: 0.94, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 50, scale: 0.94, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 280 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-5 border-b border-gray-100 flex-shrink-0">
          <Shield className="w-5 h-5" style={{ color: "#1B3C2A" }} />
          <div className="flex-1">
            <h2 className="text-base font-bold" style={{ color: "#1D1D1F" }}>{label}</h2>
            <p className="text-xs" style={{ color: "#8A8A8E" }}>{filtered.length} plots</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors">
            <XCircle className="w-4 h-4" style={{ color: "#8A8A8E" }} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.length === 0 ? (
            <p className="text-center py-10 text-sm" style={{ color: "#8A8A8E" }}>No plots in this category.</p>
          ) : filtered.map((p, i) => {
            const cfg = STATUS_CONFIG[p.status];
            return (
              <motion.button key={p.id} onClick={() => { navigate("/compliance"); onClose(); }}
                className="w-full p-4 rounded-2xl border border-gray-100 hover:border-green-200 text-left group transition-all"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
                    <cfg.icon className="w-4 h-4" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: "#1D1D1F" }}>{p.plotNumber}</p>
                    <p className="text-xs truncate" style={{ color: "#8A8A8E" }}>{p.company} · {p.location}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.label}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
        <div className="p-4 border-t border-gray-100">
          <motion.button onClick={() => { navigate("/plots"); onClose(); }}
            className="w-full py-3 rounded-2xl text-white text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: "#1B3C2A" }}
            whileHover={{ scale: 1.015, background: "#264D37" }} whileTap={{ scale: 0.97 }}>
            <Map className="w-4 h-4" /> View All in Plot Directory
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plots, setPlots] = useState<Plot[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [docCount, setDocCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);
  const [openSheet, setOpenSheet] = useState<SheetType>(null);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [chartExpanded, setChartExpanded] = useState(false);

  const refreshAlerts = useCallback((uid: string) => {
    setAlertsLoading(true);
    setTimeout(() => {
      setAlerts(runAutomationChecks(uid));
      setAlertsLoading(false);
    }, 400);
  }, []);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      await seedDemoData(user.id);
      await plotDb.fetchByUser(user.id);
      await complianceDb.fetchByUser(user.id);
      await activityDb.fetchByUser(user.id);
      await documentDb.fetchByUser(user.id);
      setPlots(plotDb.getByUser(user.id));
      setActivity(activityDb.getByUser(user.id));
      setDocCount(documentDb.countByUser(user.id));
      setChatCount(chatDb.countByUser(user.id));
      refreshAlerts(user.id);
    };
    init();
  }, [user?.id, refreshAlerts]);

  const total = plots.length;
  const compliant = plots.filter(p => p.status === "compliant").length;
  const pending = plots.filter(p => p.status === "pending").length;
  const defaulting = plots.filter(p => p.status === "defaulting").length;
  const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 0;
  const firstName = user?.name?.split(" ")[0] ?? "Officer";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const R = 68; // radius of the donut
  const circumference = 2 * Math.PI * R;

  const stats = [
    { key: "total" as SheetType, label: "Total Plots", value: total, color: "#1B3C2A", bg: "rgba(27,60,42,0.1)", icon: Map },
    { key: "compliant" as SheetType, label: "Compliant", value: compliant, color: "#4ADE80", bg: "rgba(74,222,128,0.12)", icon: CheckCircle2 },
    { key: "pending" as SheetType, label: "Pending Review", value: pending, color: "#FFB547", bg: "rgba(255,181,71,0.12)", icon: Clock },
    { key: "defaulting" as SheetType, label: "Defaulting", value: defaulting, color: "#FF6B6B", bg: "rgba(255,107,107,0.12)", icon: AlertTriangle },
  ];

  const quickActions = [
    { icon: Plus, label: "Add Plot", desc: "Register new allotment", path: "/plots", color: "#1B3C2A" },
    { icon: ClipboardCheck, label: "Check Compliance", desc: "Review all plots", path: "/compliance", color: "#4ADE80" },
    { icon: Bot, label: "Ask AI", desc: "Compliance questions", path: "/assistant", color: "#B5FF4D" },
    { icon: BarChart3, label: "View Reports", desc: "Analytics & summaries", path: "/reports", color: "#FFB547" },
  ];

  // Donut segments: compliant=green, pending=amber, defaulting=red, remaining=bg
  const compliantPct = total > 0 ? compliant / total : 0;
  const pendingPct = total > 0 ? pending / total : 0;
  const defaultingPct = total > 0 ? defaulting / total : 0;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto relative">
        {/* Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <Orb x="72%" y="-5%" size={300} color="rgba(181,255,77,0.06)" delay={0} />
          <Orb x="-5%" y="35%" size={260} color="rgba(27,60,42,0.05)" delay={2} />
          <Orb x="80%" y="60%" size={220} color="rgba(74,222,128,0.04)" delay={1.5} />
        </div>

        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "#1B3C2A" }}>
              <Shield className="w-5 h-5" style={{ color: "#B5FF4D" }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#1D1D1F", letterSpacing: "-0.02em" }}>
                {greeting}, <span className="glow-text">{firstName}</span>
              </h1>
              <p className="text-sm" style={{ color: "#8A8A8E" }}>
                Plot compliance overview · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── COMPLIANCE DISTRIBUTION CHART ── */}
        <motion.div className="mt-5 rounded-2xl p-6 widget-card"
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold tracking-tight" style={{ color: "#1D1D1F" }}>Compliance Distribution</h2>
            <div className="flex items-center gap-3">
              {/* Legend */}
              <div className="hidden sm:flex items-center gap-4">
                {[
                  { label: "Compliant", color: "#4ADE80" },
                  { label: "Pending", color: "#FFB547" },
                  { label: "Defaulting", color: "#FF6B6B" },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                    <span className="text-[11px] font-semibold" style={{ color: "#8A8A8E" }}>{l.label}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* SVG Chart */}
            <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: 200, height: 200 }}>
              <svg width={200} height={200} viewBox="0 0 200 200"
                className="transform -rotate-90">
                {/* BG track */}
                <motion.circle cx={100} cy={100} r={R} fill="transparent"
                  stroke="rgba(0,0,0,0.04)"
                  animate={{ strokeWidth: chartExpanded ? R * 2 : 26 }}
                  transition={{ duration: 0.7, type: "spring", bounce: 0.25 }} />

                {/* Compliant segment */}
                <motion.circle cx={100} cy={100} r={R} fill="transparent" stroke="#4ADE80"
                  strokeDasharray={`${compliantPct * circumference} ${circumference}`}
                  strokeDashoffset={0}
                  animate={{ strokeWidth: chartExpanded ? R * 2 : 26 }}
                  transition={{ duration: 0.7, type: "spring", bounce: 0.25 }} />

                {/* Pending segment */}
                <motion.circle cx={100} cy={100} r={R} fill="transparent" stroke="#FFB547"
                  strokeDasharray={`${pendingPct * circumference} ${circumference}`}
                  strokeDashoffset={-(compliantPct * circumference)}
                  animate={{ strokeWidth: chartExpanded ? R * 2 : 26 }}
                  transition={{ duration: 0.7, type: "spring", bounce: 0.25 }} />

                {/* Defaulting segment */}
                <motion.circle cx={100} cy={100} r={R} fill="transparent" stroke="#FF6B6B"
                  strokeDasharray={`${defaultingPct * circumference} ${circumference}`}
                  strokeDashoffset={-((compliantPct + pendingPct) * circumference)}
                  animate={{ strokeWidth: chartExpanded ? R * 2 : 26 }}
                  transition={{ duration: 0.7, type: "spring", bounce: 0.25 }} />
              </svg>

              {/* Center: compliance % always visible */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <motion.span
                  key={complianceRate}
                  className="text-3xl font-black tracking-tighter stat-number"
                  style={{ color: "#1D1D1F" }}
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 16, stiffness: 260 }}>
                  {complianceRate}%
                </motion.span>
                <span className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: "#8A8A8E" }}>Compliant</span>
              </div>
            </div>

            {/* Stats alongside chart */}
            <div className="flex-1 grid grid-cols-2 gap-3 w-full">
              {stats.map((s, i) => (
                <motion.button key={s.key} onClick={(e) => { e.stopPropagation(); setOpenSheet(s.key); }}
                  className="text-left p-4 rounded-2xl border transition-all hover:-translate-y-0.5"
                  style={{ background: s.bg, border: `1px solid ${s.color}22` }}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.06 }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <s.icon className="w-4 h-4" style={{ color: s.color }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: s.color }}>{s.label}</span>
                  </div>
                  <p className="text-2xl font-black tabular-nums" style={{ color: "#1D1D1F" }}>{s.value}</p>
                  <p className="text-[10px] font-semibold mt-0.5 flex items-center gap-0.5" style={{ color: s.color }}>
                    View all <ArrowRight className="w-3 h-3" />
                  </p>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Automation Alerts + Quick Actions */}
        <motion.div className="grid lg:grid-cols-3 gap-5 mt-6 mb-8"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>

          {/* Automated monitoring — 2/3 width */}
          <div className="lg:col-span-2">
            <h2 className="text-base font-bold mb-3 tracking-tight flex items-center gap-2" style={{ color: "#1D1D1F" }}>
              <AlertTriangle className="w-4 h-4" style={{ color: "#FFB547" }} />
              Automated Monitoring
              {alerts.filter(a => a.severity === "critical").length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(255,107,107,0.1)", color: "#FF6B6B" }}>
                  {alerts.filter(a => a.severity === "critical").length} Critical
                </span>
              )}
            </h2>
            <AlertsPanel alerts={alerts} loading={alertsLoading}
              onRefresh={() => user && refreshAlerts(user.id)} />
          </div>

          {/* Quick Actions — 1/3 width */}
          <div>
            <h2 className="text-base font-bold mb-3 tracking-tight flex items-center gap-2" style={{ color: "#1D1D1F" }}>
              <Activity className="w-4 h-4" style={{ color: "#1B3C2A" }} /> Quick Actions
            </h2>
            <div className="space-y-3">
              {quickActions.map((action, i) => (
                <motion.button key={action.path} onClick={() => navigate(action.path)}
                  className="widget-card p-4 text-left group w-full"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.07 }} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: action.color === "#B5FF4D" ? "rgba(181,255,77,0.15)" : `${action.color}18` }}>
                      <action.icon className="w-5 h-5" style={{ color: action.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "#1D1D1F" }}>{action.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#8A8A8E" }}>{action.desc}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" style={{ color: action.color }} />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Recent Plots + Activity */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold tracking-tight flex items-center gap-2" style={{ color: "#1D1D1F" }}>
                <Map className="w-4 h-4" style={{ color: "#1B3C2A" }} /> Recent Plots
              </h2>
              <button onClick={() => navigate("/plots")} className="text-xs font-semibold flex items-center gap-1" style={{ color: "#1B3C2A" }}>
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-3">
              {plots.slice(0, 4).map((p, i) => {
                const cfg = STATUS_CONFIG[p.status];
                return (
                  <motion.button key={p.id} onClick={() => navigate("/compliance")}
                    className="w-full widget-card p-4 text-left group hover:-translate-y-0.5 transition-transform"
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.08 }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: cfg.bg }}>
                        <cfg.icon className="w-5 h-5" style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold" style={{ color: "#1D1D1F" }}>{p.plotNumber}</p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                        </div>
                        <p className="text-xs truncate mt-0.5" style={{ color: "#8A8A8E" }}>{p.company} · {p.sector}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#AEAEB2" }}>
                          ₹{p.investmentCommitted}L committed · {p.employmentCommitted} jobs
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: "#1B3C2A" }} />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Activity */}
          <div>
            <h2 className="text-base font-bold tracking-tight flex items-center gap-2 mb-4" style={{ color: "#1D1D1F" }}>
              <Clock className="w-4 h-4" style={{ color: "#1B3C2A" }} /> Activity Log
            </h2>
            <motion.div className="widget-card p-4 space-y-4"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
              {activity.slice(0, 6).map((a, i) => (
                <div key={a.id} className="flex items-start gap-3 pb-4 last:pb-0"
                  style={{ borderBottom: i < 5 ? "1px solid #F2F2F7" : "none" }}>
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#B5FF4D", boxShadow: "0 0 6px rgba(181,255,77,0.4)" }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium" style={{ color: "#1D1D1F" }}>{a.action}</p>
                    <p className="text-xs truncate" style={{ color: "#8A8A8E" }}>{a.detail}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "#C7C7CC" }}>
                      {formatDistanceToNow(new Date(a.time), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Sheet */}
        <AnimatePresence>
          {openSheet && (
            <PlotListSheet type={openSheet} plots={plots} onClose={() => setOpenSheet(null)} navigate={navigate} />
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
