import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, ChevronRight, Loader2,
  Building2, FileText, Globe, Clock, Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useCreateBatch, type CreateBatchInput } from "@/hooks/useBatchAssessment";

const PRIMARY = "#1C2857";

export default function CreateBatchAssessmentPage() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const { profile } = useAuth();
  const createBatch = useCreateBatch();

  const t = (en: string, zhTw: string) => language === "en" ? en : zhTw;

  const [batchName, setBatchName] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [assessmentType, setAssessmentType] = useState("career_anchor");
  const [batchLanguage, setBatchLanguage] = useState("zh-TW");
  const [instructions, setInstructions] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [allowRepeatEntry, setAllowRepeatEntry] = useState(false);
  const [allowResume, setAllowResume] = useState(true);
  const [allowViewReport, setAllowViewReport] = useState(true);
  const [reportAccessMode, setReportAccessMode] = useState<"view_and_download" | "view_only" | "hidden">("view_and_download");
  const [reminder1Day, setReminder1Day] = useState(false);
  const [reminder3Day, setReminder3Day] = useState(false);
  const [reminderDeadline, setReminderDeadline] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch organizations for dropdown
  const { data: organizations = [] } = useQuery({
    queryKey: ["organizations-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const handleOrgChange = (orgId: string) => {
    setOrganizationId(orgId);
    const org = organizations.find((organizationItem: any) => organizationItem.id === orgId);
    if (org) setOrganizationName(org.name);
  };

  const canSubmit = batchName.trim() && organizationId && startTime && endTime;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      const input: CreateBatchInput = {
        batch_name: batchName.trim(),
        organization_id: organizationId,
        organization_name: organizationName,
        assessment_type: assessmentType,
        language: batchLanguage,
        instructions: instructions.trim(),
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        allow_repeat_entry: allowRepeatEntry,
        allow_resume: allowResume,
        allow_view_report: allowViewReport,
        employee_report_access_mode: reportAccessMode,
        reminder_1_day: reminder1Day,
        reminder_3_day: reminder3Day,
        reminder_before_deadline: reminderDeadline,
      };

      const result = await createBatch.mutateAsync(input);
      toast.success(t("Batch created successfully", "批次建立成功"));
      navigate(`/super-admin/batch-assessment/${result.id}`);
    } catch {
      toast.error(t("Failed to create batch", "建立批次失敗"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/super-admin/batch-assessment")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: PRIMARY }}>
            {t("Create Batch Assessment", "建立批次施測")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("Set up a new enterprise assessment campaign", "設置新的企業施測活動")}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border p-6 space-y-6" style={{ borderColor: "#E9ECEF" }}>
        {/* Organization */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            {t("Organization", "企業")} <span className="text-red-500">*</span>
          </Label>
          <Select value={organizationId} onValueChange={handleOrgChange}>
            <SelectTrigger>
              <SelectValue placeholder={t("Select organization", "選擇企業")} />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org: any) => (
                <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Batch Name */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            {t("Batch Name", "批次名稱")} <span className="text-red-500">*</span>
          </Label>
          <Input
            value={batchName}
            onChange={(event) => setBatchName(event.target.value)}
            placeholder={t("e.g., 2026 Q1 Leadership Assessment", "例如：2026 Q1 主管職業錨施測")}
          />
        </div>

        {/* Assessment Type */}
        <div className="space-y-2">
          <Label>{t("Assessment Type", "測評類型")} <span className="text-red-500">*</span></Label>
          <Select value={assessmentType} onValueChange={setAssessmentType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="career_anchor">{t("Career Anchor (SCPC)", "職業錨 (SCPC)")}</SelectItem>
              <SelectItem value="life_card">{t("Espresso Card", "人生卡")}</SelectItem>
              <SelectItem value="combined">{t("Integration Assessment", "整合測評")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Language */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            {t("Assessment Language", "施測語言")}
          </Label>
          <Select value={batchLanguage} onValueChange={setBatchLanguage}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="zh-TW">繁體中文</SelectItem>
              <SelectItem value="zh-CN">简体中文</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Time Window */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {t("Start Time", "開始時間")} <span className="text-red-500">*</span>
            </Label>
            <Input type="datetime-local" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {t("End Time", "截止時間")} <span className="text-red-500">*</span>
            </Label>
            <Input type="datetime-local" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-2">
          <Label>{t("Instructions for Participants", "施測說明")}</Label>
          <Textarea
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            placeholder={t("Optional instructions shown to participants before the assessment", "在測評開始前向參與者展示的說明（選填）")}
            rows={3}
          />
        </div>

        {/* Advanced Options */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <Settings2 className="w-4 h-4" />
              {t("Advanced Options", "進階選項")}
              <ChevronRight className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-90" : ""}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{t("Allow Repeat Entry", "允許重複進入")}</p>
                <p className="text-xs text-muted-foreground">{t("Participants can retake after completing", "參與者完成後可重新測評")}</p>
              </div>
              <Switch checked={allowRepeatEntry} onCheckedChange={setAllowRepeatEntry} />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{t("Allow Resume", "允許斷點續測")}</p>
                <p className="text-xs text-muted-foreground">{t("Participants can resume if interrupted", "參與者中斷後可恢復測評進度")}</p>
              </div>
              <Switch checked={allowResume} onCheckedChange={setAllowResume} />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{t("Show Report to Participants", "允許查看報告")}</p>
                <p className="text-xs text-muted-foreground">{t("Show results immediately after completion", "完成後立即顯示個人結果")}</p>
              </div>
              <Switch checked={allowViewReport} onCheckedChange={setAllowViewReport} />
            </div>

            {/* Employee Report Access Mode */}
            <div className="py-2 space-y-3">
              <div>
                <p className="text-sm font-medium">{t("Employee Report Permissions", "員工報告權限")}</p>
                <p className="text-xs text-muted-foreground">{t("Control whether employees can view or download their assessment reports", "控制員工完成測評後是否可查看或下載報告")}</p>
              </div>
              <RadioGroup value={reportAccessMode} onValueChange={(value) => setReportAccessMode(value as "view_and_download" | "view_only" | "hidden")} className="space-y-2">
                <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: reportAccessMode === "view_and_download" ? PRIMARY : "#E9ECEF" }}>
                  <RadioGroupItem value="view_and_download" className="mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{t("View & Download", "可查看並下載報告")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("Employees can view and download their reports", "員工可查看並下載自己的報告")}</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: reportAccessMode === "view_only" ? PRIMARY : "#E9ECEF" }}>
                  <RadioGroupItem value="view_only" className="mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{t("View Only", "可查看不可下載")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("Employees can view reports but cannot download", "員工可查看報告但不可下載")}</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: reportAccessMode === "hidden" ? PRIMARY : "#E9ECEF" }}>
                  <RadioGroupItem value="hidden" className="mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{t("Hidden from Employees", "員工不可查看")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("Only HR and administrators can view reports", "僅 HR 和管理員可查看報告")}</p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            <div className="border-t pt-4" style={{ borderColor: "#E9ECEF" }}>
              <p className="text-sm font-medium mb-3">{t("Auto Reminders", "自動提醒")}</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{t("1 day after start", "開始後 1 天")}</p>
                  <Switch checked={reminder1Day} onCheckedChange={setReminder1Day} />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{t("3 days after start", "開始後 3 天")}</p>
                  <Switch checked={reminder3Day} onCheckedChange={setReminder3Day} />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{t("Before deadline", "截止前提醒")}</p>
                  <Switch checked={reminderDeadline} onCheckedChange={setReminderDeadline} />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={() => navigate("/super-admin/batch-assessment")}>
          {t("Cancel", "取消")}
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting} style={{ backgroundColor: PRIMARY }}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {t("Create Batch", "建立批次")}
        </Button>
      </div>
    </div>
  );
}
