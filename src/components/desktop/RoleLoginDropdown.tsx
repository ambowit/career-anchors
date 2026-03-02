import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  User,
  LogOut,
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  useTestAuth,
  TEST_ACCOUNTS,
  isConsoleRole,
  getTestConsolePath,
  getRoleColor,
  getRoleInitials,
  getCategoryLabel,
  type UserRole,
  type LanguageKey,
} from "@/hooks/useTestAuth";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getRoleLabel, findConsolePathFromProfile, getAllConsoleRoles } from "@/lib/permissions";
import type { RoleType } from "@/lib/permissions";
import { supabase } from "@/integrations/supabase/client";

// Category order for grouped display
const CATEGORY_ORDER = ["platform", "organization", "consultant", "individual"] as const;

// Roles grouped by category
const ROLES_BY_CATEGORY: Record<string, UserRole[]> = {
  platform: ["super_admin", "partner"],
  organization: ["org_admin", "hr", "department_manager", "employee"],
  consultant: ["consultant", "client"],
  individual: ["individual"],
};

export default function RoleLoginDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useTranslation();
  const { signInWithEmail, refreshProfile, profile } = useAuth();
  const {
    isTestLoggedIn,
    testRole,
    isLoading,
    testLogin,
    testLogout,
    clearError,
  } = useTestAuth();

  // Handle test account quick login
  const handleRoleSelect = async (role: UserRole) => {
    clearError();
    await testLogin(role);
    await refreshProfile();

    const currentState = useTestAuth.getState();
    if (!currentState.error && currentState.isTestLoggedIn) {
      setIsOpen(false);
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
      } else if (location.pathname.startsWith("/super-admin") ||
                 location.pathname.startsWith("/org") ||
                 location.pathname.startsWith("/consultant") ||
                 location.pathname.startsWith("/admin")) {
        navigate("/");
      }
    } else if (currentState.error) {
      toast.error(
        language === "en"
          ? "Login failed. Please try again."
          : language === "zh-TW" ? "登入失敗，請重試"
          : "登录失败，请重试"
      );
    }
  };

  // Handle email/password login
  const handleEmailLogin = async () => {
    if (!loginEmail || !loginPassword) {
      toast.error(
        language === "en"
          ? "Please enter email and password"
          : language === "zh-TW" ? "請輸入電子郵件和密碼"
          : "请输入邮箱和密码"
      );
      return;
    }

    setEmailLoading(true);
    const { error } = await signInWithEmail(loginEmail, loginPassword);
    setEmailLoading(false);

    if (error) {
      toast.error(
        language === "en"
          ? `Login failed: ${error.message}`
          : language === "zh-TW" ? `登入失敗：${error.message}`
          : `登录失败：${error.message}`
      );
    } else {
      setIsOpen(false);
      setLoginEmail("");
      setLoginPassword("");
      toast.success(language === "en" ? "Logged in successfully" : language === "zh-TW" ? "登入成功" : "登录成功");
      // Auto-navigate to console if user has a console role
      await refreshProfile();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("role_type, additional_roles")
          .eq("id", currentUser.id)
          .single();
        if (userProfile) {
          const consolePath = findConsolePathFromProfile(userProfile);
          if (consolePath) {
            navigate(consolePath);
          }
        }
      }
    }
  };

  const handleLogout = async () => {
    await testLogout();
    setIsOpen(false);
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

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleEmailLogin();
    }
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all",
          isTestLoggedIn
            ? "bg-accent/20 text-foreground border border-accent/30"
            : "bg-card border border-border hover:border-accent/50",
          isLoading && "opacity-70 cursor-not-allowed"
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{language === "en" ? "Loading..." : language === "zh-TW" ? "登入中..." : "登录中..."}</span>
          </>
        ) : isTestLoggedIn ? (
          <>
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: getRoleColor(testRole) }}
            >
              {getRoleInitials(testRole)}
            </div>
            <span>
              {TEST_ACCOUNTS[testRole].name[language as LanguageKey]}
            </span>
          </>
        ) : (
          <>
            <User className="w-4 h-4 text-muted-foreground" />
            <span>{language === "en" ? "Login" : language === "zh-TW" ? "登入" : "登录"}</span>
          </>
        )}
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && !isLoading && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
            >
              {isTestLoggedIn ? (
                /* ── Logged-in state ── */
                <div className="p-3">
                  <div className="flex items-center gap-3 px-2 py-2">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: getRoleColor(testRole) }}
                    >
                      {getRoleInitials(testRole)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-foreground truncate">
                        {TEST_ACCOUNTS[testRole].name[language as LanguageKey]}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {TEST_ACCOUNTS[testRole].email}
                      </div>
                      <div className="text-xs mt-0.5">
                        <span
                          className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{
                            backgroundColor: getRoleColor(testRole) + "18",
                            color: getRoleColor(testRole),
                          }}
                        >
                          {getRoleLabel(testRole as RoleType, language as "zh-CN" | "zh-TW" | "en")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Console access entries from all roles */}
                  {profile && (() => {
                    const consoleRoles = getAllConsoleRoles(profile);
                    if (consoleRoles.length === 0) return null;
                    return (
                      <div className="border-t border-border mt-2 pt-2 space-y-0.5">
                        {consoleRoles.map((consoleRole, consoleIndex) => (
                          <button
                            key={`console-${consoleIndex}`}
                            onClick={() => { navigate(consoleRole.consolePath); setIsOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-primary hover:bg-primary/10 transition-colors text-sm font-medium"
                          >
                            <User className="w-4 h-4" />
                            <span>
                              {language === "en" ? "Go to Console" : language === "zh-TW" ? "進入工作台" : "进入工作台"}
                              <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                                {getRoleLabel(consoleRole.roleType, language as "zh-CN" | "zh-TW" | "en")}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    );
                  })()}

                  <div className="border-t border-border mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors text-sm"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t("common.logout")}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Login state ── */
                <div className="max-h-[480px] overflow-y-auto">
                  {/* Email/Password Login Form */}
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
                        placeholder={language === "en" ? "Email" : language === "zh-TW" ? "電子郵件" : "邮箱"}
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
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
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

                  {/* Divider */}
                  <div className="flex items-center gap-3 px-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {language === "en"
                        ? "or use test account"
                        : language === "zh-TW" ? "或使用測試帳戶"
                        : "或使用测试账户"}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Test Accounts by Category */}
                  <div className="p-2 pt-1 pb-3 space-y-1">
                    {CATEGORY_ORDER.map((category) => (
                      <div key={category}>
                        <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                          {getCategoryLabel(category, language as LanguageKey)}
                        </div>
                        {ROLES_BY_CATEGORY[category].map((role) => {
                          const account = TEST_ACCOUNTS[role];
                          return (
                            <button
                              key={role}
                              onClick={() => handleRoleSelect(role)}
                              disabled={isLoading}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left",
                                "hover:bg-muted/40",
                                isLoading && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                                style={{ backgroundColor: getRoleColor(role) }}
                              >
                                {getRoleInitials(role)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-foreground truncate">
                                  {account.name[language as LanguageKey]}
                                </div>
                                <div className="text-[11px] text-muted-foreground truncate">
                                  {account.email}
                                </div>
                              </div>
                              {isConsoleRole(role) && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                                  {language === "en" ? "Console" : "控制台"}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
