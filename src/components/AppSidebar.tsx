import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Map, ClipboardCheck, Bot,
  FileText, BarChart3, Settings, LogOut,
  ChevronLeft, ChevronRight, Shield
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface AppSidebarProps {
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Map, label: "Plot Directory", path: "/plots" },
  { icon: ClipboardCheck, label: "Compliance", path: "/compliance" },
  { icon: Bot, label: "AI Assistant", path: "/assistant" },
  { icon: FileText, label: "Documents", path: "/documents" },
  { icon: BarChart3, label: "Reports", path: "/reports" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const AppSidebar = ({ collapsed, onCollapse }: AppSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => { logout(); navigate("/"); };
  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "PG";
  const width = collapsed ? 72 : 224;

  return (
    <motion.aside
      className="fixed left-0 top-0 h-screen z-50 flex flex-col mac-sidebar"
      animate={{ width }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Header */}
      <div className="flex items-center px-4 flex-shrink-0"
        style={{ height: 52, borderBottom: "1px solid rgba(181,255,77,0.1)" }}>
        <div className="flex items-center gap-2.5">
          {/* Logo mark */}
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#B5FF4D" }}>
            <Shield className="w-4 h-4" style={{ color: "#0F1F16" }} />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <p className="text-sm font-bold whitespace-nowrap tracking-tight" style={{ color: "#FFFFFF" }}>
                  ResearchHub
                </p>
                <p className="text-[9px] font-semibold uppercase tracking-widest whitespace-nowrap" style={{ color: "rgba(181,255,77,0.6)" }}>
                  AI Platform
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Section label */}
      {!collapsed && (
        <div className="px-3 pt-5 pb-1">
          <p className="text-[10px] font-bold uppercase tracking-widest px-2" style={{ color: "rgba(255,255,255,0.2)" }}>Monitor</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-hidden">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}>
              <motion.div
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${isActive ? "zf-nav-item active" : "zf-nav-item"}`}
                whileTap={{ scale: 0.97 }}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }}
                      className="whitespace-nowrap overflow-hidden text-sm font-semibold">
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 space-y-0.5" style={{ borderTop: "1px solid rgba(181,255,77,0.08)" }}>
        {user && (
          <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-default ${collapsed ? "justify-center" : ""}`}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
              style={{ background: "#B5FF4D", color: "#0F1F16" }}>
              {initials}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: "#FFFFFF" }}>{user.name}</p>
                  <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{(user as any).role ?? "Officer"}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <button onClick={handleLogout} className="w-full">
          <div className="zf-nav-item w-full hover:!text-red-400"
            title={collapsed ? "Sign out" : undefined}>
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap text-sm">
                  Sign Out
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </button>

        <button onClick={() => onCollapse(!collapsed)} className="w-full">
          <div className="zf-nav-item w-full" title={collapsed ? "Expand" : "Collapse"}>
            {collapsed ? <ChevronRight className="w-[18px] h-[18px] flex-shrink-0" /> : <ChevronLeft className="w-[18px] h-[18px] flex-shrink-0" />}
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap text-sm">Collapse</motion.span>
              )}
            </AnimatePresence>
          </div>
        </button>
      </div>
    </motion.aside>
  );
};

export default AppSidebar;
