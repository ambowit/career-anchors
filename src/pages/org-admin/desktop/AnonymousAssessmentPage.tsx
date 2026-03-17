import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Link2, Users, CheckCircle2, Clock, Copy, Download,
  Plus, Loader2, Eye, BarChart3, Ban, Search,
  ClipboardList, Settings2, ShieldCheck, ArrowRight, ArrowLeft, Check,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { copyToClipboard } from "@/lib/clipboard";
import { SITE_ORIGIN } from "@/lib/utils";
import {
  ASSESSMENT_TYPE_LABELS, BATCH_STATUS_LABELS, LINK_STATUS_LABELS,
  type AssessmentType, type BatchStatus, type LinkStatus,
} from "@/data/anonymousAssessmentMockData";

const PRIMARY = "#1C2857";
const ACCENT_GREEN = "#20A87B";

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

export default function OrgAnonymousAssessmentPage() {
  const queryClient = useQueryClient();
  const { language } = useTranslation();
  const { profile } = useAuth();
  const { organizationId } = usePermissions();
  const [view, setView] = useState<"list" | "create" | "detail">("list");
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const t = (en: string, zhTw: string) => language === "en" ? en : zhTw;

  // Fetch batches created by users in this org (or by current user)
  const { data: batches = [], isLoading } = useQuery({
    queryKey: ["org-anonymous-batches", organizationId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("anonymous_assessment_batches")
        .select("*")
        .eq("created_by", profile?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const filteredBatches = batches.filter((batch: any) =>
    !searchQuery || (batch.batch_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Create batch state
  const [wizardStep, setWizardStep] = useState(0);
  const [formData, setFormData] = useState({
    assessmentType: "" as AssessmentType | "",
    batchName: "",
    description: "",
    participantCount: 20,
    expiresAt: "",
    allowReportReopen: true,
    optionalIdentity: false,
    reportVisibility: "personal_only" as "personal_only" | "personal_and_benchmark",
    language: "zh-TW",
    instructions: "",
  });
  const [generatedLinks, setGeneratedLinks] = useState<{ token: string; url: string }[]>([]);
  const [createdBatchId, setCreatedBatchId] = useState<string | null>(null);
  const [isGeneratingLinks, setIsGeneratingLinks] = useState(false);

  const updateField = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerateLinks = async () => {
    setIsGeneratingLinks(true);
    try {
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

      const linkRecords = [];
      const linkUrls: { token: string; url: string }[] = [];
      for (let linkIndex = 0; linkIndex < formData.participantCount; linkIndex++) {
        const token = generateToken();
        linkRecords.push({ batch_id: batchData.id, token, status: "unused" });
        linkUrls.push({ token, url: `${SITE_ORIGIN}/a/${token}` });
      }

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
      queryClient.invalidateQueries({ queryKey: ["org-anonymous-batches"] });
      toast.success(t("Batch activated!", "批次已啟用！"));
      setView("list");
      resetForm();
    },
  });

  const resetForm = () => {
    setWizardStep(0);
    setFormData({
      assessmentType: "", batchName: "", description: "", participantCount: 20,
      expiresAt: "", allowReportReopen: true, optionalIdentity: false,
      reportVisibility: "personal_only", language: "zh-TW", instructions: "",
    });
    setGeneratedLinks([]);
    setCreatedBatchId(null);
  };

  // Detail view
  const { data: detailLinks = [] } = useQuery({
    queryKey: ["org-anonymous-links", selectedBatchId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("anonymous_assessment_links")
        .select("*")
        .eq("batch_id", selectedBatchId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedBatchId && view === "detail",
  });

  const selectedBatch = batches.find((b: any) => b.id === selectedBatchId);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString();
  };

  const assessmentOptions: { type: AssessmentType; description: string; duration: string; icon: string }[] = [
    { type: "career_anchor", description: t("Career anchor assessment", "SCPC 職業錨測評"), duration: t("15-20 min", "15-20 分鐘"), icon: "🎯" },
    { type: "life_card", description: t("Espresso Card assessment", "理想人生卡測評"), duration: t("10-15 min", "10-15 分鐘"), icon: "🃏" },
    { type: "fusion", description: t("Integration assessment", "整合測評"), duration: t("25-30 min", "25-30 分鐘"), icon: "🔮" },
  ];

  // ── List View ──
  if (view === "list") {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{t("Anonymous Assessment", "匿名測評")}</h1>
            <p className="text-sm text-slate-500 mt-1">{t("Create and manage anonymous assessment batches", "建立和管理匿名測評批次")}</p>
          </div>
          <Button onClick={() => { resetForm(); setView("create"); }} style={{ backgroundColor: PRIMARY }} className="text-white">
            <Plus className="w-4 h-4 mr-2" />{t("New Batch", "新建批次")}
          </Button>
        </div>

        <div className="mb-4 relative max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t("Search batches...", "搜尋批次...")} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : filteredBatches.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm text-slate-500">{t("No batches yet", "尚無批次")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBatches.map((batch: any) => {
              const statusConfig = BATCH_STATUS_LABELS[batch.status as BatchStatus];
              return (
                <div key={batch.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => { setSelectedBatchId(batch.id); setView("detail"); }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-slate-800">{batch.batch_name}</h3>
                        <Badge className={`text-[10px] ${statusConfig?.color || ""}`} variant="outline">
                          {statusConfig ? (language === "en" ? statusConfig.en : statusConfig.zhTw) : batch.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {language === "en" ? ASSESSMENT_TYPE_LABELS[batch.assessment_type as AssessmentType]?.en : ASSESSMENT_TYPE_LABELS[batch.assessment_type as AssessmentType]?.zhTw}
                        {" · "}{batch.total_links} {t("links", "條連結")}
                        {" · "}{formatDate(batch.created_at)}
                      </p>
                    </div>
                    <Eye className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Create View ──
  if (view === "create") {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView("list")}>
            <ArrowLeft className="w-4 h-4 mr-1" />{t("Back", "返回")}
          </Button>
          <h1 className="text-xl font-bold" style={{ color: PRIMARY }}>{t("Create Anonymous Batch", "建立匿名測評批次")}</h1>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-8">
          {/* Step 0: Select type */}
          {wizardStep === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800">{t("Select Assessment Type", "選擇測評類型")}</h2>
              <div className="grid gap-3">
                {assessmentOptions.map((opt) => (
                  <button key={opt.type} onClick={() => updateField("assessmentType", opt.type)} className={`w-full text-left p-4 rounded-xl border-2 transition-all ${formData.assessmentType === opt.type ? "border-[#1C2857] bg-[#1C2857]/[0.03]" : "border-slate-200 hover:border-slate-300"}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{opt.icon}</span>
                      <div className="flex-1">
                        <span className="font-medium text-slate-800">{opt.description}</span>
                        <span className="text-xs text-slate-400 ml-2">{opt.duration}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Configure */}
          {wizardStep === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-800">{t("Configure Batch", "設定批次")}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t("Batch Name", "批次名稱")} *</Label>
                  <Input value={formData.batchName} onChange={(e) => updateField("batchName", e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>{t("Participants", "參與人數")} *</Label>
                  <Input type="number" min={1} max={500} value={formData.participantCount} onChange={(e) => updateField("participantCount", parseInt(e.target.value) || 0)} className="mt-1.5" />
                </div>
              </div>
              <div>
                <Label>{t("Description", "描述")}</Label>
                <Textarea value={formData.description} onChange={(e) => updateField("description", e.target.value)} className="mt-1.5 resize-none" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t("Expiration Date", "截止日期")}</Label>
                  <Input type="date" value={formData.expiresAt} onChange={(e) => updateField("expiresAt", e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>{t("Language", "語言")}</Label>
                  <Select value={formData.language} onValueChange={(v) => updateField("language", v)}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zh-TW">繁體中文</SelectItem>
                      <SelectItem value="zh-CN">简体中文</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm font-medium text-slate-700">{t("Allow report reopen", "允許重新開啟報告")}</div>
                  <div className="text-xs text-slate-400">{t("Participants can revisit their report", "參與者可重新查看報告")}</div>
                </div>
                <Switch checked={formData.allowReportReopen} onCheckedChange={(c) => updateField("allowReportReopen", c)} />
              </div>
            </div>
          )}

          {/* Step 2: Generated links */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">{t("Generated Links", "已生成連結")}</h2>
                {generatedLinks.length === 0 && (
                  <Button onClick={handleGenerateLinks} disabled={isGeneratingLinks} style={{ backgroundColor: PRIMARY }} className="text-white">
                    {isGeneratingLinks ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
                    {t("Generate", "生成")}
                  </Button>
                )}
              </div>
              {generatedLinks.length > 0 && (
                <>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <Badge style={{ backgroundColor: `${ACCENT_GREEN}15`, color: ACCENT_GREEN, border: `1px solid ${ACCENT_GREEN}30` }}>
                      <Check className="w-3 h-3 mr-1" />{generatedLinks.length} {t("ready", "條已就緒")}
                    </Badge>
                    <div className="flex-1" />
                    <Button variant="outline" size="sm" onClick={async () => { const ok = await copyToClipboard(generatedLinks.map((l) => l.url).join("\n")); if (ok) toast.success(t("Copied!", "已複製！")); }}>
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
                    }}>
                      <Download className="w-3.5 h-3.5 mr-1.5" />{t("CSV", "匯出")}
                    </Button>
                  </div>
                  <div className="border border-slate-200 rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white border-b border-slate-100">
                        <tr>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">#</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">{t("Link", "連結")}</th>
                          <th className="text-center px-4 py-2 text-xs font-semibold text-slate-500">{t("Copy", "複製")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {generatedLinks.map((link, index) => (
                          <tr key={link.token} className="border-b border-slate-50">
                            <td className="px-4 py-2 text-xs text-slate-400">{index + 1}</td>
                            <td className="px-4 py-2"><code className="text-xs text-slate-600 bg-slate-50 px-2 py-0.5 rounded font-mono">{link.url}</code></td>
                            <td className="px-4 py-2 text-center">
                              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={async () => { const ok = await copyToClipboard(link.url); if (ok) toast.success(t("Copied!", "已複製！")); }}>
                                <Copy className="w-3 h-3" />
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

          {/* Step 3: Confirm */}
          {wizardStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800">{t("Confirm & Activate", "確認並啟用")}</h2>
              <div className="border-2 border-slate-100 rounded-xl p-5 grid grid-cols-2 gap-4 text-sm">
                <div><div className="text-xs text-slate-500 mb-1">{t("Assessment", "測評")}</div><div className="font-medium text-slate-800">{formData.assessmentType ? (language === "en" ? ASSESSMENT_TYPE_LABELS[formData.assessmentType].en : ASSESSMENT_TYPE_LABELS[formData.assessmentType].zhTw) : "—"}</div></div>
                <div><div className="text-xs text-slate-500 mb-1">{t("Batch Name", "批次名稱")}</div><div className="font-medium text-slate-800">{formData.batchName}</div></div>
                <div><div className="text-xs text-slate-500 mb-1">{t("Participants", "人數")}</div><div className="font-medium text-slate-800">{formData.participantCount}</div></div>
                <div><div className="text-xs text-slate-500 mb-1">{t("Links", "連結")}</div><div className="font-medium" style={{ color: ACCENT_GREEN }}>{generatedLinks.length}</div></div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                {t("Once activated, participants can start immediately.", "啟用後參與者即可開始測評。")}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => wizardStep > 0 ? setWizardStep((p) => p - 1) : setView("list")}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />{wizardStep === 0 ? t("Cancel", "取消") : t("Back", "上一步")}
          </Button>
          <div className="flex gap-3">
            {wizardStep === 3 && (
              <Button variant="outline" onClick={() => { queryClient.invalidateQueries({ queryKey: ["org-anonymous-batches"] }); toast.success(t("Saved as draft", "已儲存草稿")); setView("list"); resetForm(); }}>
                {t("Save Draft", "儲存草稿")}
              </Button>
            )}
            {wizardStep < 3 ? (
              <Button onClick={() => {
                if (wizardStep === 2 && generatedLinks.length === 0) { handleGenerateLinks(); return; }
                setWizardStep((p) => p + 1);
              }} disabled={
                (wizardStep === 0 && !formData.assessmentType) ||
                (wizardStep === 1 && (!formData.batchName.trim() || formData.participantCount <= 0)) ||
                (wizardStep === 2 && generatedLinks.length === 0) ||
                isGeneratingLinks
              } style={{ backgroundColor: PRIMARY }} className="text-white">
                {t("Next", "下一步")}<ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            ) : (
              <Button onClick={() => activateMutation.mutate()} disabled={activateMutation.isPending} style={{ backgroundColor: ACCENT_GREEN }} className="text-white">
                {activateMutation.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Check className="w-4 h-4 mr-1.5" />}
                {t("Activate", "啟用")}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Detail View ──
  if (view === "detail" && selectedBatch) {
    const linkStats = {
      total: detailLinks.length,
      unused: detailLinks.filter((l: any) => l.status === "unused").length,
      inProgress: detailLinks.filter((l: any) => l.status === "in_progress").length,
      completed: detailLinks.filter((l: any) => l.status === "completed").length,
      disabled: detailLinks.filter((l: any) => l.status === "disabled").length,
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView("list")}>
            <ArrowLeft className="w-4 h-4 mr-1" />{t("Back", "返回")}
          </Button>
          <h1 className="text-xl font-bold" style={{ color: PRIMARY }}>{selectedBatch.batch_name}</h1>
          <Badge className={`text-[10px] ${BATCH_STATUS_LABELS[selectedBatch.status as BatchStatus]?.color || ""}`} variant="outline">
            {BATCH_STATUS_LABELS[selectedBatch.status as BatchStatus] ? (language === "en" ? BATCH_STATUS_LABELS[selectedBatch.status as BatchStatus].en : BATCH_STATUS_LABELS[selectedBatch.status as BatchStatus].zhTw) : selectedBatch.status}
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: t("Total", "總數"), value: linkStats.total, icon: Link2, color: PRIMARY },
            { label: t("Unused", "未使用"), value: linkStats.unused, icon: Clock, color: "#94a3b8" },
            { label: t("In Progress", "進行中"), value: linkStats.inProgress, icon: Users, color: "#E47E22" },
            { label: t("Completed", "已完成"), value: linkStats.completed, icon: CheckCircle2, color: ACCENT_GREEN },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <stat.icon className="w-5 h-5 mx-auto mb-1" style={{ color: stat.color }} />
              <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Links table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-700">{t("Link Management", "連結管理")}</h3>
            <Button variant="outline" size="sm" onClick={async () => {
              const allUrls = detailLinks.map((l: any) => `${SITE_ORIGIN}/a/${l.token}`).join("\n");
              const ok = await copyToClipboard(allUrls);
              if (ok) toast.success(t("All links copied!", "已複製全部連結！"));
            }}>
              <Copy className="w-3.5 h-3.5 mr-1.5" />{t("Copy All", "複製全部")}
            </Button>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">#</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">{t("Link", "連結")}</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500">{t("Status", "狀態")}</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500">{t("Copy", "複製")}</th>
                </tr>
              </thead>
              <tbody>
                {detailLinks.map((link: any, index: number) => {
                  const linkUrl = `${SITE_ORIGIN}/a/${link.token}`;
                  const statusConfig = LINK_STATUS_LABELS[link.status as LinkStatus];
                  return (
                    <tr key={link.id} className="border-b border-slate-50">
                      <td className="px-4 py-2 text-xs text-slate-400">{index + 1}</td>
                      <td className="px-4 py-2"><code className="text-xs text-slate-600 bg-slate-50 px-2 py-0.5 rounded font-mono">{linkUrl}</code></td>
                      <td className="px-4 py-2 text-center">
                        <Badge className={`text-[10px] ${statusConfig?.color || ""}`} variant="outline">
                          {statusConfig ? (language === "en" ? statusConfig.en : statusConfig.zhTw) : link.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={async () => { const ok = await copyToClipboard(linkUrl); if (ok) toast.success(t("Copied!", "已複製！")); }}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
