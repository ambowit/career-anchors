import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCog,
  FileQuestion,
  ShieldCheck,
  ScrollText,
  Settings,
  LogOut,
  KeyRound,
  FileBarChart,
  CreditCard,
  MessageSquareWarning,
  Lock,
  BarChart3,
  PanelLeftClose,
  PanelLeft,
  Award,
  BookOpen,
  Library,
  FileSpreadsheet,
  Layers,
  Menu,
  X,
  ClipboardCheck,
  TableProperties,
  ListChecks,
  Upload,
  Gift,
  Tag,
  Blocks,
  Cog,
  Heart,
  Combine,
  UserCheck,
  ScanEye,
  ShieldAlert,
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

export default function SuperAdminLayout() {
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

  const navSections = [
    {
      label: language === "en" ? "Platform" : language === "zh-TW" ? "平台管理" : "平台管理",
      items: [
        { path: "/super-admin", icon: LayoutDashboard, label: language === "en" ? "Dashboard" : language === "zh-TW" ? "儀表板" : "仪表盘", end: true },
        { path: "/super-admin/organizations", icon: Building2, label: language === "en" ? "Organizations" : language === "zh-TW" ? "機構管理" : "机构管理" },
        { path: "/super-admin/org-types", icon: Tag, label: language === "en" ? "Org Types" : language === "zh-TW" ? "機構類型" : "机构类型" },
        { path: "/super-admin/consultants", icon: UserCog, label: language === "en" ? "Consultants" : language === "zh-TW" ? "諮詢師管理" : "咨询师管理" },
        { path: "/super-admin/users", icon: Users, label: language === "en" ? "User Management" : language === "zh-TW" ? "使用者管理" : "用户管理" },
        { path: "/super-admin/roles", icon: ShieldCheck, label: language === "en" ? "Role Management" : language === "zh-TW" ? "角色管理" : "角色管理" },
      ],
    },
    {
      label: language === "en" ? "Content" : language === "zh-TW" ? "內容管理" : "内容管理",
      items: [
        { path: "/super-admin/questions", icon: FileQuestion, label: language === "en" ? "Question Bank" : language === "zh-TW" ? "題庫管理" : "题库管理" },
        { path: "/super-admin/report-generator", icon: Blocks, label: language === "en" ? "Career Anchor Report Generator" : language === "zh-TW" ? "職業錨報告生成器" : "职业锚报告生成器" },
        { path: "/super-admin/assessment-reports", icon: BarChart3, label: language === "en" ? "Assessment Reports" : language === "zh-TW" ? "測評報告" : "测评报告" },
        { path: "/super-admin/life-cards", icon: Heart, label: language === "en" ? "Espresso Card Report Generator" : language === "zh-TW" ? "理想人生報告生成器" : "理想人生报告生成器" },
        { path: "/super-admin/fusion-rules", icon: Combine, label: language === "en" ? "Integration Rules" : language === "zh-TW" ? "整合規則" : "整合规则" },
      ],
    },
    {
      label: language === "en" ? "Certification" : language === "zh-TW" ? "認證管理" : "认证管理",
      items: [
        { path: "/super-admin/certification", icon: Award, label: language === "en" ? "Issue Certificate" : language === "zh-TW" ? "頒發證號" : "颁发证号" },
        { path: "/super-admin/certification-review", icon: ClipboardCheck, label: language === "en" ? "Certification Review" : language === "zh-TW" ? "認證審查" : "认证审查" },
        { path: "/super-admin/certificate-registry", icon: ListChecks, label: language === "en" ? "Certificate Registry" : language === "zh-TW" ? "證照清單" : "证照清单" },
        { path: "/super-admin/course-library", icon: Library, label: language === "en" ? "Course Library" : language === "zh-TW" ? "官方課程庫" : "官方课程库" },
        { path: "/super-admin/cdu-audit", icon: BookOpen, label: language === "en" ? "CDU Audit" : language === "zh-TW" ? "CDU 審核" : "CDU 审核" },
        { path: "/super-admin/batch-cdu-review", icon: TableProperties, label: language === "en" ? "Batch CDU Review" : language === "zh-TW" ? "批次 CDU 審核" : "批次 CDU 审核" },
        { path: "/super-admin/batch-operations", icon: Upload, label: language === "en" ? "Account Setup" : language === "zh-TW" ? "帳號開通" : "账号开通" },
        { path: "/super-admin/gcqa-export", icon: FileSpreadsheet, label: language === "en" ? "GCQA Export" : language === "zh-TW" ? "GCQA 資料匯出" : "GCQA 资料导出" },
      ],
    },
    {
      label: language === "en" ? "Assessment Center" : language === "zh-TW" ? "施測中心" : "施测中心",
      items: [
        { path: "/super-admin/batch-assessment", icon: Layers, label: language === "en" ? "Batch Assessment" : language === "zh-TW" ? "批次施測" : "批次施测", end: true },
        { path: "/super-admin/anonymous-assessment", icon: ScanEye, label: language === "en" ? "Anonymous Assessment" : language === "zh-TW" ? "匿名測評" : "匿名测评", end: true },
        { path: "/super-admin/anonymous-assessment/permissions", icon: ShieldAlert, label: language === "en" ? "Permissions" : language === "zh-TW" ? "權限設定" : "权限设置" },
      ],
    },
    {
      label: language === "en" ? "System" : language === "zh-TW" ? "系統" : "系统",
      items: [
        { path: "/super-admin/sso", icon: KeyRound, label: language === "en" ? "SSO Config" : language === "zh-TW" ? "SSO 配置" : "SSO 配置" },
        { path: "/super-admin/subscriptions", icon: CreditCard, label: language === "en" ? "Subscriptions" : language === "zh-TW" ? "訂閱管理" : "订阅管理" },
        { path: "/super-admin/membership-rules", icon: Layers, label: language === "en" ? "Membership Rules" : language === "zh-TW" ? "會員規則" : "会员规则" },
        { path: "/super-admin/reward-management", icon: Gift, label: language === "en" ? "Reward Management" : language === "zh-TW" ? "贈點管理" : "赠点管理" },
        { path: "/super-admin/cp-rules", icon: Cog, label: language === "en" ? "CP Rules Engine" : language === "zh-TW" ? "CP 規則引擎" : "CP 规则引擎" },
        { path: "/super-admin/messages", icon: MessageSquareWarning, label: language === "en" ? "Message Monitor" : language === "zh-TW" ? "訊息監控" : "消息监控" },
        { path: "/super-admin/audit", icon: ScrollText, label: language === "en" ? "Audit Logs" : language === "zh-TW" ? "稽核日誌" : "审计日志" },
        { path: "/super-admin/settings", icon: Settings, label: language === "en" ? "Settings" : language === "zh-TW" ? "系統設定" : "系统设置" },
      ],
    },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  // Desktop sidebar widths
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
              ? "bg-red-500/15 text-red-400"
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

  // Sidebar content (shared between mobile drawer and desktop sidebar)
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
                <span className="text-[10px] text-red-400 font-semibold px-1.5 py-0.5 rounded bg-red-500/15 whitespace-nowrap">
                  Super Admin
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
                  <span className="text-[10px] text-red-400 font-semibold px-1.5 py-0.5 rounded bg-red-500/15 whitespace-nowrap">
                    Super Admin
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
      <nav className={cn("flex-1 overflow-y-auto py-4", isMobile ? "px-3" : isCollapsed ? "px-2" : "px-3")}>
        {navSections.map((section) => (
          <div key={section.label} className="mb-5">
            {(isMobile || !isCollapsed) && (
              <div className="px-3 mb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {section.label}
              </div>
            )}
            {!isMobile && isCollapsed && <div className="h-px bg-white/5 mb-2 mx-1" />}
            <div className="space-y-0.5">
              {section.items.map(renderNavItem)}
            </div>
          </div>
        ))}
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
              {language === "en" ? "Account" : language === "zh-TW" ? "帳戶" : "账户"}
            </div>
            <div className="text-white text-sm font-medium truncate">
              {profile?.full_name || profile?.email || "Super Admin"}
            </div>
          </div>
        )}

        {(isMobile || !isCollapsed) ? (
          <>
            <NavLink
              to="/super-admin/change-password"
              className={({ isActive }) =>
                cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-1",
                  isActive ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                )
              }
            >
              <Lock className="w-4 h-4" />
              {language === "en" ? "Change Password" : language === "zh-TW" ? "修改密碼" : "修改密码"}
            </NavLink>
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
        "bg-gradient-to-b from-[#0f172a] to-[#1e293b] flex flex-col shadow-xl z-40 transition-all duration-300",
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
              {language === "en" ? "Platform Control Center" : language === "zh-TW" ? "平台控制中心" : "平台控制中心"}
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
