import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Edit3,
  ExternalLink,
  FileText,
  Loader2,
  X,
  Package,
  Link2,
  Send,
  ArrowDownCircle,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TXT = {
  en: {
    title: "Product Management",
    desc: "Manage your products for the platform",
    addProduct: "Add Product",
    search: "Search products...",
    noProducts: "No products yet",
    noProductsDesc: "Add your first product to get started",
    name: "Product Name",
    type: "Type",
    price: "Price (CP)",
    status: "Status",
    sales: "Sales",
    revenue: "Revenue",
    actions: "Actions",
    document: "Document",
    link: "Link",
    draft: "Draft",
    pending: "Pending Review",
    approved: "Approved",
    rejected: "Rejected",
    suspended: "Suspended",
    offline: "Offline",
    split: "Revenue Split",
    platformShare: "Platform",
    partnerShare: "Partner",
    formTitle: "Product Details",
    nameZhTw: "Name (繁體)",
    nameZhCn: "Name (簡體)",
    nameEn: "Name (English)",
    descZhTw: "Description (繁體)",
    descZhCn: "Description (簡體)",
    descEn: "Description (English)",
    productType: "Product Type",
    cpPrice: "CP Price",
    externalUrl: "External URL",
    documentUrl: "Document URL",
    save: "Save Draft",
    cancel: "Cancel",
    saved: "Product saved",
    error: "An error occurred",
    docSplit: "Document: 50% platform / 50% partner",
    linkSplit: "Link: 30% platform / 70% partner",
    submitForReview: "Submit for Review",
    submitConfirm: "Submit this product for review?",
    submitted: "Product submitted for review",
    takeOffline: "Take Offline",
    offlineConfirm: "Take this product offline?",
    takenOffline: "Product taken offline",
    resubmit: "Edit & Resubmit",
    editLocked: "Approved products cannot be edited directly. Take offline first to make changes.",
    rejectedNote: "This product was rejected. Edit and resubmit for review.",
    categoryTags: "Category Tags",
    targetAudience: "Target Audience",
    coverImage: "Cover Image URL",
    authorizationCode: "Authorization Code",
    settlementDesc: "Settlement Description",
  },
  "zh-TW": {
    title: "產品管理",
    desc: "管理您在平台上的產品",
    addProduct: "新增產品",
    search: "搜尋產品...",
    noProducts: "尚無產品",
    noProductsDesc: "新增您的第一個產品",
    name: "產品名稱",
    type: "類型",
    price: "價格 (CP)",
    status: "狀態",
    sales: "銷量",
    revenue: "收入",
    actions: "操作",
    document: "文檔",
    link: "連結",
    draft: "草稿",
    pending: "待審核",
    approved: "已通過",
    rejected: "已駁回",
    suspended: "已暫停",
    offline: "已下架",
    split: "分潤比例",
    platformShare: "平台",
    partnerShare: "合作方",
    formTitle: "產品詳情",
    nameZhTw: "名稱 (繁體)",
    nameZhCn: "名稱 (簡體)",
    nameEn: "名稱 (English)",
    descZhTw: "說明 (繁體)",
    descZhCn: "說明 (簡體)",
    descEn: "說明 (English)",
    productType: "產品類型",
    cpPrice: "CP 定價",
    externalUrl: "外部連結",
    documentUrl: "文檔連結",
    save: "儲存草稿",
    cancel: "取消",
    saved: "產品已儲存",
    error: "發生錯誤",
    docSplit: "文檔型：平台 50% / 合作方 50%",
    linkSplit: "連結型：平台 30% / 合作方 70%",
    submitForReview: "提交審核",
    submitConfirm: "確認提交此產品進行審核？",
    submitted: "產品已提交審核",
    takeOffline: "下架",
    offlineConfirm: "確認將此產品下架？",
    takenOffline: "產品已下架",
    resubmit: "編輯並重新提交",
    editLocked: "已通過的產品無法直接編輯，請先下架再進行修改。",
    rejectedNote: "此產品已被駁回，請修改後重新提交審核。",
    categoryTags: "分類標籤",
    targetAudience: "適用人群",
    coverImage: "封面圖片連結",
    authorizationCode: "授權編號",
    settlementDesc: "結算說明",
  },
  "zh-CN": {
    title: "产品管理",
    desc: "管理您在平台上的产品",
    addProduct: "新增产品",
    search: "搜索产品...",
    noProducts: "暂无产品",
    noProductsDesc: "新增您的第一个产品",
    name: "产品名称",
    type: "类型",
    price: "价格 (CP)",
    status: "状态",
    sales: "销量",
    revenue: "收入",
    actions: "操作",
    document: "文档",
    link: "链接",
    draft: "草稿",
    pending: "待审核",
    approved: "已通过",
    rejected: "已驳回",
    suspended: "已暂停",
    offline: "已下架",
    split: "分润比例",
    platformShare: "平台",
    partnerShare: "合作方",
    formTitle: "产品详情",
    nameZhTw: "名称 (繁體)",
    nameZhCn: "名称 (简体)",
    nameEn: "名称 (English)",
    descZhTw: "说明 (繁體)",
    descZhCn: "说明 (简体)",
    descEn: "说明 (English)",
    productType: "产品类型",
    cpPrice: "CP 定价",
    externalUrl: "外部链接",
    documentUrl: "文档链接",
    save: "保存草稿",
    cancel: "取消",
    saved: "产品已保存",
    error: "发生错误",
    docSplit: "文档型：平台 50% / 合作方 50%",
    linkSplit: "链接型：平台 30% / 合作方 70%",
    submitForReview: "提交审核",
    submitConfirm: "确认提交此产品进行审核？",
    submitted: "产品已提交审核",
    takeOffline: "下架",
    offlineConfirm: "确认将此产品下架？",
    takenOffline: "产品已下架",
    resubmit: "编辑并重新提交",
    editLocked: "已通过的产品无法直接编辑，请先下架再进行修改。",
    rejectedNote: "此产品已被驳回，请修改后重新提交审核。",
    categoryTags: "分类标签",
    targetAudience: "适用人群",
    coverImage: "封面图片链接",
    authorizationCode: "授权编号",
    settlementDesc: "结算说明",
  },
} as const;

