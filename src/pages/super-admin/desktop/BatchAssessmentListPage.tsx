import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, Eye,
  MoreHorizontal, Loader2, PlayCircle, PauseCircle, XCircle, Archive,
  Layers, Clock,
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
import {
  useBatchAssessments,
  useUpdateBatchStatus,
} from "@/hooks/useBatchAssessment";

const PRIMARY = "#1C2857";

const STATUS_CONFIG: Record<string, { label: Record<string, string>; color: string; bgColor: string }> = {
  draft: { label: { en: "Draft", "zh-TW": "草稿", "zh-CN": "草稿" }, color: "#6B7280", bgColor: "#F3F4F6" },
  active: { label: { en: "Active", "zh-TW": "進行中", "zh-CN": "进行中" }, color: "#059669", bgColor: "#ECFDF5" },
  paused: { label: { en: "Paused", "zh-TW": "已暫停", "zh-CN": "已暂停" }, color: "#D97706", bgColor: "#FFFBEB" },
  closed: { label: { en: "Closed", "zh-TW": "已結束", "zh-CN": "已结束" }, color: "#DC2626", bgColor: "#FEF2F2" },
  archived: { label: { en: "Archived", "zh-TW": "已歸檔", "zh-CN": "已归档" }, color: "#6B7280", bgColor: "#F9FAFB" },
};

const TYPE_LABELS: Record<string, Record<string, string>> = {
  career_anchor: { en: "Career Anchor", "zh-TW": "職業錨", "zh-CN": "职业锚" },
  life_card: { en: "Espresso Card", "zh-TW": "人生卡", "zh-CN": "人生卡" },
  combined: { en: "Integration", "zh-TW": "整合", "zh-CN": "整合" },
};

export default function BatchAssessmentListPage() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const t = (en: string, zhTw: string) => language === "en" ? en : zhTw;

  const { data: batches = [], isLoading } = useBatchAssessments(true);
  const updateStatus = useUpdateBatchStatus();

  const filteredBatches = batches.filter((batch) => {
    const matchesSearch = batch.batch_name.toLowerCase().includes(searchTerm.toLowerCase())
      || batch.organization_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || batch.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalBatches = batches.length;
  const activeBatches = batches.filter(batchItem => batchItem.status === "active").length;

  const handleStatusUpdate = async (batchId: string, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ batchId, status: newStatus });
      toast.success(t("Status updated", "狀態已更新"));
    } catch {
      toast.error(t("Failed to update status", "更新狀態失敗"));
    }
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status];
    if (!config) return <Badge variant="outline">{status}</Badge>;
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
        style={{ backgroundColor: config.bgColor, color: config.color }}>
        {config.label[language] || config.label.en}
      </span>
    );
  };

  const getTypeLabel = (assessmentType: string) => {
    const labels = TYPE_LABELS[assessmentType];
    return labels ? (labels[language] || labels.en) : assessmentType;
  };

  const kpiCards = [
    { label: t("Total Batches", "批次總數"), value: totalBatches, icon: Layers, color: PRIMARY },
    { label: t("Active", "進行中"), value: activeBatches, icon: PlayCircle, color: "#059669" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: PRIMARY }}>
            {t("Batch Assessment", "批次施測")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("Manage enterprise batch assessment campaigns", "管理企業統一批次施測活動")}
          </p>
        </div>
        <Button onClick={() => navigate("/super-admin/batch-assessment/create")} style={{ backgroundColor: PRIMARY }}>
          <Plus className="w-4 h-4 mr-2" />
          {t("Create Batch", "建立批次")}
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4">
        {kpiCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border p-5" style={{ borderColor: "#E9ECEF" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: card.color }}>{card.value}</p>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: card.color + "10" }}>
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t("Search batch name or organization...", "搜尋批次名稱或企業...")}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All Status", "全部狀態")}</SelectItem>
            <SelectItem value="draft">{t("Draft", "草稿")}</SelectItem>
            <SelectItem value="active">{t("Active", "進行中")}</SelectItem>
            <SelectItem value="paused">{t("Paused", "已暫停")}</SelectItem>
            <SelectItem value="closed">{t("Closed", "已結束")}</SelectItem>
            <SelectItem value="archived">{t("Archived", "已歸檔")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Layers className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">{t("No batches found", "未找到批次")}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E9ECEF" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "#E9ECEF", backgroundColor: "#FAFBFC" }}>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Batch Name", "批次名稱")}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Organization", "企業")}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Type", "類型")}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Status", "狀態")}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Period", "期間")}</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t("Actions", "操作")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.map((batch) => (
                <tr key={batch.id} className="border-b last:border-b-0 hover:bg-gray-50/50 transition-colors" style={{ borderColor: "#E9ECEF" }}>
                  <td className="px-4 py-3">
                    <button onClick={() => navigate(`/super-admin/batch-assessment/${batch.id}`)} className="font-medium hover:underline text-left" style={{ color: PRIMARY }}>
                      {batch.batch_name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{batch.organization_name || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#F0F2F5", color: "#555" }}>
                      {getTypeLabel(batch.assessment_type)}
                    </span>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(batch.status)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(batch.start_time).toLocaleDateString()} – {new Date(batch.end_time).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/super-admin/batch-assessment/${batch.id}`)}>
                          <Eye className="w-4 h-4 mr-2" />
                          {t("View Detail", "查看詳情")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {batch.status === "draft" && (
                          <DropdownMenuItem onClick={() => handleStatusUpdate(batch.id, "active")}>
                            <PlayCircle className="w-4 h-4 mr-2" />
                            {t("Activate", "啟用")}
                          </DropdownMenuItem>
                        )}
                        {batch.status === "active" && (
                          <DropdownMenuItem onClick={() => handleStatusUpdate(batch.id, "paused")}>
                            <PauseCircle className="w-4 h-4 mr-2" />
                            {t("Pause", "暫停")}
                          </DropdownMenuItem>
                        )}
                        {batch.status === "paused" && (
                          <DropdownMenuItem onClick={() => handleStatusUpdate(batch.id, "active")}>
                            <PlayCircle className="w-4 h-4 mr-2" />
                            {t("Resume", "恢復")}
                          </DropdownMenuItem>
                        )}
                        {(batch.status === "active" || batch.status === "paused") && (
                          <DropdownMenuItem onClick={() => handleStatusUpdate(batch.id, "closed")} className="text-red-600">
                            <XCircle className="w-4 h-4 mr-2" />
                            {t("Close", "結束")}
                          </DropdownMenuItem>
                        )}
                        {batch.status === "closed" && (
                          <DropdownMenuItem onClick={() => handleStatusUpdate(batch.id, "archived")}>
                            <Archive className="w-4 h-4 mr-2" />
                            {t("Archive", "歸檔")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
