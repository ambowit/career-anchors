import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  Award,
  Calendar,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  User,
  Hash,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useVerifyCertification,
  useSearchCertifications,
  useCertificateTypes,
} from "@/hooks/useCertification";
import type { CertificationSearchResult } from "@/hooks/useCertification";
import { useTranslation } from "@/hooks/useLanguage";

type SearchMode = "number" | "name";

const TXT = {
  en: {
    certVerification: "Certificate Verification",
    certVerificationDesc: "Enter a certificate number or holder name to verify authenticity and current status.",
    searchByCertNo: "Certificate Number",
    searchByName: "Holder Name",
    certNumberLabel: "Certificate Number",
    certNumberPlaceholder: "e.g. SCPC2026001ABCD",
    nameLabel: "Name (Chinese or English)",
    namePlaceholder: "e.g. Zhang San or John Smith",
    verify: "Verify",
    search: "Search",
    verifying: "Verifying certificate...",
    searching: "Searching certificates...",
    notFound: "Certificate Not Found",
    notFoundDesc: "No certificate with number",
    notFoundSuffix: "was found in our system. Please double-check and try again.",
    noResults: "No Results Found",
    noResultsDesc: "No certificates found matching",
    noResultsSuffix: "Please try a different name or certificate number.",
    resultsFound: "results found",
    certHolder: "Certificate Holder",
    certNumber: "Certificate No.",
    certType: "Certificate Type",
    renewalCycle: "Renewal Cycle",
    issueDate: "Issue Date",
    validUntil: "Valid Until",
    years: "Years",
    email: "Registered Email",
    footer: "This verification is provided by the SCPC Certification System. For further inquiries, please contact your certifying organization.",
    secure: "Secure",
    verified: "Verified",
    official: "Official",
    recertCount: "Recertification Count",
    times: "times",
    statusActive: "Valid & Active",
    statusPendingRenewal: "Pending Renewal",
    statusUnderReview: "Under Review",
    statusExpired: "Expired",
    statusSuspended: "Suspended",
    statusRevoked: "Revoked",
    statusActiveDesc: "This certification is currently valid and in good standing.",
    statusPendingRenewalDesc: "This certification is approaching expiry and awaiting renewal.",
    statusUnderReviewDesc: "A renewal application for this certification is under review.",
    statusExpiredDesc: "This certification has expired and is no longer valid.",
    statusSuspendedDesc: "This certification has been temporarily suspended.",
    statusRevokedDesc: "This certification has been revoked and is no longer valid.",
    clickToExpand: "Click to view details",
  },
  "zh-TW": {
    certVerification: "證照查驗",
    certVerificationDesc: "輸入證書編號或持證人姓名，查驗認證真實性與當前狀態。",
    searchByCertNo: "證書編號",
    searchByName: "持證人姓名",
    certNumberLabel: "證書編號",
    certNumberPlaceholder: "例如 SCPC2026001ABCD",
    nameLabel: "姓名（中文或英文）",
    namePlaceholder: "例如 張三 或 John Smith",
    verify: "查驗",
    search: "搜尋",
    verifying: "正在查驗證書...",
    searching: "正在搜尋證書...",
    notFound: "未找到該證書",
    notFoundDesc: "系統中未找到編號為",
    notFoundSuffix: "的證書。請確認編號後重試。",
    noResults: "未找到結果",
    noResultsDesc: "未找到與",
    noResultsSuffix: "匹配的證書。請嘗試其他姓名或編號。",
    resultsFound: "筆結果",
    certHolder: "持證人",
    certNumber: "證書編號",
    certType: "認證類型",
    renewalCycle: "換證週期",
    issueDate: "頒發日期",
    validUntil: "有效期至",
    years: "年",
    email: "註冊信箱",
    footer: "此查驗由 SCPC 認證系統提供。如有更多疑問，請聯繫您的認證機構。",
    secure: "安全",
    verified: "已驗證",
    official: "官方",
    recertCount: "換證次數",
    times: "次",
    statusActive: "有效",
    statusPendingRenewal: "待換證",
    statusUnderReview: "審核中",
    statusExpired: "已過期",
    statusSuspended: "已暫停",
    statusRevoked: "已撤銷",
    statusActiveDesc: "該認證當前有效且狀態良好。",
    statusPendingRenewalDesc: "該認證即將到期，等待換證。",
    statusUnderReviewDesc: "該認證的換證申請正在審核中。",
    statusExpiredDesc: "該認證已過期，不再有效。",
    statusSuspendedDesc: "該認證已被臨時暫停。",
    statusRevokedDesc: "該認證已被撤銷，不再有效。",
    clickToExpand: "點擊查看詳情",
  },
  "zh-CN": {
    certVerification: "证照查验",
    certVerificationDesc: "输入证书编号或持证人姓名，查验认证真实性与当前状态。",
    searchByCertNo: "证书编号",
    searchByName: "持证人姓名",
    certNumberLabel: "证书编号",
    certNumberPlaceholder: "例如 SCPC2026001ABCD",
    nameLabel: "姓名（中文或英文）",
    namePlaceholder: "例如 张三 或 John Smith",
    verify: "查验",
    search: "搜索",
    verifying: "正在查验证书...",
    searching: "正在搜索证书...",
    notFound: "未找到该证书",
    notFoundDesc: "系统中未找到编号为",
    notFoundSuffix: "的证书。请确认编号后重试。",
    noResults: "未找到结果",
    noResultsDesc: "未找到与",
    noResultsSuffix: "匹配的证书。请尝试其他姓名或编号。",
    resultsFound: "笔结果",
    certHolder: "持证人",
    certNumber: "证书编号",
    certType: "认证类型",
    renewalCycle: "换证周期",
    issueDate: "颁发日期",
    validUntil: "有效期至",
    years: "年",
    email: "注册邮箱",
    footer: "此查验由 SCPC 认证系统提供。如有更多疑问，请联系您的认证机构。",
    secure: "安全",
    verified: "已验证",
    official: "官方",
    recertCount: "换证次数",
    times: "次",
    statusActive: "有效",
    statusPendingRenewal: "待换证",
    statusUnderReview: "审核中",
    statusExpired: "已过期",
    statusSuspended: "已暂停",
    statusRevoked: "已撤销",
    statusActiveDesc: "该认证当前有效且状态良好。",
    statusPendingRenewalDesc: "该认证即将到期，等待换证。",
    statusUnderReviewDesc: "该认证的换证申请正在审核中。",
    statusExpiredDesc: "该认证已过期，不再有效。",
    statusSuspendedDesc: "该认证已被临时暂停。",
    statusRevokedDesc: "该认证已被撤销，不再有效。",
    clickToExpand: "点击查看详情",
  },
};

