import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BarChart3, TrendingUp, IndianRupee, Users, Shield,
    CheckCircle2, AlertTriangle, Clock, ChevronDown
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../contexts/AuthContext";
import { plotDb, complianceDb, documentDb, seedDemoData, type Plot } from "../lib/db";

/* ─────────── Colour palette ─────────── */
const C = { green: "#1B3C2A", lime: "#B5FF4D", good: "#4ADE80", warn: "#FFB547", bad: "#FF6B6B", blue: "#60A5FA", purple: "#A78BFA", grey: "#8A8A8E" };

/* ─────────── Tooltip ─────────── */
function Tooltip({ text, x, y, visible }: { text: string; x: number; y: number; visible: boolean }) {
    return (
        <AnimatePresence>
            {visible && (
                <motion.div className="fixed z-50 pointer-events-none"
                    style={{ left: x + 12, top: y - 8 }}
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.12 }}>
                    <div className="px-2.5 py-1.5 rounded-xl text-xs font-semibold shadow-lg"
                        style={{ background: "#1D1D1F", color: "#fff", whiteSpace: "nowrap", maxWidth: 220 }}>
                        {text}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/* ─────────── KPI stat card ─────────── */
function StatCard({ label, value, sub, color, icon: Icon }: { label: string; value: string | number; sub?: string; color: string; icon: React.ElementType }) {
    return (
        <motion.div className="widget-card p-5 relative overflow-hidden"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -3 }}>
            <div className="absolute -top-5 -right-5 w-18 h-18 rounded-full pointer-events-none" style={{ background: `${color}18`, width: 72, height: 72 }} />
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.grey }}>{label}</p>
                    <p className="text-2xl font-black mt-1 stat-number" style={{ color: "#1D1D1F" }}>{value}</p>
                    {sub && <p className="text-[11px] mt-0.5 font-medium" style={{ color: C.grey }}>{sub}</p>}
                </div>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: C.green }}>
                    <Icon className="w-5 h-5" style={{ color: C.lime }} />
                </div>
            </div>
        </motion.div>
    );
}

/* ─────────── Radial gauge ─────────── */
function RadialGauge({ pct, label, color }: { pct: number; label: string; color: string }) {
    const r = 52, circ = 2 * Math.PI * r;
    return (
        <div className="flex flex-col items-center">
            <div className="relative w-28 h-28">
                <svg width={112} height={112} viewBox="0 0 112 112" className="-rotate-90">
                    <circle cx={56} cy={56} r={r} fill="transparent" stroke="rgba(0,0,0,0.06)" strokeWidth={13} />
                    <motion.circle cx={56} cy={56} r={r} fill="transparent" stroke={color} strokeWidth={13}
                        strokeLinecap="round"
                        strokeDasharray={circ}
                        initial={{ strokeDashoffset: circ }}
                        animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.3 }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span className="text-xl font-black stat-number" style={{ color: "#1D1D1F" }}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                        {pct}%
                    </motion.span>
                </div>
            </div>
            <p className="text-[11px] font-bold mt-1" style={{ color: C.grey }}>{label}</p>
        </div>
    );
}

