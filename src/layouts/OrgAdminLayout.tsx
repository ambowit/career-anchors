import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderTree,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  MessageCircle,
  Lock,
  ShieldCheck,
  FileBarChart,
  PanelLeftClose,
  PanelLeft,
  Award,
  BookOpen,
  RefreshCw,
  Menu,
  X,
  Link2,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useTranslation } from "@/hooks/useLanguage";
import { useSidebarCollapse } from "@/hooks/useSidebarCollapse";
import { useIsMobile } from "@/hooks/useIsMobile";
import LanguageSwitcher from "@/components/desktop/LanguageSwitcher";
import RoleSwitcher from "@/components/desktop/RoleSwitcher";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useFeaturePermissions, type FeatureKey } from "@/hooks/useFeaturePermissions";
import { useOrgInfo } from "@/hooks/useAdminData";

const SCPC_LOGO = "https://b.ux-cdn.com/uxarts/20260226/1eeac3700a3d4b41ad6120512fa02969.png";

export default function OrgAdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useTranslation();
  const { signOut, profile } = useAuth();
  const { roleLabel, canAccess } = usePermissions();
  const { isCollapsed, toggleCollapse } = useSidebarCollapse();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { hasFeature } = useFeaturePermissions();
  const { data: orgInfo } = useOrgInfo();
  const orgDisplayName = orgInfo?.name || "";
  const orgLogoUrl = orgInfo?.logo_url || "";

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen, isMobile]);

  const allNavItems: Array<{ path: string; icon: React.ElementType; label: string; end?: boolean; module: string; featureKey?: FeatureKey }> = [
    { path: "/org", icon: LayoutDashboard, label: language === "en" ? "Dashboard" : language === "zh-TW" ? "儀表板" : "仪表盘", end: true, module: "dashboard" as const },
    { path: "/org/users", icon: Users, label: language === "en" ? "User Management" : language === "zh-TW" ? "使用者管理" : "用户管理", module: "users" as const },
    { path: "/org/roles", icon: ShieldCheck, label: language === "en" ? "Role Management" : language === "zh-TW" ? "角色管理" : "角色管理", module: "users" as const },
    { path: "/org/departments", icon: FolderTree, label: language === "en" ? "Departments" : language === "zh-TW" ? "部門管理" : "部门管理", module: "departments" as const },
    { path: "/org/assessments", icon: ClipboardList, label: language === "en" ? "Assessments" : language === "zh-TW" ? "測評管理" : "测评管理", module: "assessments" as const },
    { path: "/org/analytics", icon: BarChart3, label: language === "en" ? "Analytics" : language === "zh-TW" ? "資料分析" : "数据分析", module: "analytics" as const, featureKey: "analytics" },
    { path: "/org/assessment-reports", icon: FileBarChart, label: language === "en" ? "Assessment Reports" : language === "zh-TW" ? "測評報告" : "测评报告", module: "reports" as const },
    { path: "/org/messages", icon: MessageCircle, label: language === "en" ? "Messages" : language === "zh-TW" ? "機構訊息" : "机构消息", module: "dashboard" as const, featureKey: "message" },
    { path: "/org/certification-overview", icon: Award, label: language === "en" ? "Certification" : language === "zh-TW" ? "認證總覽" : "认证总览", module: "dashboard" as const, featureKey: "certification" },
    { path: "/org/cdu-monitoring", icon: BookOpen, label: language === "en" ? "CDU Monitoring" : language === "zh-TW" ? "CDU 監控" : "CDU 监控", module: "dashboard" as const, featureKey: "cdu_records" },
    { path: "/org/renewal-approval", icon: RefreshCw, label: language === "en" ? "Renewal Approval" : language === "zh-TW" ? "換證審核" : "换证审核", module: "dashboard" as const, featureKey: "certification" },
    { path: "/org/batch-assessment", icon: Layers, label: language === "en" ? "Batch Assessment" : language === "zh-TW" ? "批次施測" : "批次施测", module: "dashboard" as const },
    { path: "/org/anonymous-assessment", icon: Link2, label: language === "en" ? "Anonymous Assessment" : language === "zh-TW" ? "匿名測評" : "匿名测评", module: "dashboard" as const, featureKey: "anonymous_assessment" as FeatureKey },
    { path: "/org/settings", icon: Settings, label: language === "en" ? "Settings" : language === "zh-TW" ? "設定" : "设置", module: "system_settings" as const },
  ];

  const navItems = allNavItems.filter((item) => canAccess(item.module) && (!item.featureKey || hasFeature(item.featureKey)));

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const sidebarWidth = isCollapsed ? "w-[72px]" : "w-64";
  const mainMargin = isCollapsed ? "ml-[72px]" : "ml-64";

  const renderNavItem = (item: { path: string; icon: React.ElementType; label: string; end?: boolean }) => {
    const { path, icon: Icon, label, end } = item;
    const showLabel = isMobile || !isCollapsed;

    const linkElement = (
      <NavLink
        key={path}
        to={path}
        end={end}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 rounded-lg text-sm font-medium transition-all",
            !isMobile && isCollapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5",
            isActive
              ? "bg-sky-500/15 text-sky-300"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          )
        }
      >
        <Icon className="w-[18px] h-[18px] flex-shrink-0" />
        {showLabel && label}
      </NavLink>
    );

    if (!isMobile && isCollapsed) {
      return (
        <Tooltip key={path} delayDuration={100}>
          <TooltipTrigger asChild>{linkElement}</TooltipTrigger>
          <TooltipContent side="right" className="text-xs">{label}</TooltipContent>
        </Tooltip>
      );
    }
    return linkElement;
  };

  const sidebarContent = (
    <>
      {/* Logo Header */}
      <div className={cn("h-16 flex items-center border-b border-white/10", isMobile ? "px-4 justify-between" : "")}>
        {isMobile ? (
          <>
            <Link to="/" className="flex items-center gap-3">
              <img src={SCPC_LOGO} alt="SCPC" className="h-8 w-8 rounded object-contain" />
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-bold text-base tracking-tight">SCPC</span>
                  {orgLogoUrl && <img src={orgLogoUrl} alt="" className="h-5 w-5 rounded object-contain flex-shrink-0" />}
                  {orgDisplayName && <span className="text-sky-200/80 text-xs font-medium truncate max-w-[120px]">{orgDisplayName}</span>}
                </div>
                <span className="text-[10px] text-sky-300/70 font-medium">
                  {language === "en" ? "Organization" : language === "zh-TW" ? "機構管理" : "机构管理"}
                </span>
              </div>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </>
        ) : (
          <>
            <Link to="/" className={cn(
              "flex items-center flex-1 h-full hover:bg-white/5 transition-colors",
              isCollapsed ? "justify-center px-2" : "px-4 gap-3"
            )}>
              <img src={SCPC_LOGO} alt="SCPC" className="h-8 w-8 rounded object-contain flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-bold text-base tracking-tight">SCPC</span>
                    {orgLogoUrl && <img src={orgLogoUrl} alt="" className="h-5 w-5 rounded object-contain flex-shrink-0" />}
                    {orgDisplayName && <span className="text-sky-200/80 text-xs font-medium truncate max-w-[120px]">{orgDisplayName}</span>}
                  </div>
                  <span className="text-[10px] text-sky-300/70 font-medium">
                    {language === "en" ? "Organization" : language === "zh-TW" ? "機構管理" : "机构管理"}
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
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 overflow-y-auto py-6", isMobile ? "px-3" : isCollapsed ? "px-2" : "px-3")}>
        <div className="space-y-0.5">
          {navItems.map(renderNavItem)}
        </div>
      </nav>

      {/* Footer */}
      <div className={cn("border-t border-white/10", isMobile ? "p-3" : isCollapsed ? "p-2" : "p-4")}>
        {/* Role Switcher */}
        <div className={cn(!isMobile && isCollapsed ? "mb-1" : "mb-3")}>
          <RoleSwitcher collapsed={!isMobile && isCollapsed} />
        </div>

        {(isMobile || !isCollapsed) && (
          <div className="px-3 py-2.5 mb-3 rounded-lg bg-white/5">
            <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">{roleLabel}</div>
            <div className="text-white text-sm font-medium truncate">
              {profile?.full_name || profile?.email || "Admin"}
            </div>
          </div>
        )}

        {(isMobile || !isCollapsed) ? (
          <>
            <NavLink
              to="/org/change-password"
              className={({ isActive }) =>
                cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5",
                  isActive ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                )
              }
            >
              <Lock className="w-4 h-4" />
              {language === "en" ? "Change Password" : language === "zh-TW" ? "修改密碼" : "修改密码"}
            </NavLink>
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
              {language === "en" ? "Logout" : language === "zh-TW" ? "登出" : "退出登录"}
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
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile: Overlay backdrop */}
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "bg-gradient-to-b from-[#1C2857] to-[#162046] flex flex-col shadow-xl z-40 transition-all duration-300",
        isMobile
          ? cn(
              "fixed inset-y-0 left-0 w-72 transform",
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )
          : cn("fixed inset-y-0 left-0 z-20", sidebarWidth)
      )}>
        {sidebarContent}
      </aside>

      {/* Main area */}
      <main className={cn(
        "flex-1 overflow-auto transition-all duration-300",
        isMobile ? "ml-0" : mainMargin
      )}>
        {/* Top bar */}
        <div className={cn(
          "flex items-center justify-between border-b border-slate-200 bg-white sticky top-0 z-10",
          isMobile ? "h-14 px-4 pt-[env(safe-area-inset-top)]" : "h-16 px-8"
        )}>
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-1.5 -ml-1 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <img src={SCPC_LOGO} alt="SCPC" className={cn("opacity-60", isMobile ? "h-6 w-6" : "h-7 w-7")} />
            <span className={cn("text-slate-400 font-medium", isMobile ? "text-xs" : "text-sm")}>
              {language === "en" ? "Organization Console" : language === "zh-TW" ? "機構控制台" : "机构控制台"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isMobile && (
              <button
                onClick={() => navigate("/")}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors"
              >
                {language === "en" ? "User Mode" : language === "zh-TW" ? "使用者" : "使用者"}
              </button>
            )}
            <LanguageSwitcher />
          </div>
        </div>
        <div className={cn("admin-page-content", isMobile ? "p-4 overflow-x-auto" : "p-8")}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
