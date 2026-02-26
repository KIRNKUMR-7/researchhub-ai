import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Map, Search, Filter, CheckCircle2, AlertTriangle, Clock, XCircle,
    Building2, MapPin, TrendingUp, Users, IndianRupee, ExternalLink,
    ChevronRight, Plus, X, Calendar
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../contexts/AuthContext";
import { plotDb, complianceDb, activityDb, seedDemoData, type Plot, type PlotStatus, type SectorType } from "../lib/db";
import { formatDistanceToNow } from "date-fns";

const STATUS_CONFIG: Record<PlotStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    compliant: { label: "Compliant", color: "#34C759", bg: "rgba(52,199,89,0.1)", icon: CheckCircle2 },
    pending: { label: "Pending", color: "#FF9F0A", bg: "rgba(255,159,10,0.1)", icon: Clock },
    defaulting: { label: "Defaulting", color: "#FF3B30", bg: "rgba(255,59,48,0.1)", icon: AlertTriangle },
    closed: { label: "Closed", color: "#8A8A8E", bg: "rgba(138,138,142,0.1)", icon: XCircle },
};

const FILTERS: { key: PlotStatus | "all"; label: string }[] = [
    { key: "all", label: "All Plots" },
    { key: "compliant", label: "Compliant" },
    { key: "pending", label: "Pending" },
    { key: "defaulting", label: "Defaulting" },
    { key: "closed", label: "Closed" },
];

