import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Award,
  Calendar,
  Shield,
  RefreshCw,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Clock,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMyCertification, useCduSummary, useMyRenewals, useCertificateTypes } from "@/hooks/useCertification";

const TXT = {
  en: {
    certInfo: "Certification Status",
    noCert: "No certification found",
    noCertDesc: "You don't have an active certification yet.",
    applyCert: "Apply for Certification",
    certNumber: "Certificate No.",
    issueDate: "Issue Date",
    expiryDate: "Expiry Date",
    recertCount: "Renewals",
    status: "Status",
    cduProgress: "CDU Progress",
    typeA: "A-Class",
    typeB: "B-Class",
    total: "Total",
    progress: "Progress",
    required: "Required",
    remaining: "Remaining",
    eligible: "Eligible for Renewal",
    notEligible: "Not Eligible Yet",
    viewCduRecords: "View CDU Records",
    renewalStatus: "Renewal Status",
    applyRenewal: "Apply Renewal",
    renewalPending: "Renewal In Progress",
    daysLeft: "days remaining",
    expired: "Expired",
    statusActive: "Active",
    statusPendingRenewal: "Pending Renewal",
    statusUnderReview: "Under Review",
    statusExpired: "Expired",
  },
  "zh-TW": {
    certInfo: "認證狀態",
    noCert: "尚未取得認證",
    noCertDesc: "您目前沒有有效的認證記錄。",
    applyCert: "申請認證",
    certNumber: "證書編號",
    issueDate: "頒發日期",
    expiryDate: "有效期至",
    recertCount: "換證次數",
    status: "狀態",
    cduProgress: "CDU 學分進度",
    typeA: "A 類",
    typeB: "B 類",
    total: "合計",
    progress: "進度",
    required: "要求",
    remaining: "待完成",
    eligible: "符合換證條件",
    notEligible: "學分尚未達標",
    viewCduRecords: "查看 CDU 記錄",
    renewalStatus: "換證狀態",
    applyRenewal: "申請換證",
    renewalPending: "換證審核中",
    daysLeft: "天",
    expired: "已過期",
    statusActive: "有效",
    statusPendingRenewal: "待換證",
    statusUnderReview: "審核中",
    statusExpired: "已過期",
  },
  "zh-CN": {
    certInfo: "认证状态",
    noCert: "尚未取得认证",
    noCertDesc: "您目前没有有效的认证记录。",
    applyCert: "申请认证",
    certNumber: "证书编号",
    issueDate: "颁发日期",
    expiryDate: "有效期至",
    recertCount: "换证次数",
    status: "状态",
    cduProgress: "CDU 学分进度",
    typeA: "A 类",
    typeB: "B 类",
    total: "合计",
    progress: "进度",
    required: "要求",
    remaining: "待完成",
    eligible: "符合换证条件",
    notEligible: "学分尚未达标",
    viewCduRecords: "查看 CDU 记录",
    renewalStatus: "换证状态",
    applyRenewal: "申请换证",
    renewalPending: "换证审核中",
    daysLeft: "天",
    expired: "已过期",
    statusActive: "有效",
    statusPendingRenewal: "待换证",
    statusUnderReview: "审核中",
    statusExpired: "已过期",
  },
};

