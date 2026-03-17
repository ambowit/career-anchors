import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, ArrowRight, Check, ClipboardList, Settings2, Link2, ShieldCheck,
  Copy, Download, FileText, Globe, Clock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { copyToClipboard } from "@/lib/clipboard";
import { SITE_ORIGIN } from "@/lib/utils";
import { ASSESSMENT_TYPE_LABELS, LINK_STATUS_LABELS, type AssessmentType } from "@/data/anonymousAssessmentMockData";

const PRIMARY = "#1C2857";
const ACCENT_GREEN = "#20A87B";

interface WizardData {
  assessmentType: AssessmentType | "";
  batchName: string;
  description: string;
  participantCount: number;
  expiresAt: string;
  allowReportReopen: boolean;
  optionalIdentity: boolean;
  reportVisibility: "personal_only" | "personal_and_benchmark";
  language: string;
  instructions: string;
}

const STEPS = [
  { key: "select", icon: ClipboardList },
  { key: "configure", icon: Settings2 },
  { key: "generate", icon: Link2 },
  { key: "confirm", icon: ShieldCheck },
];

function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const segments = [6, 4, 4];
  return segments.map((len) => {
    let segment = "";
    for (let charIndex = 0; charIndex < len; charIndex++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return segment;
  }).join("-");
}

