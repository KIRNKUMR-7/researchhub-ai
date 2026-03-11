import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Loader2, Map, Trash2, Zap, Database } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../contexts/AuthContext";
import { chatDb, plotDb, complianceDb, activityDb, seedDemoData, type ChatMessage, type Plot } from "../lib/db";
import { sendToGemini } from "../lib/gemini";

const QUICK_PROMPTS = [
    "Which plots are pending compliance?",
    "Which plots are defaulting on investment?",
    "What is the caution deposit status for all plots?",
    "Which plots have not started production yet?",
    "What are the land cost subsidy statuses?",
    "Show me all compliant plots",
];

// Build a comprehensive system context including all actual plot data
function buildSystemContext(plots: Plot[], userId: string): string {
    const plotData = plots.map(p => {
        const comp = complianceDb.getByPlot(p.id);
        const investPct = comp && p.investmentCommitted > 0
            ? Math.round((comp.investmentActual / p.investmentCommitted) * 100)
            : 0;
        const empPct = comp && p.employmentCommitted > 0
            ? Math.round((comp.employmentActual / p.employmentCommitted) * 100)
            : 0;

        return `
── PLOT RECORD ──────────────────────────────
Plot Number   : ${p.plotNumber}
Company       : ${p.company}
Allottee      : ${p.allotteeName}
Sector/Industry: ${p.sector}
Location      : ${p.location}
Area          : ${p.area} sqm
STATUS        : ${p.status.toUpperCase()}
Allotment Date: ${p.allotmentDate || "not set"}
Lease Period  : ${p.leaseStartDate || "?"} → ${p.leaseEndDate || "?"}
Investment
  Committed   : ₹${p.investmentCommitted}L
  Actual      : ₹${comp?.investmentActual ?? 0}L  (${investPct}% achieved)
Employment
  Committed   : ${p.employmentCommitted} jobs
  Actual      : ${comp?.employmentActual ?? 0} jobs  (${empPct}% achieved)
Caution Deposit: ₹${p.cautionDeposit}L — Status: ${comp?.cautionStatus?.replace(/_/g, " ") ?? "not set"}
Land Cost Subsidy Eligible: ₹${p.landCostSubsidy}L — Status: ${comp?.subsidyStatus?.replace(/_/g, " ") ?? "not set"}
Construction Started : ${comp?.constructionStarted ? "YES" : "NO"}
Construction Completed: ${comp?.constructionCompleted ? "YES" : "NO"}
Production Started   : ${comp?.productionStarted ? "YES (" + (comp.productionStartDate ?? "") + ")" : "NO"}
Inspection Remarks: ${comp?.inspectionRemarks || "None"}
Notes: ${p.notes || "None"}`;
    }).join("\n");

    const summary = {
        total: plots.length,
        compliant: plots.filter(p => p.status === "compliant").length,
        pending: plots.filter(p => p.status === "pending").length,
        defaulting: plots.filter(p => p.status === "defaulting").length,
        closed: plots.filter(p => p.status === "closed").length,
    };

    return `You are ResearchHub AI — the compliance intelligence system for SIDCO/TIDCO/SIPCOT/TIIC industrial plot monitoring in Tamil Nadu.

══════════════════════════════════════════════════════
CRITICAL INSTRUCTIONS — READ BEFORE EVERY REPLY:
══════════════════════════════════════════════════════
1. You have DIRECT ACCESS to the COMPLETE LIVE DATABASE below (${plots.length} plots). USE IT.
2. NEVER say "I don't have access", "I cannot tell", or "please check the database". You ARE the database.
3. When asked about ANY plots, LIST THEM BY NAME with their actual data. Be specific, not generic.
4. Always reference plot numbers and company names in your answers.
5. Give concrete numbers — investment amounts, percentages, job counts, dates.
6. If a question matches multiple plots, list ALL matching plots.
7. "Plots for sale" = plots with status CLOSED (vacated/available). List them by name.
8. Format answers clearly: use bullet points or a mini-table for multiple plots.
9. If data is missing for a field, say "not updated" — don't hide it.
10. Be direct, concise, and data-driven. No fluff.

══ PORTFOLIO SUMMARY ══
Total: ${summary.total} | Compliant: ${summary.compliant} | Pending: ${summary.pending} | Defaulting: ${summary.defaulting} | Closed: ${summary.closed}

══ LIVE PLOT DATABASE (as of ${new Date().toLocaleDateString("en-IN")}) ══
${plotData || "⚠️ No plots registered yet. Officer should add plots via Plot Directory."}
══════════════════════════════════════════════

Your role: Instantly answer any question about the above plots using the exact data. Examples of what you MUST do:
- "Which plots are defaulting?" → List each defaulting plot with company name, how much investment they missed, how many jobs short
- "What is the caution deposit status?" → List every plot's caution deposit amount and current status
- "Which plots are for sale?" → List CLOSED plots by name
- "Plot X details?" → Dump all fields for that specific plot
- "Investment summary?" → List every plot's ₹ committed vs actual and %`;
}