const STATUS_CONFIG: Record<string, { color: string; icon: React.ComponentType<any> }> = {
  draft: { color: "border-slate-200 text-slate-600 bg-slate-50", icon: Clock },
  pending: { color: "border-amber-200 text-amber-700 bg-amber-50", icon: Clock },
  approved: { color: "border-emerald-200 text-emerald-700 bg-emerald-50", icon: CheckCircle2 },
  rejected: { color: "border-red-200 text-red-700 bg-red-50", icon: XCircle },
  suspended: { color: "border-slate-200 text-slate-700 bg-slate-50", icon: Ban },
  offline: { color: "border-gray-200 text-gray-600 bg-gray-50", icon: ArrowDownCircle },
};

interface ProductForm {
  product_name_zh_tw: string;
  product_name_zh_cn: string;
  product_name_en: string;
  description_zh_tw: string;
  description_zh_cn: string;
  description_en: string;
  product_type: "document" | "link";
  cp_price: number;
  external_url: string;
  document_url: string;
}

const emptyForm: ProductForm = {
  product_name_zh_tw: "",
  product_name_zh_cn: "",
  product_name_en: "",
  description_zh_tw: "",
  description_zh_cn: "",
  description_en: "",
  product_type: "document",
  cp_price: 0,
  external_url: "",
  document_url: "",
};

// Status flow: which statuses allow editing
const EDITABLE_STATUSES = new Set(["draft", "rejected", "offline"]);

// Status flow: which statuses allow submission for review
const SUBMITTABLE_STATUSES = new Set(["draft", "rejected", "offline"]);

// Status flow: which statuses allow taking offline
const OFFLINEABLE_STATUSES = new Set(["approved", "suspended"]);

