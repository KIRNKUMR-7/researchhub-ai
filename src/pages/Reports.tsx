import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, IndianRupee, Users, Shield, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../contexts/AuthContext";
import { plotDb, complianceDb, documentDb, seedDemoData, type Plot } from "../lib/db";

function StatWidget({ label, value, sub, color, icon: Icon }: { label: string; value: string | number; sub?: string; color: string; icon: React.ElementType }) {
    return (
        <motion.div className="widget-card p-5 relative overflow-hidden"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -3 }}>
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-10 pointer-events-none" style={{ background: color }} />
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#8A8A8E" }}>{label}</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: "#1D1D1F" }}>{value}</p>
                    {sub && <p className="text-xs mt-0.5" style={{ color: "#8A8A8E" }}>{sub}</p>}
                </div>
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${color}18` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                </div>
            </div>
        </motion.div>
    );
}

function BarRow({ label, pct, color, value }: { label: string; pct: number; color: string; value: string }) {
    return (
        <div className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
            <div className="w-32 truncate text-xs font-medium flex-shrink-0" style={{ color: "#3C3C43" }}>{label}</div>
            <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.05)" }}>
                <motion.div className="h-full rounded-full"
                    style={{ background: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(pct, 100)}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }} />
            </div>
            <div className="w-24 text-right text-xs font-semibold flex-shrink-0" style={{ color: "#6E6E73" }}>{value}</div>
            <div className="w-10 text-right text-xs font-bold flex-shrink-0" style={{ color: pct >= 80 ? "#34C759" : pct >= 40 ? "#FF9F0A" : "#FF3B30" }}>{pct}%</div>
        </div>
    );
}

export default function Reports() {
    const { user } = useAuth();
    const [plots, setPlots] = useState<Plot[]>([]);
    const [compRecords, setCompRecords] = useState<ReturnType<typeof complianceDb.getByUser>>([]);
    const [docCount, setDocCount] = useState(0);

    useEffect(() => {
        if (!user) return;
        seedDemoData(user.id);
        const p = plotDb.getByUser(user.id);
        setPlots(p);
        setCompRecords(complianceDb.getByUser(user.id));
        setDocCount(documentDb.countByUser(user.id));
    }, [user?.id]);

    const totalInvestmentCommitted = plots.reduce((s, p) => s + p.investmentCommitted, 0);
    const totalInvestmentActual = compRecords.reduce((s, c) => s + (c.investmentActual ?? 0), 0);
    const totalEmpCommitted = plots.reduce((s, p) => s + p.employmentCommitted, 0);
    const totalEmpActual = compRecords.reduce((s, c) => s + (c.employmentActual ?? 0), 0);
    const totalCautionDeposit = plots.reduce((s, p) => s + p.cautionDeposit, 0);
    const subsidyDisbursed = compRecords.reduce((s, c) => s + (c.subsidyAmountDisbursed ?? 0), 0);
    const complianceRate = plots.length > 0 ? Math.round((plots.filter(p => p.status === "compliant").length / plots.length) * 100) : 0;
    const investPct = totalInvestmentCommitted > 0 ? Math.round((totalInvestmentActual / totalInvestmentCommitted) * 100) : 0;
    const empPct = totalEmpCommitted > 0 ? Math.round((totalEmpActual / totalEmpCommitted) * 100) : 0;

    const statusCounts = {
        compliant: plots.filter(p => p.status === "compliant").length,
        pending: plots.filter(p => p.status === "pending").length,
        defaulting: plots.filter(p => p.status === "defaulting").length,
    };

    const cautionStatusSummary = {
        held: compRecords.filter(c => c.cautionStatus === "held").length,
        refund_due: compRecords.filter(c => c.cautionStatus === "refund_due").length,
        refunded: compRecords.filter(c => c.cautionStatus === "refunded").length,
    };

    const subsidySummary = {
        disbursed: compRecords.filter(c => c.subsidyStatus === "disbursed").length,
        approved: compRecords.filter(c => c.subsidyStatus === "approved").length,
        applied: compRecords.filter(c => c.subsidyStatus === "applied").length,
        not_applied: compRecords.filter(c => c.subsidyStatus === "not_applied").length,
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" style={{ color: "#1D1D1F", letterSpacing: "-0.02em" }}>
                        <BarChart3 className="w-6 h-6" style={{ color: "#FF3B30" }} />
                        <span>Compliance <span className="glow-text">Reports</span></span>
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "#8A8A8E" }}>
                        Portfolio summary — {plots.length} plots monitored · {docCount} documents filed
                    </p>
                </motion.div>

                {/* KPI cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatWidget label="Compliance Rate" value={`${complianceRate}%`} sub={`${statusCounts.compliant} of ${plots.length} compliant`} color="#34C759" icon={Shield} />
                    <StatWidget label="Investment Achieved" value={`₹${Math.round(totalInvestmentActual)}L`} sub={`of ₹${totalInvestmentCommitted}L (${investPct}%)`} color="#007AFF" icon={IndianRupee} />
                    <StatWidget label="Employment Created" value={totalEmpActual} sub={`of ${totalEmpCommitted} committed (${empPct}%)`} color="#5E5CE6" icon={Users} />
                    <StatWidget label="Caution Deposits" value={`₹${totalCautionDeposit}L`} sub="Total held across plots" color="#FF9F0A" icon={TrendingUp} />
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Investment by plot */}
                    <div className="widget-card p-5">
                        <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "#1D1D1F" }}>
                            <IndianRupee className="w-4 h-4" style={{ color: "#007AFF" }} /> Investment Progress by Plot
                        </h2>
                        {plots.map(p => {
                            const comp = compRecords.find(c => c.plotId === p.id);
                            const pct = comp ? Math.round((comp.investmentActual / p.investmentCommitted) * 100) : 0;
                            return (
                                <BarRow key={p.id} label={p.plotNumber} pct={pct}
                                    color={pct >= 80 ? "#34C759" : pct >= 40 ? "#FF9F0A" : "#FF3B30"}
                                    value={`₹${comp?.investmentActual ?? 0}L / ₹${p.investmentCommitted}L`} />
                            );
                        })}
                    </div>

                    {/* Employment by plot */}
                    <div className="widget-card p-5">
                        <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "#1D1D1F" }}>
                            <Users className="w-4 h-4" style={{ color: "#5E5CE6" }} /> Employment by Plot
                        </h2>
                        {plots.map(p => {
                            const comp = compRecords.find(c => c.plotId === p.id);
                            const pct = comp ? Math.round((comp.employmentActual / p.employmentCommitted) * 100) : 0;
                            return (
                                <BarRow key={p.id} label={p.plotNumber} pct={pct}
                                    color={pct >= 80 ? "#34C759" : pct >= 40 ? "#FF9F0A" : "#FF3B30"}
                                    value={`${comp?.employmentActual ?? 0} / ${p.employmentCommitted} jobs`} />
                            );
                        })}
                    </div>

                    {/* Caution deposit summary */}
                    <div className="widget-card p-5">
                        <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "#1D1D1F" }}>
                            <Shield className="w-4 h-4" style={{ color: "#FF9F0A" }} /> Caution Deposit Summary
                        </h2>
                        <div className="space-y-3">
                            {[
                                { label: `Held`, value: cautionStatusSummary.held, color: "#FF9F0A", icon: Clock },
                                { label: `Refund Due`, value: cautionStatusSummary.refund_due, color: "#FF3B30", icon: AlertTriangle },
                                { label: `Refunded`, value: cautionStatusSummary.refunded, color: "#34C759", icon: CheckCircle2 },
                            ].map(item => (
                                <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: `${item.color}10` }}>
                                    <item.icon className="w-4 h-4 flex-shrink-0" style={{ color: item.color }} />
                                    <span className="text-sm flex-1 font-medium" style={{ color: "#3C3C43" }}>{item.label}</span>
                                    <span className="text-sm font-bold" style={{ color: item.color }}>{item.value} plots</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Subsidy pipeline */}
                    <div className="widget-card p-5">
                        <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "#1D1D1F" }}>
                            <TrendingUp className="w-4 h-4" style={{ color: "#34C759" }} /> Land Cost Subsidy Pipeline
                        </h2>
                        <div className="space-y-3">
                            {[
                                { label: "Not Applied", value: subsidySummary.not_applied, color: "#8A8A8E" },
                                { label: "Applied", value: subsidySummary.applied, color: "#007AFF" },
                                { label: "Approved", value: subsidySummary.approved, color: "#FF9F0A" },
                                { label: "Disbursed", value: subsidySummary.disbursed, color: "#34C759" },
                            ].map(item => (
                                <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: `${item.color}10` }}>
                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                                        <motion.div className="h-full rounded-full" style={{ background: item.color }}
                                            initial={{ width: 0 }}
                                            animate={{ width: plots.length > 0 ? `${(item.value / plots.length) * 100}%` : "0%" }}
                                            transition={{ duration: 0.7 }} />
                                    </div>
                                    <span className="text-xs font-medium w-20 text-right" style={{ color: "#3C3C43" }}>{item.label}</span>
                                    <span className="text-sm font-bold w-6 text-right" style={{ color: item.color }}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
