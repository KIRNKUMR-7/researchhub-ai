import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Map, Search, Filter, CheckCircle2, AlertTriangle, Clock, XCircle,
    Building2, MapPin, TrendingUp, IndianRupee, ExternalLink,
    ChevronRight, Plus, X, Users, BarChart3, Award, History, ArrowRight, Layers
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../contexts/AuthContext";
import { plotDb, complianceDb, activityDb, seedDemoData, type Plot, type PlotStatus, type SectorType } from "../lib/db";

// ── Previous owner type ────────────────────────────────────────
interface PreviousOwner {
    name: string;
    company: string;
    sector: string;
    period: string;
    investmentPct: number;
    vacatedReason: string;
    outcome: "transferred" | "cancelled" | "surrendered";
}

// ── Demo ownership history keyed by plot number ───────────────
const OWNERSHIP_HISTORY: Record<string, PreviousOwner[]> = {
    "SIDCO/CHN/A-14": [
        { name: "K. Sundaram", company: "Sundaram Engineering Works", sector: "Industrial", period: "2012–2018", investmentPct: 30, vacatedReason: "Company wound up due to financial losses. Plot de-allotted after 3 show-cause notices.", outcome: "cancelled" },
        { name: "Meenakshi Tools Ltd", company: "Meenakshi Tools Pvt Ltd", sector: "Auto Component", period: "2018–2020", investmentPct: 62, vacatedReason: "Premises surrendered voluntarily; business relocated to SEZ for export incentives.", outcome: "surrendered" },
    ],
    "TIDCO/CBE/B-07": [
        { name: "Karpagam Weaves", company: "Karpagam Handloom Co.", sector: "Textile", period: "2009–2017", investmentPct: 48, vacatedReason: "Lease expired. Renewal rejected due to non-payment of caution deposit arrears.", outcome: "cancelled" },
    ],
    "SIPCOT/MDU/C-22": [
        { name: "BioGrow Farms", company: "BioGrow Agri Industries", sector: "Agro-based", period: "2011–2016", investmentPct: 22, vacatedReason: "Construction never commenced. Plot cancelled after 2-year notice period.", outcome: "cancelled" },
        { name: "Agritech Park Ltd", company: "Agritech Park Ltd", sector: "Agro-based", period: "2016–2019", investmentPct: 15, vacatedReason: "Allottee failed to begin operations. Show-cause issued; plot transferred to current operator.", outcome: "transferred" },
    ],
    "SIDCO/TRY/D-03": [
        { name: "Tri-Tech Infosoft", company: "Tri-Tech Infosoft", sector: "IT/ITES", period: "2015–2021", investmentPct: 55, vacatedReason: "Company merged with parent group; operations moved to Chennai headquarters.", outcome: "surrendered" },
    ],
    "TIDCO/VEL/E-11": [
        { name: "Chem Masters India", company: "Chem Masters India Pvt Ltd", sector: "Chemical", period: "2014–2020", investmentPct: 40, vacatedReason: "Pollution NOC permanently revoked by TNPCB. Plot re-allotted after remediation.", outcome: "cancelled" },
    ],
};

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

const SECTORS = ["Auto Component", "Textile", "Chemical", "IT/ITES", "Agro-based", "Industrial", "MSME"];

// ── Animated count-up hook ────────────────────────────────────
function useCountUp(target: number, duration = 900) {
    const [val, setVal] = useState(0);
    const raf = useRef<number>(0);
    useEffect(() => {
        const start = performance.now();
        const tick = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            setVal(Math.round(p * target));
            if (p < 1) raf.current = requestAnimationFrame(tick);
        };
        raf.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf.current);
    }, [target, duration]);
    return val;
}

