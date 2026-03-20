import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Shield, Building2, Globe } from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { getConsolePath, isConsoleRoleType, type RoleType } from "@/lib/permissions";

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, profile, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const { language } = useTranslation();
  
  // Redirect authenticated users to appropriate console
  useEffect(() => {
    console.log("[v0] AuthPage useEffect - user:", !!user, "profile:", profile?.role_type);
    if (user && profile) {
      const roleType = profile.role_type as RoleType;
      console.log("[v0] Role type:", roleType, "isConsoleRoleType:", isConsoleRoleType(roleType));
      if (isConsoleRoleType(roleType)) {
        const path = getConsolePath(roleType);
        console.log("[v0] Navigating to console:", path);
        navigate(path, { replace: true });
      } else {
        console.log("[v0] Navigating to home /");
        navigate("/", { replace: true });
      }
    }
  }, [user, profile, navigate]);
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showSSOPanel, setShowSSOPanel] = useState(false);
  const [ssoEmail, setSSOEmail] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          toast.error(language === "en" ? "Login failed" : language === "zh-TW" ? "登入失敗" : "登录失败", { description: error.message });
        } else {
          toast.success(language === "en" ? "Logged in" : language === "zh-TW" ? "登入成功" : "登录成功");
          // useEffect will handle redirect once profile loads
        }
      } else {
        const { error } = await signUpWithEmail(email, password, fullName);
        if (error) {
          toast.error(language === "en" ? "Signup failed" : language === "zh-TW" ? "註冊失敗" : "注册失败", { description: error.message });
        } else {
          toast.success(language === "en" ? "Account created" : language === "zh-TW" ? "註冊成功" : "注册成功", { description: language === "en" ? "Welcome to SCPC Career Anchor Assessment" : language === "zh-TW" ? "歡迎使用 SCPC 職業錨測評" : "欢迎使用 SCPC 职业锚测评" });
          // useEffect will handle redirect once profile loads
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(language === "en" ? "Google login failed" : language === "zh-TW" ? "Google 登入失敗" : "Google 登录失败", { description: error.message });
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground text-background p-12 flex-col justify-between">
        <div>
          <Link to="/" className="inline-block">
            <h1 className="text-2xl font-semibold tracking-tight">
              SCPC Career Anchors
            </h1>
          </Link>
        </div>
        
        <div className="space-y-6">
          <blockquote className="text-xl font-serif leading-relaxed opacity-90">
            {language === "en" ? "'A career anchor is the one element in a person's self-concept that they will not give up, even when forced to make a difficult choice.'" : language === "zh-TW" ? "『職業錨是每個人在做職業選擇時，無論如何都不願放棄的自我概念中的核心要素。』" : "『职业锚是每个人在做职业选择时，无论如何都不愿放弃的自我概念中的核心要素。』"}
          </blockquote>
          <p className="text-sm opacity-60">
            — Edgar H. Schein, MIT Sloan School of Management
          </p>
        </div>
        
        <div className="text-sm opacity-40">
          {language === "en" ? "Based on Schein's Career Anchor Theory" : language === "zh-TW" ? "基於 Schein 職業錨理論 · 專業職業決策工具" : "基于 Schein 职业锚理论 · 专业职业决策工具"}
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/">
              <h1 className="text-xl font-semibold tracking-tight">
                SCPC Career Anchors
              </h1>
            </Link>
          </div>

          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">
              {isLogin ? (language === "en" ? "Sign In" : language === "zh-TW" ? "帳號登入" : "登录账户") : (language === "en" ? "Create Account" : language === "zh-TW" ? "建立帳戶" : "创建账户")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isLogin 
                ? (language === "en" ? "Sign in to access your assessment history" : language === "zh-TW" ? "登入以存取您的測評記錄和個人數據" : "登录以访问您的测评历史和个人数据") 
                : (language === "en" ? "Sign up to save results and get personalized advice" : language === "zh-TW" ? "註冊以儲存測評結果並獲取個人化建議" : "注册以保存测评结果并获取个性化建议")}
            </p>
          </div>

          {/* SSO Login Section */}
          {isLogin && (
            <div className="space-y-2">
              <button
                onClick={() => setShowSSOPanel(!showSSOPanel)}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-lg border border-border bg-muted/5 text-sm font-medium text-foreground hover:bg-muted/15 transition-colors"
              >
                <Building2 className="w-4 h-4 text-muted-foreground" />
                {language === "en" ? "Enterprise SSO" : language === "zh-TW" ? "企業 SSO 登入" : "企业 SSO 登录"}
              </button>
              {showSSOPanel && (
                <div className="p-4 rounded-lg border border-border bg-muted/5 space-y-3">
                  <p className="text-xs text-muted-foreground">{language === "en" ? "Enter your corporate email to auto-detect SSO provider" : language === "zh-TW" ? "輸入企業信箱，系統將自動識別 SSO 提供商" : "输入企业邮箱，系统将自动识别 SSO 提供商"}</p>
                  <Input
                    type="email"
                    placeholder="your@company.com"
                    value={ssoEmail}
                    onChange={(e) => setSSOEmail(e.target.value)}
                    className="h-10"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button className="flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-border text-xs font-medium text-muted-foreground hover:bg-muted/10 transition-colors">
                      <svg className="w-4 h-4" viewBox="0 0 23 23"><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/></svg>
                      Azure AD
                    </button>
                    <button className="flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-border text-xs font-medium text-muted-foreground hover:bg-muted/10 transition-colors">
                      <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                      Google
                    </button>
                    <button className="flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-border text-xs font-medium text-muted-foreground hover:bg-muted/10 transition-colors">
                      <Globe className="w-4 h-4" />
                      Okta
                    </button>
                    <button className="flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-border text-xs font-medium text-muted-foreground hover:bg-muted/10 transition-colors">
                      <Shield className="w-4 h-4" />
                      SAML
                    </button>
                  </div>
                  <Button className="w-full h-9 text-xs" disabled={!ssoEmail}>
                    {language === "en" ? "Continue with SSO" : language === "zh-TW" ? "繼續 SSO 登入" : "继续 SSO 登录"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Google OAuth */}
          <Button
            variant="outline"
            className="w-full h-12 gap-2"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {language === "en" ? `Sign ${isLogin ? "in" : "up"} with Google` : language === "zh-TW" ? `使用 Google 帳戶${isLogin ? "登入" : "註冊"}` : `使用 Google 账户${isLogin ? "登录" : "注册"}`}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {language === "en" ? "or use email" : language === "zh-TW" ? "或使用信箱" : "或使用邮箱"}
              </span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">{language === "en" ? "Full Name" : "姓名"}</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder={language === "en" ? "Your name" : language === "zh-TW" ? "您的姓名" : "您的姓名"}
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="h-11"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">{language === "en" ? "Email" : language === "zh-TW" ? "信箱" : "邮箱地址"}</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">{language === "en" ? "Password" : language === "zh-TW" ? "密碼" : "密码"}</Label>
              <Input
                id="password"
                type="password"
                placeholder={isLogin ? (language === "en" ? "Enter password" : language === "zh-TW" ? "輸入密碼" : "输入密码") : (language === "en" ? "Set password (min 6 chars)" : language === "zh-TW" ? "設定密碼（至少 6 位）" : "设置密码（至少 6 位）")}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? (language === "en" ? "Sign In" : language === "zh-TW" ? "登入" : "登录") : (language === "en" ? "Sign Up" : language === "zh-TW" ? "註冊" : "注册")}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? (language === "en" ? "Don't have an account?" : language === "zh-TW" ? "還沒有帳戶？" : "还没有账户？") : (language === "en" ? "Already have an account?" : language === "zh-TW" ? "已有帳戶？" : "已有账户？")}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="ml-1 font-medium text-primary hover:underline"
            >
              {isLogin ? (language === "en" ? "Sign Up" : language === "zh-TW" ? "立即註冊" : "立即注册") : (language === "en" ? "Sign In" : language === "zh-TW" ? "登入" : "登录")}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
