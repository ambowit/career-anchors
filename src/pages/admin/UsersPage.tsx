import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  Mail,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  Upload,
  Trash2,
  X,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation, Language } from "@/hooks/useLanguage";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  stage: string;
  assessments: number;
  lastActive: string;
  mainAnchor: string;
  status: "active" | "pending" | "inactive";
}



const getStages = (language: Language) => {
  const stageMap: Record<Language, string[]> = {
    "zh-CN": ["职场新人", "职场中期", "高管/创业者", "HR/组织发展"],
    "zh-TW": ["職場新人", "職場中期", "高管/創業者", "HR/組織發展"],
    "en": ["Entry Level", "Mid-Career", "Senior/Entrepreneur", "HR/OD Professional"],
  };
  return stageMap[language];
};

const getStatusConfig = (t: (key: string) => string) => ({
  active: { label: t("admin.active"), icon: CheckCircle2, color: "text-green-600", bg: "bg-green-500/10" },
  pending: { label: t("admin.pending"), icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10" },
  inactive: { label: t("admin.inactive"), icon: XCircle, color: "text-muted-foreground", bg: "bg-muted/30" },
});

export default function AdminUsersPage() {
  const { t, language } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ name: "", email: "", stage: "" });
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stages = getStages(language);
  const statusConfig = getStatusConfig(t);

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = !selectedStage || user.stage === selectedStage;
    return matchesSearch && matchesStage;
  });

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) {
      toast.error(language === "en" ? "Please fill in all required fields" : language === "zh-TW" ? "請填寫必填欄位" : "请填写必填字段");
      return;
    }
    
    const newId = `U${Math.floor(Math.random() * 10000)}`;
    const newUserData: User = {
      id: newId,
      name: newUser.name,
      email: newUser.email,
      stage: newUser.stage || stages[0],
      assessments: 0,
      lastActive: new Date().toISOString().slice(0, 16).replace("T", " "),
      mainAnchor: "-",
      status: "pending",
    };
    
    setUsers([newUserData, ...users]);
    setNewUser({ name: "", email: "", stage: "" });
    setShowAddModal(false);
    toast.success(language === "en" ? "User added successfully" : language === "zh-TW" ? "用戶新增成功" : "用户添加成功");
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
    setShowDeleteConfirm(null);
    toast.success(t("admin.deleteSuccess"));
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    // TODO: Implement real CSV parsing and database import
    toast.info(language === "en" ? "CSV import coming soon" : language === "zh-TW" ? "CSV 匯入功能即將推出" : "CSV 导入功能即将推出");
    setIsImporting(false);
    setShowImportModal(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownloadTemplate = () => {
    // Create CSV template
    const csvContent = "Name,Email,Career Stage\nJohn Doe,john@example.com,Entry Level\nJane Smith,jane@example.com,Mid-Career";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "user_import_template.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{t("admin.usersTitle")}</h1>
          <p className="text-muted-foreground">
            {t("admin.usersDesc")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Upload className="w-4 h-4" />
            {t("admin.batchImport")}
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <Download className="w-4 h-4" />
            {t("admin.exportUsers")}
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors"
            style={{ backgroundColor: "hsl(75, 55%, 50%)", color: "hsl(228, 51%, 15%)" }}
          >
            <Plus className="w-4 h-4" />
            {t("admin.addUser")}
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
            placeholder={t("admin.searchUser")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Stage Filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedStage(null)}
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              !selectedStage
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {t("admin.allStages")}
          </button>
          {stages.map((stage) => (
            <button
              key={stage}
              onClick={() => setSelectedStage(stage)}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                selectedStage === stage
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {stage}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{users.length.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">{t("admin.totalUsers")}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{users.filter(u => u.status === "active").length.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">{t("admin.activeUsers")}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-amber-600">{users.filter(u => u.status === "pending").length.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">{t("admin.pendingAssessment")}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">
            {(users.reduce((sum, u) => sum + u.assessments, 0) / Math.max(users.length, 1)).toFixed(1)}
          </div>
          <div className="text-sm text-muted-foreground">{t("admin.avgAssessments")}</div>
        </div>
      </div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("admin.user")}
              </th>
              <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("admin.careerStage")}
              </th>
              <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("admin.mainAnchor")}
              </th>
              <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("admin.assessmentCount")}
              </th>
              <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("admin.status")}
              </th>
              <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("admin.lastActive")}
              </th>
              <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("admin.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredUsers.map((user, index) => {
              const status = statusConfig[user.status];
              const StatusIcon = status.icon;

              return (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-muted/10 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm"
                        style={{ backgroundColor: "hsl(228, 51%, 23%)", color: "white" }}
                      >
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {user.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-foreground">{user.stage}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-foreground">{user.mainAnchor}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-foreground">{user.assessments}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("flex items-center gap-1.5 text-sm", status.color)}>
                      <StatusIcon className="w-4 h-4" />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">{user.lastActive}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        className="p-2 hover:bg-muted/20 rounded-lg transition-colors"
                        title={t("admin.viewDetails")}
                      >
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button 
                        className="p-2 hover:bg-muted/20 rounded-lg transition-colors"
                        title={t("admin.sendEmail")}
                      >
                        <Mail className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(user.id)}
                        className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                        title={t("admin.deleteUser")}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-muted-foreground">
          {t("admin.showing")} 1-{filteredUsers.length} {t("admin.of")} {users.length} {t("admin.items")}
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg">
            {t("admin.prevPage")}
          </button>
          <button className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg">
            1
          </button>
          <button className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg">
            {t("admin.nextPage")}
          </button>
        </div>
      </div>

      {/* Add User Modal */}
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
              className="bg-card border border-border rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">{t("admin.addUserTitle")}</h2>
                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-muted/20 rounded">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t("admin.userName")} *</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t("admin.email")} *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t("admin.careerStage")}</label>
                  <select
                    value={newUser.stage}
                    onChange={(e) => setNewUser({ ...newUser, stage: e.target.value })}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">{t("admin.allStages")}</option>
                    {stages.map((stage) => (
                      <option key={stage} value={stage}>{stage}</option>
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
                  onClick={handleAddUser}
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
                <h2 className="text-lg font-semibold text-foreground">{t("admin.importTitle")}</h2>
                <button 
                  onClick={() => !isImporting && setShowImportModal(false)} 
                  className="p-1 hover:bg-muted/20 rounded"
                  disabled={isImporting}
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                {t("admin.importDesc")}
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
                <h2 className="text-lg font-semibold text-foreground">{t("admin.deleteUser")}</h2>
              </div>
              
              <p className="text-sm text-muted-foreground mb-6">
                {t("admin.deleteConfirm")} {users.find(u => u.id === showDeleteConfirm)?.name}?
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={() => handleDeleteUser(showDeleteConfirm)}
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
