import { ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import { Shield, Bell, Search } from "lucide-react";

const PAGE_TITLES: Record<string, { title: string; sub: string }> = {
  "/dashboard": { title: "Dashboard", sub: "Portfolio overview & compliance summary" },
  "/plots": { title: "Plot Directory", sub: "All allotted industrial plots" },
  "/compliance": { title: "Compliance Tracker", sub: "Review & update per-plot compliance files" },
  "/assistant": { title: "AI Assistant", sub: "Compliance advisory powered by AI" },
  "/documents": { title: "Document Library", sub: "orders, lease deeds & NOCs" },
  "/reports": { title: "Reports", sub: "Analytics & portfolio summary" },
  "/settings": { title: "Settings", sub: "Account & preferences" },
};

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const sidebarWidth = collapsed ? 72 : 220;
  const page = PAGE_TITLES[location.pathname] ?? { title: "ResearchHub AI", sub: "" };
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  const dateStr = now.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="min-h-screen flex" style={{ background: "#F2F3F7" }}>
      <AppSidebar collapsed={collapsed} onCollapse={setCollapsed} />

      <main className="flex-1 min-h-screen flex flex-col transition-all duration-300" style={{ marginLeft: sidebarWidth }}>

        {/* ── Top toolbar ── */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-6"
          style={{
            height: 54,
            background: "rgba(250,251,253,0.93)",
            backdropFilter: "blur(32px) saturate(2.2)",
            WebkitBackdropFilter: "blur(32px) saturate(2.2)",
            borderBottom: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.8)",
          }}>

          {/* Left: page breadcrumb */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "#AEAEB2" }}>
              <span className="font-semibold" style={{ color: "#8A8A8E" }}>ResearchHub AI</span>
              <span>/</span>
              <span className="font-semibold" style={{ color: "#1D1D1F" }}>{page.title}</span>
            </div>
          </div>

          {/* Center: page title */}
          <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <p className="text-[13px] font-semibold tracking-tight" style={{ color: "#1D1D1F" }}>{page.title}</p>
          </div>

          {/* Right: time + actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-[11px] font-semibold tabular-nums" style={{ color: "#3C3C43" }}>{timeStr}</p>
              <p className="text-[10px]" style={{ color: "#AEAEB2" }}>{dateStr}</p>
            </div>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-black/5" style={{ color: "#8A8A8E" }}>
                <Search className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-black/5 relative" style={{ color: "#8A8A8E" }}>
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 ring-1 ring-white" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Page content ── */}
        <motion.div
          key={location.pathname}
          className="flex-1 p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default DashboardLayout;