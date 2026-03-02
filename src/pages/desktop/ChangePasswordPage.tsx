import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function ChangePasswordPage() {
  const { language } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const isValid = newPassword.length >= 6 && newPassword === confirmPassword;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      // Supabase updateUser changes the password for the currently logged-in user
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast.error(
          language === "en"
            ? `Failed to change password: ${error.message}`
            : language === "zh-TW" ? `修改密碼失敗: ${error.message}`
            : `修改密码失败: ${error.message}`
        );
      } else {
        setIsSuccess(true);
        toast.success(
          language === "en"
            ? "Password changed successfully"
            : language === "zh-TW" ? "密碼修改成功"
            : "密码修改成功"
        );
      }
    } catch {
      toast.error(language === "en" ? "An error occurred" : language === "zh-TW" ? "發生錯誤，請重試" : "发生错误，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-muted-foreground">
          {language === "en" ? "Please login first" : language === "zh-TW" ? "請先登入" : "请先登录"}
        </p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-2xl p-8 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {language === "en" ? "Password Changed" : language === "zh-TW" ? "密碼已修改" : "密码已修改"}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {language === "en"
              ? "Your password has been updated successfully. Please use the new password on your next login."
              : language === "zh-TW" ? "您的密碼已成功更新。下次登入時請使用新密碼。"
              : "您的密码已成功更新。下次登录时请使用新密码。"}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {language === "en" ? "Go Back" : language === "zh-TW" ? "返回" : "返回"}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-8"
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {language === "en" ? "Back" : language === "zh-TW" ? "返回" : "返回"}
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {language === "en" ? "Change Password" : language === "zh-TW" ? "修改密碼" : "修改密码"}
            </h1>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {language === "en" ? "New Password" : language === "zh-TW" ? "新密碼" : "新密码"}
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={language === "en" ? "At least 6 characters" : language === "zh-TW" ? "至少6個字元" : "至少6个字符"}
                className="w-full px-3 py-2.5 pr-10 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {newPassword && newPassword.length < 6 && (
              <p className="text-xs text-red-500 mt-1">
                {language === "en" ? "Password must be at least 6 characters" : language === "zh-TW" ? "密碼至少需要6個字元" : "密码至少需要6个字符"}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {language === "en" ? "Confirm New Password" : language === "zh-TW" ? "確認新密碼" : "确认新密码"}
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={language === "en" ? "Confirm your new password" : language === "zh-TW" ? "再次輸入新密碼" : "再次输入新密码"}
                className="w-full px-3 py-2.5 pr-10 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">
                {language === "en" ? "Passwords do not match" : language === "zh-TW" ? "兩次輸入的密碼不一致" : "两次输入的密码不一致"}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {language === "en" ? "Changing..." : language === "zh-TW" ? "修改中..." : "修改中..."}
              </>
            ) : (
              language === "en" ? "Change Password" : language === "zh-TW" ? "確認修改" : "确认修改"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
