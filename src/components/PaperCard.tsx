import { motion } from "framer-motion";
import { FileText, Bookmark, BookmarkCheck, ExternalLink } from "lucide-react";

interface PaperCardProps {
  title: string;
  authors: string;
  date: string;
  abstract: string;
  citations: number;
  tags: string[];
  delay?: number;
  url?: string;
  saved?: boolean;
  onSave?: () => void;
  onClick?: () => void;
  selected?: boolean;
}

const PaperCard = ({
  title, authors, date, abstract, citations, tags,
  delay = 0, url, saved = false, onSave, onClick, selected = false,
}: PaperCardProps) => {
  return (
    <motion.div
      className={`widget-card p-5 group cursor-pointer relative overflow-hidden ${selected
          ? "ring-2 ring-primary/40 !bg-gradient-to-br from-primary/5 to-violet-500/5"
          : ""
        }`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, type: "spring", damping: 20, stiffness: 260 }}
      whileHover={{ y: -3 }}
      onClick={onClick}
    >
      {/* Hover shimmer line at top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: "linear-gradient(90deg, #007AFF, #5E5CE6, #BF5AF2)" }} />

      <div className="flex items-start gap-4">
        {/* Icon */}
        <motion.div
          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: "hsl(211 100% 50% / 0.1)" }}
          whileHover={{ scale: 1.08, rotate: 5 }}
          transition={{ type: "spring", damping: 10, stiffness: 300 }}
        >
          <FileText className="w-5 h-5 text-primary" />
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5 flex-wrap">
            <span className="font-medium">{authors}</span>
            <span className="opacity-30">·</span>
            <span>{date}</span>
            <span className="opacity-30">·</span>
            <span className="font-semibold" style={{ color: "hsl(38 100% 45%)" }}>
              {citations.toLocaleString()} citations
            </span>
          </p>
          <p className="text-xs text-muted-foreground/70 mt-2 line-clamp-2 leading-relaxed">{abstract}</p>
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            {tags.map((tag) => (
              <span key={tag} className="mac-tag">{tag}</span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 flex-shrink-0 pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {onSave && (
            <motion.button
              onClick={(e) => { e.stopPropagation(); if (!saved) onSave(); }}
              title={saved ? "Saved" : "Save to workspace"}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${saved
                  ? "bg-success/10 text-success border border-success/20"
                  : "bg-white border border-gray-200 text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 shadow-sm"
                }`}
              whileTap={{ scale: 0.88 }}
            >
              {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </motion.button>
          )}
          {url && (
            <motion.a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Open paper"
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-white border border-gray-200 text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 shadow-sm transition-all"
              whileTap={{ scale: 0.88 }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </motion.a>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PaperCard;
