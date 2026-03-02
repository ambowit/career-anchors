import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  useTestAuth,
  TEST_ACCOUNTS,
  getWorkExperienceDescription,
  isConsoleRole,
  getTestConsolePath,
  getRoleColor,
  getRoleInitials,
  getCategoryLabel,
  type UserRole,
  type LanguageKey,
} from "@/hooks/useTestAuth";
import { useTranslation } from "@/hooks/useLanguage";
import { getRoleLabel, findConsoleRoleFromProfile } from "@/lib/permissions";
import { navigateToConsoleWithSwap } from "@/lib/consoleUtils";
import type { RoleType } from "@/lib/permissions";
import { supabase } from "@/integrations/supabase/client";
import LanguageSwitcher from "@/components/desktop/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  LogOut,
  History,
  Loader2,
  ChevronDown,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Wallet,
  Gift,
} from "lucide-react";
import { toast } from "sonner";

const CATEGORY_ORDER = ["platform", "organization", "consultant", "individual"] as const;
const ROLES_BY_CATEGORY: Record<string, UserRole[]> = {
  platform: ["super_admin", "partner"],
  organization: ["org_admin", "hr", "department_manager", "employee"],
  consultant: ["consultant", "client"],
  individual: ["individual"],
};

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { user, profile, loading, signOut, signInWithEmail, refreshProfile } = useAuth();
  const { isTestLoggedIn, testRole, isLoading, testLogin, testLogout, clearError } = useTestAuth();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const isAssessment = location.pathname.includes("/assessment");

  const handleSignOut = async () => {
    // Clear test auth persistence to prevent stale role display after logout
    useTestAuth.setState({
      isTestLoggedIn: false,
      testRole: "individual" as UserRole,
      careerStage: null,
      workYears: null,
      isExecutive: false,
      isEntrepreneur: false,
      assessmentMode: "full" as const,
      includeCareerAnchor: true,
      includeIdealCard: false,
    });
    await signOut();
    navigate("/");
  };

  const handleTestRoleSelect = async (role: UserRole) => {
    clearError();
    await testLogin(role);
    await refreshProfile();

    const currentState = useTestAuth.getState();
    if (!currentState.error && currentState.isTestLoggedIn) {
      setShowRoleDropdown(false);
      const roleName = TEST_ACCOUNTS[role].name[language as LanguageKey];
      toast.success(
        language === "en"
          ? `Logged in as ${roleName}`
          : language === "zh-TW" ? `已登入為${roleName}`
          : `已登录为${roleName}`
      );
      const consolePath = getTestConsolePath(role);
      if (consolePath !== "/") {
        navigate(consolePath);
      }
    } else if (currentState.error) {
      toast.error(language === "en" ? "Login failed" : language === "zh-TW" ? "登入失敗" : "登录失败");
    }
  };

  const handleEmailLogin = async () => {
    if (!loginEmail || !loginPassword) return;
    setEmailLoading(true);
    const { error } = await signInWithEmail(loginEmail, loginPassword);
    setEmailLoading(false);
    if (error) {
      toast.error(language === "en" ? `Login failed: ${error.message}` : language === "zh-TW" ? `登入失敗：${error.message}` : `登录失败：${error.message}`);
    } else {
      setShowRoleDropdown(false);
      setLoginEmail("");
      setLoginPassword("");
      toast.success(language === "en" ? "Logged in" : language === "zh-TW" ? "登入成功" : "登录成功");
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("role_type")
          .eq("id", currentUser.id)
          .single();
        if (userProfile?.role_type) {
          const consolePath = getConsolePath(userProfile.role_type as RoleType);
          if (consolePath !== "/") {
            navigate(consolePath);
          }
          // Roles that stay on "/" (employee, client, individual):
          // No navigation needed — auth state change will re-render the UI
        }
      }
    }
  };

  const handleTestLogout = async () => {
    await testLogout();
    setShowRoleDropdown(false);
    toast.success(language === "en" ? "Logged out" : language === "zh-TW" ? "已登出" : "已退出登录");
    if (
      location.pathname.startsWith("/admin") ||
      location.pathname.startsWith("/super-admin") ||
      location.pathname.startsWith("/org") ||
      location.pathname.startsWith("/consultant")
    ) {
      navigate("/");
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") handleEmailLogin();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50">
        <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src="https://b.ux-cdn.com/uxarts/20260210/bd2fe8a1fd4d4cd5bcca019a03911b22.png"
              alt="SCPC"
              className="h-7 w-auto"
            />
            <span className="text-foreground font-semibold tracking-tight">
              SCPC
            </span>
            <span className="text-muted-foreground text-sm">|</span>
            <span className="text-muted-foreground text-sm tracking-wide">
              Career Anchors
            </span>
          </Link>

          {/* Right Actions */}
          <nav className="flex items-center gap-4">
            {!isAssessment && (
              <>
                <Link
                  to="/messages"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-foreground",
                    location.pathname === "/messages"
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {language === "en" ? "Messages" : language === "zh-TW" ? "訊息" : "消息"}
                </Link>
                <Link
                  to="/history"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-foreground",
                    location.pathname === "/history"
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {t("history.title")}
                </Link>
                <Link
                  to="/assessment"
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-sm btn-mechanical hover:bg-primary/90 transition-colors"
                >
                  {t("home.startAssessment")}
                </Link>
              </>
            )}
            {isAssessment && (
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("save-and-exit"));
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("assessment.saveExit")}
              </button>
            )}

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* User Menu */}
            {loading || isLoading ? (
              <div className="flex items-center gap-2 px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {language === "en" ? "Loading..." : language === "zh-TW" ? "載入中..." : "加载中..."}
                </span>
              </div>
            ) : user ? (
              // ── Logged in ──
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 gap-2 px-3 rounded-lg">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: getRoleColor(testRole) }}
                    >
                      {isTestLoggedIn
                        ? getRoleInitials(testRole)
                        : getInitials(profile?.full_name || user.email)}
                    </div>
                    <span className="text-sm font-medium">
                      {isTestLoggedIn
                        ? TEST_ACCOUNTS[testRole].name[language as LanguageKey]
                        : profile?.full_name || user.email?.split("@")[0]}
                    </span>
                    {(() => {
                      const { workYears } = useTestAuth.getState();
                      if (workYears === null) return null;
                      return (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "hsl(75, 55%, 90%)", color: "hsl(75, 55%, 35%)" }}
                        >
                          {language === "en" ? `${workYears}y` : `${workYears}年`}
                        </span>
                      );
                    })()}
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center gap-3 p-2">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: getRoleColor(testRole) }}
                    >
                      {isTestLoggedIn ? getRoleInitials(testRole) : getInitials(profile?.full_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {isTestLoggedIn
                          ? TEST_ACCOUNTS[testRole].name[language as LanguageKey]
                          : profile?.full_name || user.email}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                      {isTestLoggedIn && (
                        <span
                          className="inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded font-medium"
                          style={{
                            backgroundColor: getRoleColor(testRole) + "18",
                            color: getRoleColor(testRole),
                          }}
                        >
                          {getRoleLabel(testRole as RoleType, language as "zh-CN" | "zh-TW" | "en")}
                        </span>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/messages" className="cursor-pointer">
                      <Mail className="mr-2 h-4 w-4" />
                      {language === "en" ? "Messages" : language === "zh-TW" ? "訊息" : "消息"}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/history" className="cursor-pointer">
                      <History className="mr-2 h-4 w-4" />
                      {t("history.title")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/cp-wallet" className="cursor-pointer">
                      <Wallet className="mr-2 h-4 w-4" />
                      {language === "en" ? "CP Wallet" : language === "zh-TW" ? "CP \u9322\u5305" : "CP \u94b1\u5305"}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/referral" className="cursor-pointer">
                      <Gift className="mr-2 h-4 w-4" />
                      {language === "en" ? "Referral Rewards" : language === "zh-TW" ? "推薦獎勵" : "推荐奖励"}
                    </Link>
                  </DropdownMenuItem>
                  {user && (
                    <DropdownMenuItem asChild>
                      <Link to="/change-password" className="cursor-pointer">
                        <Lock className="mr-2 h-4 w-4" />
                        {language === "en" ? "Change Password" : language === "zh-TW" ? "修改密碼" : "修改密码"}
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {/* Console link — single entry, auto-swap role then navigate */}
                  {(() => {
                    if (isTestLoggedIn) {
                      if (!isConsoleRole(testRole)) return null;
                      const target = getTestConsolePath(testRole);
                      if (target === "/") return null;
                      return (
                        <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(target)}>
                          <User className="mr-2 h-4 w-4" />
                          {language === "en" ? "Go to Console" : language === "zh-TW" ? "進入工作台" : "进入工作台"}
                        </DropdownMenuItem>
                      );
                    }
                    if (!profile) return null;
                    const consoleInfo = findConsoleRoleFromProfile(profile);
                    if (!consoleInfo) return null;
                    return (
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={async () => {
                          await navigateToConsoleWithSwap(profile, refreshProfile, navigate);
                        }}
                      >
                        <User className="mr-2 h-4 w-4" />
                        {language === "en" ? "Go to Console" : language === "zh-TW" ? "進入工作台" : "进入工作台"}
                      </DropdownMenuItem>
                    );
                  })()}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={isTestLoggedIn ? handleTestLogout : handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("common.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // ── Not logged in ──
              <div className="relative">
                <button
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all hover:bg-muted/50"
                >
                  <User className="w-4 h-4" />
                  <span>{language === "en" ? "Login" : language === "zh-TW" ? "登入" : "登录"}</span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform",
                      showRoleDropdown && "rotate-180"
                    )}
                  />
                </button>

                <AnimatePresence>
                  {showRoleDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowRoleDropdown(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
                      >
                        <div className="max-h-[480px] overflow-y-auto">
                          {/* Email/Password Form */}
                          <div className="p-4 space-y-3">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
                              {language === "en" ? "Account Login" : language === "zh-TW" ? "帳號登入" : "账号登录"}
                            </div>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <input
                                type="email"
                                value={loginEmail}
                                onChange={(event) => setLoginEmail(event.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={language === "en" ? "Email" : language === "zh-TW" ? "信箱" : "邮箱"}
                                className="w-full pl-10 pr-3 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                              />
                            </div>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <input
                                type={showPassword ? "text" : "password"}
                                value={loginPassword}
                                onChange={(event) => setLoginPassword(event.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={language === "en" ? "Password" : language === "zh-TW" ? "密碼" : "密码"}
                                className="w-full pl-10 pr-10 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            <button
                              onClick={handleEmailLogin}
                              disabled={emailLoading}
                              className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                              {emailLoading ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  {language === "en" ? "Logging in..." : language === "zh-TW" ? "登入中..." : "登录中..."}
                                </>
                              ) : (
                                language === "en" ? "Login" : language === "zh-TW" ? "登入" : "登录"
                              )}
                            </button>
                          </div>


                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  );
}
