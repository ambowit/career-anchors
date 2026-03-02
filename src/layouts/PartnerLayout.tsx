import { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  BarChart3,
  DollarSign,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useSidebarCollapse } from "@/hooks/useSidebarCollapse";
import { useIsMobile } from "@/hooks/useIsMobile";
import LanguageSwitcher from "@/components/desktop/LanguageSwitcher";
import RoleSwitcher from "@/components/desktop/RoleSwitcher";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const SCPC_LOGO = "https://b.ux-cdn.com/uxarts/20260226/1eeac3700a3d4b41ad6120512fa02969.png";

export default function PartnerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { signOut, profile } = useAuth();
  const { isCollapsed, toggleCollapse } = useSidebarCollapse();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      path: "/partner",
      icon: LayoutDashboard,
      label: language === "en" ? "Dashboard" : language === "zh-TW" ? "總覽" : "总览",
    },
    {
      path: "/partner/products",
      icon: Package,
      label: language === "en" ? "Products" : language === "zh-TW" ? "產品管理" : "产品管理",
    },
    {
      path: "/partner/sales",
      icon: BarChart3,
      label: language === "en" ? "Sales" : language === "zh-TW" ? "銷售數據" : "销售数据",
    },
    {
      path: "/partner/revenue",
      icon: DollarSign,
      label: language === "en" ? "Revenue" : language === "zh-TW" ? "收入報表" : "收入报表",
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const sidebarTitle = language === "en" ? "Partner Portal" : language === "zh-TW" ? "合作方入口" : "合作方入口";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(true)} className="p-1.5 rounded-lg hover:bg-slate-100">
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <img src={SCPC_LOGO} alt="Logo" className="h-7 w-7 rounded" />
            <span className="text-sm font-bold text-slate-800">{sidebarTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <RoleSwitcher />
          </div>
        </div>
      )}

      {/* Mobile drawer overlay */}
      {isMobile && mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="w-64 h-full bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <img src={SCPC_LOGO} alt="Logo" className="h-7 w-7 rounded" />
                <span className="text-sm font-bold text-slate-800">{sidebarTitle}</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="p-3 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/partner"}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                      isActive
                        ? "bg-slate-100 text-slate-900 font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                    )
                  }
                >
                  <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <aside
          className={cn(
            "flex flex-col border-r border-slate-200 bg-white transition-all duration-200",
            isCollapsed ? "w-16" : "w-56"
          )}
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5 h-14 px-4 border-b border-slate-200 flex-shrink-0">
            <img src={SCPC_LOGO} alt="Logo" className="h-7 w-7 rounded flex-shrink-0" />
            {!isCollapsed && (
              <span className="text-sm font-bold text-slate-800 truncate">{sidebarTitle}</span>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive =
                item.path === "/partner"
                  ? location.pathname === "/partner"
                  : location.pathname.startsWith(item.path);

              const linkContent = (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/partner"}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-slate-100 text-slate-900 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-800",
                    isCollapsed && "justify-center px-2"
                  )}
                >
                  <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                );
              }
              return linkContent;
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-slate-200 p-2 space-y-1">
            {!isCollapsed && (
              <div className="flex items-center gap-2 px-3 py-1.5">
                <LanguageSwitcher />
                <RoleSwitcher />
              </div>
            )}
            <button
              onClick={toggleCollapse}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 w-full transition-colors"
            >
              {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              {!isCollapsed && (language === "en" ? "Collapse" : "收起")}
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 hover:text-red-600 w-full transition-colors"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && (language === "en" ? "Log Out" : "登出")}
            </button>
          </div>
        </aside>
      )}

      {/* Main content */}
      <main className={cn("flex-1 overflow-y-auto", isMobile && "pt-14")}>
        <Outlet />
      </main>
    </div>
  );
}