export default function AIAssistant() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [plots, setPlots] = useState<Plot[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [contextPlot, setContextPlot] = useState<string>("");
    const [dbLoaded, setDbLoaded] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user) return;
        const init = async () => {
            await seedDemoData(user.id);
            await chatDb.fetchByUser(user.id);
            setMessages(chatDb.getByUser(user.id));
            const p = await plotDb.fetchByUser(user.id);
            setPlots(p);
            await complianceDb.fetchByUser(user.id);
            setDbLoaded(true);
        };
        init();
    }, [user?.id]);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    const send = async (text?: string) => {
        const content = text ?? input.trim();
        if (!content || !user) return;
        setInput("");

        // Build context: always include full plot DB + optional focused plot
        const sysCtx = buildSystemContext(plots, user.id);
        const focusedPlot = plots.find(p => p.id === contextPlot);
        const focusSuffix = focusedPlot
            ? `\n\nFOCUSED PLOT: The officer is currently looking at ${focusedPlot.plotNumber} (${focusedPlot.company}). Prioritise answers about this plot if relevant.`
            : "";
        const fullSystem = sysCtx + focusSuffix;

        const userMsg = chatDb.add({
            userId: user.id, role: "user", content,
            timestamp: new Date().toISOString(),
            plotId: contextPlot || undefined
        });
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);

        try {
            const history = messages
                .filter(m => m.userId === user.id)
                .slice(-12) // last 12 messages for context window management
                .map(m => ({ role: m.role as "user" | "ai", content: m.content }));

            const reply = await sendToGemini([...history, { role: "user", content }], fullSystem);
            const aiMsg = chatDb.add({
                userId: user.id, role: "ai", content: reply,
                timestamp: new Date().toISOString(),
                plotId: contextPlot || undefined
            });
            setMessages(prev => [...prev, aiMsg]);
            activityDb.log(user.id, "AI Query", content.slice(0, 60));
        } catch (err: unknown) {
            const realError = err instanceof Error ? err.message : String(err);
            const errMsg = chatDb.add({
                userId: user.id, role: "ai",
                content: `❌ Error: ${realError}\n\nIf this persists, check your internet connection or API key in Settings.`,
                timestamp: new Date().toISOString()
            });
            setMessages(prev => [...prev, errMsg]);
        } finally { setLoading(false); }
    };

    const clearChat = () => {
        if (!user) return;
        setMessages([]);
        localStorage.removeItem("pg_chats");
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto h-[calc(100vh-6rem)] flex flex-col">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-3 flex-shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"
                            style={{ color: "#1D1D1F", letterSpacing: "-0.02em" }}>
                            <Bot className="w-6 h-6" style={{ color: "#5E5CE6" }} />
                            <span>AI <span className="glow-text">Compliance</span> Assistant</span>
                        </h1>
                        <p className="text-sm mt-0.5 flex items-center gap-1.5" style={{ color: "#8A8A8E" }}>
                            {dbLoaded && (
                                <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                                    style={{ background: "rgba(52,199,89,0.1)", color: "#34C759" }}>
                                    <Database className="w-3 h-3" /> {plots.length} plots loaded
                                </span>
                            )}
                            Answers based on your live plot data
                        </p>
                    </div>
                    <button onClick={clearChat}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors hover:bg-red-50"
                        style={{ color: "#8A8A8E" }}>
                        <Trash2 className="w-3.5 h-3.5" /> Clear
                    </button>
                </motion.div>

                {/* Plot context selector */}
                <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                    <Map className="w-4 h-4 flex-shrink-0" style={{ color: "#8A8A8E" }} />
                    <select value={contextPlot} onChange={e => setContextPlot(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl text-sm focus:outline-none"
                        style={{
                            background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.1)",
                            color: contextPlot ? "#1D1D1F" : "#AEAEB2"
                        }}>
                        <option value="">All plots context (general query)</option>
                        {plots.map(p => (
                            <option key={p.id} value={p.id}>{p.plotNumber} — {p.company}</option>
                        ))}
                    </select>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 py-2 px-1 mb-3 scrollbar-thin">
                    {messages.length === 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                            <div className="w-16 h-16 rounded-3xl gradient-primary flex items-center justify-center mx-auto mb-4 pulse-glow">
                                <Bot className="w-8 h-8 text-white" />
                            </div>
                            <p className="font-bold text-lg" style={{ color: "#1D1D1F" }}>ResearchHub AI</p>
                            <p className="text-sm mt-1 mb-1" style={{ color: "#8A8A8E" }}>
                                Your intelligent compliance advisor — knows your {plots.length} plots
                            </p>
                            <p className="text-xs mb-6" style={{ color: "#AEAEB2" }}>
                                Ask about any plot by name, status, investment, subsidies, or compliance rules
                            </p>
                            <div className="grid grid-cols-2 gap-2 max-w-lg mx-auto">
                                {QUICK_PROMPTS.map(p => (
                                    <button key={p} onClick={() => send(p)}
                                        className="p-3 rounded-2xl text-left text-xs font-medium transition-all hover:-translate-y-0.5 hover:shadow-sm"
                                        style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)", color: "#3C3C43" }}>
                                        <Zap className="w-3 h-3 mb-1 inline mr-1" style={{ color: "#007AFF" }} />{p}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {messages.map((msg) => (
                        <motion.div key={msg.id}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}>

                            {msg.role === "ai" && (
                                <div className="w-7 h-7 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                                    <Bot className="w-3.5 h-3.5 text-white" />
                                </div>
                            )}

                            <div className="max-w-[80%] px-4 py-3 rounded-2xl"
                                style={{
                                    background: msg.role === "user"
                                        ? "linear-gradient(135deg,#007AFF,#5E5CE6)"
                                        : "rgba(255,255,255,0.95)",
                                    color: msg.role === "user" ? "#fff" : "#1D1D1F",
                                    boxShadow: msg.role === "ai"
                                        ? "0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05)"
                                        : "0 4px 16px rgba(0,122,255,0.25)",
                                    borderTopRightRadius: msg.role === "user" ? 6 : 18,
                                    borderTopLeftRadius: msg.role === "ai" ? 6 : 18,
                                }}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                <p className="text-[10px] mt-1.5 opacity-50">
                                    {new Date(msg.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                </p>
                            </div>
                        </motion.div>
                    ))}

                    {loading && (
                        <motion.div className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="w-7 h-7 rounded-xl gradient-primary flex items-center justify-center">
                                <Bot className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="px-4 py-3 rounded-2xl flex items-center gap-2"
                                style={{ background: "rgba(255,255,255,0.9)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                                <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#007AFF" }} />
                                <span className="text-xs" style={{ color: "#8A8A8E" }}>Analysing plot data…</span>
                            </div>
                        </motion.div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="flex items-end gap-2 flex-shrink-0">
                    <div className="flex-1 relative">
                        <textarea value={input} onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                            placeholder="Ask: which plots are defaulting? What is the subsidy status of Plot X? Show all pending plots..."
                            rows={2}
                            className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none resize-none transition-all"
                            style={{
                                background: "rgba(255,255,255,0.9)",
                                border: "1px solid rgba(0,0,0,0.1)",
                                color: "#1D1D1F",
                                boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
                            }}
                            onFocus={e => { e.target.style.borderColor = "rgba(0,122,255,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12), 0 2px 12px rgba(0,0,0,0.06)"; }}
                            onBlur={e => { e.target.style.borderColor = "rgba(0,0,0,0.1)"; e.target.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"; }} />
                    </div>
                    <motion.button onClick={() => send()} disabled={!input.trim() || loading}
                        className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0 disabled:opacity-40"
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Send className="w-5 h-5 text-white" />
                    </motion.button>
                </div>
            </div>
        </DashboardLayout>
    );
}
