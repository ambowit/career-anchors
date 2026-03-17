import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, Filter, Copy, Download, FileBarChart, XCircle, Eye,
  Users, Link2, CheckCircle2, BarChart3, FileText,
  ArrowUpDown, MoreHorizontal, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import {
  ASSESSMENT_TYPE_LABELS, BATCH_STATUS_LABELS,
  type BatchStatus, type AssessmentType,
} from "@/data/anonymousAssessmentMockData";

const PRIMARY = "#1C2857";
const ACCENT_ORANGE = "#E47E22";
const ACCENT_GREEN = "#20A87B";

export default function AnonymousBatchListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const t = (en: string, zhTw: string) => language === "en" ? en : zhTw;

  // Fetch batches from Supabase
  const { data: batches = [], isLoading } = useQuery({
    queryKey: ["anonymous-batches"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("anonymous_assessment_batches")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch link stats (aggregated counts per batch)
  const { data: linkStats = {} } = useQuery({
    queryKey: ["anonymous-link-stats"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("anonymous_assessment_links")
        .select("batch_id, status");
      if (error) throw error;
      const stats: Record<string, { total: number; completed: number; inProgress: number }> = {};
      for (const link of (data || [])) {
        if (!stats[link.batch_id]) stats[link.batch_id] = { total: 0, completed: 0, inProgress: 0 };
        stats[link.batch_id].total++;
        if (link.status === "completed") stats[link.batch_id].completed++;
        if (link.status === "in_progress") stats[link.batch_id].inProgress++;
      }
      return stats;
    },
  });

  const filteredBatches = batches.filter((batch: any) => {
    const matchesSearch = batch.batch_name?.toLowerCase().includes(searchTerm.toLowerCase())
      || batch.created_by_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || batch.status === filterStatus;
    const matchesType = filterType === "all" || batch.assessment_type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  // KPI calculations
  const totalBatches = batches.length;
  const totalLinks = Object.values(linkStats).reduce((sum: number, stat: any) => sum + (stat?.total || 0), 0);
  const totalCompleted = Object.values(linkStats).reduce((sum: number, stat: any) => sum + (stat?.completed || 0), 0);
  const completionRate = totalLinks > 0 ? Math.round((totalCompleted / totalLinks) * 100) : 0;
  const reportsGenerated = batches.filter((batchItem: any) => batchItem.status === "report_generated").length;

  const kpiCards = [
    { label: t("Total Batches", "批次總數"), value: totalBatches, icon: FileText, color: PRIMARY, bgColor: "bg-[#1C2857]/5" },
    { label: t("Active Links", "有效連結"), value: totalLinks, icon: Link2, color: ACCENT_ORANGE, bgColor: "bg-[#E47E22]/5" },
    { label: t("Completed", "已完成回收"), value: totalCompleted, icon: CheckCircle2, color: ACCENT_GREEN, bgColor: "bg-[#20A87B]/5" },
    { label: t("Completion Rate", "完成率"), value: `${completionRate}%`, icon: BarChart3, color: "#6366F1", bgColor: "bg-indigo-50" },
    { label: t("Reports Generated", "已出報告"), value: reportsGenerated, icon: FileBarChart, color: "#8B5CF6", bgColor: "bg-violet-50" },
  ];

  const getStatusLabel = (status: BatchStatus) => {
    const config = BATCH_STATUS_LABELS[status];
    return config ? (language === "en" ? config.en : config.zhTw) : status;
  };

  const getTypeLabel = (assessmentType: AssessmentType) => {
    const config = ASSESSMENT_TYPE_LABELS[assessmentType];
    return config ? (language === "en" ? config.en : config.zhTw) : assessmentType;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === "en" ? "en-US" : "zh-TW", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  const handleCloseBatch = async (batchId: string) => {
    const { error } = await (supabase as any)
      .from("anonymous_assessment_batches")
      .update({ status: "closed" })
      .eq("id", batchId);
    if (error) {
      toast.error(t("Failed to close batch", "關閉批次失敗"));
    } else {
      toast.success(t("Batch closed", "批次已關閉"));
      queryClient.invalidateQueries({ queryKey: ["anonymous-batches"] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: PRIMARY }}>
            {t("Anonymous Assessment Center", "匿名測評中心")}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t("Create, manage, and analyze anonymous assessment batches", "建立、管理及分析組織匿名測評批次")}
          </p>
        </div>
        <Button
          onClick={() => navigate("/super-admin/anonymous-assessment/create")}
          className="text-white shadow-lg shadow-[#1C2857]/20"
          style={{ backgroundColor: PRIMARY }}
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("Create Batch", "建立批次")}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpiCards.map((card) => (
          <div key={card.label} className={`${card.bgColor} rounded-xl border border-slate-100 p-4 transition-all hover:shadow-md`}>
            <div className="flex items-center gap-2 mb-2">
              <card.icon className="w-4 h-4" style={{ color: card.color }} />
              <span className="text-xs font-medium text-slate-500">{card.label}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-slate-200 p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder={t("Search batch name or creator…", "搜尋批次名稱或建立者…")}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-9 border-slate-200"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px] border-slate-200">
            <Filter className="w-3.5 h-3.5 mr-2 text-slate-400" />
            <SelectValue placeholder={t("Assessment Type", "測評類型")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All Types", "全部類型")}</SelectItem>
            <SelectItem value="career_anchor">{t("Career Anchor", "職業錨")}</SelectItem>
            <SelectItem value="life_card">{t("Espresso Card", "人生卡")}</SelectItem>
            <SelectItem value="fusion">{t("Integration", "整合")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px] border-slate-200">
            <SelectValue placeholder={t("Status", "狀態")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All Status", "全部狀態")}</SelectItem>
            {(Object.keys(BATCH_STATUS_LABELS) as BatchStatus[]).map((statusKey) => (
              <SelectItem key={statusKey} value={statusKey}>
                {language === "en" ? BATCH_STATUS_LABELS[statusKey].en : BATCH_STATUS_LABELS[statusKey].zhTw}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Batch Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100" style={{ backgroundColor: `${PRIMARY}08` }}>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-700">
                    <div className="flex items-center gap-1.5">{t("Batch Name", "批次名稱")} <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </th>
                  <th className="text-left px-4 py-3.5 font-semibold text-slate-700">{t("Type", "類型")}</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-slate-700">{t("Creator", "建立者")}</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-slate-700">{t("Date", "日期")}</th>
                  <th className="text-center px-4 py-3.5 font-semibold text-slate-700">{t("Links", "連結數")}</th>
                  <th className="text-center px-4 py-3.5 font-semibold text-slate-700">{t("Completed", "已完成")}</th>
                  <th className="text-center px-4 py-3.5 font-semibold text-slate-700">{t("Status", "狀態")}</th>
                  <th className="text-center px-4 py-3.5 font-semibold text-slate-700">{t("Actions", "操作")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map((batch: any) => {
                  const stats = linkStats[batch.id] || { total: 0, completed: 0, inProgress: 0 };
                  const batchCompletionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                  return (
                    <tr
                      key={batch.id}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/super-admin/anonymous-assessment/${batch.id}`)}
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-800">{batch.batch_name}</div>
                        <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{batch.description}</div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="outline" className="text-xs font-medium border-slate-200">
                          {getTypeLabel(batch.assessment_type)}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{batch.created_by_name || "—"}</td>
                      <td className="px-4 py-4 text-slate-500 text-xs">{formatDate(batch.created_at)}</td>
                      <td className="px-4 py-4 text-center font-medium text-slate-700">{stats.total}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-medium" style={{ color: ACCENT_GREEN }}>{stats.completed}</span>
                          <span className="text-xs text-slate-400">({batchCompletionRate}%)</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge className={`text-[11px] font-medium border ${BATCH_STATUS_LABELS[batch.status as BatchStatus]?.color || ""}`} variant="outline">
                          {getStatusLabel(batch.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-center" onClick={(event) => event.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="w-4 h-4 text-slate-400" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => navigate(`/super-admin/anonymous-assessment/${batch.id}`)}>
                              <Eye className="w-4 h-4 mr-2" />{t("View Batch", "檢視批次")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.success(t("Links copied!", "連結已複製！"))}>
                              <Copy className="w-4 h-4 mr-2" />{t("Copy Links", "複製連結")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.success(t("Exported!", "已匯出！"))}>
                              <Download className="w-4 h-4 mr-2" />{t("Export Links", "匯出連結")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {(batch.status === "completed" || batch.status === "active") && (
                              <DropdownMenuItem onClick={() => navigate(`/super-admin/anonymous-assessment/${batch.id}/report`)}>
                                <FileBarChart className="w-4 h-4 mr-2" />{t("Generate Report", "生成分析報告")}
                              </DropdownMenuItem>
                            )}
                            {batch.status !== "closed" && (
                              <DropdownMenuItem className="text-red-600" onClick={() => handleCloseBatch(batch.id)}>
                                <XCircle className="w-4 h-4 mr-2" />{t("Close Batch", "關閉批次")}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
                {filteredBatches.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center text-slate-400">
                      <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                      <div className="font-medium">{t("No batches found", "未找到批次")}</div>
                      <div className="text-xs mt-1">{t("Create your first anonymous assessment batch", "建立您的第一個匿名測評批次")}</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
