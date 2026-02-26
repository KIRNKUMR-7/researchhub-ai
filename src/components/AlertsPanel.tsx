import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp,
    Zap, ArrowRight, RefreshCw
} from "lucide-react";
import { type ComplianceAlert, SEVERITY_CONFIG, CATEGORY_LABEL } from "../lib/automationEngine";

interface AlertsPanelProps {
    alerts: ComplianceAlert[];
    onRefresh: () => void;
    loading?: boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
    investment: "💰", employment: "👥", lease_expiry: "📋",
    caution_deposit: "🏦", subsidy: "🎯", production: "🏭",
    document: "📄", construction: "🏗️",
};

export default function AlertsPanel({ alerts, onRefresh, loading }: AlertsPanelProps) {
    const [expanded, setExpanded] = useState<string | null>(null);
    const [filterSeverity, setFilterSeverity] = useState<"all" | "critical" | "warning" | "info">("all");

    const critical = alerts.filter(a => a.severity === "critical").length;
    const warning = alerts.filter(a => a.severity === "warning").length;
    const info = alerts.filter(a => a.severity === "info").length;

    const visible = filterSeverity === "all" ? alerts : alerts.filter(a => a.severity === filterSeverity);

    const SevIcon = ({ severity }: { severity: ComplianceAlert["severity"] }) => {
        if (severity === "critical") return <AlertTriangle className="w-4 h-4" style={{ color: SEVERITY_CONFIG.critical.color }} />;
        if (severity === "warning") return <AlertTriangle className="w-4 h-4" style={{ color: SEVERITY_CONFIG.warning.color }} />;
        return <Info className="w-4 h-4" style={{ color: SEVERITY_CONFIG.info.color }} />;
    };

    return (
        <div className="widget-card overflow-hidden">
            {/* Panel header */}
            <div className="p-5 pb-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: critical > 0 ? "rgba(255,59,48,0.1)" : "rgba(52,199,89,0.1)" }}>
                            {critical > 0
                                ? <AlertTriangle className="w-4 h-4" style={{ color: "#FF3B30" }} />
                                : <CheckCircle className="w-4 h-4" style={{ color: "#34C759" }} />}
                        </div>
                        <div>
                            <p className="text-sm font-bold" style={{ color: "#1D1D1F" }}>
                                Automated Monitoring
                            </p>
                            <p className="text-[10px]" style={{ color: "#8A8A8E" }}>
                                {alerts.length === 0 ? "All plots compliant ✓" : `${alerts.length} issues detected`}
                            </p>
                        </div>
                    </div>
                    <motion.button onClick={onRefresh} disabled={loading}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-gray-100"
                        whileTap={{ scale: 0.9 }}>
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                            style={{ color: "#8A8A8E" }} />
                    </motion.button>
                </div>

                {/* Summary badges */}
                <div className="flex gap-2">
                    {[
                        { key: "all", label: `All (${alerts.length})`, color: "#6E6E73", bg: "rgba(0,0,0,0.05)" },
                        { key: "critical", label: `${critical} Critical`, color: SEVERITY_CONFIG.critical.color, bg: SEVERITY_CONFIG.critical.bg },
                        { key: "warning", label: `${warning} Warning`, color: SEVERITY_CONFIG.warning.color, bg: SEVERITY_CONFIG.warning.bg },
                        { key: "info", label: `${info} Info`, color: SEVERITY_CONFIG.info.color, bg: SEVERITY_CONFIG.info.bg },
                    ].map(f => (
                        <button key={f.key} onClick={() => setFilterSeverity(f.key as typeof filterSeverity)}
                            className="flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all"
                            style={{
                                background: filterSeverity === f.key ? f.bg : "transparent",
                                color: filterSeverity === f.key ? f.color : "#AEAEB2",
                                border: `1px solid ${filterSeverity === f.key ? f.color + "33" : "transparent"}`,
                            }}>
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Alert list */}
            <div className="overflow-y-auto" style={{ maxHeight: 380 }}>
                {visible.length === 0 ? (
                    <div className="py-10 text-center">
                        <CheckCircle className="w-10 h-10 mx-auto mb-2" style={{ color: "#34C759" }} />
                        <p className="text-sm font-semibold" style={{ color: "#1D1D1F" }}>
                            {filterSeverity === "all" ? "All Clear!" : `No ${filterSeverity} alerts`}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "#8A8A8E" }}>
                            Automated checks found no issues
                        </p>
                    </div>
                ) : (
                    <div className="p-3 space-y-2">
                        {visible.map((alert, i) => {
                            const cfg = SEVERITY_CONFIG[alert.severity];
                            const isOpen = expanded === alert.id;
                            return (
                                <motion.div key={alert.id}
                                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}>
                                    <button className="w-full text-left rounded-2xl overflow-hidden transition-all"
                                        style={{
                                            background: isOpen ? cfg.bg : "rgba(0,0,0,0.02)",
                                            border: `1px solid ${isOpen ? cfg.color + "33" : "rgba(0,0,0,0.06)"}`,
                                        }}
                                        onClick={() => setExpanded(isOpen ? null : alert.id)}>
                                        <div className="flex items-start gap-2.5 p-3">
                                            {/* Severity dot */}
                                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                                                style={{ background: cfg.bg }}>
                                                <SevIcon severity={alert.severity} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                                        style={{ background: cfg.bg, color: cfg.color }}>
                                                        {SEVERITY_CONFIG[alert.severity].label}
                                                    </span>
                                                    <span className="text-[10px] font-semibold"
                                                        style={{ color: "#AEAEB2" }}>
                                                        {CATEGORY_ICONS[alert.category]} {CATEGORY_LABEL[alert.category]}
                                                    </span>
                                                    <span className="text-[10px] font-bold ml-auto"
                                                        style={{ color: "#007AFF" }}>
                                                        {alert.plotNumber}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-semibold mt-0.5 leading-snug"
                                                    style={{ color: "#1D1D1F" }}>
                                                    {alert.title}
                                                </p>
                                                <p className="text-[10px] mt-0.5 leading-relaxed"
                                                    style={{ color: "#6E6E73" }}>
                                                    {alert.company}
                                                </p>
                                            </div>
                                            {isOpen
                                                ? <ChevronUp className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: "#AEAEB2" }} />
                                                : <ChevronDown className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: "#AEAEB2" }} />}
                                        </div>

                                        {/* Expanded detail */}
                                        <AnimatePresence>
                                            {isOpen && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}>
                                                    <div className="px-3 pb-3 space-y-2">
                                                        <p className="text-xs leading-relaxed"
                                                            style={{ color: "#3C3C43" }}>
                                                            {alert.description}
                                                        </p>
                                                        <div className="flex items-start gap-1.5 p-2 rounded-xl"
                                                            style={{ background: "rgba(0,0,0,0.04)" }}>
                                                            <Zap className="w-3 h-3 flex-shrink-0 mt-0.5"
                                                                style={{ color: cfg.color }} />
                                                            <p className="text-[11px] font-semibold leading-relaxed"
                                                                style={{ color: "#1D1D1F" }}>
                                                                <span style={{ color: cfg.color }}>Action: </span>
                                                                {alert.actionRequired}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer */}
            {alerts.length > 0 && (
                <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                    <p className="text-[10px] flex items-center gap-1" style={{ color: "#AEAEB2" }}>
                        <Zap className="w-3 h-3" style={{ color: "#007AFF" }} />
                        Auto-generated by PlotGuardian compliance rules engine ·{" "}
                        {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                </div>
            )}
        </div>
    );
}
