import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ClipboardCheck, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle,
    Clock, X, Save, MapPin, Building2, TrendingUp, Users, IndianRupee,
    Shield, Calendar, FileCheck
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../contexts/AuthContext";
import {
    plotDb, complianceDb, activityDb, seedDemoData,
    type Plot, type ComplianceRecord, type PlotStatus
} from "../lib/db";

const STATUS_CONFIG: Record<PlotStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    compliant: { label: "Compliant", color: "#34C759", bg: "rgba(52,199,89,0.1)", icon: CheckCircle2 },
    pending: { label: "Pending", color: "#FF9F0A", bg: "rgba(255,159,10,0.1)", icon: Clock },
    defaulting: { label: "Defaulting", color: "#FF3B30", bg: "rgba(255,59,48,0.1)", icon: AlertTriangle },
    closed: { label: "Closed", color: "#8A8A8E", bg: "rgba(138,138,142,0.1)", icon: X },
};

function ProgressRow({ label, pct, color }: { label: string; pct: number; color: string }) {
    return (
        <div>
            <div className="flex justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: "#6E6E73" }}>{label}</span>
                <span className="text-xs font-bold" style={{ color }}>{pct}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                <motion.div className="h-full rounded-full" style={{ background: color }}
                    initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }} />
            </div>
        </div>
    );
}

function StatusBadge({ label, value, good, warn }: { label: string; value: string; good: boolean; warn?: boolean }) {
    const color = good ? "#34C759" : warn ? "#FF9F0A" : "#FF3B30";
    return (
        <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <span className="text-xs" style={{ color: "#6E6E73" }}>{label}</span>
            <span className="text-xs font-semibold capitalize px-2 py-0.5 rounded-full" style={{ color, background: `${color}18` }}>{value}</span>
        </div>
    );
}