export default function CreateAnonymousBatchPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useTranslation();
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [generatedLinks, setGeneratedLinks] = useState<{ token: string; url: string }[]>([]);
  const [createdBatchId, setCreatedBatchId] = useState<string | null>(null);
  const [isGeneratingLinks, setIsGeneratingLinks] = useState(false);

  const t = (en: string, zhTw: string) => language === "en" ? en : zhTw;

  const stepLabels = [
    t("Select Assessment", "選擇測評"),
    t("Configure Batch", "設定批次"),
    t("Generate Links", "生成連結"),
    t("Confirm & Activate", "確認啟用"),
  ];

  const [formData, setFormData] = useState<WizardData>({
    assessmentType: "",
    batchName: "",
    description: "",
    participantCount: 20,
    expiresAt: "",
    allowReportReopen: true,
    optionalIdentity: false,
    reportVisibility: "personal_only",
    language: "zh-TW",
    instructions: "",
  });

  const updateField = <K extends keyof WizardData>(key: K, value: WizardData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const assessmentOptions: { type: AssessmentType; description: string; duration: string; icon: string }[] = [
    { type: "career_anchor", description: t("Evaluate 8 career anchor dimensions", "評估 8 大職業錨維度，深入了解專業動機"), duration: t("15-20 min", "15-20 分鐘"), icon: "🎯" },
    { type: "life_card", description: t("Explore core values through card sorting", "透過卡片排序探索核心價值觀與人生優先序"), duration: t("10-15 min", "10-15 分鐘"), icon: "🃏" },
    { type: "fusion", description: t("Combined career anchor and Espresso Card analysis", "結合職業錨與人生卡的綜合深度分析"), duration: t("25-30 min", "25-30 分鐘"), icon: "🔮" },
  ];

  // Create batch + generate links in DB
  const handleGenerateLinks = async () => {
    setIsGeneratingLinks(true);
    try {
      // Step 1: Create batch record
      const { data: batchData, error: batchError } = await (supabase as any)
        .from("anonymous_assessment_batches")
        .insert({
          batch_name: formData.batchName,
          description: formData.description,
          assessment_type: formData.assessmentType,
          total_links: formData.participantCount,
          status: "draft",
          created_by: profile?.id || null,
          created_by_name: profile?.full_name || profile?.email || "",
          expires_at: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
          allow_report_reopen: formData.allowReportReopen,
          optional_identity_enabled: formData.optionalIdentity,
          report_visibility: formData.reportVisibility,
          language: formData.language,
          instructions: formData.instructions,
        })
        .select()
        .single();

      if (batchError) throw batchError;
      setCreatedBatchId(batchData.id);

      // Step 2: Generate unique links
      const linkRecords = [];
      const linkUrls: { token: string; url: string }[] = [];
      for (let linkIndex = 0; linkIndex < formData.participantCount; linkIndex++) {
        const token = generateToken();
        linkRecords.push({ batch_id: batchData.id, token, status: "unused" });
        linkUrls.push({ token, url: `${SITE_ORIGIN}/a/${token}` });
      }

      // Insert links in chunks of 100 to avoid payload size limits
      for (let chunkStart = 0; chunkStart < linkRecords.length; chunkStart += 100) {
        const chunk = linkRecords.slice(chunkStart, chunkStart + 100);
        const { error: linkError } = await (supabase as any)
          .from("anonymous_assessment_links")
          .insert(chunk);
        if (linkError) throw linkError;
      }

      setGeneratedLinks(linkUrls);
      toast.success(t(`${formData.participantCount} links generated!`, `已生成 ${formData.participantCount} 條連結！`));
    } catch (error: any) {
      toast.error(error.message || t("Failed to generate links", "生成連結失敗"));
    } finally {
      setIsGeneratingLinks(false);
    }
  };

  // Activate batch
  const activateMutation = useMutation({
    mutationFn: async () => {
      if (!createdBatchId) throw new Error("No batch ID");
      const { error } = await (supabase as any)
        .from("anonymous_assessment_batches")
        .update({ status: "active" })
        .eq("id", createdBatchId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anonymous-batches"] });
      toast.success(t("Batch activated successfully!", "批次已成功啟用！"));
      navigate("/super-admin/anonymous-assessment");
    },
    onError: (error: any) => {
      toast.error(error.message || t("Failed to activate", "啟用失敗"));
    },
  });

  const handleSaveDraft = () => {
    queryClient.invalidateQueries({ queryKey: ["anonymous-batches"] });
    toast.success(t("Saved as draft", "已儲存為草稿"));
    navigate("/super-admin/anonymous-assessment");
  };

  const handleNext = () => {
    if (currentStep === 2 && generatedLinks.length === 0) {
      handleGenerateLinks();
      return;
    }
    if (currentStep < 3) setCurrentStep((prev) => prev + 1);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return formData.assessmentType !== "";
      case 1: return formData.batchName.trim() !== "" && formData.participantCount > 0;
      case 2: return generatedLinks.length > 0;
      case 3: return true;
      default: return false;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/super-admin/anonymous-assessment")}>
          <ArrowLeft className="w-4 h-4 mr-1" />{t("Back", "返回")}
        </Button>
        <h1 className="text-xl font-bold" style={{ color: PRIMARY }}>{t("Create Anonymous Batch", "建立匿名測評批次")}</h1>
      </div>

      {/* Step Indicator */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isActive ? "text-white shadow-lg" : isCompleted ? "text-white" : "bg-slate-100 text-slate-400"
                    }`}
                    style={{ backgroundColor: isActive ? PRIMARY : isCompleted ? ACCENT_GREEN : undefined, boxShadow: isActive ? `0 4px 14px ${PRIMARY}40` : undefined }}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${isActive ? "text-[#1C2857]" : isCompleted ? "text-emerald-600" : "text-slate-400"}`}>
                    {stepLabels[index]}
                  </span>
                </div>
                {index < 3 && <div className={`flex-1 h-px mx-4 mt-[-18px] ${index < currentStep ? "bg-emerald-300" : "bg-slate-200"}`} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        {/* Step 1: Select Assessment */}
        {currentStep === 0 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">{t("Select Assessment Type", "選擇測評類型")}</h2>
              <p className="text-sm text-slate-500 mt-1">{t("Choose which assessment to deploy anonymously", "選擇要進行匿名施測的測評類型")}</p>
            </div>
            <div className="grid gap-4">
              {assessmentOptions.map((option) => {
                const isSelected = formData.assessmentType === option.type;
                return (
                  <button key={option.type} onClick={() => updateField("assessmentType", option.type)}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all ${isSelected ? "border-[#1C2857] bg-[#1C2857]/[0.03] shadow-md" : "border-slate-200 hover:border-slate-300 hover:shadow-sm"}`}>
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">{option.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">{language === "en" ? ASSESSMENT_TYPE_LABELS[option.type].en : ASSESSMENT_TYPE_LABELS[option.type].zhTw}</span>
                          <Badge variant="outline" className="text-xs border-slate-200 text-slate-500"><Clock className="w-3 h-3 mr-1" />{option.duration}</Badge>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">{option.description}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${isSelected ? "border-[#1C2857] bg-[#1C2857]" : "border-slate-300"}`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Configure Batch */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">{t("Configure Batch", "設定批次")}</h2>
              <p className="text-sm text-slate-500 mt-1">{t("Set up parameters for your anonymous assessment batch", "設定匿名測評批次的各項參數")}</p>
            </div>
            <div className="grid gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-700">{t("Batch Name", "批次名稱")} *</Label>
                  <Input value={formData.batchName} onChange={(e) => updateField("batchName", e.target.value)} placeholder={t("e.g., Q1 2026 Team Assessment", "例：2026 Q1 全員普測")} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-slate-700">{t("Number of Participants", "參與人數")} *</Label>
                  <Input type="number" min={1} max={1000} value={formData.participantCount} onChange={(e) => updateField("participantCount", parseInt(e.target.value) || 0)} className="mt-1.5" />
                </div>
              </div>
              <div>
                <Label className="text-slate-700">{t("Description", "批次描述")}</Label>
                <Textarea value={formData.description} onChange={(e) => updateField("description", e.target.value)} placeholder={t("Brief description…", "簡述此批次測評的目的…")} className="mt-1.5 resize-none" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-700">{t("Expiration Date", "截止日期")}</Label>
                  <Input type="date" value={formData.expiresAt} onChange={(e) => updateField("expiresAt", e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-slate-700">{t("Language", "語言")}</Label>
                  <Select value={formData.language} onValueChange={(v) => updateField("language", v)}>
                    <SelectTrigger className="mt-1.5"><Globe className="w-4 h-4 mr-2 text-slate-400" /><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zh-TW">繁體中文</SelectItem>
                      <SelectItem value="zh-CN">简体中文</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Settings2 className="w-4 h-4" style={{ color: PRIMARY }} />{t("Advanced Settings", "進階設定")}
                </h3>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm font-medium text-slate-700">{t("Allow report reopen", "允許重新開啟報告")}</div>
                    <div className="text-xs text-slate-400">{t("Participants can revisit their report", "參與者可透過同一連結重新查看報告")}</div>
                  </div>
                  <Switch checked={formData.allowReportReopen} onCheckedChange={(c) => updateField("allowReportReopen", c)} />
                </div>
                <div className="flex items-center justify-between py-2 border-t border-slate-100">
                  <div>
                    <div className="text-sm font-medium text-slate-700">{t("Optional self-identification", "選填身份欄位")}</div>
                    <div className="text-xs text-slate-400">{t("Participants may optionally enter their name", "參與者可選擇性填寫姓名")}</div>
                  </div>
                  <Switch checked={formData.optionalIdentity} onCheckedChange={(c) => updateField("optionalIdentity", c)} />
                </div>
                <div className="flex items-center justify-between py-2 border-t border-slate-100">
                  <div>
                    <div className="text-sm font-medium text-slate-700">{t("Report visibility", "報告可見範圍")}</div>
                    <div className="text-xs text-slate-400">{t("What participants can see", "參與者完成後可看到的內容")}</div>
                  </div>
                  <Select value={formData.reportVisibility} onValueChange={(v: any) => updateField("reportVisibility", v)}>
                    <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal_only">{t("Personal only", "僅個人報告")}</SelectItem>
                      <SelectItem value="personal_and_benchmark">{t("Personal + Benchmark", "個人 + 對標摘要")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-slate-700">{t("Instructions for Participants", "參與者說明")}</Label>
                <Textarea value={formData.instructions} onChange={(e) => updateField("instructions", e.target.value)} placeholder={t("Instructions shown before assessment…", "參與者開始測評前顯示的指引說明…")} className="mt-1.5 resize-none" rows={3} />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Generate Links */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">{t("Generated Links", "已生成連結")}</h2>
                <p className="text-sm text-slate-500 mt-1">
                  {generatedLinks.length > 0
                    ? t(`${generatedLinks.length} unique anonymous links ready`, `已準備 ${generatedLinks.length} 條唯一匿名連結`)
                    : t("Click generate to create anonymous links", "點擊生成按鈕建立匿名連結")}
                </p>
              </div>
              {generatedLinks.length === 0 && (
                <Button onClick={handleGenerateLinks} disabled={isGeneratingLinks} style={{ backgroundColor: PRIMARY }} className="text-white">
                  {isGeneratingLinks ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
                  {isGeneratingLinks ? t("Generating…", "生成中…") : t("Generate Links", "生成連結")}
                </Button>
              )}
            </div>
            {generatedLinks.length > 0 && (
              <>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <Badge style={{ backgroundColor: `${ACCENT_GREEN}15`, color: ACCENT_GREEN, border: `1px solid ${ACCENT_GREEN}30` }}>
                    <Check className="w-3 h-3 mr-1" />{generatedLinks.length} {t("links ready", "條連結已就緒")}
                  </Badge>
                  <div className="flex-1" />
                  <Button variant="outline" size="sm" onClick={async () => { const ok = await copyToClipboard(generatedLinks.map((l) => l.url).join("\n")); if (ok) toast.success(t("All links copied!", "所有連結已複製！")); else toast.error(t("Copy failed", "複製失敗")); }}>
                    <Copy className="w-3.5 h-3.5 mr-1.5" />{t("Copy All", "複製全部")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    const csv = ["#,Token,URL", ...generatedLinks.map((l, i) => `${i + 1},${l.token},${l.url}`)].join("\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const anchor = document.createElement("a");
                    anchor.href = url;
                    anchor.download = `anonymous-links-${formData.batchName}.csv`;
                    anchor.click();
                    toast.success(t("CSV exported!", "CSV 已匯出！"));
                  }}>
                    <Download className="w-3.5 h-3.5 mr-1.5" />{t("Export CSV", "匯出 CSV")}
                  </Button>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[360px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white border-b border-slate-100">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">#</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">{t("Link", "連結")}</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500">{t("Status", "狀態")}</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500">{t("Action", "操作")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generatedLinks.map((link, index) => (
                        <tr key={link.token} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="px-4 py-2.5 text-slate-400 text-xs">{index + 1}</td>
                          <td className="px-4 py-2.5"><code className="text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded font-mono">{link.url}</code></td>
                          <td className="px-4 py-2.5 text-center"><Badge className={`text-[10px] ${LINK_STATUS_LABELS.unused.color}`} variant="outline">{language === "en" ? "Unused" : "未使用"}</Badge></td>
                          <td className="px-4 py-2.5 text-center">
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={async () => { const ok = await copyToClipboard(link.url); if (ok) toast.success(t("Copied!", "已複製！")); else toast.error(t("Copy failed", "複製失敗")); }}>
                              <Copy className="w-3 h-3 mr-1" />{t("Copy", "複製")}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 4: Confirm & Activate */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">{t("Confirm & Activate", "確認並啟用")}</h2>
              <p className="text-sm text-slate-500 mt-1">{t("Review your batch configuration before activating", "啟用前請確認批次設定")}</p>
            </div>
            <div className="border-2 border-[#1C2857]/10 rounded-xl p-6 space-y-4" style={{ backgroundColor: `${PRIMARY}03` }}>
              <div className="grid grid-cols-2 gap-6">
                <div><div className="text-xs text-slate-500 mb-1">{t("Assessment", "測評類型")}</div><div className="font-medium text-slate-800">{formData.assessmentType ? (language === "en" ? ASSESSMENT_TYPE_LABELS[formData.assessmentType].en : ASSESSMENT_TYPE_LABELS[formData.assessmentType].zhTw) : "—"}</div></div>
                <div><div className="text-xs text-slate-500 mb-1">{t("Batch Name", "批次名稱")}</div><div className="font-medium text-slate-800">{formData.batchName || "—"}</div></div>
                <div><div className="text-xs text-slate-500 mb-1">{t("Participants", "參與人數")}</div><div className="font-medium text-slate-800">{formData.participantCount}</div></div>
                <div><div className="text-xs text-slate-500 mb-1">{t("Links Generated", "已生成連結")}</div><div className="font-medium" style={{ color: ACCENT_GREEN }}>{generatedLinks.length}</div></div>
                <div><div className="text-xs text-slate-500 mb-1">{t("Expiration", "截止日期")}</div><div className="font-medium text-slate-800">{formData.expiresAt || t("No expiration", "無截止日期")}</div></div>
                <div><div className="text-xs text-slate-500 mb-1">{t("Language", "語言")}</div><div className="font-medium text-slate-800">{formData.language}</div></div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="text-sm text-amber-800">{t("Once activated, participants can start immediately.", "啟用後，參與者即可透過唯一連結立即開始測評。")}</div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => currentStep > 0 ? setCurrentStep((p) => p - 1) : navigate("/super-admin/anonymous-assessment")}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />{currentStep === 0 ? t("Cancel", "取消") : t("Previous", "上一步")}
        </Button>
        <div className="flex items-center gap-3">
          {currentStep === 3 && <Button variant="outline" onClick={handleSaveDraft}>{t("Save as Draft", "儲存為草稿")}</Button>}
          {currentStep < 3 ? (
            <Button onClick={handleNext} disabled={!canProceed() || isGeneratingLinks} style={{ backgroundColor: canProceed() && !isGeneratingLinks ? PRIMARY : undefined }} className={canProceed() && !isGeneratingLinks ? "text-white shadow-lg" : ""}>
              {isGeneratingLinks ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
              {t("Next", "下一步")}<ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : (
            <Button onClick={() => activateMutation.mutate()} disabled={activateMutation.isPending} style={{ backgroundColor: ACCENT_GREEN }} className="text-white shadow-lg">
              {activateMutation.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Check className="w-4 h-4 mr-1.5" />}
              {t("Activate Batch", "啟用批次")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