const STATUS_STYLES: Record<string, { icon: React.ElementType; colorClass: string; bgClass: string; borderClass: string }> = {
  active: { icon: CheckCircle2, colorClass: "text-emerald-600", bgClass: "bg-emerald-50", borderClass: "border-emerald-200" },
  pending_renewal: { icon: Clock, colorClass: "text-amber-600", bgClass: "bg-amber-50", borderClass: "border-amber-200" },
  under_review: { icon: RefreshCw, colorClass: "text-blue-600", bgClass: "bg-blue-50", borderClass: "border-blue-200" },
  expired: { icon: XCircle, colorClass: "text-red-600", bgClass: "bg-red-50", borderClass: "border-red-200" },
  suspended: { icon: AlertTriangle, colorClass: "text-orange-600", bgClass: "bg-orange-50", borderClass: "border-orange-200" },
  revoked: { icon: Shield, colorClass: "text-slate-600", bgClass: "bg-slate-50", borderClass: "border-slate-200" },
};

const STATUS_LABEL_KEY: Record<string, keyof typeof TXT.en> = {
  active: "statusActive",
  pending_renewal: "statusPendingRenewal",
  under_review: "statusUnderReview",
  expired: "statusExpired",
  suspended: "statusSuspended",
  revoked: "statusRevoked",
};

const STATUS_DESC_KEY: Record<string, keyof typeof TXT.en> = {
  active: "statusActiveDesc",
  pending_renewal: "statusPendingRenewalDesc",
  under_review: "statusUnderReviewDesc",
  expired: "statusExpiredDesc",
  suspended: "statusSuspendedDesc",
  revoked: "statusRevokedDesc",
};

