import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Home, ClipboardList, User, History, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTestAuth } from "@/hooks/useTestAuth";
import { useTranslation } from "@/hooks/useLanguage";
import PWAInstallPrompt from "@/components/mobile/PWAInstallPrompt";

export default function MobileLayout() {
  const location = useLocation();
  const { language } = useTranslation();
  const { user } = useAuth();
  const { isTestLoggedIn } = useTestAuth();

  // Check if user is logged in (either real or test account)
  const isLoggedIn = !!user || isTestLoggedIn;

  // Hide bottom nav on assessment page for immersive experience
  const hideBottomNav = location.pathname === "/assessment";

  // Localized nav items
  const navItems = [
    { path: "/", icon: Home, label: language === "en" ? "Home" : language === "zh-TW" ? "首頁" : "首页" },
    { path: "/assessment", icon: ClipboardList, label: language === "en" ? "Assess" : language === "zh-TW" ? "測評" : "测评" },
    { path: "/history", icon: FileText, label: language === "en" ? "History" : language === "zh-TW" ? "記錄" : "记录" },
    { path: "/profile", icon: User, label: language === "en" ? "Profile" : language === "zh-TW" ? "我的" : "我的" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <main className="flex-1" style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom, 0px) + 0.5rem)" }}>
        <Outlet />
      </main>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Bottom Navigation */}
      {!hideBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-50" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          <div className="flex items-center justify-around h-16">
            {navItems.map(({ path, icon: Icon, label }) => {
              const isActive = location.pathname === path || 
                (path !== "/" && location.pathname.startsWith(path));
              const needsAuth = path === "/history" || path === "/profile";

              // If needs auth and not logged in, redirect to home (where login dropdown is)
              const targetPath = needsAuth && !isLoggedIn ? "/" : path;

              return (
                <NavLink
                  key={path}
                  to={targetPath}
                  className={cn(
                    "flex flex-col items-center justify-center w-16 h-full transition-colors",
                    isActive 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon 
                    className={cn(
                      "w-5 h-5 mb-1 transition-transform",
                      isActive && "scale-110"
                    )} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className={cn(
                    "text-xs",
                    isActive && "font-medium"
                  )}>
                    {label}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