export default function PlotDirectory() {
    const { user } = useAuth();
    const [plots, setPlots] = useState<Plot[]>([]);
    const [filter, setFilter] = useState<PlotStatus | "all">("all");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Plot | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [compliance, setCompliance] = useState<Record<string, ReturnType<typeof complianceDb.getByPlot>>>({});

    // New plot form state
    const [form, setForm] = useState({
        plotNumber: "", allotteeName: "", company: "", sector: "Industrial" as SectorType,
        area: "", location: "", allotmentDate: "", leaseStartDate: "", leaseEndDate: "",
        investmentCommitted: "", employmentCommitted: "", cautionDeposit: "", landCostSubsidy: ""
    });

    useEffect(() => {
        if (!user) return;
        seedDemoData(user.id);
        const p = plotDb.getByUser(user.id);
        setPlots(p);
        const c: Record<string, ReturnType<typeof complianceDb.getByPlot>> = {};
        p.forEach(pl => { c[pl.id] = complianceDb.getByPlot(pl.id); });
        setCompliance(c);
    }, [user?.id]);

    const visible = plots.filter(p => {
        const matchStatus = filter === "all" || p.status === filter;
        const matchSearch = !search || [p.plotNumber, p.company, p.allotteeName, p.location, p.sector].join(" ").toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
    });

    const handleAdd = () => {
        if (!user || !form.plotNumber || !form.company) return;
        const newPlot = plotDb.save({
            userId: user.id,
            plotNumber: form.plotNumber, allotteeName: form.allotteeName, company: form.company,
            sector: form.sector, area: Number(form.area) || 0, location: form.location,
            allotmentDate: form.allotmentDate, leaseStartDate: form.leaseStartDate, leaseEndDate: form.leaseEndDate,
            status: "pending",
            investmentCommitted: Number(form.investmentCommitted) || 0,
            employmentCommitted: Number(form.employmentCommitted) || 0,
            cautionDeposit: Number(form.cautionDeposit) || 0,
            landCostSubsidy: Number(form.landCostSubsidy) || 0,
            notes: "",
        });
        activityDb.log(user.id, "Plot Added", `${newPlot.plotNumber} — ${newPlot.company}`, newPlot.id);
        setPlots(plotDb.getByUser(user.id));
        setShowAdd(false);
        setForm({ plotNumber: "", allotteeName: "", company: "", sector: "Industrial", area: "", location: "", allotmentDate: "", leaseStartDate: "", leaseEndDate: "", investmentCommitted: "", employmentCommitted: "", cautionDeposit: "", landCostSubsidy: "" });
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" style={{ color: "#1D1D1F", letterSpacing: "-0.02em" }}>
                            <Map className="w-6 h-6" style={{ color: "#007AFF" }} />
                            <span>Plot <span className="glow-text">Directory</span></span>
                        </h1>
                        <p className="text-sm mt-1" style={{ color: "#8A8A8E" }}>All allotted industrial plots and their compliance status.</p>
                    </div>
                    <motion.button onClick={() => setShowAdd(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl gradient-primary text-white text-sm font-semibold"
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                        <Plus className="w-4 h-4" /> Add Plot
                    </motion.button>
                </motion.div>

                {/* Search bar */}
                <div className="relative mb-5">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#AEAEB2" }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search plot, company, location..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm focus:outline-none transition-all"
                        style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.1)", color: "#1D1D1F" }}
                        onFocus={e => { e.target.style.borderColor = "rgba(0,122,255,0.55)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)"; }}
                        onBlur={e => { e.target.style.borderColor = "rgba(0,0,0,0.1)"; e.target.style.boxShadow = "none"; }} />
                </div>

                {/* 3-column layout: filters | list | detail */}
                <div className="flex gap-4 items-start">

                    {/* ── Vertical filter sidebar ── */}
                    <div className="flex-shrink-0 w-44 space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest px-3 pb-2" style={{ color: "#AEAEB2" }}>Filter by Status</p>
                        {FILTERS.map(f => {
                            const count = f.key === "all" ? plots.length : plots.filter(p => p.status === f.key).length;
                            const cfg = f.key !== "all" ? STATUS_CONFIG[f.key as PlotStatus] : null;
                            const isActive = filter === f.key;
                            return (
                                <motion.button key={f.key} onClick={() => setFilter(f.key)}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left"
                                    style={{
                                        background: isActive ? (cfg ? cfg.bg : "rgba(0,122,255,0.1)") : "transparent",
                                        color: isActive ? (cfg ? cfg.color : "#007AFF") : "#6E6E73",
                                        border: isActive ? `1px solid ${cfg ? cfg.color + "44" : "rgba(0,122,255,0.25)"}` : "1px solid transparent",
                                    }}
                                    whileTap={{ scale: 0.97 }}>
                                    {cfg && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color }} />}
                                    {!cfg && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#007AFF" }} />}
                                    <span className="flex-1 truncate">{f.label}</span>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                                        style={{
                                            background: isActive ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.06)",
                                            color: isActive ? "inherit" : "#AEAEB2",
                                        }}>
                                        {count}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* ── Plot list ── */}
                    <div className={`flex-1 space-y-3 min-w-0 transition-all duration-300 ${selected ? "max-w-[calc(50%-5.5rem)]" : ""}`}>
                        {visible.length === 0 && (
                            <div className="widget-card p-12 text-center">
                                <Map className="w-12 h-12 mx-auto mb-3" style={{ color: "#C7C7CC" }} />
                                <p className="font-semibold" style={{ color: "#1D1D1F" }}>No plots found</p>
                                <p className="text-sm mt-1" style={{ color: "#8A8A8E" }}>Try a different filter or add a new plot.</p>
                            </div>
                        )}
                        {visible.map((p, i) => {
                            const cfg = STATUS_CONFIG[p.status];
                            const comp = compliance[p.id];
                            const investPct = comp ? Math.round((comp.investmentActual / p.investmentCommitted) * 100) : 0;
                            return (
                                <motion.button key={p.id} onClick={() => setSelected(selected?.id === p.id ? null : p)}
                                    className={`w-full text-left widget-card p-4 group transition-all ${selected?.id === p.id ? "ring-2 ring-primary/40" : ""}`}
                                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06, type: "spring", damping: 20 }}
                                    whileHover={{ y: -2 }}>
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
                                            <cfg.icon className="w-5 h-5" style={{ color: cfg.color }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-sm" style={{ color: "#1D1D1F" }}>{p.plotNumber}</span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(0,122,255,0.08)", color: "#007AFF" }}>{p.sector}</span>
                                            </div>
                                            <p className="text-sm font-semibold mt-0.5 truncate" style={{ color: "#3C3C43" }}>{p.company}</p>
                                            <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "#8A8A8E" }}>
                                                <MapPin className="w-3 h-3" /> {p.location}
                                            </p>
                                            {/* Investment progress */}
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                                                    <motion.div className="h-full rounded-full"
                                                        style={{ background: investPct >= 80 ? "#34C759" : investPct >= 40 ? "#FF9F0A" : "#FF3B30" }}
                                                        initial={{ width: 0 }} animate={{ width: `${Math.min(investPct, 100)}%` }}
                                                        transition={{ delay: i * 0.06 + 0.3, duration: 0.6 }} />
                                                </div>
                                                <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: "#8A8A8E" }}>
                                                    {investPct}% invested
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${selected?.id === p.id ? "rotate-90 text-primary" : "group-hover:translate-x-0.5"}`} style={{ color: "#C7C7CC" }} />
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Detail panel */}
                    <AnimatePresence>
                        {selected && (
                            <motion.div className="w-1/2 flex-shrink-0"
                                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
                                transition={{ type: "spring", damping: 22, stiffness: 280 }}>
                                <div className="widget-card p-5 sticky top-16">
                                    {(() => {
                                        const cfg = STATUS_CONFIG[selected.status];
                                        const comp = compliance[selected.id];
                                        const investPct = comp ? Math.round((comp.investmentActual / selected.investmentCommitted) * 100) : 0;
                                        const empPct = comp ? Math.round((comp.employmentActual / selected.employmentCommitted) * 100) : 0;
                                        return (
                                            <>
                                                <div className="flex items-start gap-3 mb-5">
                                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
                                                        <cfg.icon className="w-6 h-6" style={{ color: cfg.color }} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-base" style={{ color: "#1D1D1F" }}>{selected.plotNumber}</p>
                                                        <p className="text-sm font-semibold" style={{ color: "#3C3C43" }}>{selected.company}</p>
                                                        <p className="text-xs mt-0.5" style={{ color: "#8A8A8E" }}>{selected.allotteeName}</p>
                                                    </div>
                                                    <button onClick={() => setSelected(null)} className="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-gray-100">
                                                        <X className="w-4 h-4" style={{ color: "#8A8A8E" }} />
                                                    </button>
                                                </div>

                                                <div className="space-y-4">
                                                    {[
                                                        { label: "Investment", pct: investPct, actual: `₹${comp?.investmentActual ?? 0}L`, target: `₹${selected.investmentCommitted}L` },
                                                        { label: "Employment", pct: empPct, actual: `${comp?.employmentActual ?? 0} jobs`, target: `${selected.employmentCommitted} jobs` },
                                                    ].map(m => (
                                                        <div key={m.label}>
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-xs font-semibold" style={{ color: "#6E6E73" }}>{m.label} Progress</span>
                                                                <span className="text-xs font-bold" style={{ color: m.pct >= 80 ? "#34C759" : m.pct >= 40 ? "#FF9F0A" : "#FF3B30" }}>{m.pct}%</span>
                                                            </div>
                                                            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                                                                <motion.div className="h-full rounded-full"
                                                                    style={{ background: m.pct >= 80 ? "#34C759" : m.pct >= 40 ? "#FF9F0A" : "#FF3B30" }}
                                                                    initial={{ width: 0 }} animate={{ width: `${Math.min(m.pct, 100)}%` }}
                                                                    transition={{ duration: 0.6, ease: "easeOut" }} />
                                                            </div>
                                                            <div className="flex justify-between mt-1">
                                                                <span className="text-[10px]" style={{ color: "#8A8A8E" }}>Actual: {m.actual}</span>
                                                                <span className="text-[10px]" style={{ color: "#8A8A8E" }}>Target: {m.target}</span>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    <div className="grid grid-cols-2 gap-2 pt-2">
                                                        {[
                                                            { label: "Area", value: `${selected.area.toLocaleString()} sqm`, icon: Building2 },
                                                            { label: "Sector", value: selected.sector, icon: Filter },
                                                            { label: "Caution Deposit", value: `₹${selected.cautionDeposit}L`, icon: IndianRupee },
                                                            { label: "Subsidy Eligible", value: `₹${selected.landCostSubsidy}L`, icon: TrendingUp },
                                                        ].map(item => (
                                                            <div key={item.label} className="p-2.5 rounded-xl" style={{ background: "rgba(0,0,0,0.03)" }}>
                                                                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#AEAEB2" }}>{item.label}</p>
                                                                <p className="text-sm font-bold mt-0.5" style={{ color: "#1D1D1F" }}>{item.value}</p>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Status badges */}
                                                    <div className="pt-2 space-y-2">
                                                        {comp && (
                                                            <>
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span style={{ color: "#6E6E73" }}>Caution Deposit</span>
                                                                    <span className="font-semibold capitalize" style={{ color: comp.cautionStatus === "refunded" ? "#34C759" : comp.cautionStatus === "refund_due" ? "#FF3B30" : "#FF9F0A" }}>
                                                                        {comp.cautionStatus.replace(/_/g, " ")}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span style={{ color: "#6E6E73" }}>Land Cost Subsidy</span>
                                                                    <span className="font-semibold capitalize" style={{ color: comp.subsidyStatus === "disbursed" ? "#34C759" : comp.subsidyStatus === "rejected" ? "#FF3B30" : "#FF9F0A" }}>
                                                                        {comp.subsidyStatus.replace(/_/g, " ")}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span style={{ color: "#6E6E73" }}>Production Started</span>
                                                                    <span className="font-semibold" style={{ color: comp.productionStarted ? "#34C759" : "#FF9F0A" }}>
                                                                        {comp.productionStarted ? `Yes (${comp.productionStartDate ?? ""})` : "No"}
                                                                    </span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>

                                                    {selected.notes && (
                                                        <p className="text-xs p-3 rounded-xl italic" style={{ background: "rgba(0,0,0,0.03)", color: "#6E6E73" }}>"{selected.notes}"</p>
                                                    )}
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Add Plot Modal */}
                <AnimatePresence>
                    {showAdd && (
                        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdd(false)}>
                            <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)" }} />
                            <motion.div className="relative w-full max-w-xl rounded-3xl overflow-hidden"
                                style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 32px 80px rgba(0,0,0,0.22)" }}
                                initial={{ y: 40, scale: 0.94 }} animate={{ y: 0, scale: 1 }} exit={{ y: 40, scale: 0.94 }}
                                transition={{ type: "spring", damping: 24, stiffness: 280 }} onClick={e => e.stopPropagation()}>
                                <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                                    <Plus className="w-5 h-5" style={{ color: "#007AFF" }} />
                                    <h2 className="text-base font-bold" style={{ color: "#1D1D1F" }}>Register New Plot</h2>
                                    <button onClick={() => setShowAdd(false)} className="ml-auto w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100">
                                        <X className="w-4 h-4" style={{ color: "#8A8A8E" }} />
                                    </button>
                                </div>
                                <div className="p-5 grid grid-cols-2 gap-3 overflow-y-auto max-h-[60vh]">
                                    {[
                                        { key: "plotNumber", label: "Plot Number", placeholder: "SIDCO/CHN/A-XX" },
                                        { key: "allotteeName", label: "Allottee Name", placeholder: "Full name" },
                                        { key: "company", label: "Company Name", placeholder: "Pvt Ltd / LLP" },
                                        { key: "location", label: "Location", placeholder: "Estate, District" },
                                        { key: "area", label: "Area (sqm)", placeholder: "e.g. 5000", type: "number" },
                                        { key: "investmentCommitted", label: "Investment (₹ Lakhs)", placeholder: "e.g. 500", type: "number" },
                                        { key: "employmentCommitted", label: "Employment Target", placeholder: "No. of employees", type: "number" },
                                        { key: "cautionDeposit", label: "Caution Deposit (₹L)", placeholder: "e.g. 10", type: "number" },
                                        { key: "landCostSubsidy", label: "Subsidy Eligible (₹L)", placeholder: "e.g. 50", type: "number" },
                                        { key: "allotmentDate", label: "Allotment Date", placeholder: "", type: "date" },
                                        { key: "leaseStartDate", label: "Lease Start", placeholder: "", type: "date" },
                                        { key: "leaseEndDate", label: "Lease End", placeholder: "", type: "date" },
                                    ].map(f => (
                                        <div key={f.key} className={f.key === "location" ? "col-span-2" : ""}>
                                            <label className="text-[10px] font-semibold uppercase tracking-widest block mb-1" style={{ color: "#6E6E73" }}>{f.label}</label>
                                            <input type={f.type ?? "text"} value={(form as any)[f.key]} placeholder={f.placeholder}
                                                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
                                                style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.1)", color: "#1D1D1F" }}
                                                onFocus={e => { e.target.style.borderColor = "rgba(0,122,255,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)"; }}
                                                onBlur={e => { e.target.style.borderColor = "rgba(0,0,0,0.1)"; e.target.style.boxShadow = "none"; }} />
                                        </div>
                                    ))}
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-semibold uppercase tracking-widest block mb-1" style={{ color: "#6E6E73" }}>Sector</label>
                                        <select value={form.sector} onChange={e => setForm(prev => ({ ...prev, sector: e.target.value as SectorType }))}
                                            className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
                                            style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.1)", color: "#1D1D1F" }}>
                                            {["Industrial", "MSME", "IT/ITES", "Agro-based", "Textile", "Chemical", "Auto Component"].map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="p-5 border-t border-gray-100 flex gap-3">
                                    <button onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-colors"
                                        style={{ background: "rgba(0,0,0,0.04)", color: "#6E6E73" }}>Cancel</button>
                                    <motion.button onClick={handleAdd} className="flex-1 py-3 rounded-2xl gradient-primary text-white text-sm font-semibold"
                                        whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.97 }}>Register Plot</motion.button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
}