export default function ComplianceTracker() {
    const { user } = useAuth();
    const [plots, setPlots] = useState<Plot[]>([]);
    const [selected, setSelected] = useState<Plot | null>(null);
    const [comp, setComp] = useState<ComplianceRecord | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [formComp, setFormComp] = useState<Partial<ComplianceRecord>>({});

    useEffect(() => {
        if (!user) return;
        seedDemoData(user.id);
        setPlots(plotDb.getByUser(user.id));
    }, [user?.id]);

    const loadPlot = (p: Plot) => {
        setSelected(p);
        const c = complianceDb.getByPlot(p.id);
        setComp(c ?? null);
        setFormComp(c ?? {});
        setEditMode(false);
    };

    const saveCompliance = () => {
        if (!user || !selected) return;
        const updated = complianceDb.upsert({
            plotId: selected.id, userId: user.id,
            investmentActual: Number(formComp.investmentActual ?? 0),
            investmentAsOn: formComp.investmentAsOn ?? new Date().toISOString().split("T")[0],
            investmentStatus: formComp.investmentStatus ?? "pending",
            employmentActual: Number(formComp.employmentActual ?? 0),
            employmentAsOn: formComp.employmentAsOn ?? new Date().toISOString().split("T")[0],
            employmentStatus: formComp.employmentStatus ?? "pending",
            cautionStatus: formComp.cautionStatus ?? "held",
            subsidyStatus: formComp.subsidyStatus ?? "not_applied",
            constructionStarted: formComp.constructionStarted ?? false,
            constructionCompleted: formComp.constructionCompleted ?? false,
            productionStarted: formComp.productionStarted ?? false,
            productionStartDate: formComp.productionStartDate,
            leaseRenewalStatus: formComp.leaseRenewalStatus ?? "pending",
            lastInspectionDate: formComp.lastInspectionDate,
            nextInspectionDate: formComp.nextInspectionDate,
            inspectionRemarks: formComp.inspectionRemarks ?? "",
            updatedBy: user.id,
            cautionRefundDueDate: formComp.cautionRefundDueDate,
            subsidyAmountDisbursed: formComp.subsidyAmountDisbursed,
        });
        setComp(updated);

        // Recalculate overall status
        const investPct = (updated.investmentActual / selected.investmentCommitted) * 100;
        const newStatus: PlotStatus = updated.investmentStatus === "overdue" ? "defaulting"
            : investPct < 30 ? "pending" : investPct >= 80 ? "compliant" : "pending";
        plotDb.update(selected.id, { status: newStatus });
        setSelected({ ...selected, status: newStatus });
        setPlots(plotDb.getByUser(user.id));
        activityDb.log(user.id, "Compliance Updated", `${selected.plotNumber} — ${newStatus}`, selected.id);
        setEditMode(false);
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" style={{ color: "#1D1D1F", letterSpacing: "-0.02em" }}>
                        <ClipboardCheck className="w-6 h-6" style={{ color: "#5E5CE6" }} />
                        <span>Compliance <span className="glow-text">Tracker</span></span>
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "#8A8A8E" }}>Review and update compliance status for each allotted plot.</p>
                </motion.div>

                <div className="grid lg:grid-cols-5 gap-5">
                    {/* Plot list */}
                    <div className="lg:col-span-2 space-y-2">
                        {plots.map((p, i) => {
                            const cfg = STATUS_CONFIG[p.status];
                            const isSelected = selected?.id === p.id;
                            return (
                                <motion.button key={p.id} onClick={() => loadPlot(p)}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all ${isSelected ? "border-primary/40 shadow-md" : "border-gray-100 hover:border-gray-200"}`}
                                    style={{ background: isSelected ? "rgba(0,122,255,0.04)" : "rgba(255,255,255,0.9)" }}
                                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.06, type: "spring", damping: 22 }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: cfg.bg }}>
                                            <cfg.icon className="w-4 h-4" style={{ color: cfg.color }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm" style={{ color: "#1D1D1F" }}>{p.plotNumber}</p>
                                            <p className="text-xs truncate" style={{ color: "#8A8A8E" }}>{p.company}</p>
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
                                            {cfg.label}
                                        </span>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Compliance Detail */}
                    <div className="lg:col-span-3">
                        <AnimatePresence mode="wait">
                            {!selected ? (
                                <motion.div key="empty" className="widget-card p-12 text-center h-full flex flex-col items-center justify-center"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <ClipboardCheck className="w-14 h-14 mb-4" style={{ color: "#C7C7CC" }} />
                                    <p className="font-semibold" style={{ color: "#1D1D1F" }}>Select a plot</p>
                                    <p className="text-sm mt-1" style={{ color: "#8A8A8E" }}>Choose a plot from the left to view and update its compliance file.</p>
                                </motion.div>
                            ) : (
                                <motion.div key={selected.id} className="widget-card p-5"
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                    transition={{ type: "spring", damping: 22, stiffness: 260 }}>
                                    {/* Header */}
                                    <div className="flex items-start gap-3 mb-5 pb-4 border-b border-gray-100">
                                        <div className="flex-1">
                                            <p className="font-bold text-lg" style={{ color: "#1D1D1F" }}>{selected.plotNumber}</p>
                                            <p className="text-sm font-semibold" style={{ color: "#3C3C43" }}>{selected.company}</p>
                                            <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "#8A8A8E" }}>
                                                <MapPin className="w-3 h-3" />{selected.location} · {selected.sector}
                                            </p>
                                        </div>
                                        <motion.button onClick={() => setEditMode(!editMode)}
                                            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                                            style={{ background: editMode ? "#007AFF" : "rgba(0,122,255,0.1)", color: editMode ? "#fff" : "#007AFF" }}
                                            whileTap={{ scale: 0.96 }}>
                                            {editMode ? "Cancel" : "Edit"}
                                        </motion.button>
                                    </div>

                                    {/* Investment */}
                                    <section className="mb-5">
                                        <h3 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-1" style={{ color: "#AEAEB2" }}>
                                            <IndianRupee className="w-3 h-3" /> Investment
                                        </h3>
                                        {editMode ? (
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { key: "investmentActual", label: "Actual (₹L)", type: "number" },
                                                    { key: "investmentAsOn", label: "As on Date", type: "date" },
                                                ].map(f => (
                                                    <div key={f.key}>
                                                        <label className="text-[10px] font-semibold uppercase tracking-widest block mb-1" style={{ color: "#6E6E73" }}>{f.label}</label>
                                                        <input type={f.type} value={(formComp as any)[f.key] ?? ""}
                                                            onChange={e => setFormComp(p => ({ ...p, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))}
                                                            className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none"
                                                            style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.1)", color: "#1D1D1F" }}
                                                            onFocus={e => { e.target.style.borderColor = "rgba(0,122,255,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.1)"; }}
                                                            onBlur={e => { e.target.style.borderColor = "rgba(0,0,0,0.1)"; e.target.style.boxShadow = "none"; }} />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : comp ? (
                                            <ProgressRow label={`Actual ₹${comp.investmentActual}L / Committed ₹${selected.investmentCommitted}L`}
                                                pct={Math.round((comp.investmentActual / selected.investmentCommitted) * 100)}
                                                color={comp.investmentActual / selected.investmentCommitted >= 0.8 ? "#34C759" : comp.investmentActual / selected.investmentCommitted >= 0.4 ? "#FF9F0A" : "#FF3B30"} />
                                        ) : <p className="text-xs" style={{ color: "#8A8A8E" }}>No record yet. Click Edit to add.</p>}
                                    </section>

                                    {/* Employment */}
                                    <section className="mb-5">
                                        <h3 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-1" style={{ color: "#AEAEB2" }}>
                                            <Users className="w-3 h-3" /> Employment
                                        </h3>
                                        {editMode ? (
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { key: "employmentActual", label: "Actual Jobs", type: "number" },
                                                    { key: "employmentAsOn", label: "As on Date", type: "date" },
                                                ].map(f => (
                                                    <div key={f.key}>
                                                        <label className="text-[10px] font-semibold uppercase tracking-widest block mb-1" style={{ color: "#6E6E73" }}>{f.label}</label>
                                                        <input type={f.type} value={(formComp as any)[f.key] ?? ""}
                                                            onChange={e => setFormComp(p => ({ ...p, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))}
                                                            className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none"
                                                            style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.1)", color: "#1D1D1F" }}
                                                            onFocus={e => { e.target.style.borderColor = "rgba(0,122,255,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.1)"; }}
                                                            onBlur={e => { e.target.style.borderColor = "rgba(0,0,0,0.1)"; e.target.style.boxShadow = "none"; }} />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : comp ? (
                                            <ProgressRow label={`Actual ${comp.employmentActual} / Committed ${selected.employmentCommitted} jobs`}
                                                pct={Math.round((comp.employmentActual / selected.employmentCommitted) * 100)}
                                                color={comp.employmentActual / selected.employmentCommitted >= 0.8 ? "#34C759" : comp.employmentActual / selected.employmentCommitted >= 0.4 ? "#FF9F0A" : "#FF3B30"} />
                                        ) : null}
                                    </section>

                                    {/* Compliance Status Grid */}
                                    <section className="mb-5">
                                        <h3 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-1" style={{ color: "#AEAEB2" }}>
                                            <Shield className="w-3 h-3" /> Compliance Status
                                        </h3>
                                        {editMode ? (
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { key: "cautionStatus", label: "Caution Deposit", options: ["held", "refund_due", "refund_initiated", "refunded"] },
                                                    { key: "subsidyStatus", label: "Land Cost Subsidy", options: ["not_applied", "applied", "approved", "disbursed", "rejected"] },
                                                    { key: "investmentStatus", label: "Investment Status", options: ["compliant", "pending", "overdue", "na"] },
                                                    { key: "leaseRenewalStatus", label: "Lease Renewal", options: ["compliant", "pending", "overdue", "na"] },
                                                ].map(f => (
                                                    <div key={f.key}>
                                                        <label className="text-[10px] font-semibold uppercase tracking-widest block mb-1" style={{ color: "#6E6E73" }}>{f.label}</label>
                                                        <select value={(formComp as any)[f.key] ?? ""}
                                                            onChange={e => setFormComp(p => ({ ...p, [f.key]: e.target.value }))}
                                                            className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none"
                                                            style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.1)", color: "#1D1D1F" }}>
                                                            {f.options.map(o => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
                                                        </select>
                                                    </div>
                                                ))}
                                                {/* Checkboxes */}
                                                {[
                                                    { key: "constructionStarted", label: "Construction Started" },
                                                    { key: "constructionCompleted", label: "Construction Completed" },
                                                    { key: "productionStarted", label: "Production Started" },
                                                ].map(f => (
                                                    <label key={f.key} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "#1D1D1F" }}>
                                                        <input type="checkbox" checked={!!(formComp as any)[f.key]}
                                                            onChange={e => setFormComp(p => ({ ...p, [f.key]: e.target.checked }))}
                                                            className="w-4 h-4 rounded accent-blue-500" />
                                                        {f.label}
                                                    </label>
                                                ))}
                                                <div className="col-span-2">
                                                    <label className="text-[10px] font-semibold uppercase tracking-widest block mb-1" style={{ color: "#6E6E73" }}>Inspection Remarks</label>
                                                    <textarea value={formComp.inspectionRemarks ?? ""}
                                                        onChange={e => setFormComp(p => ({ ...p, inspectionRemarks: e.target.value }))}
                                                        rows={2} className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none resize-none"
                                                        style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.1)", color: "#1D1D1F" }} />
                                                </div>
                                            </div>
                                        ) : comp ? (
                                            <div>
                                                <StatusBadge label="Caution Deposit" value={comp.cautionStatus.replace(/_/g, " ")} good={comp.cautionStatus === "refunded"} warn={comp.cautionStatus === "held"} />
                                                <StatusBadge label="Land Cost Subsidy" value={comp.subsidyStatus.replace(/_/g, " ")} good={comp.subsidyStatus === "disbursed"} warn={comp.subsidyStatus === "applied" || comp.subsidyStatus === "approved"} />
                                                <StatusBadge label="Construction" value={comp.constructionCompleted ? "Completed" : comp.constructionStarted ? "In Progress" : "Not Started"} good={comp.constructionCompleted} warn={comp.constructionStarted} />
                                                <StatusBadge label="Production" value={comp.productionStarted ? `Started ${comp.productionStartDate ?? ""}` : "Not Started"} good={comp.productionStarted} warn={false} />
                                                <StatusBadge label="Lease Renewal" value={comp.leaseRenewalStatus} good={comp.leaseRenewalStatus === "compliant"} warn={comp.leaseRenewalStatus === "pending"} />
                                                {comp.inspectionRemarks && (
                                                    <p className="text-xs mt-3 p-2.5 rounded-xl italic" style={{ background: "rgba(0,0,0,0.03)", color: "#6E6E73" }}>"{comp.inspectionRemarks}"</p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-xs" style={{ color: "#8A8A8E" }}>No compliance record. Click Edit to start.</p>
                                        )}
                                    </section>

                                    {editMode && (
                                        <motion.button onClick={saveCompliance}
                                            className="w-full py-3 rounded-2xl gradient-primary text-white text-sm font-semibold flex items-center justify-center gap-2"
                                            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}>
                                            <Save className="w-4 h-4" /> Save Compliance Record
                                        </motion.button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
