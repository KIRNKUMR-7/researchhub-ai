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
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", color: "hsl(211 100% 50%)" },
  { icon: Map, label: "Plot Directory", path: "/plots", color: "hsl(142 71% 40%)" },
  { icon: ClipboardCheck, label: "Compliance", path: "/compliance", color: "hsl(252 85% 60%)" },
  { icon: Bot, label: "AI Assistant", path: "/assistant", color: "hsl(280 70% 55%)" },
  { icon: FileText, label: "Documents", path: "/documents", color: "hsl(38 100% 50%)" },
  { icon: BarChart3, label: "Reports", path: "/reports", color: "hsl(0 84% 55%)" },
  { icon: Settings, label: "Settings", path: "/settings", color: "hsl(240 4% 50%)" },
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
        style={{ height: 44, borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }}
                className="text-sm font-bold whitespace-nowrap tracking-tight overflow-hidden" style={{ color: "#1D1D1F" }}>
                PlotGuardian
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Section label */}
      {!collapsed && (
        <div className="px-3 pt-5 pb-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest px-2" style={{ color: "#AEAEB2" }}>Monitor</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-hidden">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}>
              <motion.div
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer"
                style={{
                  color: isActive ? item.color : "#6E6E73",
                  background: isActive ? `${item.color.replace("hsl(", "hsl(").replace(")", " / 0.1)")}` : "transparent",
                  boxShadow: isActive ? `inset 0 0 0 1px ${item.color.replace(")", " / 0.2)")}` : "none",
                }}
                whileTap={{ scale: 0.97 }}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }}
                      className="whitespace-nowrap overflow-hidden font-semibold">
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
      <div className="px-2 py-3 space-y-0.5" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
        {user && (
          <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-default ${collapsed ? "justify-center" : ""}`}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white gradient-primary">
              {initials}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: "#1D1D1F" }}>{user.name}</p>
                  <p className="text-[10px] truncate" style={{ color: "#8A8A8E" }}>{(user as any).role ?? "Officer"}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <button onClick={handleLogout} className="w-full">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-red-50"
            style={{ color: "#8A8A8E" }} title={collapsed ? "Sign out" : undefined}>
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap hover:text-red-500 transition-colors">
                  Sign Out
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </button>

        <button onClick={() => onCollapse(!collapsed)} className="w-full">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-gray-100"
            style={{ color: "#8A8A8E" }} title={collapsed ? "Expand" : "Collapse"}>
            {collapsed ? <ChevronRight className="w-[18px] h-[18px] flex-shrink-0" /> : <ChevronLeft className="w-[18px] h-[18px] flex-shrink-0" />}
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">Collapse</motion.span>
              )}
            </AnimatePresence>
          </div>
        </button>
      </div>
    </motion.aside>
  );
};

export default AppSidebar;