// ── Journey step component ─────────────────────────────────────
function JourneyStep({ label, date, done, active }: { label: string; date?: string; done: boolean; active: boolean }) {
    const color = done ? "#34C759" : active ? "#FF9F0A" : "#C7C7CC";
    const bg = done ? "rgba(52,199,89,0.12)" : active ? "rgba(255,159,10,0.12)" : "rgba(0,0,0,0.05)";
    return (
        <div className="journey-step">
            <div className="journey-step-dot" style={{ background: bg, color }}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : active ? <Clock className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-current opacity-40" />}
            </div>
            <p className="text-[10px] font-bold text-center" style={{ color: done || active ? "#1D1D1F" : "#C7C7CC" }}>{label}</p>
            {date && <p className="text-[9px]" style={{ color: "#AEAEB2" }}>{date}</p>}
        </div>
    );
}

// ── Ownership History Timeline ─────────────────────────────────
function OwnershipTimeline({ plotNumber, allotteeName, company, allotmentDate }: { plotNumber: string; allotteeName: string; company: string; allotmentDate: string }) {
    const history = OWNERSHIP_HISTORY[plotNumber] ?? [];
    const outcomeColors: Record<string, { color: string; label: string }> = {
        cancelled: { color: "#FF3B30", label: "De-allotted" },
        surrendered: { color: "#FF9F0A", label: "Surrendered" },
        transferred: { color: "#007AFF", label: "Transferred" },
    };
    return (
        <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: "#AEAEB2" }}>
                <History className="w-3 h-3" /> Ownership History
            </p>
            {history.length === 0 ? (
                <p className="text-xs italic" style={{ color: "#AEAEB2" }}>First allottee for this plot.</p>
            ) : (
                <div className="relative pl-8 space-y-4">
                    <div className="timeline-line" />
                    {history.map((owner, i) => {
                        const oc = outcomeColors[owner.outcome];
                        return (
                            <div key={i} className="relative">
                                <div className="timeline-dot absolute -left-8" style={{ background: "rgba(181,255,77,0.12)", color: "#B5FF4D" }}>
                                    <Users className="w-3 h-3" />
                                </div>
                                <div className="p-3 rounded-xl" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <div>
                                            <p className="text-xs font-bold" style={{ color: "#1D1D1F" }}>{owner.company}</p>
                                            <p className="text-[10px]" style={{ color: "#8A8A8E" }}>{owner.name} · {owner.period}</p>
                                        </div>
                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: `${oc.color}15`, color: oc.color }}>{oc.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.07)" }}>
                                            <div className="h-full rounded-full" style={{ width: `${owner.investmentPct}%`, background: owner.investmentPct >= 60 ? "#34C759" : owner.investmentPct >= 30 ? "#FF9F0A" : "#FF3B30" }} />
                                        </div>
                                        <span className="text-[10px] font-semibold" style={{ color: "#8A8A8E" }}>{owner.investmentPct}% invested</span>
                                    </div>
                                    <p className="text-[10px] italic leading-relaxed" style={{ color: "#6E6E73" }}>"{owner.vacatedReason}"</p>
                                </div>
                            </div>
                        );
                    })}
                    {/* Current owner */}
                    <div className="relative">
                        <div className="timeline-dot absolute -left-8" style={{ background: "rgba(181,255,77,0.2)", color: "#B5FF4D" }}>
                            <Award className="w-3 h-3" />
                        </div>
                        <div className="p-3 rounded-xl" style={{ background: "rgba(181,255,77,0.08)", border: "1px solid rgba(181,255,77,0.2)" }}>
                            <div className="flex items-center justify-between mb-0.5">
                                <p className="text-xs font-bold" style={{ color: "#1B3C2A" }}>{company}</p>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(52,199,89,0.15)", color: "#1B3C2A" }}>Current</span>
                            </div>
                            <p className="text-[10px]" style={{ color: "#4A9C6D" }}>{allotteeName} · {allotmentDate} – present</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────
