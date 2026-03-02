import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Package,
  Search,
  Loader2,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  FileText,
  Link2,
  ExternalLink,
  Users,
  Eye,
  Plus,
  UserPlus,
  Unlink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TXT = {
  en: {
    pageTitle: "Partner Review",
    pageDesc: "Review partner applications and product listings",
    // Tabs
    tabPartners: "Partner Accounts",
    tabProducts: "Product Listings",
    // Partner section
    totalPartners: "Total",
    pendingPartners: "Pending",
    approvedPartners: "Approved",
    rejectedPartners: "Rejected",
    companyName: "Company Name",
    contactName: "Contact",
    contactEmail: "Email",
    status: "Status",
    submittedDate: "Submitted",
    actions: "Actions",
    searchPartners: "Search by company or email...",
    noPartners: "No partner applications",
    // Partner review modal
    reviewPartner: "Review Partner Application",
    companyInfo: "Company Information",
    contactInfo: "Contact Information",
    approvalNotes: "Notes",
    approvalNotesPlaceholder: "Add notes about this review decision...",
    approve: "Approve",
    reject: "Reject",
    cancel: "Cancel",
    // Product section
    totalProducts: "Total",
    pendingProducts: "Pending",
    approvedProducts: "Approved",
    rejectedProducts: "Rejected",
    productName: "Product Name",
    partnerName: "Partner",
    productType: "Type",
    cpPrice: "CP Price",
    revenueSplit: "Split",
    reviewStatus: "Status",
    searchProducts: "Search by product or partner...",
    noProducts: "No product listings",
    // Product review modal
    reviewProduct: "Review Product",
    productDetails: "Product Details",
    partnerInfo: "Partner Info",
    typeDocument: "Document",
    typeLink: "Link",
    reviewNotes: "Review Notes",
    reviewNotesPlaceholder: "Add review notes...",
    suspend: "Suspend",
    // Status labels
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    suspended: "Suspended",
    // Actions feedback
    partnerApproved: "Partner approved successfully",
    partnerRejected: "Partner rejected",
    productApproved: "Product approved and activated",
    productRejected: "Product rejected",
    productSuspended: "Product suspended",
    phone: "Phone",
    notes: "Notes",
    platform: "Platform",
    partner: "Partner",
    createPartner: "New Partner",
    createPartnerTitle: "Create Partner Account",
    companyNameRequired: "Company name is required",
    contactNameRequired: "Contact name is required",
    contactEmailRequired: "Contact email is required",
    contactPhone: "Phone",
    companyDescription: "Company Description",
    companyDescPlaceholder: "Brief description of the partner company...",
    notesPlaceholder: "Optional notes...",
    create: "Create",
    creating: "Creating...",
    partnerCreated: "Partner created successfully",
    partnerCreateError: "Failed to create partner",
    userNotFound: "No user found with this email. Please create the user account first.",
    partnerExists: "A partner record already exists for this user.",
    description: "Description",
    externalUrl: "External URL",
    documentUrl: "Document URL",
    nameTw: "Name (繁體)",
    nameCn: "Name (简体)",
    nameEn: "Name (EN)",
    descTw: "Desc (繁體)",
    descCn: "Desc (简体)",
    descEn: "Desc (EN)",
    review: "Review",
    // Binding
    bindUsers: "Bind Users",
    bindUsersTitle: "Bind Partner Users",
    bindUsersDesc: "Select users with partner role to bind to this partner",
    searchPartnerUsers: "Search by name or email...",
    noPartnerUsers: "No users with partner role found",
    boundUsers: "Bound Users",
    availableUsers: "Available Users",
    bind: "Bind",
    unbind: "Unbind",
    bindSuccess: "User bound to partner",
    unbindSuccess: "User unbound from partner",
    unbindConfirm: "Unbind this user from the partner?",
    noBoundUsers: "No users bound yet",
    boundBy: "Bound by",
    boundAt: "Bound at",
  },
  "zh-TW": {
    pageTitle: "合作方審核",
    pageDesc: "審核合作方申請與產品上架",
    tabPartners: "合作方帳戶",
    tabProducts: "產品清單",
    totalPartners: "總數",
    pendingPartners: "待審核",
    approvedPartners: "已通過",
    rejectedPartners: "已拒絕",
    companyName: "公司名稱",
    contactName: "聯繫人",
    contactEmail: "電子郵件",
    status: "狀態",
    submittedDate: "提交日期",
    actions: "操作",
    searchPartners: "依公司名稱或郵件搜尋...",
    noPartners: "暫無合作方申請",
    reviewPartner: "審核合作方申請",
    companyInfo: "公司資訊",
    contactInfo: "聯繫資訊",
    approvalNotes: "審核備註",
    approvalNotesPlaceholder: "新增審核決定備註...",
    approve: "通過",
    reject: "拒絕",
    cancel: "取消",
    totalProducts: "總數",
    pendingProducts: "待審核",
    approvedProducts: "已通過",
    rejectedProducts: "已拒絕",
    productName: "產品名稱",
    partnerName: "合作方",
    productType: "類型",
    cpPrice: "CP 價格",
    revenueSplit: "分潤比例",
    reviewStatus: "狀態",
    searchProducts: "依產品或合作方搜尋...",
    noProducts: "暫無產品清單",
    reviewProduct: "審核產品",
    productDetails: "產品詳情",
    partnerInfo: "合作方資訊",
    typeDocument: "文件型",
    typeLink: "連結型",
    reviewNotes: "審核備註",
    reviewNotesPlaceholder: "新增審核備註...",
    suspend: "停權",
    pending: "待審核",
    approved: "已通過",
    rejected: "已拒絕",
    suspended: "已停權",
    partnerApproved: "合作方已通過審核",
    partnerRejected: "合作方已拒絕",
    productApproved: "產品已通過並上架",
    productRejected: "產品已拒絕",
    productSuspended: "產品已停權",
    phone: "電話",
    notes: "備註",
    platform: "平台",
    partner: "合作方",
    createPartner: "新增合作方",
    createPartnerTitle: "建立合作方帳戶",
    companyNameRequired: "公司名稱為必填",
    contactNameRequired: "聯繫人為必填",
    contactEmailRequired: "電子郵件為必填",
    contactPhone: "電話",
    companyDescription: "公司描述",
    companyDescPlaceholder: "簡要描述合作方公司...",
    notesPlaceholder: "可選備註...",
    create: "建立",
    creating: "建立中...",
    partnerCreated: "合作方建立成功",
    partnerCreateError: "建立合作方失敗",
    userNotFound: "找不到此郵件對應的使用者，請先建立使用者帳號。",
    partnerExists: "此使用者已有合作方記錄。",
    description: "描述",
    externalUrl: "外部連結",
    documentUrl: "文件連結",
    nameTw: "名稱（繁體）",
    nameCn: "名稱（簡體）",
    nameEn: "名稱（EN）",
    descTw: "描述（繁體）",
    descCn: "描述（簡體）",
    descEn: "描述（EN）",
    review: "審核",
    bindUsers: "綁定使用者",
    bindUsersTitle: "綁定合作方使用者",
    bindUsersDesc: "從合作方角色使用者列表中選擇綁定",
    searchPartnerUsers: "搜尋姓名或信箱...",
    noPartnerUsers: "未找到合作方角色使用者",
    boundUsers: "已綁定使用者",
    availableUsers: "可綁定使用者",
    bind: "綁定",
    unbind: "解綁",
    bindSuccess: "使用者已綁定",
    unbindSuccess: "使用者已解綁",
    unbindConfirm: "確定解除此使用者的綁定？",
    noBoundUsers: "尚未綁定使用者",
    boundBy: "綁定者",
    boundAt: "綁定時間",
  },
  "zh-CN": {
    pageTitle: "合作方审核",
    pageDesc: "审核合作方申请与产品上架",
    tabPartners: "合作方账户",
    tabProducts: "产品清单",
    totalPartners: "总数",
    pendingPartners: "待审核",
    approvedPartners: "已通过",
    rejectedPartners: "已拒绝",
    companyName: "公司名称",
    contactName: "联系人",
    contactEmail: "电子邮件",
    status: "状态",
    submittedDate: "提交日期",
    actions: "操作",
    searchPartners: "按公司名称或邮件搜索...",
    noPartners: "暂无合作方申请",
    reviewPartner: "审核合作方申请",
    companyInfo: "公司信息",
    contactInfo: "联系信息",
    approvalNotes: "审核备注",
    approvalNotesPlaceholder: "添加审核决定备注...",
    approve: "通过",
    reject: "拒绝",
    cancel: "取消",
    totalProducts: "总数",
    pendingProducts: "待审核",
    approvedProducts: "已通过",
    rejectedProducts: "已拒绝",
    productName: "产品名称",
    partnerName: "合作方",
    productType: "类型",
    cpPrice: "CP 价格",
    revenueSplit: "分润比例",
    reviewStatus: "状态",
    searchProducts: "按产品或合作方搜索...",
    noProducts: "暂无产品清单",
    reviewProduct: "审核产品",
    productDetails: "产品详情",
    partnerInfo: "合作方信息",
    typeDocument: "文件型",
    typeLink: "链接型",
    reviewNotes: "审核备注",
    reviewNotesPlaceholder: "添加审核备注...",
    suspend: "停权",
    pending: "待审核",
    approved: "已通过",
    rejected: "已拒绝",
    suspended: "已停权",
    partnerApproved: "合作方已通过审核",
    partnerRejected: "合作方已拒绝",
    productApproved: "产品已通过并上架",
    productRejected: "产品已拒绝",
    productSuspended: "产品已停权",
    phone: "电话",
    notes: "备注",
    platform: "平台",
    partner: "合作方",
    createPartner: "新建合作方",
    createPartnerTitle: "创建合作方账户",
    companyNameRequired: "公司名称为必填",
    contactNameRequired: "联系人为必填",
    contactEmailRequired: "电子邮件为必填",
    contactPhone: "电话",
    companyDescription: "公司描述",
    companyDescPlaceholder: "简要描述合作方公司...",
    notesPlaceholder: "可选备注...",
    create: "创建",
    creating: "创建中...",
    partnerCreated: "合作方创建成功",
    partnerCreateError: "创建合作方失败",
    userNotFound: "找不到此邮箱对应的用户，请先创建用户账号。",
    partnerExists: "此用户已有合作方记录。",
    description: "描述",
    externalUrl: "外部链接",
    documentUrl: "文件链接",
    nameTw: "名称（繁体）",
    nameCn: "名称（简体）",
    nameEn: "名称（EN）",
    descTw: "描述（繁体）",
    descCn: "描述（简体）",
    descEn: "描述（EN）",
    review: "审核",
    bindUsers: "绑定使用者",
    bindUsersTitle: "绑定合作方使用者",
    bindUsersDesc: "从合作方角色使用者列表中选择绑定",
    searchPartnerUsers: "搜索姓名或邮箱...",
    noPartnerUsers: "未找到合作方角色使用者",
    boundUsers: "已绑定使用者",
    availableUsers: "可绑定使用者",
    bind: "绑定",
    unbind: "解绑",
    bindSuccess: "使用者已绑定",
    unbindSuccess: "使用者已解绑",
    unbindConfirm: "确定解除此使用者的绑定？",
    noBoundUsers: "尚未绑定使用者",
    boundBy: "绑定者",
    boundAt: "绑定时间",
  },
};

