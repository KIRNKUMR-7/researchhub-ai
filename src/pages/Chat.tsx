import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Brain, User, Sparkles, RotateCcw, AlertCircle, Wifi, WifiOff } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../contexts/AuthContext";
import { chatDb } from "../lib/db";
import { sendToGemini, toGeminiHistory } from "../lib/gemini";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

// Simple markdown bold renderer
function renderContent(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-primary font-semibold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

const WELCOME: Message = {
  id: "welcome",
  role: "ai",
  content: "Hello! I'm your AI Research Assistant powered by **OpenRouter · DeepSeek Chat**. I can help you analyze papers, summarize findings, compare methodologies, and answer research questions. What would you like to explore today?",
  timestamp: new Date(),
};

const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from db on mount
  useEffect(() => {
    if (!user) return;
    const history = chatDb.getByUser(user.id);
    if (history.length > 0) {
      const loaded: Message[] = history.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp),
      }));
      setMessages([WELCOME, ...loaded]);
    }
  }, [user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || !user) return;
    setError("");

    const userText = input.trim();
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: userText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Save to db
    chatDb.add({
      userId: user.id,
      role: "user",
      content: userText,
      timestamp: new Date().toISOString(),
    });

    try {
      // Build history for Gemini (exclude the welcome message, only real exchanges)
      const realMessages = messages.filter(m => m.id !== "welcome");
      const geminiHistory = toGeminiHistory(
        realMessages.map(m => ({ role: m.role, content: m.content }))
      );

      const aiText = await sendToGemini(geminiHistory, userText);

      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        role: "ai",
        content: aiText,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMsg]);
      chatDb.add({
        userId: user.id,
        role: "ai",
        content: aiText,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Something went wrong.";
      setError(errMsg);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClear = () => {
    if (!user) return;
    chatDb.clear(user.id);
    setMessages([WELCOME]);
    setError("");
  };

  const suggestedPrompts = [
    "Explain the attention mechanism in transformers",
    "What's the difference between BERT and GPT models?",
    "Summarize the key ideas behind diffusion models",
    "How does RAG improve LLM accuracy?",
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-3rem)] flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4"
        >
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              AI Research <span className="glow-text">Assistant</span>
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Wifi className="w-3.5 h-3.5 text-success" />
              Powered by OpenRouter · DeepSeek Chat · Live AI
            </p>
          </div>
          <button
            onClick={handleClear}
            className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground"
            title="Clear conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-3 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm"
          >
            <WifiOff className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin space-y-4 pb-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {msg.role === "ai" && (
                  <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0 mt-1">
                    <Brain className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                <div className={`max-w-[80%] ${msg.role === "user" ? "glass-card bg-primary/10 border-primary/20" : "glass-card"} p-4 rounded-2xl`}>
                  <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {renderContent(msg.content)}
                  </div>
                  <p className="text-xs text-muted-foreground/50 mt-2">
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div className="flex gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 text-primary-foreground animate-pulse" />
              </div>
              <div className="glass-card p-4 rounded-2xl">
                <div className="flex items-center gap-1.5">
                  {[0, 0.2, 0.4].map(delay => (
                    <motion.div
                      key={delay}
                      className="w-2 h-2 rounded-full bg-primary"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Suggested prompts when only welcome message */}
          {messages.length === 1 && !isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 gap-2 mt-4"
            >
              {suggestedPrompts.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="glass-card-hover p-3 text-left text-xs text-muted-foreground hover:text-foreground rounded-xl transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <motion.form
          onSubmit={handleSend}
          className="glass-card p-3 flex items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your research papers, methodologies, or topics..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
          />
          <motion.button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="p-2.5 rounded-lg gradient-primary text-primary-foreground disabled:opacity-40"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </motion.form>
      </div>
    </DashboardLayout>
  );
};

export default Chat;