export default function PartnerProductsPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const textContent = TXT[language] || TXT["zh-TW"];

  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  // Get partner ID
  const { data: partner } = useQuery({
    queryKey: ["partner-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("product_partners")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Get products
  const { data: products, isLoading } = useQuery({
    queryKey: ["partner-products", partner?.id],
    queryFn: async () => {
      if (!partner?.id) return [];
      const { data, error } = await supabase
        .from("partner_products")
        .select("*")
        .eq("partner_id", partner.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!partner?.id,
  });

  // Save mutation (creates as draft, or updates draft/rejected/offline)
  const saveMutation = useMutation({
    mutationFn: async (formData: ProductForm & { id?: string }) => {
      const revenueSplit = formData.product_type === "document"
        ? { revenue_split_platform: 0.50, revenue_split_partner: 0.50 }
        : { revenue_split_platform: 0.30, revenue_split_partner: 0.70 };

      const payload = {
        partner_id: partner!.id,
        product_name_zh_tw: formData.product_name_zh_tw,
        product_name_zh_cn: formData.product_name_zh_cn || formData.product_name_zh_tw,
        product_name_en: formData.product_name_en || formData.product_name_zh_tw,
        description_zh_tw: formData.description_zh_tw || null,
        description_zh_cn: formData.description_zh_cn || null,
        description_en: formData.description_en || null,
        product_type: formData.product_type,
        cp_price: formData.cp_price,
        external_url: formData.product_type === "link" ? formData.external_url : null,
        document_url: formData.product_type === "document" ? formData.document_url : null,
        ...revenueSplit,
      };

      if (formData.id) {
        const { error } = await supabase
          .from("partner_products")
          .update(payload)
          .eq("id", formData.id);
        if (error) throw error;
      } else {
        // New products start as draft
        const { error } = await supabase
          .from("partner_products")
          .insert({ ...payload, review_status: "draft" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-products"] });
      toast.success(textContent.saved);
      setShowForm(false);
      setEditingProduct(null);
      setForm(emptyForm);
    },
    onError: () => toast.error(textContent.error),
  });

  // Submit for review mutation
  const submitMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from("partner_products")
        .update({ review_status: "pending" })
        .eq("id", productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-products"] });
      toast.success(textContent.submitted);
    },
    onError: () => toast.error(textContent.error),
  });

  // Take offline mutation
  const offlineMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from("partner_products")
        .update({ review_status: "offline", is_active: false })
        .eq("id", productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-products"] });
      toast.success(textContent.takenOffline);
    },
    onError: () => toast.error(textContent.error),
  });

  function handleEdit(product: Record<string, unknown>) {
    const status = (product.review_status as string) || "draft";

    // Block editing for approved/pending products
    if (!EDITABLE_STATUSES.has(status)) {
      toast.error(textContent.editLocked);
      return;
    }

    setEditingProduct(product.id as string);
    setForm({
      product_name_zh_tw: (product.product_name_zh_tw as string) || "",
      product_name_zh_cn: (product.product_name_zh_cn as string) || "",
      product_name_en: (product.product_name_en as string) || "",
      description_zh_tw: (product.description_zh_tw as string) || "",
      description_zh_cn: (product.description_zh_cn as string) || "",
      description_en: (product.description_en as string) || "",
      product_type: (product.product_type as "document" | "link") || "document",
      cp_price: (product.cp_price as number) || 0,
      external_url: (product.external_url as string) || "",
      document_url: (product.document_url as string) || "",
    });
    setShowForm(true);
  }

  function handleSubmitForReview(productId: string) {
    if (confirm(textContent.submitConfirm)) {
      submitMutation.mutate(productId);
    }
  }

  function handleTakeOffline(productId: string) {
    if (confirm(textContent.offlineConfirm)) {
      offlineMutation.mutate(productId);
    }
  }

  function handleSave() {
    if (!form.product_name_zh_tw || form.cp_price <= 0) {
      toast.error(textContent.error);
      return;
    }
    saveMutation.mutate({ ...form, id: editingProduct || undefined });
  }

  const filtered = (products || []).filter((product) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      product.product_name_zh_tw?.toLowerCase().includes(searchLower) ||
      product.product_name_en?.toLowerCase().includes(searchLower)
    );
  });

  function getProductName(product: Record<string, unknown>): string {
    if (language === "en") return (product.product_name_en as string) || (product.product_name_zh_tw as string);
    if (language === "zh-CN") return (product.product_name_zh_cn as string) || (product.product_name_zh_tw as string);
    return product.product_name_zh_tw as string;
  }

  function getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      draft: textContent.draft,
      pending: textContent.pending,
      approved: textContent.approved,
      rejected: textContent.rejected,
      suspended: textContent.suspended,
      offline: textContent.offline,
    };
    return map[status] || status;
  }

  const inputClass = "w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{textContent.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{textContent.desc}</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setEditingProduct(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:shadow-md"
          style={{ backgroundColor: "#1a3a5c" }}
        >
          <Plus className="w-4 h-4" />
          {textContent.addProduct}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder={textContent.search}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30"
        />
      </div>

      {/* Products list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 text-slate-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-600">{textContent.noProducts}</h3>
          <p className="text-xs text-slate-400 mt-1">{textContent.noProductsDesc}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">{textContent.name}</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">{textContent.type}</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">{textContent.price}</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">{textContent.split}</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">{textContent.status}</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">{textContent.sales}</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">{textContent.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
                  const status = product.review_status || "draft";
                  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
                  const StatusIcon = statusConfig.icon;
                  const canEdit = EDITABLE_STATUSES.has(status);
                  const canSubmit = SUBMITTABLE_STATUSES.has(status);
                  const canOffline = OFFLINEABLE_STATUSES.has(status);

                  return (
                    <tr key={product.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-slate-800">{getProductName(product)}</span>
                          {status === "rejected" && product.review_comment && (
                            <span className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                              <AlertTriangle className="w-3 h-3" />
                              {product.review_comment}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {product.product_type === "document" ? (
                            <FileText className="w-3.5 h-3.5 text-sky-500" />
                          ) : (
                            <Link2 className="w-3.5 h-3.5 text-violet-500" />
                          )}
                          <span className="text-slate-600">
                            {product.product_type === "document" ? textContent.document : textContent.link}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{product.cp_price} CP</td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {Math.round(Number(product.revenue_split_platform) * 100)}% / {Math.round(Number(product.revenue_split_partner) * 100)}%
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn("text-xs flex items-center gap-1 w-fit", statusConfig.color)}>
                          <StatusIcon className="w-3 h-3" />
                          {getStatusLabel(status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{product.total_sales || 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {/* Edit button - only for editable statuses */}
                          {canEdit && (
                            <button
                              onClick={() => handleEdit(product)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
                              title={textContent.resubmit}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Submit for review - only for draft/rejected/offline */}
                          {canSubmit && (
                            <button
                              onClick={() => handleSubmitForReview(product.id)}
                              disabled={submitMutation.isPending}
                              className="p-1.5 rounded-lg hover:bg-sky-50 transition-colors text-sky-500 hover:text-sky-700"
                              title={textContent.submitForReview}
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}

                          {/* Take offline - only for approved/suspended */}
                          {canOffline && (
                            <button
                              onClick={() => handleTakeOffline(product.id)}
                              disabled={offlineMutation.isPending}
                              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-slate-400 hover:text-red-600"
                              title={textContent.takeOffline}
                            >
                              <ArrowDownCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* For approved products - show locked hint on edit attempt */}
                          {status === "approved" && (
                            <button
                              onClick={() => toast.error(textContent.editLocked)}
                              className="p-1.5 rounded-lg text-slate-300 cursor-not-allowed"
                              title={textContent.editLocked}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">{textContent.formTitle}</h3>
                <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-slate-100">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Show rejected note banner */}
              {editingProduct && (products || []).find((p) => p.id === editingProduct)?.review_status === "rejected" && (
                <div className="mx-6 mt-4 px-4 py-2.5 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-600">{textContent.rejectedNote}</p>
                </div>
              )}

              <div className="px-6 py-5 space-y-4">
                {/* Product type */}
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">{textContent.productType}</label>
                  <div className="flex gap-3">
                    {(["document", "link"] as const).map((typeOption) => (
                      <button
                        key={typeOption}
                        onClick={() => setForm((prev) => ({ ...prev, product_type: typeOption }))}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all",
                          form.product_type === typeOption
                            ? "border-sky-300 bg-sky-50 text-sky-700"
                            : "border-slate-200 text-slate-500 hover:bg-slate-50"
                        )}
                      >
                        {typeOption === "document" ? <FileText className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                        {typeOption === "document" ? textContent.document : textContent.link}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    {form.product_type === "document" ? textContent.docSplit : textContent.linkSplit}
                  </p>
                </div>

                {/* Names */}
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">{textContent.nameZhTw} <span className="text-red-400">*</span></label>
                  <input className={inputClass} value={form.product_name_zh_tw} onChange={(event) => setForm((prev) => ({ ...prev, product_name_zh_tw: event.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">{textContent.nameZhCn}</label>
                    <input className={inputClass} value={form.product_name_zh_cn} onChange={(event) => setForm((prev) => ({ ...prev, product_name_zh_cn: event.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">{textContent.nameEn}</label>
                    <input className={inputClass} value={form.product_name_en} onChange={(event) => setForm((prev) => ({ ...prev, product_name_en: event.target.value }))} />
                  </div>
                </div>

                {/* CP Price */}
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">{textContent.cpPrice} <span className="text-red-400">*</span></label>
                  <input type="number" className={inputClass} value={form.cp_price || ""} onChange={(event) => setForm((prev) => ({ ...prev, cp_price: Number(event.target.value) }))} />
                </div>

                {/* URL fields */}
                {form.product_type === "link" && (
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">{textContent.externalUrl}</label>
                    <input className={inputClass} value={form.external_url} onChange={(event) => setForm((prev) => ({ ...prev, external_url: event.target.value }))} placeholder="https://..." />
                  </div>
                )}
                {form.product_type === "document" && (
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">{textContent.documentUrl}</label>
                    <input className={inputClass} value={form.document_url} onChange={(event) => setForm((prev) => ({ ...prev, document_url: event.target.value }))} placeholder="https://..." />
                  </div>
                )}

                {/* Descriptions */}
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">{textContent.descZhTw}</label>
                  <textarea className={cn(inputClass, "min-h-[60px]")} value={form.description_zh_tw} onChange={(event) => setForm((prev) => ({ ...prev, description_zh_tw: event.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">{textContent.descZhCn}</label>
                    <textarea className={cn(inputClass, "min-h-[60px]")} value={form.description_zh_cn} onChange={(event) => setForm((prev) => ({ ...prev, description_zh_cn: event.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">{textContent.descEn}</label>
                    <textarea className={cn(inputClass, "min-h-[60px]")} value={form.description_en} onChange={(event) => setForm((prev) => ({ ...prev, description_en: event.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  {textContent.cancel}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-md disabled:opacity-50"
                  style={{ backgroundColor: "#1a3a5c" }}
                >
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : textContent.save}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
