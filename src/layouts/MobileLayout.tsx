import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, ClipboardList, User, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useLanguage";
import PWAInstallPrompt from "@/components/mobile/PWAInstallPrompt";

export default function MobileLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useTranslation();

  // Hide bottom nav on assessment page for immersive experience
  const hideBottomNav = location.pathname === "/assessment" || location.pathname === "/ideal-card-test";

  // Localized nav items
  const navItems = [
    { path: "/", icon: Home, label: language === "en" ? "Home" : language === "zh-TW" ? "首頁" : "首页" },
    { path: "/start-assessment", icon: ClipboardList, label: language === "en" ? "Assess" : language === "zh-TW" ? "測評" : "测评" },
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
              // "start-assessment" is a virtual path — map active state to homepage
              const activePath = path === "/start-assessment" ? null : path;
              const isActive = activePath !== null && (
                location.pathname === activePath ||
                (activePath !== "/" && location.pathname.startsWith(activePath))
              );

              const handleClick = () => {
                if (path === "/start-assessment") {
                  // Navigate to home with state flag to trigger assessment flow
                  navigate("/", { state: { startAssessment: true } });
                } else {
                  navigate(path);
                }
              };

              return (
                <button
                  key={path}
                  onClick={handleClick}
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
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
