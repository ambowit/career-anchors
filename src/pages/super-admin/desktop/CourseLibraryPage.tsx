import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Library, Plus, X, Search, Pencil, ToggleLeft, ToggleRight, GraduationCap, Video, Link2, Building2 } from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { useAllCourseCatalog, useCreateCourse, useUpdateCourse, type CourseCatalogEntry } from "@/hooks/useCertification";
import { toast } from "sonner";

const COURSE_TYPES = ["training", "workshop", "conference", "supervision", "seminar"] as const;

function getCourseTypeLabel(type: string, langKey: string) {
  const labels: Record<string, Record<string, string>> = {
    training: { en: "Training", "zh-TW": "培訓", "zh-CN": "培训" },
    workshop: { en: "Workshop", "zh-TW": "工作坊", "zh-CN": "工作坊" },
    conference: { en: "Conference", "zh-TW": "研討會", "zh-CN": "研讨会" },
    supervision: { en: "Supervision", "zh-TW": "督導", "zh-CN": "督导" },
    seminar: { en: "Seminar", "zh-TW": "講座", "zh-CN": "讲座" },
  };
  return labels[type]?.[langKey] || type;
}

const INSTITUTION_OPTIONS = [
  { value: "", label: { en: "None", "zh-TW": "無", "zh-CN": "无" } },
  { value: "AMBOW", label: { en: "AMBOW", "zh-TW": "AMBOW", "zh-CN": "AMBOW" } },
  { value: "HK", label: { en: "HK", "zh-TW": "HK", "zh-CN": "HK" } },
] as const;

const EMPTY_FORM = {
  course_code: "",
  course_name: "",
  course_name_zh: "",
  description: "",
  description_zh: "",
  course_provider: "SCPC",
  course_type: "training" as string,
  cdu_hours: "",
  is_official: true,
  prerequisites: "",
  institution: "" as string,
  year_tag: "",
  cdu_class: "A" as string,
  is_recorded: false,
  course_url: "",
  credit_conditions: "",
};

