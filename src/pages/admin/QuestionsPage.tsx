import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Copy,
  Eye,
  FileQuestion,
  CheckCircle2,
  XCircle,
  Upload,
  X,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation, Language } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { QUESTIONS_DATA, DIMENSION_NAMES, QuestionData } from "@/data/questions";

const getTypeLabels = (t: (key: string) => string): Record<string, string> => ({
  likert: t("admin.typeLikert"),
});

const getDimensions = (language: Language) => {
  return Object.entries(DIMENSION_NAMES).map(([code, names]) => ({
    code,
    name: names[language],
  }));
};

export default function AdminQuestionsPage() {
  const { t, language } = useTranslation();
  const [questions, setQuestions] = useState<QuestionData[]>(QUESTIONS_DATA);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<QuestionData | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<QuestionData | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newQuestion, setNewQuestion] = useState({
    text: { "zh-CN": "", "zh-TW": "", "en": "" } as Record<Language, string>,
    dimension: "TF",
  });

  const dimensions = getDimensions(language);
  const typeLabels = getTypeLabels(t);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch = q.text[language].toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDimension = !selectedDimension || q.dimension === selectedDimension;
      return matchesSearch && matchesDimension;
    });
  }, [questions, searchQuery, selectedDimension, language]);

  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage]);

  const totalPages = Math.ceil(filteredQuestions.length / pageSize);

  const handleAddQuestion = () => {
    if (!newQuestion.text[language]) {
      toast.error(language === "en" ? "Please fill in question text" : language === "zh-TW" ? "請填寫題目內容" : "请填写题目内容");
      return;
    }
    
    const newId = `Q${String(questions.length + 1).padStart(3, "0")}`;
    
    const newQuestionData: QuestionData = {
      id: newId,
      itemNumber: questions.length + 1,
      text: newQuestion.text,
      type: "likert",
      dimension: newQuestion.dimension,
      weight: 1.4, // Default weight
      status: "draft",
      responses: 0,
      avgTime: "-",
    };
    
    setQuestions([newQuestionData, ...questions]);
    setNewQuestion({ 
      text: { "zh-CN": "", "zh-TW": "", "en": "" }, 
      dimension: "TF",
    });
    setShowAddModal(false);
    toast.success(language === "en" ? "Question added successfully" : language === "zh-TW" ? "題目新增成功" : "题目添加成功");
  };

  const handleEditQuestion = () => {
    if (!editingQuestion) return;
    
    setQuestions(questions.map(q => 
      q.id === editingQuestion.id ? editingQuestion : q
    ));
    setEditingQuestion(null);
    toast.success(language === "en" ? "Question updated successfully" : language === "zh-TW" ? "題目更新成功" : "题目更新成功");
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
    setShowDeleteConfirm(null);
    toast.success(t("admin.deleteQuestionSuccess"));
  };

  const handleDuplicateQuestion = (question: QuestionData) => {
    const newId = `Q${String(questions.length + 1).padStart(3, "0")}`;
    const duplicated: QuestionData = {
      ...question,
      id: newId,
      itemNumber: questions.length + 1,
      status: "draft",
      responses: 0,
      avgTime: "-",
    };
    setQuestions([duplicated, ...questions]);
    toast.success(language === "en" ? "Question duplicated" : language === "zh-TW" ? "題目已複製" : "题目已复制");
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    // TODO: Implement real CSV parsing and question import
    toast.info(language === "en" ? "CSV import coming soon" : language === "zh-TW" ? "CSV 匯入功能即將推出" : "CSV 导入功能即将推出");
    setIsImporting(false);
    setShowImportModal(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "Question_CN,Question_TW,Question_EN,Type,Dimension,Option1_CN,Option1_TW,Option1_EN,Option2_CN,Option2_TW,Option2_EN\n你更倾向于?,你更傾向於?,Which do you prefer?,forced_choice,TF,选项A,選項A,Option A,选项B,選項B,Option B";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "question_import_template.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{t("admin.questionsTitle")}</h1>
          <p className="text-muted-foreground">
            {t("admin.questionsDesc")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Upload className="w-4 h-4" />
            {t("admin.batchImportQuestions")}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors"
            style={{ backgroundColor: "hsl(75, 55%, 50%)", color: "hsl(228, 51%, 15%)" }}
          >
            <Plus className="w-4 h-4" />
            {t("admin.addQuestion")}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("admin.searchQuestion")}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Dimension Filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setSelectedDimension(null); setCurrentPage(1); }}
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              !selectedDimension
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {t("admin.allStages")}
          </button>
          {dimensions.slice(0, 4).map((dim) => (
            <button
              key={dim.code}
              onClick={() => { setSelectedDimension(dim.code); setCurrentPage(1); }}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                selectedDimension === dim.code
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {dim.name.slice(0, 4)}
            </button>
          ))}
          <button className="px-3 py-2 rounded-lg text-sm font-medium bg-card border border-border text-muted-foreground hover:text-foreground flex items-center gap-1">
            <Filter className="w-3 h-3" />
            {t("admin.more")}
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{questions.length}</div>
          <div className="text-sm text-muted-foreground">{t("admin.totalQuestions")}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{questions.filter(q => q.status === "active").length}</div>
          <div className="text-sm text-muted-foreground">{t("admin.enabledQuestions")}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-amber-600">{questions.filter(q => q.status === "draft").length}</div>
          <div className="text-sm text-muted-foreground">{t("admin.draftQuestions")}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">12.5s</div>
          <div className="text-sm text-muted-foreground">{t("admin.avgAnswerTime")}</div>
        </div>
      </div>

      {/* Questions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("admin.question")}
              </th>
              <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("admin.dimension")}
              </th>
              <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {language === "en" ? "Weight" : language === "zh-TW" ? "權重" : "权重"}
              </th>
              <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("admin.status")}
              </th>
              <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("admin.responseCount")}
              </th>
              <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("admin.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedQuestions.map((question, index) => (
              <motion.tr
                key={question.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                className="hover:bg-muted/10 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "hsl(228, 51%, 23%, 0.1)" }}
                    >
                      <FileQuestion className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground line-clamp-1">
                        {question.text[language]}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ID: {question.id}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-foreground">
                    {DIMENSION_NAMES[question.dimension]?.[language] || question.dimension}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-1 rounded text-xs font-medium",
                    question.weight >= 2.0 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                    question.weight >= 1.6 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                    question.weight >= 1.4 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                    "bg-muted/30 text-muted-foreground"
                  )}>
                    ×{question.weight.toFixed(1)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {question.status === "active" ? (
                    <span className="flex items-center gap-1.5 text-green-600 text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      {t("admin.enabled")}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-amber-600 text-sm">
                      <XCircle className="w-4 h-4" />
                      {t("admin.draft")}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-foreground">
                    {question.responses.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => setShowPreview(question)}
                      className="p-2 hover:bg-muted/20 rounded-lg transition-colors"
                      title={t("admin.preview")}
                    >
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button 
                      onClick={() => setEditingQuestion(question)}
                      className="p-2 hover:bg-muted/20 rounded-lg transition-colors"
                      title={t("admin.edit")}
                    >
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button 
                      onClick={() => handleDuplicateQuestion(question)}
                      className="p-2 hover:bg-muted/20 rounded-lg transition-colors"
                      title={t("admin.duplicate")}
                    >
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button 
                      onClick={() => setShowDeleteConfirm(question.id)}
                      className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                      title={t("admin.delete")}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-muted-foreground">
          {t("admin.showing")} {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredQuestions.length)} {t("admin.of")} {filteredQuestions.length} {t("admin.items")}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg disabled:opacity-50"
          >
            {t("admin.prevPage")}
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum = i + 1;
            if (totalPages > 5) {
              if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
            }
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-lg",
                  currentPage === pageNum
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground border border-border"
                )}
              >
                {pageNum}
              </button>
            );
          })}
          {totalPages > 5 && currentPage < totalPages - 2 && (
            <>
              <span className="text-muted-foreground">...</span>
              <button
                onClick={() => setCurrentPage(totalPages)}
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg"
              >
                {totalPages}
              </button>
            </>
          )}
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg disabled:opacity-50"
          >
            {t("admin.nextPage")}
          </button>
        </div>
      </div>

      {/* Add Question Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">{t("admin.addQuestionTitle")}</h2>
                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-muted/20 rounded">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t("admin.questionText")} (简体中文) *</label>
                  <textarea
                    value={newQuestion.text["zh-CN"]}
                    onChange={(e) => setNewQuestion({ ...newQuestion, text: { ...newQuestion.text, "zh-CN": e.target.value } })}
                    rows={2}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t("admin.questionText")} (繁體中文)</label>
                  <textarea
                    value={newQuestion.text["zh-TW"]}
                    onChange={(e) => setNewQuestion({ ...newQuestion, text: { ...newQuestion.text, "zh-TW": e.target.value } })}
                    rows={2}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t("admin.questionText")} (English)</label>
                  <textarea
                    value={newQuestion.text["en"]}
                    onChange={(e) => setNewQuestion({ ...newQuestion, text: { ...newQuestion.text, "en": e.target.value } })}
                    rows={2}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t("admin.questionDimension")}</label>
                  <select
                    value={newQuestion.dimension}
                    onChange={(e) => setNewQuestion({ ...newQuestion, dimension: e.target.value })}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {dimensions.map((dim) => (
                      <option key={dim.code} value={dim.code}>{dim.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleAddQuestion}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                  style={{ backgroundColor: "hsl(75, 55%, 50%)", color: "hsl(228, 51%, 15%)" }}
                >
                  {t("common.confirm")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Question Modal */}
      <AnimatePresence>
        {editingQuestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setEditingQuestion(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">{t("admin.editQuestionTitle")}</h2>
                <button onClick={() => setEditingQuestion(null)} className="p-1 hover:bg-muted/20 rounded">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t("admin.questionText")} (简体中文) *</label>
                  <textarea
                    value={editingQuestion.text["zh-CN"]}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, text: { ...editingQuestion.text, "zh-CN": e.target.value } })}
                    rows={2}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t("admin.questionText")} (繁體中文)</label>
                  <textarea
                    value={editingQuestion.text["zh-TW"]}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, text: { ...editingQuestion.text, "zh-TW": e.target.value } })}
                    rows={2}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t("admin.questionText")} (English)</label>
                  <textarea
                    value={editingQuestion.text["en"]}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, text: { ...editingQuestion.text, "en": e.target.value } })}
                    rows={2}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t("admin.questionDimension")}</label>
                  <select
                    value={editingQuestion.dimension}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, dimension: e.target.value })}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {dimensions.map((dim) => (
                      <option key={dim.code} value={dim.code}>{dim.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t("admin.status")}</label>
                  <select
                    value={editingQuestion.status}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, status: e.target.value as "active" | "draft" })}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="active">{t("admin.enabled")}</option>
                    <option value="draft">{t("admin.draft")}</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleEditQuestion}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                  style={{ backgroundColor: "hsl(75, 55%, 50%)", color: "hsl(228, 51%, 15%)" }}
                >
                  {t("common.save")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowPreview(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">{t("admin.preview")}</h2>
                <button onClick={() => setShowPreview(null)} className="p-1 hover:bg-muted/20 rounded">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  ID: {showPreview.id} | {DIMENSION_NAMES[showPreview.dimension]?.[language]} | {language === "en" ? "Weight" : language === "zh-TW" ? "權重" : "权重"}: ×{showPreview.weight.toFixed(1)}
                </div>
                <p className="text-foreground font-medium">{showPreview.text[language]}</p>
                
                
                
                {showPreview.type === "likert" && (
                  <div className="space-y-2">
                    {["完全不符合", "有点符合", "比较符合", "非常符合"].map((label, idx) => (
                      <div 
                        key={idx}
                        className="p-3 border border-border rounded-lg text-sm text-foreground hover:bg-muted/10 cursor-pointer flex items-center gap-3"
                      >
                        <span className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-xs">{idx}</span>
                        {language === "en" 
                          ? ["Not true for me", "Slightly true for me", "Mostly true for me", "Very true for me"][idx]
                          : label
                        }
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => !isImporting && setShowImportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">{t("admin.importQuestionsTitle")}</h2>
                <button 
                  onClick={() => !isImporting && setShowImportModal(false)} 
                  className="p-1 hover:bg-muted/20 rounded"
                  disabled={isImporting}
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                {t("admin.importQuestionsDesc")}
              </p>
              
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 text-sm text-primary hover:underline mb-4"
              >
                <FileSpreadsheet className="w-4 h-4" />
                {t("admin.downloadTemplate")}
              </button>
              
              <label className="block">
                <div className={cn(
                  "border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors",
                  isImporting && "opacity-50 pointer-events-none"
                )}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleImport}
                    className="hidden"
                    disabled={isImporting}
                  />
                  {isImporting ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-muted-foreground">{t("admin.importing")}</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-foreground">{t("admin.dragOrClick")}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t("admin.supportFormat")}</p>
                    </>
                  )}
                </div>
              </label>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">{t("admin.delete")}</h2>
              </div>
              
              <p className="text-sm text-muted-foreground mb-6">
                {t("admin.deleteQuestionConfirm")}
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={() => handleDeleteQuestion(showDeleteConfirm)}
                  className="px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90"
                >
                  {t("admin.delete")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
