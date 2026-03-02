import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  TableProperties, CheckSquare, XSquare, Filter, Check,
  Loader2, AlertCircle, ChevronDown, Users, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CourseOption {
  id: string;
  course_code: string;
  course_name: string;
  course_name_zh: string;
  cdu_hours: number;
}

interface EnrollmentRow {
  id: string;
  user_id: string;
  course_id: string;
  attendance_confirmed: boolean;
  assignment_submitted: boolean;
  assignment_answers: Array<{ question: string; answer: string }>;
  sign_in_time: string | null;
  completion_status: string;
  cdu_auto_generated: boolean;
  profiles?: { full_name: string; email: string };
}

export default function BatchCduReviewPage() {
  const { language } = useTranslation();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [excludedRows, setExcludedRows] = useState<Set<string>>(new Set());
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [batchAction, setBatchAction] = useState<"approve" | "reject">("approve");

  const txt = {
    title: language === "en" ? "Batch CDU Review Center" : language === "zh-TW" ? "批次 CDU 審核中心" : "批次 CDU 审核中心",
    subtitle: language === "en" ? "Horizontal assignment review table for batch CDU approval" : language === "zh-TW" ? "橫向作業總表審查機制" : "横向作业总表审查机制",
    selectCourse: language === "en" ? "Select Course" : language === "zh-TW" ? "選擇課程" : "选择课程",
    selectCourseHint: language === "en" ? "Choose a course to review assignments" : language === "zh-TW" ? "選擇課程以審查作業" : "选择课程以审查作业",
    student: language === "en" ? "Student" : language === "zh-TW" ? "學員" : "学员",
    signIn: language === "en" ? "Sign-in" : language === "zh-TW" ? "簽到" : "签到",
    assignment: language === "en" ? "Assignment" : language === "zh-TW" ? "作業" : "作业",
    status: language === "en" ? "Status" : language === "zh-TW" ? "狀態" : "状态",
    selectAll: language === "en" ? "Select All Qualified" : language === "zh-TW" ? "全選符合者" : "全选符合者",
    deselectAll: language === "en" ? "Deselect All" : language === "zh-TW" ? "取消全選" : "取消全选",
    excludeRow: language === "en" ? "Exclude" : language === "zh-TW" ? "退件" : "退件",
    includeRow: language === "en" ? "Include" : language === "zh-TW" ? "恢復" : "恢复",
    batchApprove: language === "en" ? "Batch Approve Selected" : language === "zh-TW" ? "整批核准選中" : "整批核准选中",
    confirmApprove: language === "en" ? "Confirm Batch Approve" : language === "zh-TW" ? "確認整批核准" : "确认整批核准",
    confirmApproveMsg: language === "en" ? "Are you sure you want to approve CDU for the selected students?" : language === "zh-TW" ? "確認為選中的學員核准 CDU？" : "确认为选中的学员核准 CDU？",
    selectedCount: language === "en" ? "selected" : language === "zh-TW" ? "人已選" : "人已选",
    excludedCount: language === "en" ? "excluded" : language === "zh-TW" ? "人退件" : "人退件",
    qualifiedStudents: language === "en" ? "Qualified Students" : language === "zh-TW" ? "符合條件學員" : "符合条件学员",
    totalStudents: language === "en" ? "Total Students" : language === "zh-TW" ? "全部學員" : "全部学员",
    confirmed: language === "en" ? "Confirmed" : language === "zh-TW" ? "已確認" : "已确认",
    notConfirmed: language === "en" ? "Not Confirmed" : language === "zh-TW" ? "未確認" : "未确认",
    submitted: language === "en" ? "Submitted" : language === "zh-TW" ? "已提交" : "已提交",
    notSubmitted: language === "en" ? "Not Submitted" : language === "zh-TW" ? "未提交" : "未提交",
    cduGenerated: language === "en" ? "CDU Generated" : language === "zh-TW" ? "CDU 已生成" : "CDU 已生成",
    noCourse: language === "en" ? "Please select a course first" : language === "zh-TW" ? "請先選擇課程" : "请先选择课程",
    noData: language === "en" ? "No enrollment data" : language === "zh-TW" ? "無註冊資料" : "无注册数据",
    success: language === "en" ? "Batch approved successfully" : language === "zh-TW" ? "整批核准成功" : "整批核准成功",
    cancel: language === "en" ? "Cancel" : language === "zh-TW" ? "取消" : "取消",
    confirm: language === "en" ? "Confirm" : language === "zh-TW" ? "確認" : "确认",
    questionPrefix: language === "en" ? "Q" : language === "zh-TW" ? "題" : "题",
  };

  // Fetch available courses
  const { data: courses = [] } = useQuery({
    queryKey: ["batch-cdu-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cdu_course_catalog")
        .select("id, course_code, course_name, course_name_zh, cdu_hours")
        .eq("is_active", true)
        .order("course_code");
      if (error) throw error;
      return (data || []) as CourseOption[];
    },
  });

  // Fetch enrollments for selected course
  const { data: enrollments = [], isLoading: loadingEnrollments } = useQuery({
    queryKey: ["batch-cdu-enrollments", selectedCourseId],
    queryFn: async () => {
      if (!selectedCourseId) return [];
      const { data, error } = await supabase
        .from("course_enrollments")
        .select("*, profiles!course_enrollments_user_id_fkey(full_name, email)")
        .eq("course_id", selectedCourseId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as EnrollmentRow[];
    },
    enabled: !!selectedCourseId,
  });

  // Extract all unique questions from assignments
  const allQuestions = useMemo(() => {
    const questionSet = new Map<number, string>();
    enrollments.forEach(enrollment => {
      const answers = enrollment.assignment_answers || [];
      answers.forEach((answer: { question: string; answer: string }, index: number) => {
        if (!questionSet.has(index)) {
          questionSet.set(index, answer.question);
        }
      });
    });
    return Array.from(questionSet.entries()).sort(([a], [b]) => a - b);
  }, [enrollments]);

  // Filter qualified rows (both sign-in + assignment submitted, not already CDU generated)
  const qualifiedRows = useMemo(() => {
    return enrollments.filter(
      enrollment => enrollment.attendance_confirmed && enrollment.assignment_submitted && !enrollment.cdu_auto_generated
    );
  }, [enrollments]);

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  const handleSelectAll = useCallback(() => {
    const qualifiedIds = new Set(
      qualifiedRows
        .filter(r => !excludedRows.has(r.id))
        .map(r => r.id)
    );
    setSelectedRows(qualifiedIds);
  }, [qualifiedRows, excludedRows]);

  const handleDeselectAll = useCallback(() => {
    setSelectedRows(new Set());
  }, []);

  const toggleRow = useCallback((enrollmentId: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(enrollmentId)) {
        next.delete(enrollmentId);
      } else {
        next.add(enrollmentId);
      }
      return next;
    });
  }, []);

  const toggleExclude = useCallback((enrollmentId: string) => {
    setExcludedRows(prev => {
      const next = new Set(prev);
      if (next.has(enrollmentId)) {
        next.delete(enrollmentId);
      } else {
        next.add(enrollmentId);
        // Also remove from selected
        setSelectedRows(s => {
          const ns = new Set(s);
          ns.delete(enrollmentId);
          return ns;
        });
      }
      return next;
    });
  }, []);

  // Batch approve mutation
  const batchApproveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCourse || selectedRows.size === 0) return;

      const selectedEnrollments = enrollments.filter(e => selectedRows.has(e.id));

      for (const enrollment of selectedEnrollments) {
        // Create CDU record (A-type, auto-verified)
        const { data: cduRecord, error: cduError } = await supabase
          .from("cdu_records")
          .insert([{
            user_id: enrollment.user_id,
            certification_id: enrollment.certification_id || null,
            activity_type: "training" as const,
            activity_title: selectedCourse.course_name,
            activity_provider: "Official",
            activity_date: new Date().toISOString().split("T")[0],
            cdu_hours: selectedCourse.cdu_hours,
            approval_status: "approved" as const,
            cdu_type: "A",
            auto_verified: true,
            course_catalog_id: selectedCourse.id,
            reviewer_id: profile?.id,
            reviewed_at: new Date().toISOString(),
          }])
          .select("id")
          .single();

        if (cduError) throw cduError;

        // Update enrollment
        const { error: enrollError } = await supabase
          .from("course_enrollments")
          .update({
            cdu_auto_generated: true,
            cdu_record_id: cduRecord.id,
            completion_status: "completed",
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", enrollment.id);

        if (enrollError) throw enrollError;

        // Log review action
        await supabase
          .from("certification_review_logs")
          .insert([{
            reviewer_id: profile?.id,
            reviewer_email: profile?.email || "",
            target_type: "cdu_record" as const,
            target_id: cduRecord.id,
            action: "approve" as const,
            previous_status: "pending",
            new_status: "approved",
            comment: `Batch CDU approval for course ${selectedCourse.course_code}`,
          }]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batch-cdu-enrollments"] });
      toast.success(`${txt.success} (${selectedRows.size} ${language === "en" ? "students" : language === "zh-TW" ? "位學員" : "位学员"})`);
      setSelectedRows(new Set());
      setConfirmDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <TableProperties className="w-6 h-6 text-primary" />
          {txt.title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{txt.subtitle}</p>
      </div>

      {/* Course Selector */}
      <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg">
        <Filter className="w-5 h-5 text-muted-foreground" />
        <div className="flex-1">
          <Select value={selectedCourseId} onValueChange={(value) => {
            setSelectedCourseId(value);
            setSelectedRows(new Set());
            setExcludedRows(new Set());
          }}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder={txt.selectCourse} />
            </SelectTrigger>
            <SelectContent>
              {courses.map(course => (
                <SelectItem key={course.id} value={course.id}>
                  <span className="font-mono text-xs mr-2">{course.course_code}</span>
                  {language === "en" ? course.course_name : course.course_name_zh || course.course_name}
                  <span className="ml-2 text-muted-foreground">({course.cdu_hours} CDU)</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCourseId && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{txt.totalStudents}: <strong>{enrollments.length}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-green-500" />
              <span>{txt.qualifiedStudents}: <strong className="text-green-600">{qualifiedRows.length}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      {selectedCourseId && enrollments.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted/50 border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleSelectAll} className="gap-1">
              <CheckSquare className="w-4 h-4" />
              {txt.selectAll}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDeselectAll} className="gap-1">
              <XSquare className="w-4 h-4" />
              {txt.deselectAll}
            </Button>
            <div className="text-sm text-muted-foreground">
              <strong className="text-primary">{selectedRows.size}</strong> {txt.selectedCount}
              {excludedRows.size > 0 && (
                <span className="ml-2">• <strong className="text-destructive">{excludedRows.size}</strong> {txt.excludedCount}</span>
              )}
            </div>
          </div>
          <Button
            onClick={() => { setBatchAction("approve"); setConfirmDialogOpen(true); }}
            disabled={selectedRows.size === 0}
            className="gap-1 bg-green-600 hover:bg-green-700"
          >
            <Check className="w-4 h-4" />
            {txt.batchApprove} ({selectedRows.size})
          </Button>
        </div>
      )}

      {/* Horizontal Assignment Table */}
      {!selectedCourseId ? (
        <div className="py-20 text-center text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p>{txt.noCourse}</p>
          <p className="text-xs mt-1">{txt.selectCourseHint}</p>
        </div>
      ) : loadingEnrollments ? (
        <div className="py-20 text-center text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
        </div>
      ) : enrollments.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
          <p>{txt.noData}</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <ScrollArea className="max-h-[calc(100vh-360px)]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur z-10">
                  <tr>
                    <th className="p-3 text-left font-medium text-muted-foreground w-10">
                      <Checkbox
                        checked={selectedRows.size > 0 && selectedRows.size === qualifiedRows.filter(r => !excludedRows.has(r.id)).length}
                        onCheckedChange={(checked) => checked ? handleSelectAll() : handleDeselectAll()}
                      />
                    </th>
                    <th className="p-3 text-left font-medium text-muted-foreground min-w-[160px] sticky left-0 bg-muted/80">{txt.student}</th>
                    <th className="p-3 text-center font-medium text-muted-foreground w-20">{txt.signIn}</th>
                    <th className="p-3 text-center font-medium text-muted-foreground w-20">{txt.assignment}</th>
                    {allQuestions.map(([index, question]) => (
                      <th key={index} className="p-3 text-left font-medium text-muted-foreground min-w-[200px] max-w-[300px]">
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs shrink-0">{txt.questionPrefix}{index + 1}</Badge>
                          <span className="truncate text-xs" title={question}>{question}</span>
                        </div>
                      </th>
                    ))}
                    <th className="p-3 text-center font-medium text-muted-foreground w-24">{txt.status}</th>
                    <th className="p-3 text-center font-medium text-muted-foreground w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {enrollments.map(enrollment => {
                    const isQualified = enrollment.attendance_confirmed && enrollment.assignment_submitted && !enrollment.cdu_auto_generated;
                    const isExcluded = excludedRows.has(enrollment.id);
                    const isSelected = selectedRows.has(enrollment.id);
                    const answers = enrollment.assignment_answers || [];

                    return (
                      <tr
                        key={enrollment.id}
                        className={`
                          transition-colors
                          ${isExcluded ? "bg-destructive/5 opacity-60" : ""}
                          ${isSelected ? "bg-primary/5" : "hover:bg-muted/30"}
                          ${enrollment.cdu_auto_generated ? "bg-green-50/50 dark:bg-green-900/10" : ""}
                        `}
                      >
                        <td className="p-3">
                          {isQualified && !isExcluded ? (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleRow(enrollment.id)}
                            />
                          ) : enrollment.cdu_auto_generated ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : null}
                        </td>
                        <td className="p-3 sticky left-0 bg-inherit">
                          <div className="font-medium text-foreground">{enrollment.profiles?.full_name || "—"}</div>
                          <div className="text-xs text-muted-foreground">{enrollment.profiles?.email}</div>
                        </td>
                        <td className="p-3 text-center">
                          {enrollment.attendance_confirmed ? (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{txt.confirmed}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">{txt.notConfirmed}</Badge>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {enrollment.assignment_submitted ? (
                            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{txt.submitted}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">{txt.notSubmitted}</Badge>
                          )}
                        </td>
                        {allQuestions.map(([index]) => {
                          const answer = answers[index];
                          return (
                            <td key={index} className="p-3">
                              <div className="text-sm text-foreground leading-relaxed max-w-[280px] whitespace-pre-wrap">
                                {answer?.answer || <span className="text-muted-foreground italic">—</span>}
                              </div>
                            </td>
                          );
                        })}
                        <td className="p-3 text-center">
                          {enrollment.cdu_auto_generated ? (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              {txt.cduGenerated}
                            </Badge>
                          ) : isQualified ? (
                            <Badge variant="secondary">
                              {language === "en" ? "Ready" : language === "zh-TW" ? "待審" : "待审"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              {language === "en" ? "Incomplete" : language === "zh-TW" ? "未完成" : "未完成"}
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {isQualified && !enrollment.cdu_auto_generated && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className={isExcluded ? "text-destructive" : "text-muted-foreground"}
                              onClick={() => toggleExclude(enrollment.id)}
                            >
                              {isExcluded ? txt.includeRow : txt.excludeRow}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{txt.confirmApprove}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">{txt.confirmApproveMsg}</p>
            <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm">
              <div><strong>{selectedRows.size}</strong> {language === "en" ? "students will receive" : language === "zh-TW" ? "位學員將獲得" : "位学员将获得"} <strong>{selectedCourse?.cdu_hours || 0} CDU</strong></div>
              <div className="text-muted-foreground mt-1">
                {language === "en" ? "Course:" : language === "zh-TW" ? "課程：" : "课程："}
                {selectedCourse?.course_code} - {language === "en" ? selectedCourse?.course_name : selectedCourse?.course_name_zh || selectedCourse?.course_name}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              {txt.cancel}
            </Button>
            <Button
              onClick={() => batchApproveMutation.mutate()}
              disabled={batchApproveMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {batchApproveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              {txt.confirm} ({selectedRows.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
