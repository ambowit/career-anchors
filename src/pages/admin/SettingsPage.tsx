import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Save, 
  Bell, 
  Database,
  Globe,
  Clock,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useLanguage";

export default function AdminSettingsPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    systemName: "SCPC Career Anchors",
    minQuestions: 18,
    maxQuestions: 28,
    sessionTimeout: 30,
    emailNotifications: true,
    weeklyReport: true,
    maintenanceMode: false,
  });

  const handleSave = () => {
    toast.success(t("admin.settingsSaved"));
  };

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{t("admin.settingsTitle")}</h1>
          <p className="text-muted-foreground">
            {t("admin.settingsDesc")}
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors"
          style={{ backgroundColor: "hsl(75, 55%, 50%)", color: "hsl(228, 51%, 15%)" }}
        >
          <Save className="w-4 h-4" />
          {t("admin.saveSettings")}
        </button>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "hsl(228, 51%, 23%, 0.1)" }}
            >
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{t("admin.generalSettings")}</h3>
              <p className="text-sm text-muted-foreground">{t("admin.generalSettingsDesc")}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t("admin.systemName")}
              </label>
              <input
                type="text"
                value={settings.systemName}
                onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("admin.minQuestions")}
                </label>
                <input
                  type="number"
                  value={settings.minQuestions}
                  onChange={(e) => setSettings({ ...settings, minQuestions: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("admin.maxQuestions")}
                </label>
                <input
                  type="number"
                  value={settings.maxQuestions}
                  onChange={(e) => setSettings({ ...settings, maxQuestions: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Session Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "hsl(75, 55%, 50%, 0.15)" }}
            >
              <Clock className="w-5 h-5" style={{ color: "hsl(75, 55%, 45%)" }} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{t("admin.sessionSettings")}</h3>
              <p className="text-sm text-muted-foreground">{t("admin.sessionSettingsDesc")}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t("admin.sessionTimeout")}
            </label>
            <input
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
              className="w-full max-w-xs px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {t("admin.sessionTimeoutDesc")}
            </p>
          </div>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "hsl(200, 80%, 50%, 0.15)" }}
            >
              <Bell className="w-5 h-5" style={{ color: "hsl(200, 80%, 45%)" }} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{t("admin.notificationSettings")}</h3>
              <p className="text-sm text-muted-foreground">{t("admin.notificationSettingsDesc")}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-background rounded-lg">
              <div>
                <div className="font-medium text-foreground">{t("admin.emailNotifications")}</div>
                <div className="text-sm text-muted-foreground">
                  {t("admin.emailNotificationsDesc")}
                </div>
              </div>
              <button
                onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative",
                  settings.emailNotifications ? "bg-primary" : "bg-muted"
                )}
              >
                <div
                  className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                    settings.emailNotifications ? "translate-x-7" : "translate-x-1"
                  )}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-background rounded-lg">
              <div>
                <div className="font-medium text-foreground">{t("admin.weeklyReport")}</div>
                <div className="text-sm text-muted-foreground">
                  {t("admin.weeklyReportDesc")}
                </div>
              </div>
              <button
                onClick={() => setSettings({ ...settings, weeklyReport: !settings.weeklyReport })}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative",
                  settings.weeklyReport ? "bg-primary" : "bg-muted"
                )}
              >
                <div
                  className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                    settings.weeklyReport ? "translate-x-7" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Maintenance Mode */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "hsl(0, 60%, 50%, 0.15)" }}
            >
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{t("admin.maintenanceMode")}</h3>
              <p className="text-sm text-muted-foreground">{t("admin.maintenanceModeDesc")}</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
            <div>
              <div className="font-medium text-foreground">{t("admin.enableMaintenance")}</div>
              <div className="text-sm text-muted-foreground">
                {t("admin.enableMaintenanceDesc")}
              </div>
            </div>
            <button
              onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative",
                settings.maintenanceMode ? "bg-destructive" : "bg-muted"
              )}
            >
              <div
                className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                  settings.maintenanceMode ? "translate-x-7" : "translate-x-1"
                )}
              />
            </button>
          </div>
        </motion.div>

        {/* Database Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "hsl(280, 60%, 55%, 0.15)" }}
            >
              <Database className="w-5 h-5" style={{ color: "hsl(280, 60%, 50%)" }} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{t("admin.databaseInfo")}</h3>
              <p className="text-sm text-muted-foreground">{t("admin.databaseInfoDesc")}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-background rounded-lg">
              <div className="text-2xl font-bold text-foreground">12,847</div>
              <div className="text-sm text-muted-foreground">{t("admin.userRecords")}</div>
            </div>
            <div className="p-4 bg-background rounded-lg">
              <div className="text-2xl font-bold text-foreground">28,543</div>
              <div className="text-sm text-muted-foreground">{t("admin.assessmentRecords")}</div>
            </div>
            <div className="p-4 bg-background rounded-lg">
              <div className="text-2xl font-bold text-foreground">156</div>
              <div className="text-sm text-muted-foreground">{t("admin.totalQuestionsCount")}</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