/* ─────────── Grouped bar chart (SVG) ─────────── */
type Bar = { label: string; committed: number; actual: number; unit: string };
function GroupedBarChart({ bars, colorA, colorB, labelA, labelB }:
    { bars: Bar[]; colorA: string; colorB: string; labelA: string; labelB: string }) {

    const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number; visible: boolean }>({ text: "", x: 0, y: 0, visible: false });
    const [hoveredBar, setHoveredBar] = useState<string | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    if (bars.length === 0) return <p className="text-sm text-center py-8" style={{ color: C.grey }}>No data</p>;

    const maxVal = Math.max(...bars.flatMap(b => [b.committed, b.actual]), 1);
    const chartH = 180, barGap = 8, groupW = 56, svgW = bars.length * (groupW + barGap) + 40;
    const barW = (groupW - 6) / 2;

    return (
        <div className="w-full overflow-x-auto">
            <Tooltip {...tooltip} />
            {/* Legend */}
            <div className="flex items-center gap-4 mb-3">
                {[{ color: colorA, label: labelA }, { color: colorB, label: labelB }].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
                        <span className="text-[11px] font-semibold" style={{ color: C.grey }}>{l.label}</span>
                    </div>
                ))}
            </div>
            <svg ref={svgRef} width="100%" height={chartH + 28} viewBox={`0 0 ${svgW} ${chartH + 28}`} preserveAspectRatio="xMidYMid meet">
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map(t => (
                    <line key={t} x1={0} y1={chartH - t * chartH} x2={svgW} y2={chartH - t * chartH}
                        stroke="rgba(0,0,0,0.05)" strokeWidth={1} />
                ))}

                {bars.map((bar, i) => {
                    const gx = 20 + i * (groupW + barGap);
                    const committedH = Math.max((bar.committed / maxVal) * chartH, 2);
                    const actualH = Math.max((bar.actual / maxVal) * chartH, 2);
                    const isHovered = hoveredBar === bar.label;
                    return (
                        <g key={bar.label}
                            onMouseEnter={e => { setHoveredBar(bar.label); setTooltip({ text: `${bar.label}: ${bar.actual} / ${bar.committed} ${bar.unit}`, x: e.clientX, y: e.clientY, visible: true }); }}
                            onMouseLeave={() => { setHoveredBar(null); setTooltip(t => ({ ...t, visible: false })); }}
                            onMouseMove={e => setTooltip(t => ({ ...t, x: e.clientX, y: e.clientY }))}>
                            {/* Committed bar */}
                            <motion.rect
                                x={gx} y={chartH - committedH} width={barW} height={committedH} rx={4}
                                fill={colorA} opacity={isHovered ? 1 : 0.65}
                                initial={{ scaleY: 0, originY: 1 }} animate={{ scaleY: 1 }}
                                transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
                                style={{ transformOrigin: `${gx + barW / 2}px ${chartH}px` }} />
                            {/* Actual bar */}
                            <motion.rect
                                x={gx + barW + 3} y={chartH - actualH} width={barW} height={actualH} rx={4}
                                fill={colorB} opacity={isHovered ? 1 : 0.9}
                                initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                                transition={{ duration: 0.6, delay: i * 0.08 + 0.15, ease: "easeOut" }}
                                style={{ transformOrigin: `${gx + barW + 3 + barW / 2}px ${chartH}px` }} />
                            {/* Label */}
                            <text x={gx + groupW / 2} y={chartH + 16} textAnchor="middle"
                                fontSize={9} fontWeight={600} fill={isHovered ? "#1D1D1F" : C.grey}
                                style={{ fontFamily: "Inter, sans-serif" }}>
                                {bar.label.split("/").pop()}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

/* ─────────── Status donut ─────────── */
function StatusDonut({ counts, total }: { counts: { compliant: number; pending: number; defaulting: number }; total: number }) {
    const [hovered, setHovered] = useState<string | null>(null);
    const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number; visible: boolean }>({ text: "", x: 0, y: 0, visible: false });

    const slices = [
        { key: "compliant", label: "Compliant", count: counts.compliant, color: C.good },
        { key: "pending", label: "Pending", count: counts.pending, color: C.warn },
        { key: "defaulting", label: "Defaulting", count: counts.defaulting, color: C.bad },
    ];
    const r = 60, cx = 80, cy = 80, strokeW = 20;
    const circ = 2 * Math.PI * r;
    let offset = 0;

    return (
        <div className="flex flex-col items-center">
            <Tooltip {...tooltip} />
            <div className="relative">
                <svg width={160} height={160} viewBox="0 0 160 160" className="-rotate-90">
                    <circle cx={cx} cy={cy} r={r} fill="transparent" stroke="rgba(0,0,0,0.05)" strokeWidth={strokeW} />
                    {slices.map(s => {
                        if (total === 0) return null;
                        const pct = s.count / total;
                        const len = pct * circ;
                        const currOffset = offset;
                        offset += len;
                        return (
                            <motion.circle key={s.key} cx={cx} cy={cy} r={r}
                                fill="transparent" stroke={s.color}
                                strokeWidth={hovered === s.key ? strokeW + 4 : strokeW}
                                strokeDasharray={`${len} ${circ}`}
                                strokeDashoffset={-currOffset}
                                strokeLinecap="round"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                                style={{ cursor: "pointer" }}
                                onMouseEnter={e => { setHovered(s.key); setTooltip({ text: `${s.label}: ${s.count} plots (${total > 0 ? Math.round((s.count / total) * 100) : 0}%)`, x: e.clientX, y: e.clientY, visible: true }); }}
                                onMouseLeave={() => { setHovered(null); setTooltip(t => ({ ...t, visible: false })); }}
                                onMouseMove={e => setTooltip(t => ({ ...t, x: e.clientX, y: e.clientY }))} />
                        );
                    })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black stat-number" style={{ color: "#1D1D1F" }}>{total}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.grey }}>Plots</span>
                </div>
            </div>
            <div className="flex flex-col gap-1.5 w-full mt-3">
                {slices.map(s => (
                    <div key={s.key} className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all"
                        style={{ background: hovered === s.key ? `${s.color}18` : "transparent" }}
                        onMouseEnter={() => setHovered(s.key)} onMouseLeave={() => setHovered(null)}>
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                        <span className="text-xs font-semibold flex-1" style={{ color: "#3C3C43" }}>{s.label}</span>
                        <span className="text-xs font-black stat-number" style={{ color: s.color }}>{s.count}</span>
                        <span className="text-[10px]" style={{ color: C.grey }}>
                            ({total > 0 ? Math.round((s.count / total) * 100) : 0}%)
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─────────── Pipeline funnel ─────────── */
function PipelineFunnel({ stages, total }: { stages: { label: string; value: number; color: string }[]; total: number }) {
    const [hovered, setHovered] = useState<string | null>(null);
    return (
        <div className="space-y-2.5">
            {stages.map((s, i) => {
                const pct = total > 0 ? (s.value / total) * 100 : 0;
                const isH = hovered === s.label;
                return (
                    <motion.div key={s.label}
                        className="rounded-2xl overflow-hidden cursor-default transition-all"
                        style={{ background: isH ? `${s.color}12` : "rgba(0,0,0,0.03)", border: `1px solid ${isH ? s.color + "30" : "transparent"}` }}
                        onMouseEnter={() => setHovered(s.label)} onMouseLeave={() => setHovered(null)}
                        initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}>
                        <div className="flex items-center gap-3 px-3 py-2.5">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
                            <span className="text-xs font-semibold flex-1" style={{ color: "#3C3C43" }}>{s.label}</span>
                            <span className="text-xs font-black stat-number" style={{ color: s.color }}>{s.value}</span>
                            <span className="text-[10px] font-bold w-8 text-right" style={{ color: C.grey }}>
                                {Math.round(pct)}%
                            </span>
                        </div>
                        <div className="h-1.5 w-full" style={{ background: "rgba(0,0,0,0.04)" }}>
                            <motion.div className="h-full rounded-full" style={{ background: s.color }}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, delay: i * 0.1 + 0.2, ease: "easeOut" }} />
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

/* ─────────── Caution deposit ring ─────────── */
function CautionRings({ held, refund_due, refunded, total }: { held: number; refund_due: number; refunded: number; total: number }) {
    const items = [
        { label: "Held", value: held, color: C.warn, icon: Clock },
        { label: "Refund Due", value: refund_due, color: C.bad, icon: AlertTriangle },
        { label: "Refunded", value: refunded, color: C.good, icon: CheckCircle2 },
    ];
    return (
        <div className="space-y-3">
            {items.map((item, i) => {
                const pct = total > 0 ? (item.value / total) * 100 : 0;
                return (
                    <motion.div key={item.label} className="flex items-center gap-3"
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: `${item.color}15` }}>
                            <item.icon className="w-4 h-4" style={{ color: item.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-semibold" style={{ color: "#3C3C43" }}>{item.label}</span>
                                <span className="text-xs font-black stat-number" style={{ color: item.color }}>
                                    {item.value} plot{item.value !== 1 ? "s" : ""}
                                </span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                                <motion.div className="h-full rounded-full" style={{ background: item.color }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.8, delay: i * 0.12 + 0.2, ease: "easeOut" }} />
                            </div>
                        </div>
                        <span className="text-[11px] font-bold w-9 text-right" style={{ color: item.color }}>{Math.round(pct)}%</span>
                    </motion.div>
                );
            })}
        </div>
    );
}

/* ─────────── MAIN PAGE ─────────── */
export default function Reports() {
    const { user } = useAuth();
    const [plots, setPlots] = useState<Plot[]>([]);
    const [compRecords, setCompRecords] = useState<ReturnType<typeof complianceDb.getByUser>>([]);
    const [docCount, setDocCount] = useState(0);
    const [viewMode, setViewMode] = useState<"investment" | "employment">("investment");

    useEffect(() => {
        if (!user) return;
        const init = async () => {
            await seedDemoData(user.id);
            const p = await plotDb.fetchByUser(user.id);
            setPlots(p);
            await complianceDb.fetchByUser(user.id);
            setCompRecords(complianceDb.getByUser(user.id));
            await documentDb.fetchByUser(user.id);
            setDocCount(documentDb.countByUser(user.id));
        };
        init();
    }, [user?.id]);

    const totalInvCommitted = plots.reduce((s, p) => s + p.investmentCommitted, 0);
    const totalInvActual = compRecords.reduce((s, c) => s + (c.investmentActual ?? 0), 0);
    const totalEmpCommitted = plots.reduce((s, p) => s + p.employmentCommitted, 0);
    const totalEmpActual = compRecords.reduce((s, c) => s + (c.employmentActual ?? 0), 0);
    const totalCaution = plots.reduce((s, p) => s + p.cautionDeposit, 0);
    const complianceRate = plots.length > 0 ? Math.round((plots.filter(p => p.status === "compliant").length / plots.length) * 100) : 0;
    const investPct = totalInvCommitted > 0 ? Math.round((totalInvActual / totalInvCommitted) * 100) : 0;
    const empPct = totalEmpCommitted > 0 ? Math.round((totalEmpActual / totalEmpCommitted) * 100) : 0;

    const statusCounts = {
        compliant: plots.filter(p => p.status === "compliant").length,
        pending: plots.filter(p => p.status === "pending").length,
        defaulting: plots.filter(p => p.status === "defaulting").length,
    };

    const cautionSummary = {
        held: compRecords.filter(c => c.cautionStatus === "held").length,
        refund_due: compRecords.filter(c => c.cautionStatus === "refund_due").length,
        refunded: compRecords.filter(c => c.cautionStatus === "refunded").length,
    };

    const subsidyStages = [
        { label: "Not Applied", value: compRecords.filter(c => c.subsidyStatus === "not_applied").length, color: C.grey },
        { label: "Applied", value: compRecords.filter(c => c.subsidyStatus === "applied").length, color: C.blue },
        { label: "Approved", value: compRecords.filter(c => c.subsidyStatus === "approved").length, color: C.warn },
        { label: "Disbursed", value: compRecords.filter(c => c.subsidyStatus === "disbursed").length, color: C.good },
    ];

    const invBars: Bar[] = plots.map(p => {
        const comp = compRecords.find(c => c.plotId === p.id);
        return { label: p.plotNumber, committed: p.investmentCommitted, actual: comp?.investmentActual ?? 0, unit: "L" };
    });

    const empBars: Bar[] = plots.map(p => {
        const comp = compRecords.find(c => c.plotId === p.id);
        return { label: p.plotNumber, committed: p.employmentCommitted, actual: comp?.employmentActual ?? 0, unit: "jobs" };
    });

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"
                        style={{ color: "#1D1D1F", letterSpacing: "-0.02em" }}>
                        <BarChart3 className="w-6 h-6" style={{ color: C.green }} />
                        Compliance <span style={{ color: C.green }}>Reports</span>
                    </h1>
                    <p className="text-sm mt-1" style={{ color: C.grey }}>
                        {plots.length} plots monitored · {docCount} documents filed · Live data
                    </p>
                </motion.div>

                {/* KPI row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Compliance Rate" value={`${complianceRate}%`}
                        sub={`${statusCounts.compliant} of ${plots.length} compliant`} color={C.good} icon={Shield} />
                    <StatCard label="Investment Achieved" value={`₹${Math.round(totalInvActual)}L`}
                        sub={`of ₹${totalInvCommitted}L (${investPct}%)`} color={C.blue} icon={IndianRupee} />
                    <StatCard label="Employment Created" value={totalEmpActual}
                        sub={`of ${totalEmpCommitted} committed (${empPct}%)`} color={C.purple} icon={Users} />
                    <StatCard label="Caution Deposits" value={`₹${totalCaution}L`}
                        sub="Total held across plots" color={C.warn} icon={TrendingUp} />
                </div>

                {/* Row 2: Gauge trifecta + Status donut */}
                <div className="grid lg:grid-cols-3 gap-5">
                    {/* Gauge cluster */}
                    <div className="widget-card p-6 lg:col-span-2">
                        <h2 className="text-sm font-bold mb-5 flex items-center gap-2" style={{ color: "#1D1D1F" }}>
                            <TrendingUp className="w-4 h-4" style={{ color: C.green }} />
                            Achievement Gauges
                        </h2>
                        <div className="flex items-center justify-around flex-wrap gap-4">
                            <RadialGauge pct={complianceRate} label="Compliance" color={C.good} />
                            <RadialGauge pct={investPct} label="Investment" color={C.blue} />
                            <RadialGauge pct={empPct} label="Employment" color={C.purple} />
                        </div>
                    </div>

                    {/* Status donut */}
                    <div className="widget-card p-6 flex flex-col">
                        <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "#1D1D1F" }}>
                            <Shield className="w-4 h-4" style={{ color: C.green }} />
                            Portfolio Status
                        </h2>
                        <div className="flex-1 flex items-center justify-center">
                            <StatusDonut counts={statusCounts} total={plots.length} />
                        </div>
                    </div>
                </div>

                {/* Row 3: Interactive grouped bars */}
                <div className="widget-card p-6">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                        <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: "#1D1D1F" }}>
                            <BarChart3 className="w-4 h-4" style={{ color: C.green }} />
                            Committed vs Actual — Per Plot
                        </h2>
                        {/* Toggle */}
                        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "rgba(0,0,0,0.05)" }}>
                            {(["investment", "employment"] as const).map(m => (
                                <motion.button key={m} onClick={() => setViewMode(m)}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all"
                                    animate={{ background: viewMode === m ? "#1B3C2A" : "transparent", color: viewMode === m ? "#B5FF4D" : "#8A8A8E" }}
                                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                    {m === "investment" ? "₹ Investment" : "👥 Employment"}
                                </motion.button>
                            ))}
                        </div>
                    </div>
                    <AnimatePresence mode="wait">
                        <motion.div key={viewMode}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}>
                            {viewMode === "investment"
                                ? <GroupedBarChart bars={invBars} colorA="rgba(27,60,42,0.3)" colorB={C.good} labelA="Committed (₹L)" labelB="Actual (₹L)" />
                                : <GroupedBarChart bars={empBars} colorA="rgba(167,139,250,0.4)" colorB={C.purple} labelA="Committed (jobs)" labelB="Actual (jobs)" />
                            }
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Row 4: Caution deposits + Subsidy pipeline */}
                <div className="grid lg:grid-cols-2 gap-5">
                    <div className="widget-card p-6">
                        <h2 className="text-sm font-bold mb-5 flex items-center gap-2" style={{ color: "#1D1D1F" }}>
                            <Shield className="w-4 h-4" style={{ color: C.green }} />
                            Caution Deposit Tracker
                        </h2>
                        <CautionRings held={cautionSummary.held} refund_due={cautionSummary.refund_due}
                            refunded={cautionSummary.refunded} total={compRecords.length || 1} />

                        <div className="mt-5 pt-4 flex items-center justify-between"
                            style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                            <span className="text-xs font-semibold" style={{ color: C.grey }}>Total held</span>
                            <span className="text-base font-black stat-number" style={{ color: C.green }}>₹{totalCaution}L</span>
                        </div>
                    </div>

                    <div className="widget-card p-6">
                        <h2 className="text-sm font-bold mb-5 flex items-center gap-2" style={{ color: "#1D1D1F" }}>
                            <TrendingUp className="w-4 h-4" style={{ color: C.green }} />
                            Land Cost Subsidy Pipeline
                        </h2>
                        <PipelineFunnel stages={subsidyStages} total={plots.length || 1} />

                        <div className="mt-5 pt-4"
                            style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ background: C.good }} />
                                <span className="text-xs font-semibold" style={{ color: C.grey }}>
                                    {subsidyStages.find(s => s.label === "Disbursed")?.value ?? 0} of {plots.length} plots disbursed
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
