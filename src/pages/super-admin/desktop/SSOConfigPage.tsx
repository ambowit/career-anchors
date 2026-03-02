import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Globe, CheckCircle2, XCircle, Edit, Trash2, X, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { useSSOConfigurations } from "@/hooks/useAdminData";

const providerIcons: Record<string, string> = {
  azure_ad: "🔵",
  google_workspace: "🟢",
  okta: "🟣",
  custom_oidc: "⚙️",
  custom_saml: "🔐",
};

export default function SSOConfigPage() {
  const { language } = useTranslation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newConfig, setNewConfig] = useState({ orgId: "", providerType: "azure_ad", clientId: "", metadataUrl: "", domains: "" });

  const { data: ssoConfigs, isLoading } = useSSOConfigurations();
  const configs = ssoConfigs || [];

  const handleAddSSO = () => {
    toast.success(language === "en" ? "SSO configuration saved" : language === "zh-TW" ? "SSO 設定已儲存" : "SSO 配置已保存");
    setShowAddModal(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeSSOCount = configs.filter(s => s.is_active).length;
  const domainCount = configs.reduce((sum, c) => {
    const domains = c.domain_mapping;
    if (Array.isArray(domains)) return sum + domains.length;
    if (typeof domains === "string") return sum + domains.split(",").filter(Boolean).length;
    return sum;
  }, 0);
  const providerTypes = new Set(configs.map(s => s.provider_type)).size;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">{language === "en" ? "SSO Configuration" : language === "zh-TW" ? "SSO 設定" : "SSO 配置"}</h1>
          <p className="text-sm text-muted-foreground">{language === "en" ? "Manage Single Sign-On providers and domain mappings" : language === "zh-TW" ? "管理單點登入提供商和域名映射" : "管理单点登录提供商和域名映射"}</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" />
          {language === "en" ? "Add SSO Config" : language === "zh-TW" ? "新增 SSO 設定" : "新增 SSO 配置"}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{configs.length}</div>
          <div className="text-xs text-muted-foreground">{language === "en" ? "Total Configs" : language === "zh-TW" ? "設定總數" : "配置总数"}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{activeSSOCount}</div>
          <div className="text-xs text-muted-foreground">{language === "en" ? "Active" : language === "zh-TW" ? "已啟用" : "已启用"}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{domainCount}</div>
          <div className="text-xs text-muted-foreground">{language === "en" ? "Mapped Domains" : "映射域名"}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{providerTypes}</div>
          <div className="text-xs text-muted-foreground">{language === "en" ? "Provider Types" : language === "zh-TW" ? "提供商類型" : "提供商类型"}</div>
        </div>
      </div>

      <div className="space-y-4">
        {configs.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center text-sm text-muted-foreground">
            {language === "en" ? "No SSO configurations found" : language === "zh-TW" ? "暫無 SSO 設定" : "暂无 SSO 配置"}
          </div>
        ) : configs.map((config, index) => {
          const domains = Array.isArray(config.domain_mapping) ? config.domain_mapping : (typeof config.domain_mapping === "string" ? config.domain_mapping.split(",").map((d: string) => d.trim()).filter(Boolean) : []);
          return (
            <motion.div key={config.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{providerIcons[config.provider_type] || "🔑"}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{config.orgName}</span>
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${config.is_active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                        {config.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {config.is_active ? (language === "en" ? "Active" : language === "zh-TW" ? "已啟用" : "已启用") : (language === "en" ? "Disabled" : "已禁用")}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5">{config.provider_name || config.provider_type}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-muted/20 rounded-lg"><Edit className="w-4 h-4 text-muted-foreground" /></button>
                  <button className="p-2 hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4 text-destructive" /></button>
                </div>
              </div>
              {domains.length > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                  <div className="flex gap-2">
                    {domains.map((domain: string) => (
                      <span key={domain} className="text-xs px-2 py-0.5 rounded bg-muted/30 text-muted-foreground">{domain}</span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card border border-border rounded-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">{language === "en" ? "Configure SSO Provider" : language === "zh-TW" ? "設定 SSO 提供商" : "配置 SSO 提供商"}</h2>
                <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">{language === "en" ? "Provider Type" : language === "zh-TW" ? "提供商類型" : "提供商类型"}</label>
                  <select value={newConfig.providerType} onChange={(e) => setNewConfig({ ...newConfig, providerType: e.target.value })} className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm">
                    <option value="azure_ad">Azure AD</option>
                    <option value="google_workspace">Google Workspace</option>
                    <option value="okta">Okta</option>
                    <option value="custom_oidc">Custom OIDC</option>
                    <option value="custom_saml">Custom SAML 2.0</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Client ID</label>
                  <input type="text" value={newConfig.clientId} onChange={(e) => setNewConfig({ ...newConfig, clientId: e.target.value })} className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm" placeholder="your-client-id" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Metadata URL</label>
                  <input type="url" value={newConfig.metadataUrl} onChange={(e) => setNewConfig({ ...newConfig, metadataUrl: e.target.value })} className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm" placeholder="https://login.microsoftonline.com/.well-known/openid-configuration" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{language === "en" ? "Domain Mapping (comma-separated)" : language === "zh-TW" ? "域名映射（逗號分隔）" : "域名映射（逗号分隔）"}</label>
                  <input type="text" value={newConfig.domains} onChange={(e) => setNewConfig({ ...newConfig, domains: e.target.value })} className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm" placeholder="example.com, example.co.uk" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-muted-foreground">{language === "en" ? "Cancel" : "取消"}</button>
                <button onClick={handleAddSSO} className="px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg">{language === "en" ? "Save" : language === "zh-TW" ? "儲存" : "保存"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