export default function CourseLibraryPage() {
  const { language } = useTranslation();
  const langKey = language === "en" ? "en" : language === "zh-TW" ? "zh-TW" : "zh-CN";
  const { data: courses = [], isLoading } = useAllCourseCatalog();
  const createMutation = useCreateCourse();
  const updateMutation = useUpdateCourse();

  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseCatalogEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [formData, setFormData] = useState(EMPTY_FORM);

  const filteredCourses = courses
    .filter((c) => filterType === "all" || c.course_type === filterType)
    .filter((c) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return c.course_name.toLowerCase().includes(term) || c.course_code.toLowerCase().includes(term) || (c.course_name_zh || "").toLowerCase().includes(term);
    });

  const openCreateModal = () => {
    setEditingCourse(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (course: CourseCatalogEntry) => {
    setEditingCourse(course);
    setFormData({
      course_code: course.course_code,
      course_name: course.course_name,
      course_name_zh: course.course_name_zh || "",
      description: course.description || "",
      description_zh: course.description_zh || "",
      course_provider: course.course_provider,
      course_type: course.course_type,
      cdu_hours: String(Number(course.cdu_hours)),
      is_official: course.is_official,
      prerequisites: course.prerequisites || "",
      institution: course.institution || "",
      year_tag: course.year_tag || "",
      cdu_class: course.cdu_class || "A",
      is_recorded: course.is_recorded || false,
      course_url: course.course_url || "",
      credit_conditions: course.credit_conditions || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.course_code || !formData.course_name || !formData.cdu_hours) {
      toast.error({ en: "Please fill required fields", "zh-TW": "請填寫必填欄位", "zh-CN": "请填写必填字段" }[langKey]!);
      return;
    }
    if (formData.is_recorded && !formData.course_url) {
      toast.error({ en: "Recorded courses require a URL", "zh-TW": "錄播課程需要填寫網址", "zh-CN": "录播课程需要填写网址" }[langKey]!);
      return;
    }
    const courseData = {
      course_code: formData.course_code,
      course_name: formData.course_name,
      course_name_zh: formData.course_name_zh || null,
      description: formData.description || null,
      description_zh: formData.description_zh || null,
      course_provider: formData.course_provider,
      course_type: formData.course_type,
      cdu_hours: parseFloat(formData.cdu_hours),
      is_official: formData.is_official,
      is_active: true,
      prerequisites: formData.prerequisites || null,
      organization_id: null,
      institution: formData.institution || null,
      year_tag: formData.year_tag || null,
      cdu_class: formData.cdu_class as "A" | "B",
      is_recorded: formData.is_recorded,
      course_url: formData.course_url || null,
      credit_conditions: formData.credit_conditions || null,
    };

    if (editingCourse) {
      await updateMutation.mutateAsync({ courseId: editingCourse.id, updates: courseData });
      toast.success({ en: "Course updated", "zh-TW": "課程已更新", "zh-CN": "课程已更新" }[langKey]!);
    } else {
      await createMutation.mutateAsync(courseData);
      toast.success({ en: "Course created", "zh-TW": "課程已建立", "zh-CN": "课程已创建" }[langKey]!);
    }
    setShowModal(false);
  };

  const handleToggleActive = async (course: CourseCatalogEntry) => {
    await updateMutation.mutateAsync({ courseId: course.id, updates: { is_active: !course.is_active } });
    toast.success(course.is_active
      ? { en: "Course deactivated", "zh-TW": "課程已停用", "zh-CN": "课程已停用" }[langKey]!
      : { en: "Course activated", "zh-TW": "課程已啟用", "zh-CN": "课程已启用" }[langKey]!);
  };

  const stats = {
    total: courses.length,
    active: courses.filter((c) => c.is_active).length,
    official: courses.filter((c) => c.is_official).length,
    totalHours: courses.reduce((sum, c) => sum + Number(c.cdu_hours), 0),
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {{ en: "Official Course Library", "zh-TW": "官方課程庫", "zh-CN": "官方课程库" }[langKey]}
          </h1>
          <p className="text-sm text-muted-foreground">
            {{ en: "Manage official courses for A-type CDU auto-verification", "zh-TW": "管理 A 類 CDU 自動核准的官方課程", "zh-CN": "管理A类CDU自动核准的官方课程" }[langKey]}
          </p>
        </div>
        <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">
          <Plus className="w-4 h-4" />
          {{ en: "Add Course", "zh-TW": "新增課程", "zh-CN": "新增课程" }[langKey]}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: { en: "Total Courses", "zh-TW": "總課程數", "zh-CN": "总课程数" }[langKey]!, value: stats.total, color: "text-slate-700" },
          { label: { en: "Active", "zh-TW": "啟用中", "zh-CN": "启用中" }[langKey]!, value: stats.active, color: "text-emerald-600" },
          { label: { en: "Official (A-type)", "zh-TW": "官方 (A 類)", "zh-CN": "官方 (A类)" }[langKey]!, value: stats.official, color: "text-blue-600" },
          { label: { en: "Total CDU Hours", "zh-TW": "總 CDU 學時", "zh-CN": "总CDU学时" }[langKey]!, value: `${stats.totalHours}h`, color: "text-amber-600" },
        ].map((stat, index) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} className="bg-card border border-border rounded-xl p-4">
            <div className="text-xs text-muted-foreground font-medium mb-1">{stat.label}</div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={{ en: "Search courses...", "zh-TW": "搜尋課程...", "zh-CN": "搜索课程..." }[langKey]} className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm" />
        </div>
        <div className="flex items-center gap-1.5">
          {["all", ...COURSE_TYPES].map((type) => (
            <button key={type} onClick={() => setFilterType(type)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterType === type ? "bg-red-500 text-white" : "bg-muted/10 text-muted-foreground hover:bg-muted/20"}`}>
              {type === "all" ? { en: "All", "zh-TW": "全部", "zh-CN": "全部" }[langKey] : getCourseTypeLabel(type, langKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full" /></div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <Library className="w-10 h-10 mx-auto mb-3 opacity-30" />
            {{ en: "No courses found", "zh-TW": "暫無課程", "zh-CN": "暂无课程" }[langKey]}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/5">
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{{ en: "Code", "zh-TW": "編碼", "zh-CN": "编码" }[langKey]}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{{ en: "Course Name", "zh-TW": "課程名稱", "zh-CN": "课程名称" }[langKey]}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{{ en: "Type", "zh-TW": "類型", "zh-CN": "类型" }[langKey]}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{{ en: "Hours", "zh-TW": "學時", "zh-CN": "学时" }[langKey]}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{{ en: "CDU Class", "zh-TW": "CDU 類別", "zh-CN": "CDU 类别" }[langKey]}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{{ en: "Institution", "zh-TW": "機構", "zh-CN": "机构" }[langKey]}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{{ en: "Status", "zh-TW": "狀態", "zh-CN": "状态" }[langKey]}</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">{{ en: "Actions", "zh-TW": "操作", "zh-CN": "操作" }[langKey]}</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((course) => (
                <tr key={course.id} className="border-b border-border/50 last:border-0 hover:bg-muted/5 transition-colors">
                  <td className="px-5 py-3.5 text-xs text-muted-foreground font-mono">{course.course_code}</td>
                  <td className="px-5 py-3.5">
                    <div className="text-sm font-medium text-foreground">{langKey === "en" ? course.course_name : (course.course_name_zh || course.course_name)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{course.course_provider}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">{getCourseTypeLabel(course.course_type, langKey)}</span>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-foreground">
                    <span className="flex items-center gap-1">
                      {Number(course.cdu_hours)}h
                      {(course as any).is_recorded && <Video className="w-3 h-3 text-purple-500" title="Recorded" />}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      (course as any).cdu_class === "B" ? "bg-orange-50 text-orange-700 border border-orange-200" : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}>
                      {(course as any).cdu_class === "B" ? "B" : <><GraduationCap className="w-3 h-3 inline mr-0.5" />A</>}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {(course as any).institution ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                        <Building2 className="w-3 h-3 inline mr-0.5" />{(course as any).institution}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${course.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                      {course.is_active ? { en: "Active", "zh-TW": "啟用", "zh-CN": "启用" }[langKey] : { en: "Inactive", "zh-TW": "停用", "zh-CN": "停用" }[langKey]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => openEditModal(course)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/20 transition-colors" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleToggleActive(course)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/20 transition-colors" title={course.is_active ? "Deactivate" : "Activate"}>
                        {course.is_active ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card border border-border rounded-2xl p-6 w-[600px] shadow-xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground">
                  {editingCourse
                    ? { en: "Edit Course", "zh-TW": "編輯課程", "zh-CN": "编辑课程" }[langKey]
                    : { en: "Add Course", "zh-TW": "新增課程", "zh-CN": "新增课程" }[langKey]}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-muted/20"><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{{ en: "Course Code", "zh-TW": "課程編碼", "zh-CN": "课程编码" }[langKey]} *</label>
                    <input value={formData.course_code} onChange={(e) => setFormData({ ...formData, course_code: e.target.value })} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm" placeholder="SCPC-101" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{{ en: "CDU Hours", "zh-TW": "CDU 學時", "zh-CN": "CDU 学时" }[langKey]} *</label>
                    <input type="number" step="0.5" min="0.5" value={formData.cdu_hours} onChange={(e) => setFormData({ ...formData, cdu_hours: e.target.value })} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm" placeholder="8" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{{ en: "Course Name (EN)", "zh-TW": "課程名稱 (英文)", "zh-CN": "课程名称 (英文)" }[langKey]} *</label>
                  <input value={formData.course_name} onChange={(e) => setFormData({ ...formData, course_name: e.target.value })} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm" />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{{ en: "Course Name (ZH)", "zh-TW": "課程名稱 (中文)", "zh-CN": "课程名称 (中文)" }[langKey]}</label>
                  <input value={formData.course_name_zh} onChange={(e) => setFormData({ ...formData, course_name_zh: e.target.value })} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{{ en: "Provider", "zh-TW": "機構", "zh-CN": "机构" }[langKey]}</label>
                    <input value={formData.course_provider} onChange={(e) => setFormData({ ...formData, course_provider: e.target.value })} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{{ en: "Course Type", "zh-TW": "課程類型", "zh-CN": "课程类型" }[langKey]}</label>
                    <select value={formData.course_type} onChange={(e) => setFormData({ ...formData, course_type: e.target.value })} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm">
                      {COURSE_TYPES.map((type) => <option key={type} value={type}>{getCourseTypeLabel(type, langKey)}</option>)}
                    </select>
                  </div>
                </div>

                {/* CDU Class + Institution */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{{ en: "CDU Class", "zh-TW": "CDU 類別", "zh-CN": "CDU 类别" }[langKey]}</label>
                    <div className="flex items-center gap-4 mt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="cdu_class" value="A" checked={formData.cdu_class === "A"} onChange={() => setFormData({ ...formData, cdu_class: "A" })} className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">{{ en: "A-Class (Official)", "zh-TW": "A 類（官方）", "zh-CN": "A类（官方）" }[langKey]}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="cdu_class" value="B" checked={formData.cdu_class === "B"} onChange={() => setFormData({ ...formData, cdu_class: "B" })} className="w-4 h-4 text-orange-500" />
                        <span className="text-sm">{{ en: "B-Class (External)", "zh-TW": "B 類（外部）", "zh-CN": "B类（外部）" }[langKey]}</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{{ en: "Institution", "zh-TW": "所屬機構", "zh-CN": "所属机构" }[langKey]}</label>
                    <select value={formData.institution} onChange={(e) => setFormData({ ...formData, institution: e.target.value })} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm">
                      {INSTITUTION_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label[langKey as keyof typeof opt.label]}</option>)}
                    </select>
                  </div>
                </div>

                {/* Year Tag + Official */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{{ en: "Year Tag", "zh-TW": "年份標籤", "zh-CN": "年份标签" }[langKey]}</label>
                    <input value={formData.year_tag} onChange={(e) => setFormData({ ...formData, year_tag: e.target.value })} placeholder={{ en: "e.g. 2024 Red Cup Course", "zh-TW": "例：2024紅盃課程", "zh-CN": "例：2024红杯课程" }[langKey]} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm" />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.is_official} onChange={(e) => setFormData({ ...formData, is_official: e.target.checked })} className="w-4 h-4 rounded border-border text-blue-500" />
                      <span className="text-sm font-medium text-foreground">
                        {{ en: "Official Course (auto-approval)", "zh-TW": "官方課程（自動核准）", "zh-CN": "官方课程（自动核准）" }[langKey]}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Recorded Course */}
                <div className="p-3 border border-border rounded-lg bg-muted/5">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input type="checkbox" checked={formData.is_recorded} onChange={(e) => setFormData({ ...formData, is_recorded: e.target.checked })} className="w-4 h-4 rounded border-border text-purple-500" />
                    <Video className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium text-foreground">
                      {{ en: "Recorded Course", "zh-TW": "錄播課程", "zh-CN": "录播课程" }[langKey]}
                    </span>
                  </label>
                  {formData.is_recorded && (
                    <div className="mt-2">
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">{{ en: "Course URL", "zh-TW": "課程網址", "zh-CN": "课程网址" }[langKey]} *</label>
                      <div className="relative">
                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <input value={formData.course_url} onChange={(e) => setFormData({ ...formData, course_url: e.target.value })} placeholder="https://..." className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg text-sm" />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{{ en: "Description (EN)", "zh-TW": "描述 (英文)", "zh-CN": "描述 (英文)" }[langKey]}</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm resize-none" />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{{ en: "Credit Conditions", "zh-TW": "認抵條件", "zh-CN": "认抵条件" }[langKey]}</label>
                  <textarea value={formData.credit_conditions} onChange={(e) => setFormData({ ...formData, credit_conditions: e.target.value })} rows={2} placeholder={{ en: "Conditions for CDU credit recognition...", "zh-TW": "CDU 學分認抵的條件說明...", "zh-CN": "CDU 学分认抵的条件说明..." }[langKey]} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm resize-none" />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{{ en: "Prerequisites", "zh-TW": "先決條件", "zh-CN": "先决条件" }[langKey]}</label>
                  <input value={formData.prerequisites} onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm" />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground">{{ en: "Cancel", "zh-TW": "取消", "zh-CN": "取消" }[langKey]}</button>
                <button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="px-5 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50">
                  {(createMutation.isPending || updateMutation.isPending) ? "..." : editingCourse ? { en: "Update", "zh-TW": "更新", "zh-CN": "更新" }[langKey] : { en: "Create", "zh-TW": "建立", "zh-CN": "创建" }[langKey]}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
