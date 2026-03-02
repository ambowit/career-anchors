import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  StickyNote,
  TrendingUp,
  LogOut,
  ChevronLeft,
  MessageCircle,
  Lock,
  PanelLeftClose,
  PanelLeft,
  Award,
  BookOpen,
  RefreshCw,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useLanguage";
import { useSidebarCollapse } from "@/hooks/useSidebarCollapse";
import { useIsMobile } from "@/hooks/useIsMobile";
import LanguageSwitcher from "@/components/desktop/LanguageSwitcher";
import RoleSwitcher from "@/components/desktop/RoleSwitcher";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const SCPC_LOGO = "https://b.ux-cdn.com/uxarts/20260226/1eeac3700a3d4b41ad6120512fa02969.png";

export default function ConsultantLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useTranslation();
  const { signOut, profile } = useAuth();
  const { isCollapsed, toggleCollapse } = useSidebarCollapse();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const navItems = [
    { path: "/consultant", icon: LayoutDashboard, label: language === "en" ? "Dashboard" : language === "zh-TW" ? "儀表板" : "仪表盘", end: true },
    { path: "/consultant/clients", icon: Users, label: language === "en" ? "Clients" : language === "zh-TW" ? "客戶管理" : "客户管理" },
    { path: "/consultant/assessments", icon: ClipboardList, label: language === "en" ? "Assessments" : language === "zh-TW" ? "測評派發" : "测评派发" },
    { path: "/consultant/reports", icon: FileText, label: language === "en" ? "Reports" : language === "zh-TW" ? "報告管理" : "报告管理" },
    { path: "/consultant/notes", icon: StickyNote, label: language === "en" ? "Notes" : language === "zh-TW" ? "諮詢備註" : "咨询备注" },
    { path: "/consultant/trends", icon: TrendingUp, label: language === "en" ? "Trends" : language === "zh-TW" ? "趨勢分析" : "趋势分析" },
    { path: "/consultant/messages", icon: MessageCircle, label: language === "en" ? "Messages" : language === "zh-TW" ? "訊息中心" : "消息中心" },
    { path: "/consultant/my-certification", icon: Award, label: language === "en" ? "My Certification" : language === "zh-TW" ? "我的認證" : "我的认证" },
    { path: "/consultant/certification-apply", icon: FileText, label: language === "en" ? "Apply Certification" : language === "zh-TW" ? "認證申請" : "认证申请" },
    { path: "/consultant/cdu-records", icon: BookOpen, label: language === "en" ? "CDU Records" : language === "zh-TW" ? "CDU 記錄" : "CDU 记录" },
    { path: "/consultant/renewal", icon: RefreshCw, label: language === "en" ? "Renewal Status" : language === "zh-TW" ? "換證狀態" : "换证状态" },
  ];

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
              ? "bg-emerald-500/15 text-emerald-400"
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
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-base tracking-tight">SCPC</span>
                <span className="text-[10px] text-emerald-400 font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 whitespace-nowrap">
                  {language === "en" ? "Consultant" : language === "zh-TW" ? "諮詢師" : "咨询师"}
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
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-white font-bold text-base tracking-tight">SCPC</span>
                  <span className="text-[10px] text-emerald-400 font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 whitespace-nowrap">
                    {language === "en" ? "Consultant" : language === "zh-TW" ? "諮詢師" : "咨询师"}
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
            <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">
              {language === "en" ? "Consultant" : language === "zh-TW" ? "諮詢師" : "咨询师"}
            </div>
            <div className="text-white text-sm font-medium truncate">
              {profile?.full_name || profile?.email || "Consultant"}
            </div>
          </div>
        )}

        {(isMobile || !isCollapsed) ? (
          <>
            <NavLink
              to="/consultant/change-password"
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
              {language === "en" ? "Back" : language === "zh-TW" ? "返回使用者端" : "返回用户端"}
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
        "bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex flex-col shadow-xl z-40 transition-all duration-300",
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
          isMobile ? "h-14 px-4" : "h-16 px-8"
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
              {language === "en" ? "Consultant Console" : language === "zh-TW" ? "諮詢師控制台" : "咨询师控制台"}
            </span>
          </div>
          <LanguageSwitcher />
        </div>
        <div className={cn(isMobile ? "p-4" : "p-8")}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