export default function PlotDirectory() {
    const { user } = useAuth();
    const [plots, setPlots] = useState<Plot[]>([]);
    const [filter, setFilter] = useState<PlotStatus | "all">("all");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Plot | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [sortBy, setSortBy] = useState<"default" | "investment" | "lease" | "status">("default");
    const [compliance, setCompliance] = useState<Record<string, ReturnType<typeof complianceDb.getByPlot>>>({});
    const [chartVisible, setChartVisible] = useState(false);

    const [form, setForm] = useState({
        plotNumber: "", allotteeName: "", company: "", sector: "Industrial" as SectorType,
        area: "", location: "", allotmentDate: "", leaseStartDate: "", leaseEndDate: "",
        investmentCommitted: "", employmentCommitted: "", cautionDeposit: "", landCostSubsidy: ""
    });

    useEffect(() => {
        if (!user) return;
        seedDemoData(user.id).then(() => {
            const p = plotDb.getByUser(user.id);
            setPlots(p);
            const c: Record<string, ReturnType<typeof complianceDb.getByPlot>> = {};
            p.forEach(pl => { c[pl.id] = complianceDb.getByPlot(pl.id); });
            setCompliance(c);
            setTimeout(() => setChartVisible(true), 400);
        });
    }, [user?.id]);

    // ── Stats ─────────────────────────────────────────────────
    const total = plots.length;
    const compliantCount = plots.filter(p => p.status === "compliant").length;
    const pendingCount = plots.filter(p => p.status === "pending").length;
    const defaultingCount = plots.filter(p => p.status === "defaulting").length;
    const totalInvestment = plots.reduce((s, p) => s + p.investmentCommitted, 0);
    const totalEmployment = plots.reduce((s, p) => s + p.employmentCommitted, 0);
    const complianceRate = total > 0 ? Math.round((compliantCount / total) * 100) : 0;

    const totalAnim = useCountUp(total);
    const rateAnim = useCountUp(complianceRate);
    const invAnim = useCountUp(Math.round(totalInvestment / 100)); // crores
    const empAnim = useCountUp(totalEmployment);

    const heroStats = [
        { label: "Total Plots", value: `${totalAnim}`, sub: "Active allotments", icon: Map, accent: "#B5FF4D" },
        { label: "Compliance Rate", value: `${rateAnim}%`, sub: "Meeting all terms", icon: CheckCircle2, accent: "#4ADE80" },
        { label: "Investment (₹ Cr)", value: `${invAnim}`, sub: "Total committed", icon: IndianRupee, accent: "#B5FF4D" },
        { label: "Employment Target", value: `${empAnim}`, sub: "Jobs committed", icon: Users, accent: "#4ADE80" },
    ];

    // ── Sector distribution ───────────────────────────────────
    const sectorCounts = SECTORS.map(s => ({ sector: s, count: plots.filter(p => p.sector === s).length }))
        .filter(s => s.count > 0)
        .sort((a, b) => b.count - a.count);
    const maxSectorCount = Math.max(1, ...sectorCounts.map(s => s.count));

    // ── Filtered & sorted list ────────────────────────────────
    const visible = plots
        .filter(p => {
            const matchStatus = filter === "all" || p.status === filter;
            const matchSearch = !search || [p.plotNumber, p.company, p.allotteeName, p.location, p.sector].join(" ").toLowerCase().includes(search.toLowerCase());
            return matchStatus && matchSearch;
        })
        .sort((a, b) => {
            if (sortBy === "investment") {
                const pctA = (compliance[a.id]?.investmentActual ?? 0) / a.investmentCommitted;
                const pctB = (compliance[b.id]?.investmentActual ?? 0) / b.investmentCommitted;
                return pctB - pctA;
            }
            if (sortBy === "lease") return new Date(a.leaseEndDate).getTime() - new Date(b.leaseEndDate).getTime();
            if (sortBy === "status") return a.status.localeCompare(b.status);
            return 0;
        });

    const handleAdd = async () => {
        if (!user || !form.plotNumber || !form.company) return;
        const newPlot = await plotDb.save({
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
        const updated = plotDb.getByUser(user.id);
        setPlots(updated);
        setShowAdd(false);
        setForm({ plotNumber: "", allotteeName: "", company: "", sector: "Industrial", area: "", location: "", allotmentDate: "", leaseStartDate: "", leaseEndDate: "", investmentCommitted: "", employmentCommitted: "", cautionDeposit: "", landCostSubsidy: "" });
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">

                {/* ── PAGE HEADER ─────────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" style={{ color: "#1D1D1F", letterSpacing: "-0.02em" }}>
                            <Map className="w-6 h-6" style={{ color: "#1B3C2A" }} />
                            <span>Plot <span className="glow-text">Directory</span></span>
                        </h1>
                        <p className="text-sm mt-1" style={{ color: "#8A8A8E" }}>The numbers that define our portfolio</p>
                    </div>
                    <motion.button onClick={() => setShowAdd(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl gradient-primary text-white text-sm font-semibold"
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                        <Plus className="w-4 h-4" /> Add Plot
                    </motion.button>
                </motion.div>

                {/* ── HERO STAT CARDS ──────────────────────────────────────── */}
                <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    {heroStats.map((s, i) => (
                        <motion.div key={s.label} className="datagrid-stat-card p-6"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.12 + i * 0.07 }}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.accent}18` }}>
                                    <s.icon className="w-5 h-5" style={{ color: s.accent }} />
                                </div>
                                <ArrowRight className="w-4 h-4 opacity-20" style={{ color: s.accent }} />
                            </div>
                            <p className="text-3xl font-black stat-number mb-1" style={{ color: "#F5F7F2" }}>{s.value}</p>
                            <p className="text-xs font-bold" style={{ color: s.accent }}>{s.label}</p>
                            <p className="text-[10px] mt-0.5" style={{ color: "rgba(245,247,242,0.4)" }}>{s.sub}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* ── SECTOR DISTRIBUTION ──────────────────────────────────── */}
                <motion.div className="widget-card p-6 mb-8"
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                    <div className="flex items-center gap-2 mb-5">
                        <BarChart3 className="w-4 h-4" style={{ color: "#1B3C2A" }} />
                        <h2 className="text-sm font-bold" style={{ color: "#1D1D1F" }}>Sector Distribution</h2>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto" style={{ background: "rgba(27,60,42,0.08)", color: "#1B3C2A" }}>
                            {sectorCounts.length} sectors
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {sectorCounts.map((s, i) => (
                            <div key={s.sector} className="flex items-center gap-3">
                                <p className="text-xs font-semibold w-28 flex-shrink-0 truncate" style={{ color: "#6E6E73" }}>{s.sector}</p>
                                <div className="flex-1 sector-bar-track">
                                    <motion.div className="sector-bar-fill"
                                        style={{ background: i % 2 === 0 ? "#B5FF4D" : "#1B3C2A" }}
                                        initial={{ width: 0 }}
                                        animate={{ width: chartVisible ? `${(s.count / maxSectorCount) * 100}%` : 0 }}
                                        transition={{ delay: 0.1 + i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                    />
                                </div>
                                <span className="text-xs font-black w-5 text-right" style={{ color: "#1D1D1F" }}>{s.count}</span>
                            </div>
                        ))}
                        {sectorCounts.length === 0 && <p className="text-xs col-span-2" style={{ color: "#AEAEB2" }}>No plots yet.</p>}
                    </div>
                </motion.div>

                {/* ── SEARCH + SORT ─────────────────────────────────────────── */}
                <div className="flex gap-3 mb-5">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#AEAEB2" }} />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search plot, company, location..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm focus:outline-none transition-all"
                            style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.1)", color: "#1D1D1F" }}
                            onFocus={e => { e.target.style.borderColor = "rgba(27,60,42,0.55)"; e.target.style.boxShadow = "0 0 0 3px rgba(181,255,77,0.15)"; }}
                            onBlur={e => { e.target.style.borderColor = "rgba(0,0,0,0.1)"; e.target.style.boxShadow = "none"; }} />
                    </div>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
                        className="px-3 py-2.5 rounded-2xl text-sm font-semibold focus:outline-none"
                        style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.1)", color: "#6E6E73" }}>
                        <option value="default">Sort: Default</option>
                        <option value="investment">Investment %</option>
                        <option value="lease">Lease End</option>
                        <option value="status">Status</option>
                    </select>
                </div>

                {/* ── 3-COLUMN LAYOUT ──────────────────────────────────────── */}
                <div className="flex gap-4 items-start">

                    {/* Filter sidebar */}
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
                                        background: isActive ? (cfg ? cfg.bg : "rgba(27,60,42,0.1)") : "transparent",
                                        color: isActive ? (cfg ? cfg.color : "#1B3C2A") : "#6E6E73",
                                        border: isActive ? `1px solid ${cfg ? cfg.color + "44" : "rgba(27,60,42,0.25)"}` : "1px solid transparent",
                                    }}
                                    whileTap={{ scale: 0.97 }}>
                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg ? cfg.color : "#1B3C2A" }} />
                                    <span className="flex-1 truncate">{f.label}</span>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                                        style={{ background: isActive ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.06)", color: isActive ? "inherit" : "#AEAEB2" }}>
                                        {count}
                                    </span>
                                </motion.button>
                            );
                        })}

                        {/* Mini compliance gauge */}
                        <div className="mt-4 p-3 rounded-2xl" style={{ background: "#1B3C2A" }}>
                            <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(181,255,77,0.6)" }}>Compliance Rate</p>
                            <p className="text-2xl font-black stat-number" style={{ color: "#B5FF4D" }}>{complianceRate}%</p>
                            <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                                <motion.div className="h-full rounded-full" style={{ background: "#B5FF4D" }}
                                    initial={{ width: 0 }} animate={{ width: `${complianceRate}%` }}
                                    transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
                            </div>
                        </div>
                    </div>

                    {/* Plot list */}
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
                            const historyCount = (OWNERSHIP_HISTORY[p.plotNumber] ?? []).length;
                            return (
                                <motion.button key={p.id} onClick={() => setSelected(selected?.id === p.id ? null : p)}
                                    className={`w-full text-left widget-card p-4 group transition-all ${selected?.id === p.id ? "ring-2" : ""}`}
                                    style={{ ringColor: "#B5FF4D" }}
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
                                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(27,60,42,0.08)", color: "#1B3C2A" }}>{p.sector}</span>
                                                {historyCount > 0 && (
                                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: "rgba(181,255,77,0.12)", color: "#1B3C2A" }}>
                                                        <History className="w-2.5 h-2.5" /> {historyCount} prev
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm font-semibold mt-0.5 truncate" style={{ color: "#3C3C43" }}>{p.company}</p>
                                            <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "#8A8A8E" }}>
                                                <MapPin className="w-3 h-3" /> {p.location}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                                                    <motion.div className="h-full rounded-full"
                                                        style={{ background: investPct >= 80 ? "#34C759" : investPct >= 40 ? "#FF9F0A" : "#FF3B30" }}
                                                        initial={{ width: 0 }} animate={{ width: `${Math.min(investPct, 100)}%` }}
                                                        transition={{ delay: i * 0.06 + 0.3, duration: 0.6 }} />
                                                </div>
                                                <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: "#8A8A8E" }}>{investPct}% invested</span>
                                            </div>
                                        </div>
                                        <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${selected?.id === p.id ? "rotate-90" : "group-hover:translate-x-0.5"}`} style={{ color: "#C7C7CC" }} />
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* ── DETAIL PANEL ──────────────────────────────────────── */}
                    <AnimatePresence>
                        {selected && (() => {
                            const cfg = STATUS_CONFIG[selected.status];
                            const comp = compliance[selected.id];
                            const investPct = comp ? Math.round((comp.investmentActual / selected.investmentCommitted) * 100) : 0;
                            const empPct = comp ? Math.round((comp.employmentActual / selected.employmentCommitted) * 100) : 0;

                            // Journey steps
                            const allotted = !!selected.allotmentDate;
                            const constructed = comp?.constructionCompleted ?? false;
                            const constructionStarted = comp?.constructionStarted ?? false;
                            const production = comp?.productionStarted ?? false;
                            const fullyCompliant = selected.status === "compliant";

                            // Mini bar chart — quarterly investment mock
                            const quarters = ["Q1", "Q2", "Q3", "Q4"];
                            const qBars = [0.15, 0.35, 0.6, investPct / 100].map(v => Math.min(v, 1));

                            return (
                                <motion.div className="w-1/2 flex-shrink-0"
                                    initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
                                    transition={{ type: "spring", damping: 22, stiffness: 280 }}>
                                    <div className="widget-card p-5 sticky top-16 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-thin space-y-5">

                                        {/* Header */}
                                        <div className="flex items-start gap-3">
                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
                                                <cfg.icon className="w-6 h-6" style={{ color: cfg.color }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-base" style={{ color: "#1D1D1F" }}>{selected.plotNumber}</p>
                                                <p className="text-sm font-semibold" style={{ color: "#3C3C43" }}>{selected.company}</p>
                                                <p className="text-xs mt-0.5" style={{ color: "#8A8A8E" }}>{selected.allotteeName} · {selected.sector}</p>
                                            </div>
                                            <button onClick={() => setSelected(null)} className="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-gray-100">
                                                <X className="w-4 h-4" style={{ color: "#8A8A8E" }} />
                                            </button>
                                        </div>

                                        {/* Plot Journey */}
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: "#AEAEB2" }}>
                                                <Layers className="w-3 h-3" /> Plot Journey
                                            </p>
                                            <div className="flex items-start gap-0 p-3 rounded-2xl" style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)" }}>
                                                <JourneyStep label="Allotted" date={selected.allotmentDate} done={allotted} active={false} />
                                                <JourneyStep label="Construction" date={constructionStarted ? "Started" : undefined} done={constructed} active={constructionStarted && !constructed} />
                                                <JourneyStep label="Production" date={comp?.productionStartDate} done={production} active={constructed && !production} />
                                                <JourneyStep label="Compliant" done={fullyCompliant} active={production && !fullyCompliant} />
                                            </div>
                                        </div>

                                        {/* Investment Trend Chart */}
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: "#AEAEB2" }}>
                                                <TrendingUp className="w-3 h-3" /> Investment Progress (Quarterly)
                                            </p>
                                            <div className="p-3 rounded-2xl flex items-end gap-2 h-20" style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.05)" }}>
                                                {qBars.map((v, i) => (
                                                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                                        <motion.div className="w-full rounded-t-lg"
                                                            style={{ background: i === 3 ? (investPct >= 80 ? "#34C759" : investPct >= 40 ? "#FF9F0A" : "#FF3B30") : "#1B3C2A", opacity: 0.7 + i * 0.1 }}
                                                            initial={{ height: 0 }} animate={{ height: `${v * 48}px` }}
                                                            transition={{ delay: 0.2 + i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} />
                                                        <span className="text-[9px] font-semibold" style={{ color: "#AEAEB2" }}>{quarters[i]}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Progress metrics */}
                                        <div className="space-y-3">
                                            {[
                                                { label: "Investment", pct: investPct, actual: `₹${comp?.investmentActual ?? 0}L`, target: `₹${selected.investmentCommitted}L` },
                                                { label: "Employment", pct: empPct, actual: `${comp?.employmentActual ?? 0} jobs`, target: `${selected.employmentCommitted} jobs` },
                                            ].map(m => (
                                                <div key={m.label}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-semibold" style={{ color: "#6E6E73" }}>{m.label} Progress</span>
                                                        <span className="text-xs font-bold" style={{ color: m.pct >= 80 ? "#34C759" : m.pct >= 40 ? "#FF9F0A" : "#FF3B30" }}>{m.pct}%</span>
                                                    </div>
                                                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                                                        <motion.div className="h-full rounded-full"
                                                            style={{ background: m.pct >= 80 ? "#34C759" : m.pct >= 40 ? "#FF9F0A" : "#FF3B30" }}
                                                            initial={{ width: 0 }} animate={{ width: `${Math.min(m.pct, 100)}%` }}
                                                            transition={{ duration: 0.6, ease: "easeOut" }} />
                                                    </div>
                                                    <div className="flex justify-between mt-0.5">
                                                        <span className="text-[10px]" style={{ color: "#8A8A8E" }}>Actual: {m.actual}</span>
                                                        <span className="text-[10px]" style={{ color: "#8A8A8E" }}>Target: {m.target}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Quick info grid */}
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { label: "Area", value: `${selected.area.toLocaleString()} sqm`, icon: Building2 },
                                                { label: "Caution Deposit", value: `₹${selected.cautionDeposit}L`, icon: IndianRupee },
                                                { label: "Subsidy Eligible", value: `₹${selected.landCostSubsidy}L`, icon: TrendingUp },
                                                { label: "Lease End", value: selected.leaseEndDate, icon: ExternalLink },
                                            ].map(item => (
                                                <div key={item.label} className="p-2.5 rounded-xl" style={{ background: "rgba(0,0,0,0.03)" }}>
                                                    <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#AEAEB2" }}>{item.label}</p>
                                                    <p className="text-sm font-bold mt-0.5" style={{ color: "#1D1D1F" }}>{item.value}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Compliance status badges */}
                                        {comp && (
                                            <div className="space-y-1.5 p-3 rounded-2xl" style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.05)" }}>
                                                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#AEAEB2" }}>Compliance Status</p>
                                                {[
                                                    { label: "Caution Deposit", val: comp.cautionStatus.replace(/_/g, " "), ok: comp.cautionStatus === "refunded" },
                                                    { label: "Land Cost Subsidy", val: comp.subsidyStatus.replace(/_/g, " "), ok: comp.subsidyStatus === "disbursed" },
                                                    { label: "Production Started", val: comp.productionStarted ? `Yes (${comp.productionStartDate ?? ""})` : "No", ok: comp.productionStarted },
                                                ].map(row => (
                                                    <div key={row.label} className="flex items-center justify-between text-xs">
                                                        <span style={{ color: "#6E6E73" }}>{row.label}</span>
                                                        <span className="font-semibold capitalize" style={{ color: row.ok ? "#34C759" : "#FF9F0A" }}>{row.val}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Notes */}
                                        {selected.notes && (
                                            <p className="text-xs p-3 rounded-xl italic" style={{ background: "rgba(0,0,0,0.03)", color: "#6E6E73" }}>"{selected.notes}"</p>
                                        )}

                                        {/* Ownership history */}
                                        <div className="pt-1 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                                            <OwnershipTimeline
                                                plotNumber={selected.plotNumber}
                                                allotteeName={selected.allotteeName}
                                                company={selected.company}
                                                allotmentDate={selected.allotmentDate}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })()}
                    </AnimatePresence>
                </div>

                {/* ── ADD PLOT MODAL ──────────────────────────────────────── */}
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
                                    <Plus className="w-5 h-5" style={{ color: "#1B3C2A" }} />
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
                                            <input type={f.type ?? "text"} value={(form as Record<string, string>)[f.key]} placeholder={f.placeholder}
                                                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
                                                style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.1)", color: "#1D1D1F" }}
                                                onFocus={e => { e.target.style.borderColor = "rgba(27,60,42,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(181,255,77,0.15)"; }}
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
                                    <button onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-2xl text-sm font-semibold"
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
