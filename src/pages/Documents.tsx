import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FileText, Upload, Trash2, X, Search, Calendar, CheckCircle2,
    AlertTriangle, Clock, ChevronRight, Shield, Stamp, Flame,
    TrendingUp, Users, Building2, FileCheck, Receipt, File, FolderOpen
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../contexts/AuthContext";
import { documentDb, plotDb, activityDb, seedDemoData, type PlotDocument, type DocumentType } from "../lib/db";

// ── Document type metadata ─────────────────────────────────────
const DOC_META: Record<DocumentType, { label: string; color: string; bg: string; icon: React.ElementType; desc: string }> = {
    allotment_order: { label: "Allotment Order", color: "#007AFF", bg: "rgba(0,122,255,0.1)", icon: Stamp, desc: "Official plot allotment letters issued by the authority" },
    lease_deed: { label: "Lease Deed", color: "#5E5CE6", bg: "rgba(94,92,230,0.1)", icon: FileCheck, desc: "Registered lease agreements for plot possession" },
    noc_pollution: { label: "NOC — Pollution Control", color: "#34C759", bg: "rgba(52,199,89,0.1)", icon: Shield, desc: "No-objection certificates from Pollution Control Board" },
    noc_fire: { label: "NOC — Fire & Safety", color: "#FF9F0A", bg: "rgba(255,159,10,0.1)", icon: Flame, desc: "Fire safety clearances and certificates" },
    investment_certificate: { label: "Investment Certificate", color: "#007AFF", bg: "rgba(0,122,255,0.08)", icon: TrendingUp, desc: "Certificates confirming investment milestones achieved" },
    employment_certificate: { label: "Employment Certificate", color: "#5E5CE6", bg: "rgba(94,92,230,0.08)", icon: Users, desc: "Records of employment generated at the allotted plot" },
    completion_certificate: { label: "Completion Certificate", color: "#34C759", bg: "rgba(52,199,89,0.08)", icon: Building2, desc: "Certificates confirming construction completion" },
    subsidy_application: { label: "Subsidy Application", color: "#FF9F0A", bg: "rgba(255,159,10,0.08)", icon: FileText, desc: "Applications filed for land cost subsidy" },
    subsidy_sanction: { label: "Subsidy Sanction", color: "#34C759", bg: "rgba(52,199,89,0.1)", icon: FileText, desc: "Sanctioned and approved subsidy orders" },
    inspection_report: { label: "Inspection Report", color: "#FF3B30", bg: "rgba(255,59,48,0.08)", icon: FileCheck, desc: "Field inspection reports from monitoring officers" },
    caution_receipt: { label: "Caution Deposit Receipt", color: "#007AFF", bg: "rgba(0,122,255,0.08)", icon: Receipt, desc: "Receipts for caution deposit paid by allottees" },
    other: { label: "Other Documents", color: "#8A8A8E", bg: "rgba(138,138,142,0.1)", icon: File, desc: "Miscellaneous compliance-related documents" },
};

const ALL_TYPES = Object.keys(DOC_META) as DocumentType[];

