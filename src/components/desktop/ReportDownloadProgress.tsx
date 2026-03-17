/**
 * ReportDownloadProgress
 *
 * A global overlay that appears whenever a PDF report is being generated.
 * Subscribes to the reactive reportProgressStore — no props needed.
 * Mount once in the root layout; it auto-shows/hides based on download state.
 */

import { useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileDown } from "lucide-react";
import {
  subscribeReportProgress,
  getReportProgressSnapshot,
} from "@/lib/reportProgressStore";

export default function ReportDownloadProgress() {
  const progress = useSyncExternalStore(
    subscribeReportProgress,
    getReportProgressSnapshot,
  );

  return (
    <AnimatePresence>
      {progress.active && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
        >
          <div className="bg-[#1C2857] text-white rounded-2xl shadow-2xl px-6 py-4 min-w-[320px] max-w-[400px] pointer-events-auto">
            {/* Top row: icon + title + percentage */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <FileDown className="w-4.5 h-4.5 text-[#F6C343]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium tracking-wide truncate">
                    PDF
                  </span>
                  <span className="text-xs font-mono text-white/70 tabular-nums flex-shrink-0">
                    {Math.round(progress.percent)}%
                  </span>
                </div>
                <p className="text-xs text-white/50 mt-0.5 truncate leading-tight">
                  {progress.stepLabel}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#F6C343] to-[#F4A261]"
                initial={{ width: 0 }}
                animate={{ width: `${progress.percent}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
