import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Plus, Send, Users, Clock, CheckCircle2, X, Calendar, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { useOrgAssessments, useOrgUsers, type AssignmentBatch } from "@/hooks/useAdminData";
import { useFeaturePermissions, type FeatureKey } from "@/hooks/useFeaturePermissions";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function OrgAssessmentsPage() {
  const { language } = useTranslation();
  const { data: assignments, isLoading } = useOrgAssessments();
  const { data: orgUsers = [] } = useOrgUsers();
  const { isDepartmentManager, organizationId } = usePermissions();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { hasFeature } = useFeaturePermissions();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedTarget, setSelectedTarget] = useState("all");
  const [dueDate, setDueDate] = useState("");
  const [sendNotification, setSendNotification] = useState(true);
  const [autoRemind, setAutoRemind] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingBatchId, setDeletingBatchId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const allAssignments = assignments || [];

  const totalAssigned = allAssignments.reduce((sum, assignment) => sum + (assignment.target_count || 0), 0);
  const totalCompleted = allAssignments.reduce((sum, assignment) => sum + (assignment.completed_count || 0), 0);
  const completionRate = totalAssigned > 0 ? ((totalCompleted / totalAssigned) * 100).toFixed(1) : "0";

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
  };

  const getStatus = (assignment: AssignmentBatch) => {
    if (assignment.status === "completed") return "completed";
    if (assignment.status === "cancelled") return "cancelled";
    return "active";
  };

  const handleDeleteBatch = async (batchId: string) => {
    setDeletingBatchId(batchId);
    const { error } = await supabase
      .from("assessment_assignments")
      .delete()
      .eq("batch_id", batchId)
      .eq("organization_id", organizationId!);

    if (error) {
      console.error("Delete batch error:", error);
      toast.error(language === "en" ? "Failed to delete" : language === "zh-TW" ? "刪除失敗" : "删除失败");
    } else {
      toast.success(language === "en" ? "Assessment deleted" : language === "zh-TW" ? "測評已刪除" : "测评已删除");
      queryClient.invalidateQueries({ queryKey: ["org", "assessments"] });
    }
    setDeletingBatchId(null);
  };

  const handleAssign = async () => {
    if (!user || !organizationId) {
      toast.error(language === "en" ? "Not authorized" : language === "zh-TW" ? "未授權" : "未授权");
      return;
    }

    setIsSubmitting(true);

    const targetUsers = selectedTarget === "all"
      ? orgUsers.map((u) => u.id)
      : [selectedTarget];

    if (targetUsers.length === 0) {
      toast.error(language === "en" ? "No target users found" : language === "zh-TW" ? "找不到目標使用者" : "找不到目标用户");
      setIsSubmitting(false);
      return;
    }

    const batchId = crypto.randomUUID();
    const targetDescription = selectedTarget === "all"
      ? (isDepartmentManager
        ? (language === "en" ? "All Department Members" : language === "zh-TW" ? "本部門全體員工" : "本部门全体员工")
        : (language === "en" ? "All Employees" : language === "zh-TW" ? "全體員工" : "全体员工"))
      : orgUsers.find((u) => u.id === selectedTarget)?.full_name || selectedTarget;

    if (selectedTypes.length === 0) {
      toast.error(language === "en" ? "Please select at least one assessment type" : language === "zh-TW" ? "請至少選擇一種測評類型" : "请至少选择一种测评类型");
      setIsSubmitting(false);
      return;
    }

    const versionLabel = selectedTypes.join(",");
    const rows = targetUsers.map((userId) => ({
      assigned_by: user.id,
      assigned_to: userId,
      organization_id: organizationId,
      assessment_version: versionLabel,
      status: "pending",
      due_date: dueDate || null,
      batch_id: batchId,
      target_description: targetDescription,
      reminder_sent: false,
    }));

    const { error } = await supabase
      .from("assessment_assignments")
      .insert(rows);

    if (error) {
      setIsSubmitting(false);
      console.error("Assignment error:", error);
      toast.error(language === "en" ? "Failed to assign" : language === "zh-TW" ? "派發失敗" : "派发失败");
      return;
    }

    const messageSubject = language === "en" ? "New Assessment Assigned" : language === "zh-TW" ? "新測評任務" : "新测评任务";
    const messageContent = language === "en"
      ? `You have been assigned a career anchor assessment (${rows[0].assessment_version}). Please complete it${dueDate ? " before " + new Date(dueDate).toLocaleDateString() : ""}.`
      : language === "zh-TW"
        ? `您被指派了一項職業錨測評（${rows[0].assessment_version}），請${dueDate ? "於 " + new Date(dueDate).toLocaleDateString() + " 前" : "儘快"}完成。`
        : `您被指派了一项职业锚测评（${rows[0].assessment_version}），请${dueDate ? "于 " + new Date(dueDate).toLocaleDateString() + " 前" : "尽快"}完成。`;

    const messageRows = targetUsers.map((userId) => ({
      sender_id: user.id,
      recipient_id: userId,
      subject: messageSubject,
      content: messageContent,
      message_type: "assessment_assignment",
      channel: "system",
      is_read: false,
      organization_id: organizationId,
    }));

    await supabase.from("messages").insert(messageRows);

    setIsSubmitting(false);

    toast.success(
      language === "en"
        ? `Assessment assigned to ${targetUsers.length} user(s)`
        : language === "zh-TW"
          ? `已向 ${targetUsers.length} 位使用者派發測評`
          : `已向 ${targetUsers.length} 位用户派发测评`
    );

    setShowAssignModal(false);
    setSelectedTarget("all");
    setSelectedTypes([]);
    setDueDate("");
    setSendNotification(true);
    setAutoRemind(true);

    queryClient.invalidateQueries({ queryKey: ["org", "assessments"] });
  };

  const renderCompletionTooltip = (assignment: AssignmentBatch) => {
    const completedUsers = assignment.users.filter((u) => u.status === "completed");
    const pendingUsers = assignment.users.filter((u) => u.status !== "completed");

    return (
      <div className="max-w-xs space-y-2 text-xs">
        {completedUsers.length > 0 && (
          <div>
            <div className="font-semibold text-green-400 mb-1">
              {language === "en" ? "Completed" : language === "zh-TW" ? "已完成" : "已完成"} ({completedUsers.length})
            </div>
            {completedUsers.map((u) => (
              <div key={u.userId} className="text-muted-foreground truncate">
                {u.fullName || u.email}
              </div>
            ))}
          </div>
        )}
        {pendingUsers.length > 0 && (
          <div>
            <div className="font-semibold text-amber-400 mb-1">
              {language === "en" ? "Pending" : language === "zh-TW" ? "未完成" : "未完成"} ({pendingUsers.length})
            </div>
            {pendingUsers.slice(0, 10).map((u) => (
              <div key={u.userId} className="text-muted-foreground truncate">
                {u.fullName || u.email}
              </div>
            ))}
            {pendingUsers.length > 10 && (
              <div className="text-muted-foreground">
                ...{language === "en" ? `and ${pendingUsers.length - 10} more` : `等 ${pendingUsers.length - 10} 人`}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">{language === "en" ? "Assessment Management" : language === "zh-TW" ? "測評管理" : "测评管理"}</h1>
          <p className="text-sm text-muted-foreground">{language === "en" ? "Dispatch, track, and manage assessments" : language === "zh-TW" ? "派發、追蹤和管理測評任務" : "派发、追踪和管理测评任务"}</p>
        </div>
        <button onClick={() => setShowAssignModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium">
          <Send className="w-4 h-4" /> {language === "en" ? "Assign Assessment" : language === "zh-TW" ? "派發測評" : "派发测评"}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{allAssignments.length}</div>
          <div className="text-xs text-muted-foreground">{language === "en" ? "Active Batches" : language === "zh-TW" ? "派發批次" : "派发批次"}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{totalAssigned}</div>
          <div className="text-xs text-muted-foreground">{language === "en" ? "Total Assigned" : language === "zh-TW" ? "已派發" : "已派发"}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{totalCompleted}</div>
          <div className="text-xs text-muted-foreground">{language === "en" ? "Completed" : language === "zh-TW" ? "已完成" : "已完成"}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{completionRate}%</div>
          <div className="text-xs text-muted-foreground">{language === "en" ? "Completion Rate" : language === "zh-TW" ? "完成率" : "完成率"}</div>
        </div>
      </div>

      <div className="space-y-4">
        {allAssignments.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center text-sm text-muted-foreground">
            {language === "en" ? "No assessment assignments found" : language === "zh-TW" ? "暫無測評派發記錄" : "暂无测评派发记录"}
          </div>
        ) : allAssignments.map((assignment, index) => {
          const assignmentStatus = getStatus(assignment);
          const targetCount = assignment.target_count || 0;
          const completedCount = assignment.completed_count || 0;
          const progressPercent = targetCount > 0 ? (completedCount / targetCount) * 100 : 0;

          return (
            <motion.div key={assignment.batch_id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} className="bg-card border border-border rounded-xl p-5 group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-sky-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{assignment.target_description || (language === "en" ? "Assessment Batch" : language === "zh-TW" ? "測評批次" : "测评批次")}</div>
                    <div className="text-xs text-muted-foreground">{assignment.assessment_version || "SCPC v1.4"} · {formatDate(assignment.created_at)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", assignmentStatus === "completed" ? "bg-green-50 text-green-600 dark:bg-green-900/20" : assignmentStatus === "cancelled" ? "bg-red-50 text-red-500 dark:bg-red-900/20" : "bg-sky-50 text-sky-600 dark:bg-sky-900/20")}>
                    {assignmentStatus === "completed" ? (language === "en" ? "Completed" : language === "zh-TW" ? "已完成" : "已完成") : assignmentStatus === "cancelled" ? (language === "en" ? "Cancelled" : language === "zh-TW" ? "已取消" : "已取消") : (language === "en" ? "In Progress" : language === "zh-TW" ? "進行中" : "进行中")}
                  </span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        disabled={deletingBatchId === assignment.batch_id}
                      >
                        {deletingBatchId === assignment.batch_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {language === "en" ? "Delete Assessment?" : language === "zh-TW" ? "確認刪除測評？" : "确认删除测评？"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {language === "en"
                            ? `This will permanently delete this assessment batch "${assignment.target_description || "Assessment"}" and all ${targetCount} assignments. This action cannot be undone.`
                            : language === "zh-TW"
                              ? `此操作將永久刪除測評批次「${assignment.target_description || "測評"}」及其全部 ${targetCount} 條分配記錄，無法撤銷。`
                              : `此操作将永久删除测评批次「${assignment.target_description || "测评"}」及其全部 ${targetCount} 条分配记录，无法撤销。`
                          }
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {language === "en" ? "Cancel" : language === "zh-TW" ? "取消" : "取消"}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteBatch(assignment.batch_id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {language === "en" ? "Delete" : language === "zh-TW" ? "刪除" : "删除"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                      <Users className="w-3.5 h-3.5" /> {completedCount}/{targetCount} {language === "en" ? "completed" : language === "zh-TW" ? "已完成" : "已完成"}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="start" className="p-3">
                    {renderCompletionTooltip(assignment)}
                  </TooltipContent>
                </Tooltip>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" /> {language === "en" ? "Due" : language === "zh-TW" ? "截止" : "截止"}: {formatDate(assignment.due_date)}
                </div>
              </div>
              <div className="mt-3">
                <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.6 }} className="h-full rounded-full bg-sky-500" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {showAssignModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAssignModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card border border-border rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">{language === "en" ? "Assign Assessment" : language === "zh-TW" ? "派發測評" : "派发测评"}</h2>
                <button onClick={() => setShowAssignModal(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">{language === "en" ? "Target" : language === "zh-TW" ? "派發對象" : "派发对象"}</label>
                  <select
                    value={selectedTarget}
                    onChange={(e) => setSelectedTarget(e.target.value)}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm"
                  >
                    <option value="all">
                      {isDepartmentManager
                        ? (language === "en" ? "All Department Members" : language === "zh-TW" ? "本部門全體員工" : "本部门全体员工")
                        : (language === "en" ? "All Employees" : language === "zh-TW" ? "全體員工" : "全体员工")
                      }
                    </option>
                    {orgUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || u.email}{u.departmentName ? ` (· ${u.departmentName})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{language === "en" ? "Assessment Type" : language === "zh-TW" ? "測評類型" : "测评类型"}</label>
                  <div className="space-y-2">
                    {[
                      { key: "career_anchor", labelEn: "Career Anchor", labelTW: "職業錨測評", labelCN: "职业锚测评", featureKey: "career_anchor" as FeatureKey },
                      { key: "ideal_card", labelEn: "Espresso Card", labelTW: "理想人生卡", labelCN: "理想人生卡", featureKey: "ideal_card" as FeatureKey },
                      { key: "combined", labelEn: "Integration Assessment", labelTW: "整合測評", labelCN: "整合测评", featureKey: "combined" as FeatureKey },
                    ].filter((opt) => hasFeature(opt.featureKey)).map((opt) => (
                      <label key={opt.key} className="flex items-center gap-2.5 px-3 py-2.5 bg-background border border-border rounded-lg cursor-pointer hover:bg-muted/10 transition-colors">
                        <input
                          type="checkbox"
                          className="rounded border-border"
                          checked={selectedTypes.includes(opt.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTypes([...selectedTypes, opt.key]);
                            } else {
                              setSelectedTypes(selectedTypes.filter((t) => t !== opt.key));
                            }
                          }}
                        />
                        <span className="text-sm">{language === "en" ? opt.labelEn : language === "zh-TW" ? opt.labelTW : opt.labelCN}</span>
                      </label>
                    ))}
                    {selectedTypes.length === 0 && (
                      <p className="text-xs text-amber-600">{language === "en" ? "Please select at least one type" : language === "zh-TW" ? "請至少選擇一種類型" : "请至少选择一种类型"}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{language === "en" ? "Due Date" : language === "zh-TW" ? "截止日期" : "截止日期"}</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm"
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" checked={sendNotification} onChange={(e) => setSendNotification(e.target.checked)} />
                  <span className="text-sm text-muted-foreground">{language === "en" ? "Send email notification" : language === "zh-TW" ? "發送郵件通知" : "发送邮件通知"}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" checked={autoRemind} onChange={(e) => setAutoRemind(e.target.checked)} />
                  <span className="text-sm text-muted-foreground">{language === "en" ? "Auto-remind before deadline" : language === "zh-TW" ? "到期前自動提醒" : "到期前自动提醒"}</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowAssignModal(false)} disabled={isSubmitting} className="px-4 py-2 text-sm text-muted-foreground">{language === "en" ? "Cancel" : language === "zh-TW" ? "取消" : "取消"}</button>
                <button onClick={handleAssign} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium bg-sky-500 hover:bg-sky-600 text-white rounded-lg disabled:opacity-60 flex items-center gap-2">
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {language === "en" ? "Assign" : language === "zh-TW" ? "派發" : "派发"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
