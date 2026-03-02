import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useLanguage";
import { toast } from "sonner";
import {
  Award, Plus, Pencil, ToggleLeft, ToggleRight, GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface CertificateType {
  id: string;
  cert_code: string;
  cert_name_en: string;
  cert_name_zh_cn: string;
  cert_name_zh_tw: string;
  description_en: string;
  description_zh_cn: string;
  description_zh_tw: string;
  gcqa_code: string;
  renewal_cycle_years: number;
  minimum_cdu_hours: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const emptyForm: Omit<CertificateType, "id" | "created_at"> = {
  cert_code: "",
  cert_name_en: "",
  cert_name_zh_cn: "",
  cert_name_zh_tw: "",
  description_en: "",
  description_zh_cn: "",
  description_zh_tw: "",
  gcqa_code: "",
  renewal_cycle_years: 5,
  minimum_cdu_hours: 80,
  is_active: true,
  sort_order: 0,
};

export default function CertificateRegistryPage() {
  const { language } = useTranslation();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const txt = {
    title: language === "en" ? "Certificate Registry" : language === "zh-TW" ? "證照清單" : "证照清单",
    subtitle: language === "en" ? "Manage all certification types in the system" : language === "zh-TW" ? "管理系統中所有認證類型" : "管理系统中所有认证类型",
    addNew: language === "en" ? "Add Certificate Type" : language === "zh-TW" ? "新增證照類型" : "新增证照类型",
    edit: language === "en" ? "Edit" : language === "zh-TW" ? "編輯" : "编辑",
    certCode: language === "en" ? "Certificate Code" : language === "zh-TW" ? "證照代碼" : "证照代码",
    certNameEn: language === "en" ? "English Name" : language === "zh-TW" ? "英文名稱" : "英文名称",
    certNameZhCn: language === "en" ? "Simplified Chinese" : language === "zh-TW" ? "簡體中文名稱" : "简体中文名称",
    certNameZhTw: language === "en" ? "Traditional Chinese" : language === "zh-TW" ? "繁體中文名稱" : "繁体中文名称",
    descEn: language === "en" ? "Description (EN)" : language === "zh-TW" ? "說明（英文）" : "说明（英文）",
    descZhCn: language === "en" ? "Description (ZH-CN)" : language === "zh-TW" ? "說明（簡中）" : "说明（简中）",
    descZhTw: language === "en" ? "Description (ZH-TW)" : language === "zh-TW" ? "說明（繁中）" : "说明（繁中）",
    gcqaCode: language === "en" ? "GCQA Code" : language === "zh-TW" ? "GCQA 代碼" : "GCQA 代码",
    gcqaCodeHint: language === "en" ? "First 4 chars of certificate ID for GCQA-partnered certificates" : language === "zh-TW" ? "GCQA 合作證書編號前四碼" : "GCQA 合作证书编号前四码",
    renewalCycle: language === "en" ? "Renewal Cycle (Years)" : language === "zh-TW" ? "換證週期（年）" : "换证周期（年）",
    minCduHours: language === "en" ? "Min CDU Hours" : language === "zh-TW" ? "最低 CDU 時數" : "最低 CDU 学时",
    active: language === "en" ? "Active" : language === "zh-TW" ? "啟用" : "启用",
    inactive: language === "en" ? "Inactive" : language === "zh-TW" ? "停用" : "停用",
    status: language === "en" ? "Status" : language === "zh-TW" ? "狀態" : "状态",
    sortOrder: language === "en" ? "Sort Order" : language === "zh-TW" ? "排序" : "排序",
    save: language === "en" ? "Save" : language === "zh-TW" ? "儲存" : "保存",
    cancel: language === "en" ? "Cancel" : language === "zh-TW" ? "取消" : "取消",
    createTitle: language === "en" ? "New Certificate Type" : language === "zh-TW" ? "新增證照類型" : "新增证照类型",
    editTitle: language === "en" ? "Edit Certificate Type" : language === "zh-TW" ? "編輯證照類型" : "编辑证照类型",
    certName: language === "en" ? "Certificate Name" : language === "zh-TW" ? "證照名稱" : "证照名称",
    renewalInfo: language === "en" ? "Renewal Info" : language === "zh-TW" ? "換證資訊" : "换证信息",
    toggleSuccess: language === "en" ? "Status updated" : language === "zh-TW" ? "狀態已更新" : "状态已更新",
    saveSuccess: language === "en" ? "Saved successfully" : language === "zh-TW" ? "儲存成功" : "保存成功",
  };

  const getCertName = (item: CertificateType) => {
    if (language === "en") return item.cert_name_en;
    if (language === "zh-TW") return item.cert_name_zh_tw;
    return item.cert_name_zh_cn;
  };

  const getDescription = (item: CertificateType) => {
    if (language === "en") return item.description_en;
    if (language === "zh-TW") return item.description_zh_tw;
    return item.description_zh_cn;
  };

  const { data: certTypes = [], isLoading } = useQuery({
    queryKey: ["certificate-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificate_types")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as CertificateType[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: typeof form & { id?: string }) => {
      if (values.id) {
        const { error } = await supabase
          .from("certificate_types")
          .update({ ...values, updated_at: new Date().toISOString() })
          .eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("certificate_types")
          .insert([values]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificate-types"] });
      toast.success(txt.saveSuccess);
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("certificate_types")
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificate-types"] });
      toast.success(txt.toggleSuccess);
    },
  });

  const handleEdit = (item: CertificateType) => {
    setEditingId(item.id);
    setForm({
      cert_code: item.cert_code,
      cert_name_en: item.cert_name_en,
      cert_name_zh_cn: item.cert_name_zh_cn,
      cert_name_zh_tw: item.cert_name_zh_tw,
      description_en: item.description_en,
      description_zh_cn: item.description_zh_cn,
      description_zh_tw: item.description_zh_tw,
      gcqa_code: item.gcqa_code,
      renewal_cycle_years: item.renewal_cycle_years,
      minimum_cdu_hours: item.minimum_cdu_hours,
      is_active: item.is_active,
      sort_order: item.sort_order,
    });
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, sort_order: certTypes.length + 1 });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.cert_code.trim()) return;
    upsertMutation.mutate(editingId ? { ...form, id: editingId } : form);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            {txt.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{txt.subtitle}</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          {txt.addNew}
        </Button>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12">#</TableHead>
              <TableHead>{txt.certCode}</TableHead>
              <TableHead>{txt.certName}</TableHead>
              <TableHead>{txt.gcqaCode}</TableHead>
              <TableHead>{txt.renewalInfo}</TableHead>
              <TableHead>{txt.status}</TableHead>
              <TableHead className="text-right">{txt.edit}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : certTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  {language === "en" ? "No certificate types found" : language === "zh-TW" ? "尚無證照類型" : "暂无证照类型"}
                </TableCell>
              </TableRow>
            ) : (
              certTypes.map((item, index) => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <GripVertical className="w-3 h-3 text-muted-foreground/50" />
                      {index + 1}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono font-bold text-sm">
                      {item.cert_code}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{getCertName(item)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 max-w-xs truncate">
                      {getDescription(item)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{item.gcqa_code || "—"}</span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {item.renewal_cycle_years}{language === "en" ? " yrs" : language === "zh-TW" ? " 年" : " 年"} / {item.minimum_cdu_hours} CDU
                    </div>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => toggleMutation.mutate({ id: item.id, isActive: !item.is_active })}
                      className="flex items-center gap-1.5"
                    >
                      {item.is_active ? (
                        <>
                          <ToggleRight className="w-5 h-5 text-green-500" />
                          <span className="text-xs text-green-600">{txt.active}</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{txt.inactive}</span>
                        </>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? txt.editTitle : txt.createTitle}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Code & GCQA */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{txt.certCode}</Label>
                <Input
                  value={form.cert_code}
                  onChange={(e) => setForm({ ...form, cert_code: e.target.value.toUpperCase() })}
                  placeholder="SCPC"
                  className="font-mono"
                  disabled={!!editingId}
                />
              </div>
              <div>
                <Label>{txt.gcqaCode}</Label>
                <Input
                  value={form.gcqa_code}
                  onChange={(e) => setForm({ ...form, gcqa_code: e.target.value })}
                  placeholder="SCPC"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">{txt.gcqaCodeHint}</p>
              </div>
            </div>

            {/* Names */}
            <div>
              <Label>{txt.certNameEn}</Label>
              <Input
                value={form.cert_name_en}
                onChange={(e) => setForm({ ...form, cert_name_en: e.target.value })}
                placeholder="SCPC Career Pathway Consultant"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{txt.certNameZhCn}</Label>
                <Input
                  value={form.cert_name_zh_cn}
                  onChange={(e) => setForm({ ...form, cert_name_zh_cn: e.target.value })}
                />
              </div>
              <div>
                <Label>{txt.certNameZhTw}</Label>
                <Input
                  value={form.cert_name_zh_tw}
                  onChange={(e) => setForm({ ...form, cert_name_zh_tw: e.target.value })}
                />
              </div>
            </div>

            {/* Descriptions */}
            <div>
              <Label>{txt.descEn}</Label>
              <Textarea
                value={form.description_en}
                onChange={(e) => setForm({ ...form, description_en: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{txt.descZhCn}</Label>
                <Textarea
                  value={form.description_zh_cn}
                  onChange={(e) => setForm({ ...form, description_zh_cn: e.target.value })}
                  rows={2}
                />
              </div>
              <div>
                <Label>{txt.descZhTw}</Label>
                <Textarea
                  value={form.description_zh_tw}
                  onChange={(e) => setForm({ ...form, description_zh_tw: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            {/* Renewal */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>{txt.renewalCycle}</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.renewal_cycle_years}
                  onChange={(e) => setForm({ ...form, renewal_cycle_years: parseInt(e.target.value) || 5 })}
                />
              </div>
              <div>
                <Label>{txt.minCduHours}</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.minimum_cdu_hours}
                  onChange={(e) => setForm({ ...form, minimum_cdu_hours: parseInt(e.target.value) || 80 })}
                />
              </div>
              <div>
                <Label>{txt.sortOrder}</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Active */}
            <div className="flex items-center gap-3">
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
              <Label>{form.is_active ? txt.active : txt.inactive}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {txt.cancel}
            </Button>
            <Button onClick={handleSave} disabled={upsertMutation.isPending || !form.cert_code.trim()}>
              {txt.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
