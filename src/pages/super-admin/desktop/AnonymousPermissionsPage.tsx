import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Save, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";

const PRIMARY = "#1C2857";
const ACCENT_GREEN = "#20A87B";

type PermissionKey = "create_batch" | "generate_links" | "view_progress" | "generate_report" | "export_links" | "export_reports" | "close_batch";

const PERMISSION_LABELS: Record<PermissionKey, { en: string; zhTw: string }> = {
  create_batch: { en: "Create Batch", zhTw: "建立批次" },
  generate_links: { en: "Generate Links", zhTw: "生成連結" },
  view_progress: { en: "View Progress", zhTw: "檢視進度" },
  generate_report: { en: "Generate Report", zhTw: "生成報告" },
  export_links: { en: "Export Links", zhTw: "匯出連結" },
  export_reports: { en: "Export Reports", zhTw: "匯出報告" },
  close_batch: { en: "Close Batch", zhTw: "關閉批次" },
};

const PERMISSION_KEYS: PermissionKey[] = [
  "create_batch", "generate_links", "view_progress", "generate_report",
  "export_links", "export_reports", "close_batch",
];

interface PermissionRole {
  id: string;
  role_id: string;
  role_name: string;
  role_name_zh: string;
  create_batch: boolean;
  generate_links: boolean;
  view_progress: boolean;
  generate_report: boolean;
  export_links: boolean;
  export_reports: boolean;
  close_batch: boolean;
}

export default function AnonymousPermissionsPage() {
  const queryClient = useQueryClient();
  const { language } = useTranslation();
  const [localRoles, setLocalRoles] = useState<PermissionRole[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const t = (en: string, zhTw: string) => language === "en" ? en : zhTw;

  // Fetch permission roles
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["anonymous-permissions"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("anonymous_assessment_permissions")
        .select("*")
        .order("role_id", { ascending: true });
      if (error) throw error;
      return data as PermissionRole[];
    },
  });

  useEffect(() => {
    if (roles.length > 0) {
      setLocalRoles(roles.map((role: PermissionRole) => ({ ...role })));
      setHasChanges(false);
    }
  }, [roles]);

  const togglePermission = (roleId: string, permissionKey: PermissionKey) => {
    setLocalRoles((prev) =>
      prev.map((role) =>
        role.role_id === roleId ? { ...role, [permissionKey]: !role[permissionKey] } : role
      )
    );
    setHasChanges(true);
  };

  // Save mutations
  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = localRoles.filter((role) => role.role_id !== "super_admin");
      for (const role of updates) {
        const { id, ...updateData } = role;
        const { error } = await (supabase as any)
          .from("anonymous_assessment_permissions")
          .update({
            create_batch: updateData.create_batch,
            generate_links: updateData.generate_links,
            view_progress: updateData.view_progress,
            generate_report: updateData.generate_report,
            export_links: updateData.export_links,
            export_reports: updateData.export_reports,
            close_batch: updateData.close_batch,
            updated_at: new Date().toISOString(),
          })
          .eq("role_id", updateData.role_id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(t("Permissions saved!", "權限設定已儲存！"));
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ["anonymous-permissions"] });
    },
    onError: (error: any) => {
      toast.error(error.message || t("Failed to save", "儲存失敗"));
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: PRIMARY }}>
            {t("Anonymous Assessment Permissions", "匿名測評權限設定")}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t("Configure which roles can perform which actions in the Anonymous Assessment Center",
              "設定各角色在匿名測評中心的操作權限")}
          </p>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!hasChanges || saveMutation.isPending}
          style={{ backgroundColor: hasChanges ? ACCENT_GREEN : undefined }}
          className={hasChanges ? "text-white shadow-lg" : ""}
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {t("Save Changes", "儲存變更")}
        </Button>
      </div>

      {/* Info banner */}
      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
        <p className="text-sm text-blue-700">
          {t("Super Admin always has full permissions. Other roles can be customized below.",
            "超級管理員始終擁有全部權限。其他角色權限可在下方自訂調整。")}
        </p>
      </div>

      {/* Permission Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100" style={{ backgroundColor: `${PRIMARY}06` }}>
                  <th className="text-left px-5 py-4 font-semibold text-slate-700 min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" style={{ color: PRIMARY }} />
                      {t("Role", "角色")}
                    </div>
                  </th>
                  {PERMISSION_KEYS.map((permKey) => (
                    <th key={permKey} className="text-center px-3 py-4 font-medium text-slate-600 text-xs whitespace-nowrap">
                      {language === "en" ? PERMISSION_LABELS[permKey].en : PERMISSION_LABELS[permKey].zhTw}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {localRoles.map((role) => {
                  const isSuperAdmin = role.role_id === "super_admin";
                  return (
                    <tr key={role.role_id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-800">{language === "en" ? role.role_name : role.role_name_zh}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{role.role_id}</div>
                      </td>
                      {PERMISSION_KEYS.map((permKey) => (
                        <td key={permKey} className="text-center px-3 py-4">
                          {isSuperAdmin ? (
                            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200 bg-emerald-50">
                              {t("Always", "始終")} ✓
                            </Badge>
                          ) : (
                            <Switch
                              checked={role[permKey]}
                              onCheckedChange={() => togglePermission(role.role_id, permKey)}
                            />
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Permission Descriptions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">{t("Permission Descriptions", "權限說明")}</h3>
        <div className="grid grid-cols-2 gap-4">
          {PERMISSION_KEYS.map((permKey) => {
            const descriptions: Record<PermissionKey, { en: string; zhTw: string }> = {
              create_batch: { en: "Create new anonymous assessment batches", zhTw: "建立新的匿名測評批次" },
              generate_links: { en: "Generate unique anonymous participation links", zhTw: "生成唯一匿名參與連結" },
              view_progress: { en: "View batch completion progress and status", zhTw: "查看批次完成進度與狀態" },
              generate_report: { en: "Trigger AI analysis and generate batch reports", zhTw: "觸發 AI 分析並生成批次報告" },
              export_links: { en: "Export link lists as CSV", zhTw: "匯出連結清單為 CSV" },
              export_reports: { en: "Export analysis reports as PDF", zhTw: "匯出分析報告為 PDF" },
              close_batch: { en: "Close a batch and disable remaining links", zhTw: "關閉批次並停用剩餘連結" },
            };
            return (
              <div key={permKey} className="flex items-start gap-2 text-sm">
                <Badge variant="outline" className="text-[10px] mt-0.5 whitespace-nowrap">{language === "en" ? PERMISSION_LABELS[permKey].en : PERMISSION_LABELS[permKey].zhTw}</Badge>
                <span className="text-slate-500 text-xs">{language === "en" ? descriptions[permKey].en : descriptions[permKey].zhTw}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