const STATUS_COLORS: Record<string, { text: string; bg: string; dot: string }> = {
  active: { text: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  pending_renewal: { text: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-500" },
  under_review: { text: "text-blue-700", bg: "bg-blue-50", dot: "bg-blue-500" },
  expired: { text: "text-red-700", bg: "bg-red-50", dot: "bg-red-500" },
};

export default function CertificationInfoCard({ langKey }: { langKey: "en" | "zh-TW" | "zh-CN" }) {
  const txt = TXT[langKey];
  const { data: certification, isLoading: certLoading } = useMyCertification();
  const { data: certTypes = [] } = useCertificateTypes();
  const cduSummary = useCduSummary(certification?.id);
  const { data: renewals = [] } = useMyRenewals(certification?.id);

  const hasActiveRenewal = renewals.some((renewalItem) => ["submitted", "under_review"].includes(renewalItem.status));

  if (certLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 animate-pulse">
        <div className="h-5 w-32 bg-muted rounded mb-4" />
        <div className="h-20 bg-muted rounded" />
      </div>
    );
  }

  // No certification state
  if (!certification) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground text-sm">{txt.certInfo}</h3>
        </div>
        <div className="text-center py-6">
          <Shield className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground mb-1">{txt.noCert}</p>
          <p className="text-xs text-muted-foreground/70 mb-4">{txt.noCertDesc}</p>
          <Link
            to="/consultant/certification-apply"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            {txt.applyCert}
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </motion.div>
    );
  }

  // Certification exists
  const certCode = certification.cert_code || certification.certification_type;
  const certType = certTypes.find((ct) => ct.cert_code === certCode);
  const certTypeName = certType
    ? langKey === "zh-TW" ? certType.cert_name_zh_tw || certType.cert_name_en
      : langKey === "zh-CN" ? certType.cert_name_zh_cn || certType.cert_name_en
        : certType.cert_name_en
    : certCode;

  const statusColors = STATUS_COLORS[certification.certification_status] || STATUS_COLORS.active;
  const statusLabelKey = `status${certification.certification_status.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("")}` as keyof typeof txt;
  const statusLabel = txt[statusLabelKey] || certification.certification_status;

  // Days until expiry
  const daysUntilExpiry = Math.ceil(
    (new Date(certification.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const isExpiringSoon = daysUntilExpiry <= 180 && daysUntilExpiry > 0;
  const isExpired = daysUntilExpiry <= 0;

  // CDU progress
  const totalApproved = cduSummary.totalApprovedHours;
  const minimumRequired = cduSummary.minimumRequired;
  const overallProgress = Math.min(100, cduSummary.progressPercent);

  const progressTheme = overallProgress >= 100
    ? "text-emerald-700"
    : overallProgress >= 50
      ? "text-blue-700"
      : "text-amber-700";

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header with cert code badge */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground text-sm">{txt.certInfo}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs px-2 py-0.5 border-[#1C2857]/20 text-[#1C2857]">
            {certCode}
          </Badge>
          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColors.text} ${statusColors.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusColors.dot}`} />
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Certification details grid */}
        <div className="grid grid-cols-2 gap-3">
          <InfoField icon={<Shield className="w-3.5 h-3.5" />} label={txt.certNumber} value={certification.certification_number} mono />
          <InfoField icon={<Calendar className="w-3.5 h-3.5" />} label={txt.issueDate} value={certification.issue_date} />
          <InfoField
            icon={isExpiringSoon ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> : <Calendar className="w-3.5 h-3.5" />}
            label={txt.expiryDate}
            value={
              isExpired
                ? `${certification.expiry_date} (${txt.expired})`
                : isExpiringSoon
                  ? `${certification.expiry_date} (${daysUntilExpiry} ${txt.daysLeft})`
                  : certification.expiry_date
            }
            highlight={isExpired || isExpiringSoon}
          />
          <InfoField icon={<RefreshCw className="w-3.5 h-3.5" />} label={txt.recertCount} value={String(certification.recertification_count || 0)} />
        </div>

        {/* CDU Progress */}
        <div className="bg-muted/30 rounded-lg p-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground">{txt.cduProgress}</span>
            </div>
            <span className={`text-xs font-bold ${progressTheme}`}>{Math.round(overallProgress)}%</span>
          </div>

          {/* Mini breakdown */}
          <div className="flex items-center gap-4 mb-2 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {txt.typeA}: {cduSummary.typeAHours}h
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {txt.typeB}: {cduSummary.typeBHours}h
            </span>
            <span className="text-muted-foreground">
              {txt.total}: {totalApproved}h / {minimumRequired}h
            </span>
          </div>

          {/* Progress bar */}
          <div className="relative h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            {totalApproved > 0 && (
              <>
                <div
                  className="absolute top-0 left-0 h-full bg-emerald-500 rounded-l-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (cduSummary.typeAHours / minimumRequired) * 100)}%` }}
                />
                <div
                  className="absolute top-0 h-full bg-blue-500 transition-all duration-500"
                  style={{
                    left: `${Math.min(100, (cduSummary.typeAHours / minimumRequired) * 100)}%`,
                    width: `${Math.min(100 - (cduSummary.typeAHours / minimumRequired) * 100, (cduSummary.typeBHours / minimumRequired) * 100)}%`,
                  }}
                />
              </>
            )}
          </div>

          {/* Eligibility status */}
          <div className="mt-2 flex items-center gap-1.5">
            {cduSummary.isEligibleForRenewal ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs text-emerald-700 font-medium">{txt.eligible}</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs text-amber-700 font-medium">
                  {txt.notEligible} · {txt.remaining}: {cduSummary.remainingHours}h
                </span>
              </>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2">
          <Link
            to="/consultant/cdu-records"
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg bg-muted/30 hover:bg-muted/50"
          >
            <FileText className="w-3.5 h-3.5" />
            {txt.viewCduRecords}
          </Link>
          {hasActiveRenewal ? (
            <Link
              to="/consultant/renewal"
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100"
            >
              <Clock className="w-3.5 h-3.5" />
              {txt.renewalPending}
            </Link>
          ) : (
            <Link
              to="/consultant/renewal"
              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors px-3 py-2 rounded-lg bg-primary/5 hover:bg-primary/10"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {txt.renewalStatus}
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function InfoField({
  icon,
  label,
  value,
  mono = false,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-6 h-6 rounded-md bg-muted/50 flex items-center justify-center text-muted-foreground flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</div>
        <div className={`text-xs font-semibold mt-0.5 truncate ${highlight ? "text-amber-600" : "text-foreground"} ${mono ? "font-mono" : ""}`}>
          {value}
        </div>
      </div>
    </div>
  );
}