function formatVerifyDate(dateString: string, lang: string): string {
  const date = new Date(dateString);
  if (lang === "en") {
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }
  return date.toLocaleDateString("zh-TW", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export default function VerifyCertificatePage() {
  const { language } = useTranslation();
  const langKey = language === "en" ? "en" : language === "zh-TW" ? "zh-TW" : "zh-CN";
  const txt = TXT[langKey];

  const [searchParams] = useSearchParams();
  const certFromUrl = searchParams.get("cert");

  const [searchMode, setSearchMode] = useState<SearchMode>(certFromUrl ? "number" : "number");
  const [inputValue, setInputValue] = useState(certFromUrl || "");
  const [searchCert, setSearchCert] = useState<string | null>(certFromUrl);
  const [searchName, setSearchName] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: certTypes = [] } = useCertificateTypes();

  // Certificate number search (exact match)
  const { data: numberResult, isLoading: isLoadingNumber } = useVerifyCertification(
    searchMode === "number" ? searchCert : null
  );

  // Name search (multiple results)
  const { data: nameResults = [], isLoading: isLoadingName } = useSearchCertifications(
    searchMode === "name" ? searchName : null
  );

  const isLoading = searchMode === "number" ? isLoadingNumber : isLoadingName;

  useEffect(() => {
    if (certFromUrl) {
      setInputValue(certFromUrl);
      setSearchCert(certFromUrl);
      setSearchMode("number");
    }
  }, [certFromUrl]);

  const handleSearch = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (searchMode === "number") {
      setSearchCert(trimmed);
      setSearchName(null);
    } else {
      setSearchName(trimmed);
      setSearchCert(null);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") handleSearch();
  };

  const handleModeSwitch = (mode: SearchMode) => {
    setSearchMode(mode);
    setInputValue("");
    setSearchCert(null);
    setSearchName(null);
    setExpandedId(null);
  };

  const getCertTypeName = (certCode: string | null) => {
    if (!certCode) return certCode || "—";
    const certType = certTypes.find((ct) => ct.cert_code === certCode);
    if (!certType) return certCode;
    if (langKey === "zh-TW") return certType.cert_name_zh_tw || certType.cert_name_en;
    if (langKey === "zh-CN") return certType.cert_name_zh_cn || certType.cert_name_en;
    return certType.cert_name_en;
  };

  // Determine display state
  const hasSearched = searchMode === "number" ? !!searchCert : !!searchName;
  const numberNotFound = searchMode === "number" && hasSearched && !isLoading && !numberResult;
  const nameNotFound = searchMode === "name" && hasSearched && !isLoading && nameResults.length === 0;
  const numberFound = searchMode === "number" && hasSearched && !isLoading && !!numberResult;
  const nameFound = searchMode === "name" && hasSearched && !isLoading && nameResults.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 text-[#1C2857] hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-4 h-4" />
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-[#B5D260]" />
              <span className="font-bold text-lg tracking-tight">SCPC</span>
            </div>
          </Link>
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            {txt.certVerification}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1C2857] mb-5">
            <ShieldCheck className="w-8 h-8 text-[#B5D260]" />
          </div>
          <h1 className="text-3xl font-bold text-[#1C2857] mb-2">{txt.certVerification}</h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">{txt.certVerificationDesc}</p>
        </motion.div>

        {/* Search Mode Toggle */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex gap-2 mb-4">
          <button
            onClick={() => handleModeSwitch("number")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              searchMode === "number"
                ? "bg-[#1C2857] text-white shadow-md"
                : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            <Hash className="w-4 h-4" />
            {txt.searchByCertNo}
          </button>
          <button
            onClick={() => handleModeSwitch("name")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              searchMode === "name"
                ? "bg-[#1C2857] text-white shadow-md"
                : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            <User className="w-4 h-4" />
            {txt.searchByName}
          </button>
        </motion.div>

        {/* Search Box */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8"
        >
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
            {searchMode === "number" ? txt.certNumberLabel : txt.nameLabel}
          </label>
          <div className="flex gap-3">
            <Input
              placeholder={searchMode === "number" ? txt.certNumberPlaceholder : txt.namePlaceholder}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleKeyDown}
              className={`text-base h-12 ${searchMode === "number" ? "font-mono tracking-wide" : ""}`}
            />
            <Button
              onClick={handleSearch}
              disabled={!inputValue.trim() || isLoading}
              className="h-12 px-6 bg-[#1C2857] hover:bg-[#2a3a6b] gap-2"
            >
              <Search className="w-4 h-4" />
              {searchMode === "number" ? txt.verify : txt.search}
            </Button>
          </div>
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {/* Loading */}
          {isLoading && hasSearched && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-16">
              <div className="w-10 h-10 border-3 border-[#1C2857] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-slate-400">{searchMode === "number" ? txt.verifying : txt.searching}</p>
            </motion.div>
          )}

          {/* Certificate Number — Not Found */}
          {numberNotFound && (
            <motion.div key="not-found" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
              <div className="bg-red-50 px-6 py-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <ShieldX className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-red-700 text-lg">{txt.notFound}</h3>
                </div>
              </div>
              <div className="px-6 py-5">
                <p className="text-slate-600 text-sm leading-relaxed">
                  {txt.notFoundDesc} <span className="font-mono font-semibold text-red-600">{searchCert}</span> {txt.notFoundSuffix}
                </p>
              </div>
            </motion.div>
          )}

          {/* Name — No Results */}
          {nameNotFound && (
            <motion.div key="name-not-found" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
              <div className="bg-red-50 px-6 py-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <ShieldX className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-red-700 text-lg">{txt.noResults}</h3>
                </div>
              </div>
              <div className="px-6 py-5">
                <p className="text-slate-600 text-sm leading-relaxed">
                  {txt.noResultsDesc} "<span className="font-semibold text-red-600">{searchName}</span>" {txt.noResultsSuffix}
                </p>
              </div>
            </motion.div>
          )}

          {/* Certificate Number — Found (single result) */}
          {numberFound && numberResult && (
            <SingleCertResult result={numberResult} txt={txt} langKey={langKey} getCertTypeName={getCertTypeName} />
          )}

          {/* Name — Found (multiple results) */}
          {nameFound && (
            <motion.div key="name-results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="font-medium">{nameResults.length} {txt.resultsFound}</span>
              </div>
              {nameResults.map((item, index) => (
                <NameSearchResultCard
                  key={item.certification.id}
                  item={item}
                  index={index}
                  isExpanded={expandedId === item.certification.id}
                  onToggle={() => setExpandedId(expandedId === item.certification.id ? null : item.certification.id)}
                  txt={txt}
                  langKey={langKey}
                  getCertTypeName={getCertTypeName}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trust indicators (idle state) */}
        {!hasSearched && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-12 text-center">
            <div className="flex items-center justify-center gap-8 text-slate-300">
              <div className="flex flex-col items-center gap-2">
                <Shield className="w-6 h-6" />
                <span className="text-[10px] uppercase tracking-wider font-medium">{txt.secure}</span>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 className="w-6 h-6" />
                <span className="text-[10px] uppercase tracking-wider font-medium">{txt.verified}</span>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div className="flex flex-col items-center gap-2">
                <Award className="w-6 h-6" />
                <span className="text-[10px] uppercase tracking-wider font-medium">{txt.official}</span>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

// =========== Single Certificate Number Result ===========
function SingleCertResult({
  result,
  txt,
  langKey,
  getCertTypeName,
}: {
  result: {
    certificationNumber: string;
    certificationType: string;
    certificationStatus: string;
    issueDate: string;
    expiryDate: string;
    renewalCycleYears: number;
    holderName: string | null;
    holderEmailMasked: string | null;
  };
  txt: typeof TXT.en;
  langKey: string;
  getCertTypeName: (code: string | null) => string;
}) {
  const statusStyle = STATUS_STYLES[result.certificationStatus] || STATUS_STYLES.active;
  const isValid = result.certificationStatus === "active";
  const statusLabelKey = STATUS_LABEL_KEY[result.certificationStatus];
  const statusDescKey = STATUS_DESC_KEY[result.certificationStatus];
  const statusLabel = statusLabelKey ? txt[statusLabelKey] : result.certificationStatus;
  const statusDesc = statusDescKey ? txt[statusDescKey] : "";

  // Extract cert_code from certification_number prefix (e.g., SCPC2026001ABCD → SCPC)
  const certCodeMatch = result.certificationNumber.match(/^([A-Z]+)\d/);
  const certCode = certCodeMatch ? certCodeMatch[1] : null;

  return (
    <motion.div key="found" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Status Banner */}
      <div className={`px-6 py-5 flex items-center gap-4 ${statusStyle.bgClass} border-b ${statusStyle.borderClass}`}>
        <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-white shadow-sm">
          {isValid ? <ShieldCheck className={`w-7 h-7 ${statusStyle.colorClass}`} /> : <ShieldAlert className={`w-7 h-7 ${statusStyle.colorClass}`} />}
        </div>
        <div>
          <div className={`text-2xl font-bold ${statusStyle.colorClass}`}>{statusLabel}</div>
          <div className="text-xs text-slate-500 mt-0.5">{statusDesc}</div>
        </div>
      </div>

      {/* Certificate Details */}
      <div className="px-6 py-6">
        {/* Cert code badge */}
        {certCode && (
          <div className="mb-5">
            <Badge variant="outline" className="font-mono text-sm px-3 py-1 border-[#1C2857]/20 text-[#1C2857]">
              {certCode}
            </Badge>
            <span className="ml-2 text-sm text-slate-500">{getCertTypeName(certCode)}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-5">
          <DetailItem label={txt.certHolder} value={result.holderName || "—"} icon={<Award className="w-4 h-4" />} />
          <DetailItem label={txt.certNumber} value={result.certificationNumber} icon={<Shield className="w-4 h-4" />} mono />
          <DetailItem label={txt.certType} value={getCertTypeName(result.certificationType)} icon={<CheckCircle2 className="w-4 h-4" />} />
          <DetailItem label={txt.renewalCycle} value={`${result.renewalCycleYears} ${txt.years}`} icon={<RefreshCw className="w-4 h-4" />} />
          <DetailItem label={txt.issueDate} value={formatVerifyDate(result.issueDate, langKey)} icon={<Calendar className="w-4 h-4" />} />
          <DetailItem label={txt.validUntil} value={formatVerifyDate(result.expiryDate, langKey)} icon={<Calendar className="w-4 h-4" />} highlight={!isValid} />
        </div>

        {result.holderEmailMasked && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">{txt.email}: <span className="font-mono">{result.holderEmailMasked}</span></p>
          </div>
        )}
      </div>

      <div className="bg-slate-50 px-6 py-4 border-t border-slate-100">
        <p className="text-xs text-slate-400 leading-relaxed">{txt.footer}</p>
      </div>
    </motion.div>
  );
}

// =========== Name Search Result Card ===========
function NameSearchResultCard({
  item,
  index,
  isExpanded,
  onToggle,
  txt,
  langKey,
  getCertTypeName,
}: {
  item: CertificationSearchResult;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  txt: typeof TXT.en;
  langKey: string;
  getCertTypeName: (code: string | null) => string;
}) {
  const certification = item.certification;
  const profile = item.profile;
  const statusStyle = STATUS_STYLES[certification.certification_status] || STATUS_STYLES.active;
  const StatusIcon = statusStyle.icon;
  const isValid = certification.certification_status === "active";
  const statusLabelKey = STATUS_LABEL_KEY[certification.certification_status];
  const statusLabel = statusLabelKey ? txt[statusLabelKey] : certification.certification_status;
  const certCode = certification.cert_code || certification.certification_type;

  const holderName = profile?.full_name || "—";
  const holderEnglishName = [certification.first_name_en, certification.last_name_en].filter(Boolean).join(" ") || (profile?.first_name_en && profile?.last_name_en ? `${profile.first_name_en} ${profile.last_name_en}` : null);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Collapsed summary */}
      <button onClick={onToggle} className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors">
        <div className="flex items-center gap-4 min-w-0">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${statusStyle.bgClass}`}>
            <StatusIcon className={`w-5 h-5 ${statusStyle.colorClass}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-foreground">{holderName}</span>
              {holderEnglishName && <span className="text-xs text-muted-foreground">({holderEnglishName})</span>}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {certCode && (
                <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 h-5">
                  {certCode}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground font-mono">{certification.certification_number}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle.colorClass} ${statusStyle.bgClass}`}>
            {statusLabel}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 border-t border-slate-100">
              {certCode && (
                <div className="mb-4">
                  <Badge variant="outline" className="font-mono text-sm px-3 py-1 border-[#1C2857]/20 text-[#1C2857]">
                    {certCode}
                  </Badge>
                  <span className="ml-2 text-sm text-slate-500">{getCertTypeName(certCode)}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label={txt.certNumber} value={certification.certification_number} icon={<Shield className="w-4 h-4" />} mono />
                <DetailItem label={txt.renewalCycle} value={`${certification.renewal_cycle_years} ${txt.years}`} icon={<RefreshCw className="w-4 h-4" />} />
                <DetailItem label={txt.issueDate} value={formatVerifyDate(certification.issue_date, langKey)} icon={<Calendar className="w-4 h-4" />} />
                <DetailItem label={txt.validUntil} value={formatVerifyDate(certification.expiry_date, langKey)} icon={<Calendar className="w-4 h-4" />} highlight={!isValid} />
                {certification.recertification_count > 0 && (
                  <DetailItem label={txt.recertCount} value={`${certification.recertification_count} ${txt.times}`} icon={<RefreshCw className="w-4 h-4" />} />
                )}
              </div>
              {profile?.email && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-400">
                    {txt.email}: <span className="font-mono">{profile.email.replace(/(.{2})(.*)(@.*)/, "$1***$3")}</span>
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// =========== Detail Item ===========
function DetailItem({
  label,
  value,
  icon,
  mono = false,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">{label}</div>
        <div className={`text-sm font-semibold mt-0.5 ${highlight ? "text-red-600" : "text-[#1C2857]"} ${mono ? "font-mono tracking-wide" : ""}`}>
          {value}
        </div>
      </div>
    </div>
  );
}
