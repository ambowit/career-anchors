import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard,
  FileQuestion,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  Users,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTestAuth } from "@/hooks/useTestAuth";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useLanguage";
import { useSidebarCollapse } from "@/hooks/useSidebarCollapse";
import LanguageSwitcher from "@/components/desktop/LanguageSwitcher";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

const SCPC_LOGO = "https://b.ux-cdn.com/uxarts/20260226/1eeac3700a3d4b41ad6120512fa02969.png";

export default function AdminLayout() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { testLogout, testRole } = useTestAuth();
  const { user, profile } = useAuth();
  const { isCollapsed, toggleCollapse } = useSidebarCollapse();

  const navItems = [
    { path: "/admin", icon: LayoutDashboard, label: t("admin.dashboard"), end: true },
    { path: "/admin/questions", icon: FileQuestion, label: t("admin.questions") },
    { path: "/admin/analytics", icon: BarChart3, label: t("admin.analytics") },
    { path: "/admin/users", icon: Users, label: t("admin.users") },
    { path: "/admin/settings", icon: Settings, label: t("admin.settings") },
  ];

  const handleLogout = () => {
    testLogout();
    toast.success(language === "en" ? "Logged out" : language === "zh-TW" ? "已登出" : "已退出管理员账户");
    navigate("/");
  };

  const sidebarWidth = isCollapsed ? "w-[72px]" : "w-64";
  const mainMargin = isCollapsed ? "ml-[72px]" : "ml-64";

  const renderNavItem = (item: { path: string; icon: React.ElementType; label: string; end?: boolean }) => {
    const { path, icon: Icon, label, end } = item;
    const linkElement = (
      <NavLink
        key={path}
        to={path}
        end={end}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 rounded-lg text-sm font-medium transition-all",
            isCollapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5",
            isActive
              ? "bg-sky-500/15 text-sky-300"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          )
        }
      >
        <Icon className="w-[18px] h-[18px] flex-shrink-0" />
        {!isCollapsed && label}
      </NavLink>
    );

    if (isCollapsed) {
      return (
        <Tooltip key={path} delayDuration={100}>
          <TooltipTrigger asChild>{linkElement}</TooltipTrigger>
          <TooltipContent side="right" className="text-xs">{label}</TooltipContent>
        </Tooltip>
      );
    }
    return linkElement;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className={cn(
        "bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col shadow-xl fixed inset-y-0 left-0 z-20 transition-all duration-300",
        sidebarWidth
      )}>
        {/* Logo + Collapse Toggle */}
        <div className="h-16 flex items-center border-b border-white/10">
          <Link to="/" className={cn(
            "flex items-center flex-1 h-full hover:bg-white/5 transition-colors",
            isCollapsed ? "justify-center px-2" : "px-4 gap-3"
          )}>
            <img src={SCPC_LOGO} alt="SCPC" className="h-8 w-8 rounded object-contain flex-shrink-0" />
            {!isCollapsed && (
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-white font-bold text-base tracking-tight">SCPC</span>
                <span className="text-slate-400 text-sm">
                  {language === "en" ? "Admin" : language === "zh-TW" ? "管理後台" : "管理后台"}
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={toggleCollapse}
            className={cn(
              "flex items-center justify-center h-full border-l border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-colors",
              isCollapsed ? "w-full border-l-0 border-t border-white/5" : "w-10 flex-shrink-0"
            )}
            title={isCollapsed ? (language === "en" ? "Expand" : language === "zh-TW" ? "展開選單" : "展开菜单") : (language === "en" ? "Collapse" : language === "zh-TW" ? "收起選單" : "收起菜单")}
          >
            {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className={cn("flex-1 overflow-y-auto py-6", isCollapsed ? "px-2" : "px-3")}>
          <div className="space-y-0.5">
            {navItems.map(renderNavItem)}
          </div>
        </nav>

        {/* Footer */}
        <div className={cn("border-t border-white/10", isCollapsed ? "p-2" : "p-4")}>
          {!isCollapsed && (
            <div className="px-3 py-2.5 mb-3 rounded-lg bg-white/5">
              <div className="text-slate-500 text-xs mb-0.5">
                {language === "en" ? "Current Account" : language === "zh-TW" ? "當前帳戶" : "当前账户"}
              </div>
              <div className="text-white text-sm font-semibold truncate">
                {profile?.full_name || user?.email?.split("@")[0] || testRole}
              </div>
            </div>
          )}

          {!isCollapsed ? (
            <>
              <button
                onClick={() => navigate("/")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                {language === "en" ? "Back to User" : language === "zh-TW" ? "返回使用者端" : "返回用户端"}
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-4 h-4" />
                {t("common.logout")}
              </button>
            </>
          ) : (
            <div className="space-y-1">
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => navigate("/")}
                    className="w-full flex justify-center p-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <ChevronLeft className="w-[18px] h-[18px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">{language === "en" ? "Back" : "返回"}</TooltipContent>
              </Tooltip>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleLogout}
                    className="w-full flex justify-center p-2.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                  >
                    <LogOut className="w-[18px] h-[18px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">{language === "en" ? "Logout" : language === "zh-TW" ? "登出" : "退出登录"}</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </aside>

      <main className={cn("flex-1 overflow-auto transition-all duration-300", mainMargin)}>
        <div className="h-16 px-8 flex items-center justify-between border-b border-slate-200 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <img src={SCPC_LOGO} alt="SCPC" className="h-7 w-7 opacity-60" />
            <span className="text-sm text-slate-400 font-medium">
              {language === "en" ? "Admin Dashboard" : language === "zh-TW" ? "管理後台" : "管理后台"}
            </span>
          </div>
          <LanguageSwitcher />
        </div>
        <div className="p-8 admin-page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
