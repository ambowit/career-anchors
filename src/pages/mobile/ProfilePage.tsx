import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, LogOut, ChevronRight, History, Settings, HelpCircle, Moon, Sun, Shield, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTestAuth, getWorkExperienceDescription, isConsoleRole, isUserRole, getTestConsolePath, getRoleColor, getRoleInitials, type LanguageKey } from "@/hooks/useTestAuth";
import { findConsolePathFromProfile } from "@/lib/permissions";
import { useFeaturePermissions } from "@/hooks/useFeaturePermissions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useTranslation } from "@/hooks/useLanguage";


export default function MobileProfilePage() {
  const { language } = useTranslation();
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { isTestLoggedIn, testRole, careerStage, testLogout } = useTestAuth();
  const testUserName = "";
  const { theme, setTheme } = useTheme();
  const { isCpPointsEnabled } = useFeaturePermissions();


  // Check if logged in (real or test)
  const isLoggedIn = !!user || isTestLoggedIn;

  const handleLogout = async () => {
    if (isTestLoggedIn && !user) {
      testLogout();
      toast.success("已退出测试账户");
      navigate("/");
    } else {
      try {
        await supabase.auth.signOut();
        toast.success("已退出登录");
        navigate("/");
      } catch (error) {
        toast.error("退出失败，请重试");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background px-5 py-8" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div 
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: "hsl(75, 55%, 60%, 0.2)" }}
          >
            <User className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            未登录
          </h2>
          <p className="text-muted-foreground mb-6">
            请通过首页选择角色登录
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl transition-all active:scale-[0.98]"
          >
            返回首页
          </button>
        </motion.div>
      </div>
    );
  }

  // Get display name and email
  const displayName = user 
    ? (user.user_metadata?.full_name || user.email?.split("@")[0])
    : testUserName;
  const displayEmail = user?.email || "";
  const displayInitial = user 
    ? user.email?.charAt(0).toUpperCase() 
    : getRoleInitials(testRole);
  const avatarBgColor = getRoleColor(testRole);

  return (
    <div className="min-h-screen bg-background" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      {/* Header */}
      <motion.section
        className="px-5 pt-8 pb-6 bg-primary text-primary-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex items-center gap-4">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{ backgroundColor: user ? "hsl(75, 55%, 60%)" : avatarBgColor, color: user ? "hsl(228, 51%, 15%)" : "white" }}
          >
            {displayInitial}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">{displayName}</span>
            </div>
            <div className="text-sm opacity-70">{displayEmail}</div>
            {isTestLoggedIn && isUserRole(testRole) && (() => {
              const { workYears, isExecutive, isEntrepreneur } = useTestAuth.getState();
              const desc = getWorkExperienceDescription(workYears, isExecutive, isEntrepreneur, language as LanguageKey);
              if (!desc) return null;
              return (
                <div className="text-xs opacity-60 mt-1">{desc}</div>
              );
            })()}
          </div>
        </div>
      </motion.section>

      {/* Menu Items */}
      <motion.section
        className="px-5 mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <MenuItem
            icon={History}
            label={language === "en" ? "Assessment History" : language === "zh-TW" ? "測評歷史" : "测评历史"}
            onClick={() => navigate("/history")}
          />
          {isCpPointsEnabled && (
            <MenuItem
              icon={Wallet}
              label={language === "en" ? "CP Wallet" : language === "zh-TW" ? "CP 錢包" : "CP 钱包"}
              onClick={() => navigate("/cp-wallet")}
            />
          )}
          <MenuItem
            icon={theme === "dark" ? Sun : Moon}
            label={theme === "dark" ? "浅色模式" : "深色模式"}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            showArrow={false}
          />
        </div>
      </motion.section>

      <motion.section
        className="px-5 mt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <MenuItem
            icon={HelpCircle}
            label="关于职业锚"
            onClick={() => {}}
          />
          <MenuItem
            icon={Settings}
            label="设置"
            onClick={() => {}}
          />
          {(() => {
            // Check both test role and real profile for console access
            if (isTestLoggedIn && isConsoleRole(testRole)) {
              return (
                <MenuItem
                  icon={Shield}
                  label={language === "en" ? "Console" : language === "zh-TW" ? "工作台" : "工作台"}
                  onClick={() => navigate(getTestConsolePath(testRole))}
                />
              );
            }
            if (profile) {
              const consolePath = findConsolePathFromProfile(profile);
              if (consolePath) {
                return (
                  <MenuItem
                    icon={Shield}
                    label={language === "en" ? "Console" : language === "zh-TW" ? "工作台" : "工作台"}
                    onClick={() => navigate(consolePath)}
                  />
                );
              }
            }
            return null;
          })()}
        </div>
      </motion.section>

      {/* Logout */}
      <motion.section
        className="px-5 mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 bg-destructive/10 text-destructive font-medium rounded-xl transition-all active:scale-[0.98]"
        >
          <LogOut className="w-5 h-5" />
          退出登录
        </button>
      </motion.section>

      {/* Footer */}
      <div className="px-5 py-8 text-center text-xs text-muted-foreground">
        <p>SCPC Career Anchors Assessment</p>
        <p className="mt-1">基于 Edgar Schein 职业锚理论</p>
      </div>
    </div>
  );
}

interface MenuItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  showArrow?: boolean;
}

function MenuItem({ icon: Icon, label, onClick, showArrow = true }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 hover:bg-muted/5 transition-colors border-b border-border last:border-b-0"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-muted-foreground" />
        <span className="text-foreground">{label}</span>
      </div>
      {showArrow && <ChevronRight className="w-5 h-5 text-muted-foreground" />}
    </button>
  );
}
