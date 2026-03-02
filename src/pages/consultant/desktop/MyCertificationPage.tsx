import { useState } from "react";
import { motion } from "framer-motion";
import { Award, Calendar, Clock, AlertTriangle, Shield, CheckCircle2, XCircle, RefreshCw, Download, Loader2, ExternalLink } from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { useMyCertification, useCduSummary } from "@/hooks/useCertification";
import { useAuth } from "@/hooks/useAuth";
import { generateCertificatePdf } from "@/lib/certificateGenerator";
import { Button } from "@/components/ui/button";

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; icon: React.ElementType }> = {
  active: { color: "text-emerald-600", bgColor: "bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  pending_renewal: { color: "text-amber-600", bgColor: "bg-amber-50 border-amber-200", icon: Clock },
  under_review: { color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200", icon: RefreshCw },
  suspended: { color: "text-orange-600", bgColor: "bg-orange-50 border-orange-200", icon: AlertTriangle },
  expired: { color: "text-red-600", bgColor: "bg-red-50 border-red-200", icon: XCircle },
  revoked: { color: "text-slate-600", bgColor: "bg-slate-50 border-slate-200", icon: Shield },
};

function getStatusLabel(status: string, language: string) {
  const labels: Record<string, Record<string, string>> = {
    active: { en: "Active", "zh-TW": "有效", "zh-CN": "有效" },
    pending_renewal: { en: "Pending Renewal", "zh-TW": "待換證", "zh-CN": "待换证" },
    under_review: { en: "Under Review", "zh-TW": "審核中", "zh-CN": "审核中" },
    suspended: { en: "Suspended", "zh-TW": "已暫停", "zh-CN": "已暂停" },
    expired: { en: "Expired", "zh-TW": "已過期", "zh-CN": "已过期" },
    revoked: { en: "Revoked", "zh-TW": "已撤銷", "zh-CN": "已撤销" },
  };
  const langKey = language === "en" ? "en" : language === "zh-TW" ? "zh-TW" : "zh-CN";
  return labels[status]?.[langKey] || status;
}

export default function MyCertificationPage() {
  const { language } = useTranslation();
  const { profile } = useAuth();
  const { data: certification, isLoading } = useMyCertification();
  const cduSummary = useCduSummary(certification?.id);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const langKey = language === "en" ? "en" : language === "zh-TW" ? "zh-TW" : "zh-CN";

  const handleDownloadCertificate = async () => {
    if (!certification || !profile) return;
    setIsGeneratingPdf(true);
    try {
      await generateCertificatePdf({
        holderName: profile.full_name || profile.email || "Certificate Holder",
        certificationNumber: certification.certification_number,
        certificationType: certification.certification_type,
        issueDate: certification.issue_date,
        expiryDate: certification.expiry_date,
        renewalCycleYears: certification.renewal_cycle_years,
      });
    } catch (error) {
      console.error("Failed to generate certificate PDF:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const verifyUrl = certification
    ? `${window.location.origin}/verify-certificate?cert=${encodeURIComponent(certification.certification_number)}`
    : "";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!certification) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center">
        <Award className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">
          {{ en: "No Certification Found", "zh-TW": "尚未取得認證", "zh-CN": "尚未取得认证" }[langKey]}
        </h2>
        <p className="text-muted-foreground text-sm">
          {{ en: "You don't have an active SCPC certification. Contact your organization admin or super admin to get certified.", "zh-TW": "您目前沒有有效的 SCPC 認證。請聯繫您的機構管理員或平台管理員以取得認證。", "zh-CN": "您目前没有有效的 SCPC 认证。请联系您的机构管理员或平台管理员以取得认证。" }[langKey]}
        </p>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[certification.certification_status] || STATUS_CONFIG.active;
  const StatusIcon = statusConfig.icon;
  const daysUntilExpiry = Math.ceil((new Date(certification.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysUntilExpiry <= 180 && daysUntilExpiry > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {{ en: "My Certification", "zh-TW": "我的認證", "zh-CN": "我的认证" }[langKey]}
          </h1>
          <p className="text-sm text-muted-foreground">
            {{ en: "View your professional certification status and details", "zh-TW": "查看您的專業認證狀態與詳情", "zh-CN": "查看您的专业认证状态与详情" }[langKey]}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {certification?.certification_status === "active" && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => window.open(verifyUrl, "_blank")}
              >
                <ExternalLink className="w-4 h-4" />
                {{ en: "Verify Online", "zh-TW": "線上驗證", "zh-CN": "在线验证" }[langKey]}
              </Button>
              <Button
                size="sm"
                className="gap-2"
                onClick={handleDownloadCertificate}
                disabled={isGeneratingPdf}
              >
                {isGeneratingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {{ en: "Download Certificate", "zh-TW": "下載證書", "zh-CN": "下载证书" }[langKey]}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Certification Status Card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={`border rounded-2xl p-6 mb-6 ${statusConfig.bgColor}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-white shadow-sm`}>
              <Award className={`w-7 h-7 ${statusConfig.color}`} />
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                {{ en: "Certification Status", "zh-TW": "認證狀態", "zh-CN": "认证状态" }[langKey]}
              </div>
              <div className={`text-2xl font-bold ${statusConfig.color}`}>
                {getStatusLabel(certification.certification_status, language)}
              </div>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${statusConfig.color} bg-white shadow-sm`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {certification.certification_number}
          </div>
        </div>
      </motion.div>

      {/* Warning Banner */}
      {isExpiringSoon && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div className="text-sm text-amber-700">
            {{ en: `Your certification expires in ${daysUntilExpiry} days. Please ensure your CDU requirements are met and submit a renewal application.`, "zh-TW": `您的認證將在 ${daysUntilExpiry} 天後到期。請確保已達 CDU 學分要求並提交換證申請。`, "zh-CN": `您的认证将在 ${daysUntilExpiry} 天后到期。请确保已达 CDU 学分要求并提交换证申请。` }[langKey]}
          </div>
        </motion.div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: { en: "Certificate Type", "zh-TW": "認證類型", "zh-CN": "认证类型" }[langKey]!, value: certification.certification_type === "scpc_professional" ? "SCPC Professional" : certification.certification_type, icon: Award },
          { label: { en: "Issue Date", "zh-TW": "發證日期", "zh-CN": "发证日期" }[langKey]!, value: certification.issue_date, icon: Calendar },
          { label: { en: "Expiry Date", "zh-TW": "到期日期", "zh-CN": "到期日期" }[langKey]!, value: certification.expiry_date, icon: Calendar },
          { label: { en: "Renewal Cycle", "zh-TW": "換證周期", "zh-CN": "换证周期" }[langKey]!, value: `${certification.renewal_cycle_years} ${{ en: "years", "zh-TW": "年", "zh-CN": "年" }[langKey]}`, icon: RefreshCw },
        ].map((item, index) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <item.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">{item.label}</span>
            </div>
            <div className="text-sm font-semibold text-foreground">{item.value}</div>
          </motion.div>
        ))}
      </div>

      {/* CDU Progress */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-semibold text-foreground mb-4">
          {{ en: "CDU Progress", "zh-TW": "CDU 學分進度", "zh-CN": "CDU 学分进度" }[langKey]}
        </h3>
        <div className="flex items-end gap-6 mb-4">
          <div>
            <div className="text-3xl font-bold text-foreground">{cduSummary.totalApprovedHours}</div>
            <div className="text-xs text-muted-foreground">/ {cduSummary.minimumRequired} {{ en: "hours required", "zh-TW": "小時需求", "zh-CN": "小时需求" }[langKey]}</div>
          </div>
          <div className="text-sm">
            <span className={cduSummary.isEligibleForRenewal ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
              {cduSummary.isEligibleForRenewal
                ? { en: "Eligible for renewal", "zh-TW": "已達換證要求", "zh-CN": "已达换证要求" }[langKey]
                : `${cduSummary.remainingHours} ${{ en: "hours remaining", "zh-TW": "小時待完成", "zh-CN": "小时待完成" }[langKey]}`}
            </span>
          </div>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${cduSummary.progressPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${cduSummary.isEligibleForRenewal ? "bg-emerald-500" : "bg-amber-500"}`}
          />
        </div>
        {cduSummary.totalPendingHours > 0 && (
          <div className="mt-3 text-xs text-muted-foreground">
            {{ en: `${cduSummary.totalPendingHours} hours pending approval`, "zh-TW": `${cduSummary.totalPendingHours} 小時待審核`, "zh-CN": `${cduSummary.totalPendingHours} 小时待审核` }[langKey]}
          </div>
        )}
      </motion.div>
    </div>
  );
}
