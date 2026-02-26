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
    // Gather compliance for each plot
    const plotData = plots.map(p => {
        const comp = complianceDb.getByPlot(p.id);
        const investPct = comp && p.investmentCommitted > 0
            ? Math.round((comp.investmentActual / p.investmentCommitted) * 100)
            : 0;
        const empPct = comp && p.employmentCommitted > 0
            ? Math.round((comp.employmentActual / p.employmentCommitted) * 100)
            : 0;

        return `
PLOT: ${p.plotNumber}
  Company: ${p.company}
  Allottee: ${p.allotteeName}
  Sector: ${p.sector}
  Location: ${p.location}
  Area: ${p.area} sqm
  Status: ${p.status.toUpperCase()}
  Allotment Date: ${p.allotmentDate || "not set"}
  Lease Period: ${p.leaseStartDate || "?"} to ${p.leaseEndDate || "?"}
  Investment Committed: ₹${p.investmentCommitted}L | Actual: ₹${comp?.investmentActual ?? 0}L (${investPct}% achieved)
  Employment Committed: ${p.employmentCommitted} jobs | Actual: ${comp?.employmentActual ?? 0} jobs (${empPct}% achieved)
  Caution Deposit: ₹${p.cautionDeposit}L — Status: ${comp?.cautionStatus?.replace(/_/g, " ") ?? "unknown"}
  Land Cost Subsidy Eligible: ₹${p.landCostSubsidy}L — Status: ${comp?.subsidyStatus?.replace(/_/g, " ") ?? "unknown"}
  Construction Started: ${comp?.constructionStarted ? "Yes" : "No"}
  Construction Completed: ${comp?.constructionCompleted ? "Yes" : "No"}
  Production Started: ${comp?.productionStarted ? "Yes (" + (comp.productionStartDate ?? "") + ")" : "No"}
  Remarks: ${comp?.inspectionRemarks || "None"}
  Notes: ${p.notes || "None"}`;
    }).join("\n");

    return `You are PlotGuardian AI — an intelligent compliance monitoring assistant for SIDCO/TIDCO/SIPCOT/TIIC industrial plot officers in Tamil Nadu, India.

You have DIRECT ACCESS to the following LIVE PLOT DATABASE with ${plots.length} plots. Use this data to answer every question specifically and accurately. Do NOT say you don't have access to plot data — you do:

═══ LIVE PLOT DATABASE (${new Date().toLocaleDateString("en-IN")}) ═══
${plotData || "No plots registered yet. Ask the officer to add plots via Plot Directory."}
═══════════════════════════════════════

Your responsibilities:
1. Answer questions about specific plots using the exact data above
2. Identify non-compliant, defaulting, or pending plots and name them specifically
3. Explain SIPCOT/SIDCO/TIDCO allotment order terms, lease deed conditions, and subsidy rules
4. Advise on caution deposit refund eligibility, investment/employment commitment tracking
5. Flag risks: over-due deadlines, unfulfilled commitments, expired documents

Rules:
- Always refer to plots by their plot number and company name
- Give specific data-driven answers, not generic redirection to websites
- Be concise, professional, and action-oriented
- If asked about "available" or "for sale" plots, check the status field — plots with status "closed" may be vacated/available; guide officer to add new allotments via Plot Directory
- If data is incomplete, say what IS known and what the officer needs to update`;
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
        seedDemoData(user.id);
        setMessages(chatDb.getByUser(user.id));
        const p = plotDb.getByUser(user.id);
        setPlots(p);
        setDbLoaded(true);
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

            const reply = await sendToGemini(history, fullSystem + "\n\nOfficer: " + content);
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
                            <p className="font-bold text-lg" style={{ color: "#1D1D1F" }}>PlotGuardian AI</p>
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