// ── Status helpers ─────────────────────────────────────────────
function getDocStatus(doc: PlotDocument): "valid" | "expiring" | "expired" {
    if (doc.status === "expired") return "expired";
    if (doc.expiryDate) {
        const daysLeft = (new Date(doc.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (daysLeft < 0) return "expired";
        if (daysLeft < 30) return "expiring";
    }
    return "valid";
}

const STATUS_LABEL = { valid: "Valid", expiring: "Expiring Soon", expired: "Expired" };
const STATUS_COLOR = { valid: "#34C759", expiring: "#FF9F0A", expired: "#FF3B30" };
const STATUS_BG = { valid: "rgba(52,199,89,0.1)", expiring: "rgba(255,159,10,0.1)", expired: "rgba(255,59,48,0.1)" };
const STATUS_ICON = { valid: CheckCircle2, expiring: Clock, expired: AlertTriangle };

export default function Documents() {
    const { user } = useAuth();
    const [docs, setDocs] = useState<PlotDocument[]>([]);
    const [plots, setPlots] = useState<ReturnType<typeof plotDb.getByUser>>([]);
    const [search, setSearch] = useState("");
    const [activeType, setActiveType] = useState<DocumentType | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({
        plotId: "", type: "allotment_order" as DocumentType,
        title: "", description: "", fileDate: "", expiryDate: ""
    });

    useEffect(() => {
        if (!user) return;
        seedDemoData(user.id);
        setDocs(documentDb.getByUser(user.id));
        setPlots(plotDb.getByUser(user.id));
    }, [user?.id]);

    const handleAdd = () => {
        if (!user || !form.plotId || !form.title) return;
        documentDb.save({ ...form, userId: user.id, status: "valid" });
        activityDb.log(user.id, "Document Added", `${DOC_META[form.type].label} — ${form.title}`, form.plotId);
        setDocs(documentDb.getByUser(user.id));
        setShowAdd(false);
        setForm({ plotId: "", type: "allotment_order", title: "", description: "", fileDate: "", expiryDate: "" });
    };

    const handleDelete = (id: string) => {
        documentDb.delete(id);
        setDocs(documentDb.getByUser(user!.id));
        if (activeType) {
            const remaining = docs.filter(d => d.id !== id && d.type === activeType);
            if (remaining.length === 0) setActiveType(null);
        }
    };

    // Docs for the currently active type
    const sheetDocs = activeType ? docs.filter(d => d.type === activeType) : [];

    // Filtered types for search
    const filteredTypes = ALL_TYPES.filter(t => {
        if (!search) return true;
        return DOC_META[t].label.toLowerCase().includes(search.toLowerCase());
    });

    // Counts per type
    const countByType = (type: DocumentType) => docs.filter(d => d.type === type).length;
    const hasIssues = (type: DocumentType) => docs.filter(d => d.type === type).some(d => getDocStatus(d) !== "valid");

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" style={{ color: "#1D1D1F", letterSpacing: "-0.02em" }}>
                            <FolderOpen className="w-6 h-6" style={{ color: "#FF9F0A" }} />
                            <span>Document <span className="glow-text">Library</span></span>
                        </h1>
                        <p className="text-sm mt-1" style={{ color: "#8A8A8E" }}>
                            {docs.length} total documents across {plots.length} plots · Click a category to view all records
                        </p>
                    </div>
                    <motion.button onClick={() => setShowAdd(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl gradient-primary text-white text-sm font-semibold"
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                        <Upload className="w-4 h-4" /> Add Document
                    </motion.button>
                </motion.div>

                {/* Search bar */}
                <div className="relative mb-6 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#AEAEB2" }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search document categories..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm focus:outline-none transition-all"
                        style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.1)", color: "#1D1D1F" }}
                        onFocus={e => { e.target.style.borderColor = "rgba(0,122,255,0.55)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)"; }}
                        onBlur={e => { e.target.style.borderColor = "rgba(0,0,0,0.1)"; e.target.style.boxShadow = "none"; }} />
                </div>

                {/* Category grid */}
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredTypes.map((type, i) => {
                        const meta = DOC_META[type];
                        const count = countByType(type);
                        const issue = hasIssues(type);
                        const isActive = activeType === type;

                        return (
                            <motion.button key={type} onClick={() => setActiveType(isActive ? null : type)}
                                className="text-left"
                                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04, type: "spring", damping: 22, stiffness: 260 }}>
                                <div className={`widget-card p-5 h-full group transition-all duration-200 ${isActive ? "ring-2 ring-primary/30" : ""}`}
                                    style={isActive ? { background: "rgba(0,122,255,0.03)" } : {}}>
                                    <div className="flex items-start gap-3">
                                        {/* Icon */}
                                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                                            style={{ background: meta.bg }}>
                                            <meta.icon className="w-5 h-5" style={{ color: meta.color }} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold" style={{ color: "#1D1D1F" }}>{meta.label}</p>
                                                {issue && <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#FF9F0A" }} />}
                                            </div>
                                            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#8A8A8E" }}>{meta.desc}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                                                style={{ background: count > 0 ? meta.bg : "rgba(0,0,0,0.05)", color: count > 0 ? meta.color : "#AEAEB2" }}>
                                                {count}
                                            </div>
                                            <span className="text-xs" style={{ color: "#8A8A8E" }}>{count === 1 ? "record" : "records"}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: isActive ? "#007AFF" : "#AEAEB2" }}>
                                            {count > 0 ? (isActive ? "Hide" : "View all") : "Add first"}
                                            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? "rotate-90" : "group-hover:translate-x-0.5"}`} />
                                        </div>
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* ── Document Detail Sheet (right sliding panel) ── */}
            <AnimatePresence>
                {activeType && (
                    <>
                        {/* Backdrop */}
                        <motion.div className="fixed inset-0 z-40"
                            style={{ background: "rgba(0,0,0,0.18)", backdropFilter: "blur(4px)" }}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setActiveType(null)} />

                        {/* Panel */}
                        <motion.div
                            className="fixed right-0 top-0 h-full z-50 flex flex-col overflow-hidden"
                            style={{
                                width: "min(520px, 90vw)",
                                background: "rgba(255,255,255,0.98)",
                                backdropFilter: "blur(40px)",
                                borderLeft: "1px solid rgba(0,0,0,0.09)",
                                boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
                            }}
                            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 26, stiffness: 300 }}>

                            {/* Panel header */}
                            <div className="flex items-center gap-3 p-5 flex-shrink-0" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", background: "linear-gradient(to bottom, rgba(0,122,255,0.03), transparent)" }}>
                                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: DOC_META[activeType].bg }}>
                                    {(() => { const Icon = DOC_META[activeType].icon; return <Icon className="w-5 h-5" style={{ color: DOC_META[activeType].color }} />; })()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-base font-bold" style={{ color: "#1D1D1F" }}>{DOC_META[activeType].label}</h2>
                                    <p className="text-xs" style={{ color: "#8A8A8E" }}>{sheetDocs.length} records · all plots</p>
                                </div>
                                <button onClick={() => setActiveType(null)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors">
                                    <X className="w-4 h-4" style={{ color: "#8A8A8E" }} />
                                </button>
                            </div>

                            {/* Description */}
                            <div className="px-5 py-3 flex-shrink-0" style={{ background: `${DOC_META[activeType].color}08`, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                                <p className="text-xs leading-relaxed" style={{ color: "#6E6E73" }}>{DOC_META[activeType].desc}</p>
                            </div>

                            {/* Document list */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {sheetDocs.length === 0 ? (
                                    <div className="py-16 text-center">
                                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: DOC_META[activeType].bg }}>
                                            {(() => { const Icon = DOC_META[activeType].icon; return <Icon className="w-7 h-7" style={{ color: DOC_META[activeType].color }} />; })()}
                                        </div>
                                        <p className="font-semibold text-sm" style={{ color: "#1D1D1F" }}>No records yet</p>
                                        <p className="text-xs mt-1 mb-4" style={{ color: "#8A8A8E" }}>Add the first {DOC_META[activeType].label} document below.</p>
                                        <motion.button
                                            onClick={() => { setActiveType(null); setShowAdd(true); setForm(f => ({ ...f, type: activeType })); }}
                                            className="px-4 py-2 rounded-xl gradient-primary text-white text-xs font-semibold"
                                            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                            <Upload className="w-3.5 h-3.5 inline mr-1.5" />Add Document
                                        </motion.button>
                                    </div>
                                ) : sheetDocs.map((doc, i) => {
                                    const plot = plots.find(p => p.id === doc.plotId);
                                    const status = getDocStatus(doc);
                                    const SIcon = STATUS_ICON[status];

                                    return (
                                        <motion.div key={doc.id} className="p-4 rounded-2xl group relative"
                                            style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.07)" }}
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05, type: "spring", damping: 22 }}>

                                            {/* Delete button */}
                                            <button onClick={() => handleDelete(doc.id)}
                                                className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50">
                                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                            </button>

                                            <div className="flex items-start gap-3 pr-8">
                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: STATUS_BG[status] }}>
                                                    <SIcon className="w-4 h-4" style={{ color: STATUS_COLOR[status] }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    {/* Plot name is the main title */}
                                                    {plot ? (
                                                        <p className="text-sm font-bold flex items-center gap-1.5" style={{ color: "#1D1D1F" }}>
                                                            <Building2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#007AFF" }} />
                                                            {plot.plotNumber} — {plot.company}
                                                        </p>
                                                    ) : (
                                                        <p className="text-sm font-bold" style={{ color: "#1D1D1F" }}>{doc.title}</p>
                                                    )}
                                                    {/* Document reference title as secondary */}
                                                    {plot && <p className="text-xs mt-0.5 font-medium" style={{ color: "#3C3C43" }}>{doc.title}</p>}
                                                    {doc.description && <p className="text-xs mt-0.5" style={{ color: "#8A8A8E" }}>{doc.description}</p>}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mt-3 pt-2.5" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                                                <div className="flex items-center gap-1 text-xs" style={{ color: "#8A8A8E" }}>
                                                    <Calendar className="w-3 h-3" />
                                                    <span>Filed: {doc.fileDate}</span>
                                                    {doc.expiryDate && <span className="ml-2">· Expires: {doc.expiryDate}</span>}
                                                </div>
                                                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                    style={{ background: STATUS_BG[status], color: STATUS_COLOR[status] }}>
                                                    <SIcon className="w-3 h-3" />{STATUS_LABEL[status]}
                                                </span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Panel footer CTA */}
                            <div className="p-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
                                <motion.button
                                    onClick={() => { setShowAdd(true); setForm(f => ({ ...f, type: activeType })); }}
                                    className="w-full py-3 rounded-2xl gradient-primary text-white text-sm font-semibold flex items-center justify-center gap-2"
                                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}>
                                    <Upload className="w-4 h-4" /> Add {DOC_META[activeType].label}
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Add Document Modal ── */}
            <AnimatePresence>
                {showAdd && (
                    <motion.div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdd(false)}>
                        <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.32)", backdropFilter: "blur(8px)" }} />
                        <motion.div className="relative w-full max-w-md rounded-3xl overflow-hidden"
                            style={{ background: "rgba(255,255,255,0.98)", backdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 32px 80px rgba(0,0,0,0.22)" }}
                            initial={{ y: 40, scale: 0.94 }} animate={{ y: 0, scale: 1 }} exit={{ y: 40, scale: 0.94 }}
                            transition={{ type: "spring", damping: 24, stiffness: 280 }} onClick={e => e.stopPropagation()}>

                            <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
                                    <Upload className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold" style={{ color: "#1D1D1F" }}>Add Document</h2>
                                    <p className="text-xs" style={{ color: "#8A8A8E" }}>Attach to a plot in your portfolio</p>
                                </div>
                                <button onClick={() => setShowAdd(false)} className="ml-auto w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100">
                                    <X className="w-4 h-4" style={{ color: "#8A8A8E" }} />
                                </button>
                            </div>

                            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-widest block mb-1" style={{ color: "#6E6E73" }}>Document Type</label>
                                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as DocumentType }))}
                                        className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                                        style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.1)", color: "#1D1D1F" }}>
                                        {ALL_TYPES.map(t => <option key={t} value={t}>{DOC_META[t].label}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-widest block mb-1" style={{ color: "#6E6E73" }}>Associated Plot</label>
                                    <select value={form.plotId} onChange={e => setForm(p => ({ ...p, plotId: e.target.value }))}
                                        className="w-full px-3 py-2.5 rounded-xl text-sm"
                                        style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.1)", color: "#1D1D1F" }}>
                                        <option value="">Select plot…</option>
                                        {plots.map(p => <option key={p.id} value={p.id}>{p.plotNumber} — {p.company}</option>)}
                                    </select>
                                </div>

                                {[
                                    { key: "title", label: "Document Title", placeholder: "e.g., Allotment Order No. SIDCO/2024/A-14", type: "text" },
                                    { key: "description", label: "Description (optional)", placeholder: "Brief description of the document", type: "text" },
                                    { key: "fileDate", label: "File Date", placeholder: "", type: "date" },
                                    { key: "expiryDate", label: "Expiry Date (optional)", placeholder: "", type: "date" },
                                ].map(f => (
                                    <div key={f.key}>
                                        <label className="text-[10px] font-semibold uppercase tracking-widest block mb-1" style={{ color: "#6E6E73" }}>{f.label}</label>
                                        <input type={f.type} value={(form as any)[f.key]} placeholder={f.placeholder}
                                            onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                                            className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
                                            style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.1)", color: "#1D1D1F" }}
                                            onFocus={e => { e.target.style.borderColor = "rgba(0,122,255,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.1)"; }}
                                            onBlur={e => { e.target.style.borderColor = "rgba(0,0,0,0.1)"; e.target.style.boxShadow = "none"; }} />
                                    </div>
                                ))}
                            </div>

                            <div className="p-5 border-t border-gray-100 flex gap-3">
                                <button onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-2xl text-sm font-semibold"
                                    style={{ background: "rgba(0,0,0,0.04)", color: "#6E6E73" }}>Cancel</button>
                                <motion.button onClick={handleAdd}
                                    className="flex-1 py-3 rounded-2xl gradient-primary text-white text-sm font-semibold"
                                    whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.97 }}>
                                    Add Document
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}
