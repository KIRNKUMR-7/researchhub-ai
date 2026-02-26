import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: string;
  delay?: number;
  color?: string; // hsl string e.g. "211 100% 50%"
}

const StatsCard = ({ icon: Icon, label, value, change, delay = 0, color = "211 100% 50%" }: StatsCardProps) => {
  return (
    <motion.div
      className="widget-card p-5 group cursor-default relative overflow-hidden"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.45,
        delay,
        type: "spring",
        damping: 20,
        stiffness: 260,
      }}
      whileHover={{ y: -4 }}
    >
      {/* Subtle colour tint at top-right */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.08] pointer-events-none"
        style={{ background: `hsl(${color})` }}
      />

      <div className="flex items-start justify-between relative">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">{label}</p>
          <motion.p
            className="text-3xl font-bold text-foreground mt-2 tracking-tight tabular-nums"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.45, delay: delay + 0.18, type: "spring", damping: 14, stiffness: 260 }}
          >
            {value}
          </motion.p>
          {change && (
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">{change}</p>
          )}
        </div>
        <motion.div
          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: `hsl(${color} / 0.12)` }}
          whileHover={{ scale: 1.12, rotate: 6 }}
          transition={{ type: "spring", damping: 12, stiffness: 300 }}
        >
          <Icon className="w-5 h-5" style={{ color: `hsl(${color})` }} />
        </motion.div>
      </div>

      {/* Bottom accent bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, hsl(${color}), hsl(${color} / 0.3))` }}
      />
    </motion.div>
  );
};

export default StatsCard;
