import { type LucideIcon, ChevronDown } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AIModuleAccordionProps {
  moduleNumber: number;
  title: string;
  icon: LucideIcon;
  color: string;
  expanded: boolean;
  onToggle: (moduleNumber: number) => void;
  children: React.ReactNode;
}

export function AIModuleAccordion({
  moduleNumber,
  title,
  icon: Icon,
  color,
  expanded,
  onToggle,
  children,
}: AIModuleAccordionProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => onToggle(moduleNumber)}
        className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xs font-bold text-slate-400">
            {String(moduleNumber).padStart(2, "0")}
          </span>
          <span className="text-sm font-semibold text-slate-800 truncate">{title}</span>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-slate-400 transition-transform flex-shrink-0",
            expanded && "rotate-180"
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={prefersReducedMotion ? {} : { height: 0, opacity: 0 }}
            animate={prefersReducedMotion ? {} : { height: "auto", opacity: 1 }}
            exit={prefersReducedMotion ? {} : { height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FieldBlockProps {
  label: string;
  value: string;
  color: string;
}

export function FieldBlock({ label, value, color }: FieldBlockProps) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] font-semibold uppercase" style={{ color }}>
        {label}
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">{value}</p>
    </div>
  );
}