const STATUS_COLORS: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
  suspended: "border-slate-200 bg-slate-100 text-slate-600",
};

export default function PartnerReviewPage() {
  const { session } = useAuth();
  const { language } = useLanguage();
  const txt = TXT[language] || TXT["zh-TW"];
  const queryClient = useQueryClient();
  const adminUserId = session?.user?.id;

  const [activeTab, setActiveTab] = useState<"partners" | "products">("partners");
  const [partnerSearch, setPartnerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  // Partner review modal state
  const [reviewingPartner, setReviewingPartner] = useState<any>(null);
  const [partnerNotes, setPartnerNotes] = useState("");

  // Product review modal state
  const [reviewingProduct, setReviewingProduct] = useState<any>(null);
  const [productNotes, setProductNotes] = useState("");

  // Binding modal state
  const [bindingPartnerId, setBindingPartnerId] = useState<string | null>(null);
  const [bindingPartnerName, setBindingPartnerName] = useState("");
  const [bindUserSearch, setBindUserSearch] = useState("");

  // Create partner modal state
  const [showCreatePartner, setShowCreatePartner] = useState(false);
  const [createForm, setCreateForm] = useState({
    company_name: "",
    company_name_en: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    company_description: "",
    notes: "",
  });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  // ---------- PARTNER USER BINDING QUERIES ----------

  // Users with partner role (available to bind)
  const { data: partnerRoleUsers = [], isLoading: loadingPartnerRoleUsers } = useQuery({
    queryKey: ["partner-role-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, role")
        .or("role.eq.partner,role.eq.PARTNER_USER,role.ilike.%partner%")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!bindingPartnerId,
  });

  // Current bindings for selected partner
  const { data: currentBindings = [], isLoading: loadingBindings } = useQuery({
    queryKey: ["partner-bindings", bindingPartnerId],
    queryFn: async () => {
      if (!bindingPartnerId) return [];
      const { data, error } = await supabase
        .from("partner_user_bindings")
        .select("*, user:profiles(id, full_name, email, avatar_url)")
        .eq("partner_id", bindingPartnerId)
        .eq("is_active", true)
        .order("bound_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!bindingPartnerId,
  });

  const boundUserIds = new Set(currentBindings.map((b: any) => b.user_id));

  const filteredPartnerRoleUsers = partnerRoleUsers.filter((u: any) => {
    if (boundUserIds.has(u.id)) return false;
    if (!bindUserSearch.trim()) return true;
    const searchLower = bindUserSearch.toLowerCase();
    return u.full_name?.toLowerCase().includes(searchLower) || u.email?.toLowerCase().includes(searchLower);
  });

  // Bind user mutation
  const bindUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!bindingPartnerId) throw new Error("No partner selected");
      const { error } = await supabase
        .from("partner_user_bindings")
        .insert({
          partner_id: bindingPartnerId,
          user_id: userId,
          bound_by: adminUserId,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-bindings", bindingPartnerId] });
      toast.success(txt.bindSuccess);
    },
    onError: (error: any) => toast.error(error.message),
  });

  // Unbind user mutation
  const unbindUserMutation = useMutation({
    mutationFn: async (bindingId: string) => {
      const { error } = await supabase
        .from("partner_user_bindings")
        .update({ is_active: false })
        .eq("id", bindingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-bindings", bindingPartnerId] });
      toast.success(txt.unbindSuccess);
    },
    onError: (error: any) => toast.error(error.message),
  });

  // ---------- DATA QUERIES ----------

  const { data: partners = [], isLoading: loadingPartners } = useQuery({
    queryKey: ["admin-partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_partners")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["admin-partner-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_products")
        .select("*, product_partners(company_name, company_name_en, contact_name, contact_email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // ---------- MUTATIONS ----------

  const partnerMutation = useMutation({
    mutationFn: async ({ partnerId, status, notes }: { partnerId: string; status: string; notes: string }) => {
      const updatePayload: any = {
        status,
        notes,
        updated_at: new Date().toISOString(),
      };
      if (status === "approved") {
        updatePayload.approved_at = new Date().toISOString();
        updatePayload.approved_by = adminUserId;
      }
      const { error } = await supabase
        .from("product_partners")
        .update(updatePayload)
        .eq("id", partnerId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
      toast.success(
        variables.status === "approved" ? txt.partnerApproved : txt.partnerRejected
      );
      setReviewingPartner(null);
      setPartnerNotes("");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const createPartnerMutation = useMutation({
    mutationFn: async (form: typeof createForm) => {
      // Look up user by email in profiles
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", form.contact_email.trim().toLowerCase())
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profileData) throw new Error("USER_NOT_FOUND");

      // Check if partner record already exists
      const { data: existingPartner } = await supabase
        .from("product_partners")
        .select("id")
        .eq("user_id", profileData.id)
        .maybeSingle();

      if (existingPartner) throw new Error("PARTNER_EXISTS");

      // Insert new partner record
      const { error: insertError } = await supabase
        .from("product_partners")
        .insert({
          user_id: profileData.id,
          company_name: form.company_name.trim(),
          company_name_en: form.company_name_en.trim() || "",
          contact_name: form.contact_name.trim(),
          contact_email: form.contact_email.trim().toLowerCase(),
          contact_phone: form.contact_phone.trim() || "",
          company_description: form.company_description.trim() || "",
          notes: form.notes.trim() || "",
          status: "approved",
          approved_by: adminUserId,
          approved_at: new Date().toISOString(),
          total_products: 0,
          total_revenue_cp: 0,
        });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
      toast.success(txt.partnerCreated);
      setShowCreatePartner(false);
      setCreateForm({
        company_name: "",
        company_name_en: "",
        contact_name: "",
        contact_email: "",
        contact_phone: "",
        company_description: "",
        notes: "",
      });
      setCreateErrors({});
    },
    onError: (error: any) => {
      if (error.message === "USER_NOT_FOUND") {
        toast.error(txt.userNotFound);
      } else if (error.message === "PARTNER_EXISTS") {
        toast.error(txt.partnerExists);
      } else {
        toast.error(txt.partnerCreateError);
      }
    },
  });

  const handleCreatePartner = () => {
    const errors: Record<string, string> = {};
    if (!createForm.company_name.trim()) errors.company_name = txt.companyNameRequired;
    if (!createForm.contact_name.trim()) errors.contact_name = txt.contactNameRequired;
    if (!createForm.contact_email.trim()) errors.contact_email = txt.contactEmailRequired;
    setCreateErrors(errors);
    if (Object.keys(errors).length > 0) return;
    createPartnerMutation.mutate(createForm);
  };

  const productMutation = useMutation({
    mutationFn: async ({
      productId,
      reviewStatus,
      notes,
    }: {
      productId: string;
      reviewStatus: string;
      notes: string;
    }) => {
      const updatePayload: any = {
        review_status: reviewStatus,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminUserId,
        review_notes: notes,
        updated_at: new Date().toISOString(),
      };
      // Auto-activate on approval
      if (reviewStatus === "approved") {
        updatePayload.is_active = true;
      } else {
        updatePayload.is_active = false;
      }
      const { error } = await supabase
        .from("partner_products")
        .update(updatePayload)
        .eq("id", productId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-partner-products"] });
      const message =
        variables.reviewStatus === "approved"
          ? txt.productApproved
          : variables.reviewStatus === "rejected"
          ? txt.productRejected
          : txt.productSuspended;
      toast.success(message);
      setReviewingProduct(null);
      setProductNotes("");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // ---------- COMPUTED ----------

  const getStatusLabel = (status: string): string => {
    const map: Record<string, string> = {
      pending: txt.pending,
      approved: txt.approved,
      rejected: txt.rejected,
      suspended: txt.suspended,
    };
    return map[status] || status;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(
      language === "en" ? "en-US" : language === "zh-CN" ? "zh-CN" : "zh-TW",
      { year: "numeric", month: "short", day: "numeric" }
    );
  };

  const getProductName = (product: any): string => {
    if (language === "en" && product.product_name_en) return product.product_name_en;
    if (language === "zh-CN" && product.product_name_zh_cn) return product.product_name_zh_cn;
    return product.product_name_zh_tw || "—";
  };

  const getCompanyName = (partner: any): string => {
    if (language === "en" && partner?.company_name_en) return partner.company_name_en;
    return partner?.company_name || "—";
  };

  // Filter
  const filteredPartners = partners.filter((partner: any) => {
    if (!partnerSearch.trim()) return true;
    const term = partnerSearch.toLowerCase();
    return (
      (partner.company_name || "").toLowerCase().includes(term) ||
      (partner.company_name_en || "").toLowerCase().includes(term) ||
      (partner.contact_email || "").toLowerCase().includes(term)
    );
  });

  const filteredProducts = products.filter((product: any) => {
    if (!productSearch.trim()) return true;
    const term = productSearch.toLowerCase();
    const companyName = product.product_partners?.company_name || "";
    return (
      (product.product_name_zh_tw || "").toLowerCase().includes(term) ||
      (product.product_name_en || "").toLowerCase().includes(term) ||
      companyName.toLowerCase().includes(term)
    );
  });

  // Partner stats
  const partnerStats = {
    total: partners.length,
    pending: partners.filter((p: any) => p.status === "pending").length,
    approved: partners.filter((p: any) => p.status === "approved").length,
    rejected: partners.filter((p: any) => p.status === "rejected").length,
  };

  // Product stats
  const productStats = {
    total: products.length,
    pending: products.filter((p: any) => p.review_status === "pending").length,
    approved: products.filter((p: any) => p.review_status === "approved").length,
    rejected: products.filter((p: any) => p.review_status === "rejected").length,
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{txt.pageTitle}</h1>
        <p className="text-sm text-slate-500 mt-1">{txt.pageDesc}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("partners")}
          className={cn(
            "px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-2",
            activeTab === "partners"
              ? "border-sky-500 text-sky-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          <Building2 className="w-4 h-4" />
          {txt.tabPartners}
          {partnerStats.pending > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
              {partnerStats.pending}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("products")}
          className={cn(
            "px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-2",
            activeTab === "products"
              ? "border-sky-500 text-sky-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          <Package className="w-4 h-4" />
          {txt.tabProducts}
          {productStats.pending > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
              {productStats.pending}
            </span>
          )}
        </button>
      </div>

      {/* =================== PARTNERS TAB =================== */}
      {activeTab === "partners" && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: txt.totalPartners, value: partnerStats.total, color: "text-slate-700" },
              { label: txt.pendingPartners, value: partnerStats.pending, color: "text-amber-600" },
              { label: txt.approvedPartners, value: partnerStats.approved, color: "text-emerald-600" },
              { label: txt.rejectedPartners, value: partnerStats.rejected, color: "text-red-600" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="bg-white border border-slate-200/80 rounded-xl px-4 py-3 shadow-sm"
              >
                <p className={cn("text-xl font-bold", stat.color)}>{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Search + Create Button + Table */}
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={partnerSearch}
                  onChange={(event) => setPartnerSearch(event.target.value)}
                  placeholder={txt.searchPartners}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300 bg-white"
                />
              </div>
              <button
                onClick={() => setShowCreatePartner(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors shrink-0 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                {txt.createPartner}
              </button>
            </div>

            {loadingPartners ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : filteredPartners.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <Users className="w-8 h-8 text-slate-200" />
                <p className="text-sm text-slate-400">{txt.noPartners}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <th className="px-5 py-3 font-medium">{txt.companyName}</th>
                      <th className="px-5 py-3 font-medium">{txt.contactName}</th>
                      <th className="px-5 py-3 font-medium">{txt.contactEmail}</th>
                      <th className="px-5 py-3 font-medium text-center">{txt.status}</th>
                      <th className="px-5 py-3 font-medium">{txt.submittedDate}</th>
                      <th className="px-5 py-3 font-medium text-center">{txt.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredPartners.map((partner: any) => (
                      <tr key={partner.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 text-slate-800 font-medium">
                          {getCompanyName(partner)}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">{partner.contact_name}</td>
                        <td className="px-5 py-3.5 text-slate-500 text-xs font-mono">{partner.contact_email}</td>
                        <td className="px-5 py-3.5 text-center">
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] font-medium px-2 py-0.5", STATUS_COLORS[partner.status])}
                          >
                            {getStatusLabel(partner.status)}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                          {formatDate(partner.created_at)}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setReviewingPartner(partner);
                                setPartnerNotes(partner.notes || "");
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              {txt.review}
                            </button>
                            {partner.status === "approved" && (
                              <button
                                onClick={() => {
                                  setBindingPartnerId(partner.id);
                                  setBindingPartnerName(getCompanyName(partner));
                                  setBindUserSearch("");
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
                              >
                                <UserPlus className="w-3 h-3" />
                                {txt.bindUsers}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================== PRODUCTS TAB =================== */}
      {activeTab === "products" && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: txt.totalProducts, value: productStats.total, color: "text-slate-700" },
              { label: txt.pendingProducts, value: productStats.pending, color: "text-amber-600" },
              { label: txt.approvedProducts, value: productStats.approved, color: "text-emerald-600" },
              { label: txt.rejectedProducts, value: productStats.rejected, color: "text-red-600" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="bg-white border border-slate-200/80 rounded-xl px-4 py-3 shadow-sm"
              >
                <p className={cn("text-xl font-bold", stat.color)}>{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Search + Table */}
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm">
            <div className="p-4 border-b border-slate-100">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  placeholder={txt.searchProducts}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300 bg-white"
                />
              </div>
            </div>

            {loadingProducts ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <Package className="w-8 h-8 text-slate-200" />
                <p className="text-sm text-slate-400">{txt.noProducts}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <th className="px-5 py-3 font-medium">{txt.productName}</th>
                      <th className="px-5 py-3 font-medium">{txt.partnerName}</th>
                      <th className="px-5 py-3 font-medium text-center">{txt.productType}</th>
                      <th className="px-5 py-3 font-medium text-right">{txt.cpPrice}</th>
                      <th className="px-5 py-3 font-medium text-center">{txt.revenueSplit}</th>
                      <th className="px-5 py-3 font-medium text-center">{txt.reviewStatus}</th>
                      <th className="px-5 py-3 font-medium text-center">{txt.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredProducts.map((product: any) => (
                      <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 text-slate-800 font-medium max-w-[180px] truncate">
                          {getProductName(product)}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 text-xs">
                          {product.product_partners?.company_name || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {product.product_type === "document" ? (
                            <span className="inline-flex items-center gap-1 text-xs text-sky-600">
                              <FileText className="w-3.5 h-3.5" />
                              {txt.typeDocument}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-violet-600">
                              <Link2 className="w-3.5 h-3.5" />
                              {txt.typeLink}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right text-slate-700 font-mono">
                          {product.cp_price?.toLocaleString()} CP
                        </td>
                        <td className="px-5 py-3.5 text-center text-xs text-slate-500">
                          {Math.round(product.revenue_split_platform * 100)}% / {Math.round(product.revenue_split_partner * 100)}%
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] font-medium px-2 py-0.5", STATUS_COLORS[product.review_status])}
                          >
                            {getStatusLabel(product.review_status)}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() => {
                              setReviewingProduct(product);
                              setProductNotes(product.review_notes || "");
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {txt.review}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================== CREATE PARTNER MODAL =================== */}
      <AnimatePresence>
        {showCreatePartner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setShowCreatePartner(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">{txt.createPartnerTitle}</h3>
                <button onClick={() => setShowCreatePartner(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Company Name */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                    {txt.companyName} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.company_name}
                    onChange={(event) => setCreateForm(prev => ({ ...prev, company_name: event.target.value }))}
                    className={cn(
                      "w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300",
                      createErrors.company_name ? "border-red-300 bg-red-50" : "border-slate-200"
                    )}
                  />
                  {createErrors.company_name && <p className="text-xs text-red-500 mt-1">{createErrors.company_name}</p>}
                </div>

                {/* Company Name EN */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">{txt.nameEn}</label>
                  <input
                    type="text"
                    value={createForm.company_name_en}
                    onChange={(event) => setCreateForm(prev => ({ ...prev, company_name_en: event.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300"
                  />
                </div>

                {/* Contact Name */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                    {txt.contactName} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.contact_name}
                    onChange={(event) => setCreateForm(prev => ({ ...prev, contact_name: event.target.value }))}
                    className={cn(
                      "w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300",
                      createErrors.contact_name ? "border-red-300 bg-red-50" : "border-slate-200"
                    )}
                  />
                  {createErrors.contact_name && <p className="text-xs text-red-500 mt-1">{createErrors.contact_name}</p>}
                </div>

                {/* Contact Email */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                    {txt.contactEmail} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={createForm.contact_email}
                    onChange={(event) => setCreateForm(prev => ({ ...prev, contact_email: event.target.value }))}
                    className={cn(
                      "w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300 font-mono text-xs",
                      createErrors.contact_email ? "border-red-300 bg-red-50" : "border-slate-200"
                    )}
                  />
                  {createErrors.contact_email && <p className="text-xs text-red-500 mt-1">{createErrors.contact_email}</p>}
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">{txt.contactPhone}</label>
                  <input
                    type="tel"
                    value={createForm.contact_phone}
                    onChange={(event) => setCreateForm(prev => ({ ...prev, contact_phone: event.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300"
                  />
                </div>

                {/* Company Description */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">{txt.companyDescription}</label>
                  <textarea
                    value={createForm.company_description}
                    onChange={(event) => setCreateForm(prev => ({ ...prev, company_description: event.target.value }))}
                    placeholder={txt.companyDescPlaceholder}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300 resize-none"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">{txt.notes}</label>
                  <textarea
                    value={createForm.notes}
                    onChange={(event) => setCreateForm(prev => ({ ...prev, notes: event.target.value }))}
                    placeholder={txt.notesPlaceholder}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300 resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCreatePartner(false);
                    setCreateErrors({});
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {txt.cancel}
                </button>
                <button
                  onClick={handleCreatePartner}
                  disabled={createPartnerMutation.isPending}
                  className="px-5 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {createPartnerMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {txt.creating}</>
                  ) : (
                    <><Plus className="w-4 h-4" /> {txt.create}</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =================== PARTNER REVIEW MODAL =================== */}
      <AnimatePresence>
        {reviewingPartner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setReviewingPartner(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">{txt.reviewPartner}</h3>
                <button onClick={() => setReviewingPartner(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Company Info */}
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{txt.companyInfo}</p>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">{txt.companyName}</span>
                      <span className="text-sm font-medium text-slate-800">{reviewingPartner.company_name}</span>
                    </div>
                    {reviewingPartner.company_name_en && (
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-500">{txt.nameEn}</span>
                        <span className="text-sm text-slate-700">{reviewingPartner.company_name_en}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{txt.contactInfo}</p>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">{txt.contactName}</span>
                      <span className="text-sm text-slate-700">{reviewingPartner.contact_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">{txt.contactEmail}</span>
                      <span className="text-sm text-slate-700 font-mono text-xs">{reviewingPartner.contact_email}</span>
                    </div>
                    {reviewingPartner.contact_phone && (
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-500">{txt.phone}</span>
                        <span className="text-sm text-slate-700">{reviewingPartner.contact_phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Current status */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{txt.status}:</span>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] font-medium", STATUS_COLORS[reviewingPartner.status])}
                  >
                    {getStatusLabel(reviewingPartner.status)}
                  </Badge>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">{txt.approvalNotes}</label>
                  <textarea
                    value={partnerNotes}
                    onChange={(event) => setPartnerNotes(event.target.value)}
                    placeholder={txt.approvalNotesPlaceholder}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300 resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => setReviewingPartner(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {txt.cancel}
                </button>
                <button
                  onClick={() =>
                    partnerMutation.mutate({
                      partnerId: reviewingPartner.id,
                      status: "rejected",
                      notes: partnerNotes,
                    })
                  }
                  disabled={partnerMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4 inline mr-1" />
                  {txt.reject}
                </button>
                <button
                  onClick={() =>
                    partnerMutation.mutate({
                      partnerId: reviewingPartner.id,
                      status: "approved",
                      notes: partnerNotes,
                    })
                  }
                  disabled={partnerMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {partnerMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 inline mr-1" />
                  )}
                  {txt.approve}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =================== PARTNER USER BINDING MODAL =================== */}
      <AnimatePresence>
        {bindingPartnerId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setBindingPartnerId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{txt.bindUsersTitle}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{bindingPartnerName} · {txt.bindUsersDesc}</p>
                </div>
                <button onClick={() => setBindingPartnerId(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Currently bound users */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {txt.boundUsers} ({currentBindings.length})
                  </h4>
                  {loadingBindings ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    </div>
                  ) : currentBindings.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">{txt.noBoundUsers}</div>
                  ) : (
                    <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                      {currentBindings.map((binding: any) => (
                        <div key={binding.id} className="flex items-center gap-3 px-4 py-2.5">
                          <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                            <Users className="w-3.5 h-3.5 text-violet-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-700 truncate">{binding.user?.full_name || "—"}</p>
                            <p className="text-[10px] text-slate-400 truncate">{binding.user?.email}</p>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(binding.bound_at).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => {
                              if (window.confirm(txt.unbindConfirm)) {
                                unbindUserMutation.mutate(binding.id);
                              }
                            }}
                            disabled={unbindUserMutation.isPending}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            <Unlink className="w-3 h-3" />
                            {txt.unbind}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Available users to bind */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" />
                    {txt.availableUsers}
                  </h4>

                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      value={bindUserSearch}
                      onChange={(event) => setBindUserSearch(event.target.value)}
                      placeholder={txt.searchPartnerUsers}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-200"
                    />
                  </div>

                  {loadingPartnerRoleUsers ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    </div>
                  ) : filteredPartnerRoleUsers.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">{txt.noPartnerUsers}</div>
                  ) : (
                    <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-[250px] overflow-y-auto">
                      {filteredPartnerRoleUsers.map((partnerUser: any) => (
                        <div key={partnerUser.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-violet-50/50 transition-colors">
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                            {partnerUser.avatar_url ? (
                              <img src={partnerUser.avatar_url} className="w-7 h-7 rounded-full object-cover" alt="" />
                            ) : (
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-700 truncate">{partnerUser.full_name || "—"}</p>
                            <p className="text-[10px] text-slate-400 truncate">{partnerUser.email}</p>
                          </div>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-slate-200">{partnerUser.role}</Badge>
                          <button
                            onClick={() => bindUserMutation.mutate(partnerUser.id)}
                            disabled={bindUserMutation.isPending}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-md hover:bg-violet-100 transition-colors disabled:opacity-50"
                          >
                            <UserPlus className="w-3 h-3" />
                            {txt.bind}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =================== PRODUCT REVIEW MODAL =================== */}
      <AnimatePresence>
        {reviewingProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setReviewingProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">{txt.reviewProduct}</h3>
                <button onClick={() => setReviewingProduct(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Product Details */}
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{txt.productDetails}</p>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-2.5">
                    {reviewingProduct.product_name_zh_tw && (
                      <div className="flex justify-between gap-4">
                        <span className="text-xs text-slate-500 shrink-0">{txt.nameTw}</span>
                        <span className="text-sm text-slate-800 font-medium text-right">{reviewingProduct.product_name_zh_tw}</span>
                      </div>
                    )}
                    {reviewingProduct.product_name_zh_cn && (
                      <div className="flex justify-between gap-4">
                        <span className="text-xs text-slate-500 shrink-0">{txt.nameCn}</span>
                        <span className="text-sm text-slate-700 text-right">{reviewingProduct.product_name_zh_cn}</span>
                      </div>
                    )}
                    {reviewingProduct.product_name_en && (
                      <div className="flex justify-between gap-4">
                        <span className="text-xs text-slate-500 shrink-0">{txt.nameEn}</span>
                        <span className="text-sm text-slate-700 text-right">{reviewingProduct.product_name_en}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">{txt.productType}</span>
                      <span className="text-sm text-slate-700">
                        {reviewingProduct.product_type === "document" ? (
                          <span className="inline-flex items-center gap-1 text-sky-600">
                            <FileText className="w-3.5 h-3.5" /> {txt.typeDocument}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-violet-600">
                            <Link2 className="w-3.5 h-3.5" /> {txt.typeLink}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">{txt.cpPrice}</span>
                      <span className="text-sm text-slate-900 font-semibold font-mono">{reviewingProduct.cp_price?.toLocaleString()} CP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">{txt.revenueSplit}</span>
                      <span className="text-sm text-slate-700">
                        {txt.platform} {Math.round(reviewingProduct.revenue_split_platform * 100)}% / {txt.partner} {Math.round(reviewingProduct.revenue_split_partner * 100)}%
                      </span>
                    </div>
                    {reviewingProduct.external_url && (
                      <div className="flex justify-between gap-4">
                        <span className="text-xs text-slate-500 shrink-0">{txt.externalUrl}</span>
                        <a
                          href={reviewingProduct.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-sky-600 hover:underline truncate max-w-[200px] inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          {reviewingProduct.external_url}
                        </a>
                      </div>
                    )}
                    {reviewingProduct.document_url && (
                      <div className="flex justify-between gap-4">
                        <span className="text-xs text-slate-500 shrink-0">{txt.documentUrl}</span>
                        <a
                          href={reviewingProduct.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-sky-600 hover:underline truncate max-w-[200px] inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          {reviewingProduct.document_url}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Descriptions */}
                {(reviewingProduct.description_zh_tw || reviewingProduct.description_zh_cn || reviewingProduct.description_en) && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{txt.description}</p>
                    <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                      {reviewingProduct.description_zh_tw && (
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase">{txt.descTw}</span>
                          <p className="text-sm text-slate-700 mt-0.5">{reviewingProduct.description_zh_tw}</p>
                        </div>
                      )}
                      {reviewingProduct.description_zh_cn && (
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase">{txt.descCn}</span>
                          <p className="text-sm text-slate-700 mt-0.5">{reviewingProduct.description_zh_cn}</p>
                        </div>
                      )}
                      {reviewingProduct.description_en && (
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase">{txt.descEn}</span>
                          <p className="text-sm text-slate-700 mt-0.5">{reviewingProduct.description_en}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Partner Info */}
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{txt.partnerInfo}</p>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">{txt.companyName}</span>
                      <span className="text-sm text-slate-700">{reviewingProduct.product_partners?.company_name || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">{txt.contactName}</span>
                      <span className="text-sm text-slate-700">{reviewingProduct.product_partners?.contact_name || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">{txt.contactEmail}</span>
                      <span className="text-sm text-slate-700 font-mono text-xs">{reviewingProduct.product_partners?.contact_email || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Current status */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{txt.reviewStatus}:</span>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] font-medium", STATUS_COLORS[reviewingProduct.review_status])}
                  >
                    {getStatusLabel(reviewingProduct.review_status)}
                  </Badge>
                </div>

                {/* Review Notes */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">{txt.reviewNotes}</label>
                  <textarea
                    value={productNotes}
                    onChange={(event) => setProductNotes(event.target.value)}
                    placeholder={txt.reviewNotesPlaceholder}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300 resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 flex-wrap">
                <button
                  onClick={() => setReviewingProduct(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {txt.cancel}
                </button>
                <button
                  onClick={() =>
                    productMutation.mutate({
                      productId: reviewingProduct.id,
                      reviewStatus: "suspended",
                      notes: productNotes,
                    })
                  }
                  disabled={productMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  <ShieldAlert className="w-4 h-4 inline mr-1" />
                  {txt.suspend}
                </button>
                <button
                  onClick={() =>
                    productMutation.mutate({
                      productId: reviewingProduct.id,
                      reviewStatus: "rejected",
                      notes: productNotes,
                    })
                  }
                  disabled={productMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4 inline mr-1" />
                  {txt.reject}
                </button>
                <button
                  onClick={() =>
                    productMutation.mutate({
                      productId: reviewingProduct.id,
                      reviewStatus: "approved",
                      notes: productNotes,
                    })
                  }
                  disabled={productMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {productMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 inline mr-1" />
                  )}
                  {txt.approve}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
