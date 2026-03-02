import { useState, useCallback } from "react";

const STORAGE_KEY = "scpc_sidebar_collapsed";

export function useSidebarCollapse() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((previous) => {
      const next = !previous;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return { isCollapsed, toggleCollapse };
}
