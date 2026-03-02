import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderTree, Plus, ChevronRight, Edit, Trash2, X, Save, Loader2, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { useOrgDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from "@/hooks/useAdminData";

type ModalMode = "add" | "edit" | "delete" | null;

export default function DepartmentsPage() {
  const { language } = useTranslation();
  const { data: departments, isLoading } = useOrgDepartments();
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [formData, setFormData] = useState({ id: "", name: "", parentId: "", managerId: "" });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const allDepts = departments || [];
  const topLevelDepts = allDepts.filter((department) => !department.parent_department_id);
  const totalMembers = allDepts.reduce((sum, department) => sum + (department.memberCount || 0), 0);
  const subDeptCount = allDepts.filter((department) => department.parent_department_id).length;

  const toggleExpand = (deptId: string) => {
    const next = new Set(expandedDepts);
    if (next.has(deptId)) next.delete(deptId); else next.add(deptId);
    setExpandedDepts(next);
  };

  const getChildren = (parentId: string) => allDepts.filter((department) => department.parent_department_id === parentId);

  const openAdd = () => {
    setFormData({ id: "", name: "", parentId: "", managerId: "" });
    setModalMode("add");
  };

  const openEdit = (dept: typeof allDepts[0]) => {
    setFormData({ id: dept.id, name: dept.name, parentId: dept.parent_department_id || "", managerId: dept.manager_id || "" });
    setModalMode("edit");
  };

  const openDelete = (dept: typeof allDepts[0]) => {
    setFormData({ id: dept.id, name: dept.name, parentId: "", managerId: "" });
    setModalMode("delete");
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    if (modalMode === "add") {
      await createMutation.mutateAsync({
        name: formData.name.trim(),
        parent_department_id: formData.parentId || null,
        manager_id: formData.managerId || null,
      });
      toast.success(language === "en" ? "Department created" : language === "zh-TW" ? "部門建立成功" : "部门创建成功");
    } else if (modalMode === "edit") {
      await updateMutation.mutateAsync({
        id: formData.id,
        name: formData.name.trim(),
        parent_department_id: formData.parentId || null,
        manager_id: formData.managerId || null,
      });
      toast.success(language === "en" ? "Department updated" : language === "zh-TW" ? "部門更新成功" : "部门更新成功");
    }
    setModalMode(null);
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(formData.id);
    toast.success(language === "en" ? "Department deleted" : language === "zh-TW" ? "部門已刪除" : "部门已删除");
    setModalMode(null);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const renderDepartment = (dept: typeof allDepts[0], level = 0) => {
    const children = getChildren(dept.id);
    const hasChildren = children.length > 0;
    const memberCount = dept.memberCount || 0;
    const completedCount = dept.completedAssessments || 0;

    return (
      <div key={dept.id}>
        <div className={`flex items-center gap-3 px-5 py-4 hover:bg-muted/10 transition-colors ${level > 0 ? "border-l-2 border-sky-200 ml-8" : "border-b border-border"}`}>
          <div style={{ paddingLeft: `${level * 16}px` }} className="flex items-center gap-2 flex-1 min-w-0">
            {hasChildren ? (
              <button onClick={() => toggleExpand(dept.id)} className="p-1 hover:bg-muted/20 rounded">
                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expandedDepts.has(dept.id) ? "rotate-90" : ""}`} />
              </button>
            ) : <div className="w-6" />}
            <FolderTree className="w-4 h-4 text-sky-500 flex-shrink-0" />
            <span className="font-medium text-sm text-foreground truncate">{dept.name}</span>
          </div>
          <div className="flex items-center gap-6 flex-shrink-0">
            <div className="text-center min-w-[80px]">
              <div className="text-xs text-muted-foreground">{language === "en" ? "Manager" : language === "zh-TW" ? "主管" : "主管"}</div>
              <div className="text-sm text-foreground">{dept.managerName || "—"}</div>
            </div>
            <div className="text-center min-w-[60px]">
              <div className="text-xs text-muted-foreground">{language === "en" ? "Members" : language === "zh-TW" ? "人數" : "人数"}</div>
              <div className="text-sm font-medium text-foreground">{memberCount}</div>
            </div>
            <div className="text-center min-w-[80px]">
              <div className="text-xs text-muted-foreground">{language === "en" ? "Completed" : language === "zh-TW" ? "已完成" : "已完成"}</div>
              <div className="text-sm text-foreground">{completedCount}/{memberCount}</div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => openEdit(dept)} className="p-1.5 hover:bg-muted/20 rounded-lg" title={language === "en" ? "Edit" : language === "zh-TW" ? "編輯" : "编辑"}><Edit className="w-4 h-4 text-muted-foreground" /></button>
              <button onClick={() => openDelete(dept)} className="p-1.5 hover:bg-destructive/10 rounded-lg" title={language === "en" ? "Delete" : language === "zh-TW" ? "刪除" : "删除"}><Trash2 className="w-4 h-4 text-destructive" /></button>
            </div>
          </div>
        </div>
        {hasChildren && expandedDepts.has(dept.id) && children.map((child) => renderDepartment(child, level + 1))}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">{language === "en" ? "Departments" : language === "zh-TW" ? "部門管理" : "部门管理"}</h1>
          <p className="text-sm text-muted-foreground">{language === "en" ? "Manage organizational structure and department hierarchy" : language === "zh-TW" ? "管理組織架構和部門層級" : "管理组织架构和部门层级"}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> {language === "en" ? "Add Department" : language === "zh-TW" ? "新增部門" : "新增部门"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-4"><div className="text-2xl font-bold text-foreground">{topLevelDepts.length}</div><div className="text-xs text-muted-foreground">{language === "en" ? "Top-level Departments" : language === "zh-TW" ? "一級部門" : "一级部门"}</div></div>
        <div className="bg-card border border-border rounded-lg p-4"><div className="text-2xl font-bold text-foreground">{totalMembers}</div><div className="text-xs text-muted-foreground">{language === "en" ? "Total Members" : language === "zh-TW" ? "總人數" : "总人数"}</div></div>
        <div className="bg-card border border-border rounded-lg p-4"><div className="text-2xl font-bold text-foreground">{subDeptCount}</div><div className="text-xs text-muted-foreground">{language === "en" ? "Sub-departments" : language === "zh-TW" ? "子部門" : "子部门"}</div></div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center gap-6">
          <div className="flex-1 text-xs font-medium text-muted-foreground uppercase">{language === "en" ? "Department" : language === "zh-TW" ? "部門" : "部门"}</div>
          <div className="flex items-center gap-6 flex-shrink-0">
            <div className="text-center min-w-[80px] text-xs font-medium text-muted-foreground uppercase">{language === "en" ? "Manager" : language === "zh-TW" ? "主管" : "主管"}</div>
            <div className="text-center min-w-[60px] text-xs font-medium text-muted-foreground uppercase">{language === "en" ? "Members" : language === "zh-TW" ? "人數" : "人数"}</div>
            <div className="text-center min-w-[80px] text-xs font-medium text-muted-foreground uppercase">{language === "en" ? "Progress" : language === "zh-TW" ? "進度" : "进度"}</div>
            <div className="min-w-[72px]" />
          </div>
        </div>
        {topLevelDepts.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">{language === "en" ? "No departments found" : language === "zh-TW" ? "暫無部門資料" : "暂无部门数据"}</div>
        ) : topLevelDepts.map((dept) => renderDepartment(dept))}
      </motion.div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {(modalMode === "add" || modalMode === "edit") && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setModalMode(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card border border-border rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">{modalMode === "add" ? (language === "en" ? "Add Department" : language === "zh-TW" ? "新增部門" : "新增部门") : (language === "en" ? "Edit Department" : language === "zh-TW" ? "編輯部門" : "编辑部门")}</h2>
                <button onClick={() => setModalMode(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">{language === "en" ? "Department Name" : language === "zh-TW" ? "部門名稱" : "部门名称"} *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{language === "en" ? "Parent Department" : language === "zh-TW" ? "上級部門" : "上级部门"}</label>
                  <select value={formData.parentId} onChange={(e) => setFormData({ ...formData, parentId: e.target.value })} className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm">
                    <option value="">{language === "en" ? "None (Top-level)" : language === "zh-TW" ? "無（一級部門）" : "无（一级部门）"}</option>
                    {allDepts.filter(d => d.id !== formData.id).map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setModalMode(null)} className="px-4 py-2 text-sm text-muted-foreground">{language === "en" ? "Cancel" : "取消"}</button>
                <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-sky-500 hover:bg-sky-600 text-white rounded-lg disabled:opacity-50">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? (language === "en" ? "Saving..." : language === "zh-TW" ? "儲存中..." : "保存中...") : (language === "en" ? "Save" : language === "zh-TW" ? "儲存" : "保存")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {modalMode === "delete" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setModalMode(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card border border-border rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
                <h2 className="text-lg font-semibold text-foreground">{language === "en" ? "Delete Department" : language === "zh-TW" ? "刪除部門" : "删除部门"}</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                {language === "en" ? `Are you sure you want to delete "${formData.name}"? Sub-departments and member assignments will also be affected.` : language === "zh-TW" ? `確定要刪除「${formData.name}」嗎？子部門和人員分配也會受影響。` : `确定要删除「${formData.name}」吗？子部门和人员分配也会受影响。`}
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setModalMode(null)} className="px-4 py-2 text-sm text-muted-foreground">{language === "en" ? "Cancel" : "取消"}</button>
                <button onClick={handleDelete} disabled={deleteMutation.isPending} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50">
                  {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deleteMutation.isPending ? (language === "en" ? "Deleting..." : language === "zh-TW" ? "刪除中..." : "删除中...") : (language === "en" ? "Delete" : language === "zh-TW" ? "刪除" : "删除")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
