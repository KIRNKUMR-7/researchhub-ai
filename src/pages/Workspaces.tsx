import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FolderOpen, Plus, FileText, MessageSquare, MoreVertical, Trash2,
  X, ChevronRight, ChevronLeft, Search, BookmarkX, ExternalLink,
  Calendar, Quote, Tag, Brain
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../contexts/AuthContext";
import { workspaceDb, paperDb, chatDb, type Workspace, type Paper } from "../lib/db";
import { formatDistanceToNow } from "date-fns";

const WS_GRADIENTS: Record<string, string> = {
  "182 80% 50%": "from-cyan-500/20 to-teal-500/10",
  "250 70% 60%": "from-violet-500/20 to-purple-500/10",
  "150 70% 45%": "from-emerald-500/20 to-green-500/10",
  "40 90% 55%": "from-amber-500/20 to-yellow-500/10",
  "0 70% 50%": "from-red-500/20 to-rose-500/10",
  "280 70% 60%": "from-purple-500/20 to-pink-500/10",
  "200 75% 50%": "from-sky-500/20 to-blue-500/10",
  "30 85% 55%": "from-orange-500/20 to-amber-500/10",
};

const Workspaces = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [paperCounts, setPaperCounts] = useState<Record<string, number>>({});
  const [chatCounts, setChatCounts] = useState<Record<string, number>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // Drill-down state
  const [activeWs, setActiveWs] = useState<Workspace | null>(null);
  const [wsPapers, setWsPapers] = useState<Paper[]>([]);
  const [paperSearch, setPaperSearch] = useState("");

  const loadData = () => {
    if (!user) return;
    const wsList = workspaceDb.getByUser(user.id);
    setWorkspaces(wsList.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    const pc: Record<string, number> = {};
    const cc: Record<string, number> = {};
    wsList.forEach(ws => {
      pc[ws.id] = paperDb.getByWorkspace(ws.id).length;
      cc[ws.id] = chatDb.getByUserAndWorkspace(user.id, ws.id).filter(m => m.role === "user").length;
    });
    setPaperCounts(pc);
    setChatCounts(cc);
  };

  useEffect(() => { loadData(); }, [user?.id]);

  const openWorkspace = (ws: Workspace) => {
    setActiveWs(ws);
    setPaperSearch("");
    const papers = paperDb.getByWorkspace(ws.id);
    setWsPapers(papers);
  };

  const removePaper = (paperId: string) => {
    paperDb.delete(paperId);
    setWsPapers(prev => prev.filter(p => p.id !== paperId));
    loadData();
  };

  const createWorkspace = () => {
    if (!newName.trim() || !user) return;
    workspaceDb.create(user.id, newName.trim());
    setNewName("");
    setShowCreate(false);
    loadData();
  };

  const deleteWorkspace = (id: string) => {
    workspaceDb.delete(id);
    setOpenMenu(null);
    if (activeWs?.id === id) setActiveWs(null);
    loadData();
  };

  const filteredPapers = paperSearch
    ? wsPapers.filter(p =>
      p.title.toLowerCase().includes(paperSearch.toLowerCase()) ||
      p.authors.toLowerCase().includes(paperSearch.toLowerCase())
    )
    : wsPapers;

  // ── Workspace Detail View ─────────────────────
  if (activeWs) {
    const grad = WS_GRADIENTS[activeWs.color] ?? "from-primary/20 to-primary/5";
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto">
          {/* Back */}
          <button
            onClick={() => { setActiveWs(null); loadData(); }}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            All Workspaces
          </button>

          {/* Header Card */}
          <motion.div
            className={`glass-card p-6 mb-6 bg-gradient-to-br ${grad}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: `hsl(${activeWs.color} / 0.2)` }}
                >
                  <FolderOpen className="w-8 h-8" style={{ color: `hsl(${activeWs.color})` }} />
                </div>
                <div>
                  <h1 className="text-2xl font-display font-bold text-foreground">{activeWs.name}</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Updated {formatDistanceToNow(new Date(activeWs.updatedAt), { addSuffix: true })}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      <span className="font-semibold text-foreground">{wsPapers.length}</span> papers
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MessageSquare className="w-4 h-4" />
                      <span className="font-semibold text-foreground">{chatCounts[activeWs.id] ?? 0}</span> chats
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate("/chat")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-medium"
              >
                <Brain className="w-4 h-4" /> Chat about papers
              </button>
            </div>
          </motion.div>

          {/* Search papers in workspace */}
          {wsPapers.length > 0 && (
            <div className="glass-card p-2 mb-5 flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground ml-3 flex-shrink-0" />
              <input
                type="text"
                value={paperSearch}
                onChange={e => setPaperSearch(e.target.value)}
                placeholder="Search papers in this workspace..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none py-2"
              />
              {paperSearch && (
                <button onClick={() => setPaperSearch("")} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Papers Grid */}
          {wsPapers.length === 0 ? (
            <motion.div
              className="glass-card p-16 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <FileText className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="font-display font-semibold text-foreground text-lg">No papers yet</h3>
              <p className="text-muted-foreground text-sm mt-1">Search for papers and save them to this workspace.</p>
              <button
                onClick={() => navigate("/search")}
                className="mt-5 px-6 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold inline-flex items-center gap-2"
              >
                <Search className="w-4 h-4" /> Search Papers
              </button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground px-1">
                {filteredPapers.length} of {wsPapers.length} papers
                {paperSearch && <span className="text-primary ml-1">matching "{paperSearch}"</span>}
              </p>
              <AnimatePresence>
                {filteredPapers.map((paper, i) => (
                  <motion.div
                    key={paper.id}
                    className="glass-card p-5 group"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: `hsl(${activeWs.color} / 0.15)` }}
                      >
                        <FileText className="w-5 h-5" style={{ color: `hsl(${activeWs.color})` }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground leading-snug">{paper.title}</h3>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" /> {paper.authors}
                          </span>
                          <span className="opacity-40">·</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {paper.date}
                          </span>
                          <span className="opacity-40">·</span>
                          <span className="flex items-center gap-1 text-warning">
                            <Quote className="w-3 h-3" /> {paper.citations?.toLocaleString()} citations
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground/70 mt-2 line-clamp-2 leading-relaxed">
                          {paper.abstract}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                          {paper.tags?.map(tag => (
                            <span key={tag} className="mac-tag">{tag}</span>
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground/50 mt-2">
                          Saved {formatDistanceToNow(new Date(paper.savedAt), { addSuffix: true })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {paper.url && (
                          <a
                            href={paper.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-lg flex items-center justify-center bg-secondary text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                            title="Open paper"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => removePaper(paper.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center bg-secondary text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                          title="Remove from workspace"
                        >
                          <BookmarkX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // ── Workspace Grid ────────────────────────────
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Your <span className="glow-text">Workspaces</span>
            </h1>
            <p className="text-muted-foreground mt-1">Organize your research into project-specific collections.</p>
          </div>
          <motion.button
            onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 rounded-xl gradient-primary text-white font-semibold text-sm flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-4 h-4" /> New Workspace
          </motion.button>
        </motion.div>

        {/* Create dialog */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              className="glass-card p-5 mb-6 flex items-center gap-4"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "hsl(211 100% 50% / 0.15)" }}
              >
                <FolderOpen className="w-5 h-5 text-primary" />
              </div>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Workspace name, e.g. Medical Imaging Research..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground input-glow focus:outline-none focus:border-primary/50 text-sm"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && createWorkspace()}
              />
              <motion.button
                onClick={createWorkspace}
                className="px-5 py-2.5 rounded-xl gradient-primary text-white font-semibold text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Create
              </motion.button>
              <button
                onClick={() => setShowCreate(false)}
                className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {workspaces.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-20 text-center"
          >
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <FolderOpen className="w-10 h-10 text-primary/50" />
            </div>
            <h3 className="font-display font-semibold text-foreground text-xl">No workspaces yet</h3>
            <p className="text-muted-foreground text-sm mt-2">Create your first workspace to organize your research papers.</p>
            <motion.button
              onClick={() => setShowCreate(true)}
              className="mt-6 px-7 py-3 rounded-xl gradient-primary text-white font-semibold text-sm inline-flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <Plus className="w-4 h-4" /> Create Workspace
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {workspaces.map((ws, i) => {
              const grad = WS_GRADIENTS[ws.color] ?? "from-primary/20 to-primary/5";
              const paperCount = paperCounts[ws.id] ?? 0;
              return (
                <motion.div
                  key={ws.id}
                  className={`glass-card-hover p-6 group cursor-pointer relative bg-gradient-to-br ${grad}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -6 }}
                  onClick={() => openWorkspace(ws)}
                >
                  {/* Color accent bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5 rounded-t-[10px]"
                    style={{ background: `hsl(${ws.color})` }}
                  />

                  <div className="flex items-start justify-between">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: `hsl(${ws.color} / 0.15)` }}
                    >
                      <FolderOpen className="w-6 h-6" style={{ color: `hsl(${ws.color})` }} />
                    </div>
                    <div className="relative" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setOpenMenu(openMenu === ws.id ? null : ws.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-secondary"
                      >
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <AnimatePresence>
                        {openMenu === ws.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute right-0 top-9 z-10 glass-card p-1 min-w-[160px] shadow-2xl"
                          >
                            <button
                              onClick={() => deleteWorkspace(ws.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" /> Delete workspace
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <h3 className="font-display font-semibold text-lg text-foreground mt-4 leading-tight">{ws.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Updated {formatDistanceToNow(new Date(ws.updatedAt), { addSuffix: true })}
                  </p>

                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      <span className="font-semibold text-foreground">{paperCount}</span> papers
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MessageSquare className="w-4 h-4" />
                      <span className="font-semibold text-foreground">{chatCounts[ws.id] ?? 0}</span> chats
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 ml-auto group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Workspaces;
