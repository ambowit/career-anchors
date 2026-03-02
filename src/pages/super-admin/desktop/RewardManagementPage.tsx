import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift,
  CheckCircle2,
  Clock,
  DollarSign,
  Calendar,
  Search,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Send,
  Users,
  Filter,
  AlertTriangle,
  Building2,
  UserPlus,
  X,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  i18n                                                               */
/* ------------------------------------------------------------------ */

const TXT = {
  en: {
    pageTitle: "Reward Management",
    pageDesc: "View, manage, and batch-grant CP rewards",
    // stats
    totalGranted: "Total Granted",
    pendingRewards: "Pending",
    totalCpDistributed: "Total CP Distributed",
    thisMonth: "This Month",
    // filters
    statusFilter: "Status",
    typeFilter: "Type",
    all: "All",
    pending: "Pending",
    granted: "Granted",
    cancelled: "Cancelled",
    consultation: "Consultation",
    referral: "Referral",
    sale: "Sale",
    searchPlaceholder: "Search by email or name…",
    // table
    date: "Date",
    referrer: "Referrer",
    referred: "Referred",
    type: "Type",
    amount: "Amount",
    status: "Status",
    actions: "Actions",
    description: "Description",
    noRecords: "No reward records",
    loadMore: "Load More",
    // types
    consultation_completed: "Consultation",
    successful_referral: "Referral",
    sale_achieved: "Sale",
    // actions
    cancel: "Cancel",
    cancelConfirm: "Cancel this reward?",
    cancelSuccess: "Reward cancelled",
    cancelError: "Failed to cancel reward",
    // batch
    batchTitle: "Batch Grant CP",
    batchDesc: "Grant activity CP to multiple users at once",
    batchUserIds: "User Emails",
    batchUserIdsPlaceholder: "Enter user emails, one per line",
    batchCpAmount: "CP Amount",
    batchDescription: "Reason",
    batchDescPlaceholder: "Reason for batch grant",
    batchGrantBtn: "Grant to All",
    batchGranting: "Granting…",
    batchSuccess: "Batch grant completed",
    batchError: "Batch grant failed",
    batchResults: "Results",
    batchUserCount: "users",
    expandBatch: "Show Batch Grant",
    collapseBatch: "Hide Batch Grant",
    emailNotFound: "Email not found",
    succeeded: "Succeeded",
    failed: "Failed",
    activityReward: "Activity Reward",
    consumptionReward: "Consumption Reward",
    // Organization picker
    orgGrantTitle: "Grant from Organization",
    orgGrantDesc: "Select users from a specific organization to grant CP",
    selectOrg: "Select Organization",
    selectUsers: "Select Users",
    searchOrg: "Search organizations...",
    searchUserInOrg: "Search by name or email...",
    noOrgs: "No organizations found",
    noUsersInOrg: "No users in this organization",
    selectedCount: "selected",
    grantType: "Grant Type",
    bonus: "Bonus CP",
    activityCp: "Activity CP",
    grantToSelected: "Grant to Selected",
    orgUsers: "Organization Users",
    allUsers: "All Users",
    sourceMode: "User Source",
    confirmGrant: "Confirm grant",
    confirmGrantMsg: "Grant CP to selected users?",
    confirm: "Confirm",
  },
  "zh-TW": {
    pageTitle: "贈點管理",
    pageDesc: "查看、管理與批次贈送 CP 獎勵",
    totalGranted: "已發放總數",
    pendingRewards: "待發放",
    totalCpDistributed: "已發放 CP 總量",
    thisMonth: "本月發放",
    statusFilter: "狀態",
    typeFilter: "類型",
    all: "全部",
    pending: "待發放",
    granted: "已發放",
    cancelled: "已取消",
    consultation: "諮詢完成",
    referral: "推薦獎勵",
    sale: "銷售獎勵",
    searchPlaceholder: "搜尋 Email 或姓名…",
    date: "日期",
    referrer: "獎勵對象",
    referred: "被推薦者",
    type: "類型",
    amount: "金額",
    status: "狀態",
    actions: "操作",
    description: "描述",
    noRecords: "暫無獎勵紀錄",
    loadMore: "載入更多",
    consultation_completed: "諮詢完成",
    successful_referral: "推薦獎勵",
    sale_achieved: "銷售獎勵",
    cancel: "取消",
    cancelConfirm: "確定取消此獎勵？",
    cancelSuccess: "已取消獎勵",
    cancelError: "取消失敗",
    batchTitle: "批次贈點",
    batchDesc: "一次贈送活動 CP 給多位用戶",
    batchUserIds: "用戶 Email",
    batchUserIdsPlaceholder: "每行一個 Email",
    batchCpAmount: "CP 數量",
    batchDescription: "原因",
    batchDescPlaceholder: "批次贈點原因",
    batchGrantBtn: "全部贈送",
    batchGranting: "贈送中…",
    batchSuccess: "批次贈點完成",
    batchError: "批次贈點失敗",
    batchResults: "結果",
    batchUserCount: "位用戶",
    expandBatch: "展開批次贈點",
    collapseBatch: "收起批次贈點",
    emailNotFound: "Email 不存在",
    succeeded: "成功",
    failed: "失敗",
    activityReward: "活動獎勵",
    consumptionReward: "消費獎勵",
    orgGrantTitle: "從機構贈點",
    orgGrantDesc: "從指定機構中選擇用戶發放 CP",
    selectOrg: "選擇機構",
    selectUsers: "選擇用戶",
    searchOrg: "搜尋機構...",
    searchUserInOrg: "搜尋姓名或信箱...",
    noOrgs: "未找到機構",
    noUsersInOrg: "此機構暫無用戶",
    selectedCount: "已選",
    grantType: "贈點類型",
    bonus: "充值贈送 CP",
    activityCp: "活動獎勵 CP",
    grantToSelected: "贈送給已選用戶",
    orgUsers: "機構用戶",
    allUsers: "全站用戶",
    sourceMode: "用戶來源",
    confirmGrant: "確認贈點",
    confirmGrantMsg: "確定贈送 CP 給已選用戶？",
    confirm: "確認",
  },
  "zh-CN": {
    pageTitle: "赠点管理",
    pageDesc: "查看、管理与批次赠送 CP 奖励",
    totalGranted: "已发放总数",
    pendingRewards: "待发放",
    totalCpDistributed: "已发放 CP 总量",
    thisMonth: "本月发放",
    statusFilter: "状态",
    typeFilter: "类型",
    all: "全部",
    pending: "待发放",
    granted: "已发放",
    cancelled: "已取消",
    consultation: "咨询完成",
    referral: "推荐奖励",
    sale: "销售奖励",
    searchPlaceholder: "搜索 Email 或姓名…",
    date: "日期",
    referrer: "奖励对象",
    referred: "被推荐者",
    type: "类型",
    amount: "金额",
    status: "状态",
    actions: "操作",
    description: "描述",
    noRecords: "暂无奖励记录",
    loadMore: "加载更多",
    consultation_completed: "咨询完成",
    successful_referral: "推荐奖励",
    sale_achieved: "销售奖励",
    cancel: "取消",
    cancelConfirm: "确定取消此奖励？",
    cancelSuccess: "已取消奖励",
    cancelError: "取消失败",
    batchTitle: "批次赠点",
    batchDesc: "一次赠送活动 CP 给多位用户",
    batchUserIds: "用户 Email",
    batchUserIdsPlaceholder: "每行一个 Email",
    batchCpAmount: "CP 数量",
    batchDescription: "原因",
    batchDescPlaceholder: "批次赠点原因",
    batchGrantBtn: "全部赠送",
    batchGranting: "赠送中…",
    batchSuccess: "批次赠点完成",
    batchError: "批次赠点失败",
    batchResults: "结果",
    batchUserCount: "位用户",
    expandBatch: "展开批次赠点",
    collapseBatch: "收起批次赠点",
    emailNotFound: "Email 不存在",
    succeeded: "成功",
    failed: "失败",
    activityReward: "活动奖励",
    consumptionReward: "消费奖励",
    orgGrantTitle: "从机构赠点",
    orgGrantDesc: "从指定机构中选择用户发放 CP",
    selectOrg: "选择机构",
    selectUsers: "选择用户",
    searchOrg: "搜索机构...",
    searchUserInOrg: "搜索姓名或邮箱...",
    noOrgs: "未找到机构",
    noUsersInOrg: "此机构暂无用户",
    selectedCount: "已选",
    grantType: "赠点类型",
    bonus: "充值赠送 CP",
    activityCp: "活动奖励 CP",
    grantToSelected: "赠送给已选用户",
    orgUsers: "机构用户",
    allUsers: "全站用户",
    sourceMode: "用户来源",
    confirmGrant: "确认赠点",
    confirmGrantMsg: "确定赠送 CP 给已选用户？",
    confirm: "确认",
  },
} as const;

type LangKey = keyof typeof TXT;

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const REWARD_COLORS: Record<string, string> = {
  consultation_completed: "border-violet-200 bg-violet-50 text-violet-700",
  successful_referral: "border-sky-200 bg-sky-50 text-sky-700",
  sale_achieved: "border-amber-200 bg-amber-50 text-amber-700",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  granted: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-slate-200 bg-slate-100 text-slate-500",
};

const REWARD_CATEGORIES: Record<string, "activity" | "consumption"> = {
  consultation_completed: "activity",
  successful_referral: "activity",
  sale_achieved: "consumption",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function RewardManagementPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const txt = TXT[(language as LangKey) || "zh-TW"];

  // Filter states
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [displayLimit, setDisplayLimit] = useState(50);

  // Batch grant states
  const [batchExpanded, setBatchExpanded] = useState(false);
  const [batchEmails, setBatchEmails] = useState("");
  const [batchCpAmount, setBatchCpAmount] = useState<number>(10);
  const [batchDescription, setBatchDescription] = useState("");
  const [batchResults, setBatchResults] = useState<Array<{ email: string; success: boolean; error?: string }> | null>(null);

  // Organization grant states
  const [orgGrantExpanded, setOrgGrantExpanded] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [orgSearch, setOrgSearch] = useState("");
  const [orgUserSearch, setOrgUserSearch] = useState("");
  const [selectedOrgUserIds, setSelectedOrgUserIds] = useState<Set<string>>(new Set());
  const [orgGrantCpAmount, setOrgGrantCpAmount] = useState<number>(10);
  const [orgGrantType, setOrgGrantType] = useState<"activity" | "bonus">("activity");
  const [orgGrantReason, setOrgGrantReason] = useState("");
  const [showOrgConfirm, setShowOrgConfirm] = useState(false);

  /* ---- Organization queries ---- */

  const { data: organizations = [] } = useQuery({
    queryKey: ["admin-organizations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, short_code")
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: orgGrantExpanded,
  });

  const filteredOrgs = useMemo(() => {
    if (!orgSearch.trim()) return organizations;
    const searchLower = orgSearch.toLowerCase();
    return organizations.filter((org: any) =>
      org.name?.toLowerCase().includes(searchLower) || org.short_code?.toLowerCase().includes(searchLower)
    );
  }, [organizations, orgSearch]);

  const { data: orgUsers = [], isLoading: orgUsersLoading } = useQuery({
    queryKey: ["admin-org-users", selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return [];
      const { data, error } = await supabase
        .from("organization_members")
        .select("user_id, role, profiles(id, full_name, email, avatar_url)")
        .eq("organization_id", selectedOrgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((member: any) => ({
        id: member.profiles?.id || member.user_id,
        full_name: member.profiles?.full_name || "",
        email: member.profiles?.email || "",
        avatar_url: member.profiles?.avatar_url || "",
        role: member.role,
      }));
    },
    enabled: !!selectedOrgId,
  });

  const filteredOrgUsers = useMemo(() => {
    if (!orgUserSearch.trim()) return orgUsers;
    const searchLower = orgUserSearch.toLowerCase();
    return orgUsers.filter((u: any) =>
      u.full_name?.toLowerCase().includes(searchLower) || u.email?.toLowerCase().includes(searchLower)
    );
  }, [orgUsers, orgUserSearch]);

  const toggleOrgUser = (userId: string) => {
    setSelectedOrgUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleAllOrgUsers = () => {
    if (selectedOrgUserIds.size === filteredOrgUsers.length) {
      setSelectedOrgUserIds(new Set());
    } else {
      setSelectedOrgUserIds(new Set(filteredOrgUsers.map((u: any) => u.id)));
    }
  };

  /* ---- Organization grant mutation ---- */

  const orgGrantMutation = useMutation({
    mutationFn: async () => {
      const userIds = Array.from(selectedOrgUserIds);
      if (userIds.length === 0 || orgGrantCpAmount <= 0) throw new Error("Invalid input");

      const { data, error } = await supabase.functions.invoke("grant-reward", {
        body: {
          action: "batch_grant",
          user_ids: userIds,
          cp_amount: orgGrantCpAmount,
          description: orgGrantReason || `Organization grant (${orgGrantType})`,
          grant_type: orgGrantType,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rewards"] });
      toast.success(`${txt.batchSuccess}: ${selectedOrgUserIds.size} ${txt.batchUserCount}`);
      setSelectedOrgUserIds(new Set());
      setShowOrgConfirm(false);
    },
    onError: (error: Error) => toast.error(`${txt.batchError}: ${error.message}`),
  });

  /* ---- Data queries ---- */

  const { data: allRewards = [], isLoading: loadingRewards } = useQuery({
    queryKey: ["admin-rewards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_rewards")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Collect unique user IDs from rewards to batch-fetch profiles
  const uniqueUserIds = useMemo(() => {
    const idSet = new Set<string>();
    allRewards.forEach((reward: any) => {
      if (reward.referrer_id) idSet.add(reward.referrer_id);
      if (reward.referred_id) idSet.add(reward.referred_id);
    });
    return Array.from(idSet);
  }, [allRewards]);

  const { data: profilesMap = {} } = useQuery({
    queryKey: ["admin-reward-profiles", uniqueUserIds],
    queryFn: async () => {
      if (uniqueUserIds.length === 0) return {};
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", uniqueUserIds);
      if (error) throw error;
      const profileMap: Record<string, { email: string; full_name: string }> = {};
      (data || []).forEach((profile: any) => {
        profileMap[profile.id] = { email: profile.email, full_name: profile.full_name };
      });
      return profileMap;
    },
    enabled: uniqueUserIds.length > 0,
  });

  /* ---- Computed stats ---- */

  const stats = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const grantedRewards = allRewards.filter((r: any) => r.status === "granted");
    const pendingRewards = allRewards.filter((r: any) => r.status === "pending");
    const totalCpDistributed = grantedRewards.reduce((sum: number, r: any) => sum + (r.cp_amount || 0), 0);
    const thisMonthCp = grantedRewards
      .filter((r: any) => r.granted_at && new Date(r.granted_at) >= monthStart)
      .reduce((sum: number, r: any) => sum + (r.cp_amount || 0), 0);

    return {
      totalGranted: grantedRewards.length,
      pendingCount: pendingRewards.length,
      totalCpDistributed,
      thisMonthCp,
    };
  }, [allRewards]);

  /* ---- Filtered & searched records ---- */

  const filteredRewards = useMemo(() => {
    let filtered = allRewards;

    if (statusFilter !== "all") {
      filtered = filtered.filter((r: any) => r.status === statusFilter);
    }
    if (typeFilter !== "all") {
      filtered = filtered.filter((r: any) => r.reward_type === typeFilter);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((r: any) => {
        const referrerProfile = profilesMap[r.referrer_id];
        const referredProfile = r.referred_id ? profilesMap[r.referred_id] : null;
        const referrerEmail = referrerProfile?.email?.toLowerCase() || "";
        const referrerName = referrerProfile?.full_name?.toLowerCase() || "";
        const referredEmail = referredProfile?.email?.toLowerCase() || "";
        const referredName = referredProfile?.full_name?.toLowerCase() || "";
        const description = (r.description || "").toLowerCase();
        return (
          referrerEmail.includes(query) ||
          referrerName.includes(query) ||
          referredEmail.includes(query) ||
          referredName.includes(query) ||
          description.includes(query)
        );
      });
    }

    return filtered;
  }, [allRewards, statusFilter, typeFilter, searchQuery, profilesMap]);

  const visibleRewards = filteredRewards.slice(0, displayLimit);
  const hasMore = filteredRewards.length > displayLimit;

  /* ---- Cancel reward mutation ---- */

  const cancelMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      const { data, error } = await supabase.functions.invoke("grant-reward", {
        body: { action: "cancel_reward", reward_id: rewardId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rewards"] });
      toast.success(txt.cancelSuccess);
    },
    onError: () => {
      toast.error(txt.cancelError);
    },
  });

  /* ---- Batch grant mutation ---- */

  const batchMutation = useMutation({
    mutationFn: async () => {
      const emails = batchEmails
        .split("\n")
        .map((email) => email.trim())
        .filter((email) => email.length > 0);

      if (emails.length === 0 || batchCpAmount <= 0) {
        throw new Error("Invalid input");
      }

      // Resolve emails to user IDs
      const { data: profileMatches, error: profileError } = await supabase
        .from("profiles")
        .select("id, email")
        .in("email", emails);

      if (profileError) throw profileError;

      const emailToIdMap: Record<string, string> = {};
      (profileMatches || []).forEach((profile: any) => {
        emailToIdMap[profile.email.toLowerCase()] = profile.id;
      });

      const resolvedUserIds: string[] = [];
      const localResults: Array<{ email: string; success: boolean; error?: string }> = [];

      emails.forEach((email) => {
        const userId = emailToIdMap[email.toLowerCase()];
        if (userId) {
          resolvedUserIds.push(userId);
        } else {
          localResults.push({ email, success: false, error: txt.emailNotFound });
        }
      });

      if (resolvedUserIds.length > 0) {
        const { data, error } = await supabase.functions.invoke("grant-reward", {
          body: {
            action: "batch_grant",
            user_ids: resolvedUserIds,
            cp_amount: batchCpAmount,
            description: batchDescription || "Admin batch grant",
          },
        });

        if (error) throw error;

        // Map results back to emails
        if (data?.results) {
          data.results.forEach((result: any) => {
            const matchedEmail = Object.entries(emailToIdMap).find(
              ([, id]) => id === result.user_id
            );
            localResults.push({
              email: matchedEmail ? matchedEmail[0] : result.user_id,
              success: result.success,
              error: result.error,
            });
          });
        }
      }

      return localResults;
    },
    onSuccess: (results) => {
      setBatchResults(results);
      queryClient.invalidateQueries({ queryKey: ["admin-rewards"] });
      const successCount = results.filter((r) => r.success).length;
      toast.success(`${txt.batchSuccess}: ${successCount}/${results.length}`);
    },
    onError: (error: Error) => {
      toast.error(`${txt.batchError}: ${error.message}`);
    },
  });

  /* ---- Helpers ---- */

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(
      language === "en" ? "en-US" : language === "zh-CN" ? "zh-CN" : "zh-TW",
      { year: "numeric", month: "short", day: "numeric" }
    );
  };

  const getTypeLabel = (rewardType: string): string => {
    const key = rewardType as keyof typeof txt;
    return txt[key] || rewardType;
  };

  const getStatusLabel = (status: string): string => {
    const key = status as keyof typeof txt;
    return txt[key] || status;
  };

  const getUserDisplay = (userId: string | null): string => {
    if (!userId) return "—";
    const profile = profilesMap[userId];
    if (profile) {
      return profile.full_name || profile.email || userId.substring(0, 8);
    }
    return userId.substring(0, 8);
  };

  const getUserEmail = (userId: string | null): string => {
    if (!userId) return "";
    const profile = profilesMap[userId];
    return profile?.email || "";
  };

  /* ---- Stats cards ---- */

  const statCards = [
    {
      label: txt.totalGranted,
      value: stats.totalGranted,
      icon: CheckCircle2,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
    {
      label: txt.pendingRewards,
      value: stats.pendingCount,
      icon: Clock,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50",
    },
    {
      label: txt.totalCpDistributed,
      value: stats.totalCpDistributed.toLocaleString(),
      suffix: " CP",
      icon: DollarSign,
      iconColor: "text-sky-600",
      iconBg: "bg-sky-50",
    },
    {
      label: txt.thisMonth,
      value: stats.thisMonthCp.toLocaleString(),
      suffix: " CP",
      icon: Calendar,
      iconColor: "text-violet-600",
      iconBg: "bg-violet-50",
    },
  ];

  /* ---- Render ---- */

  if (loadingRewards) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{txt.pageTitle}</h1>
        <p className="text-sm text-slate-500 mt-1">{txt.pageDesc}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className="bg-white rounded-xl border border-slate-200 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500">{card.label}</span>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", card.iconBg)}>
                <card.icon className={cn("w-4 h-4", card.iconColor)} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-800 font-mono">
              {card.value}
              {card.suffix && <span className="text-sm font-medium text-slate-400 ml-0.5">{card.suffix}</span>}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Organization Grant Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="bg-white rounded-xl border border-slate-200"
      >
        <button
          onClick={() => setOrgGrantExpanded(!orgGrantExpanded)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors rounded-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-violet-600" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-slate-700">{txt.orgGrantTitle}</div>
              <div className="text-xs text-slate-500">{txt.orgGrantDesc}</div>
            </div>
          </div>
          {orgGrantExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {orgGrantExpanded && (
          <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Left: Organization → User picker */}
              <div className="space-y-3">
                {/* Org selector */}
                {!selectedOrgId ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      <Building2 className="w-3.5 h-3.5 inline mr-1 opacity-60" />
                      {txt.selectOrg}
                    </label>
                    <div className="relative mb-2">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        value={orgSearch}
                        onChange={(event) => setOrgSearch(event.target.value)}
                        placeholder={txt.searchOrg}
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-200"
                      />
                    </div>
                    <div className="border border-slate-200 rounded-lg max-h-[200px] overflow-y-auto">
                      {filteredOrgs.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">{txt.noOrgs}</div>
                      ) : (
                        filteredOrgs.map((org: any) => (
                          <button
                            key={org.id}
                            onClick={() => { setSelectedOrgId(org.id); setSelectedOrgUserIds(new Set()); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-violet-50 transition-colors border-b border-slate-100 last:border-0"
                          >
                            <Building2 className="w-4 h-4 text-violet-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-700 truncate">{org.name}</p>
                              {org.short_code && <p className="text-[10px] text-slate-400">{org.short_code}</p>}
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Selected org header */}
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-slate-600">
                        <Users className="w-3.5 h-3.5 inline mr-1 opacity-60" />
                        {txt.selectUsers}
                      </label>
                      <button
                        onClick={() => { setSelectedOrgId(null); setSelectedOrgUserIds(new Set()); }}
                        className="text-[10px] text-violet-600 hover:underline flex items-center gap-1"
                      >
                        <Building2 className="w-3 h-3" />
                        {organizations.find((o: any) => o.id === selectedOrgId)?.name || ""}
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    {/* User search */}
                    <div className="relative mb-2">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        value={orgUserSearch}
                        onChange={(event) => setOrgUserSearch(event.target.value)}
                        placeholder={txt.searchUserInOrg}
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-200"
                      />
                    </div>

                    {/* Select all */}
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-t-lg border border-b-0 border-slate-200">
                      <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filteredOrgUsers.length > 0 && selectedOrgUserIds.size === filteredOrgUsers.length}
                          onChange={toggleAllOrgUsers}
                          className="rounded border-slate-300"
                        />
                        {txt.all} ({filteredOrgUsers.length})
                      </label>
                      <span className="text-[10px] text-violet-600 font-medium">
                        {selectedOrgUserIds.size} {txt.selectedCount}
                      </span>
                    </div>

                    {/* User list */}
                    <div className="border border-slate-200 rounded-b-lg max-h-[200px] overflow-y-auto">
                      {orgUsersLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        </div>
                      ) : filteredOrgUsers.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">{txt.noUsersInOrg}</div>
                      ) : (
                        filteredOrgUsers.map((orgUser: any) => (
                          <label
                            key={orgUser.id}
                            className="flex items-center gap-2.5 px-3 py-2 hover:bg-violet-50/50 transition-colors border-b border-slate-100 last:border-0 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedOrgUserIds.has(orgUser.id)}
                              onChange={() => toggleOrgUser(orgUser.id)}
                              className="rounded border-slate-300"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-700 truncate">{orgUser.full_name || "—"}</p>
                              <p className="text-[10px] text-slate-400 truncate">{orgUser.email}</p>
                            </div>
                            {orgUser.role && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-slate-200">{orgUser.role}</Badge>
                            )}
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Grant config */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">{txt.grantType}</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setOrgGrantType("activity")}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-medium border transition-all",
                        orgGrantType === "activity" ? "border-violet-300 bg-violet-50 text-violet-700" : "border-slate-200 text-slate-500 hover:border-slate-300"
                      )}
                    >
                      {txt.activityCp}
                    </button>
                    <button
                      onClick={() => setOrgGrantType("bonus")}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-medium border transition-all",
                        orgGrantType === "bonus" ? "border-sky-300 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-500 hover:border-slate-300"
                      )}
                    >
                      {txt.bonus}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    <DollarSign className="w-3.5 h-3.5 inline mr-1 opacity-60" />
                    {txt.batchCpAmount}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={orgGrantCpAmount}
                    onChange={(event) => setOrgGrantCpAmount(Number(event.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">{txt.batchDescription}</label>
                  <textarea
                    value={orgGrantReason}
                    onChange={(event) => setOrgGrantReason(event.target.value)}
                    placeholder={txt.batchDescPlaceholder}
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 resize-none"
                  />
                </div>

                <button
                  onClick={() => setShowOrgConfirm(true)}
                  disabled={selectedOrgUserIds.size === 0 || orgGrantCpAmount <= 0}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50"
                  style={{ backgroundColor: "#1a3a5c" }}
                >
                  <UserPlus className="w-4 h-4" />
                  {txt.grantToSelected} ({selectedOrgUserIds.size})
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Organization Grant Confirm Dialog */}
      <AnimatePresence>
        {showOrgConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => setShowOrgConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center mx-auto mb-4">
                <Send className="w-6 h-6 text-violet-600" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">{txt.confirmGrant}</h3>
              <p className="text-xs text-slate-500 mb-4">
                {selectedOrgUserIds.size} {txt.batchUserCount} · {orgGrantCpAmount} CP · {orgGrantType === "activity" ? txt.activityCp : txt.bonus}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowOrgConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  {txt.cancel}
                </button>
                <button
                  onClick={() => orgGrantMutation.mutate()}
                  disabled={orgGrantMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 hover:shadow-lg"
                  style={{ backgroundColor: "#1a3a5c" }}
                >
                  {orgGrantMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : txt.confirm}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Batch Grant Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white rounded-xl border border-slate-200"
      >
        <button
          onClick={() => {
            setBatchExpanded(!batchExpanded);
            if (!batchExpanded) setBatchResults(null);
          }}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors rounded-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-100 to-indigo-100 flex items-center justify-center">
              <Send className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-slate-700">{txt.batchTitle}</div>
              <div className="text-xs text-slate-500">{txt.batchDesc}</div>
            </div>
          </div>
          {batchExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {batchExpanded && (
          <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  <Users className="w-3.5 h-3.5 inline mr-1 opacity-60" />
                  {txt.batchUserIds}
                </label>
                <textarea
                  value={batchEmails}
                  onChange={(event) => setBatchEmails(event.target.value)}
                  placeholder={txt.batchUserIdsPlaceholder}
                  rows={5}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 resize-none"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    <DollarSign className="w-3.5 h-3.5 inline mr-1 opacity-60" />
                    {txt.batchCpAmount}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={batchCpAmount}
                    onChange={(event) => setBatchCpAmount(Number(event.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">{txt.batchDescription}</label>
                  <textarea
                    value={batchDescription}
                    onChange={(event) => setBatchDescription(event.target.value)}
                    placeholder={txt.batchDescPlaceholder}
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                onClick={() => batchMutation.mutate()}
                disabled={batchMutation.isPending || !batchEmails.trim() || batchCpAmount <= 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {batchMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {batchMutation.isPending ? txt.batchGranting : txt.batchGrantBtn}
              </button>
            </div>

            {/* Batch Results */}
            {batchResults && batchResults.length > 0 && (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                  <span className="text-xs font-semibold text-slate-600">
                    {txt.batchResults} — {batchResults.filter((r) => r.success).length} {txt.succeeded},{" "}
                    {batchResults.filter((r) => !r.success).length} {txt.failed}
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {batchResults.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-4 py-2 border-b border-slate-100 last:border-b-0 text-xs"
                    >
                      <span className="font-mono text-slate-600">{result.email}</span>
                      {result.success ? (
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px]">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {txt.succeeded}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 text-[10px]">
                          <XCircle className="w-3 h-3 mr-1" />
                          {result.error || txt.failed}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl border border-slate-200 p-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={txt.searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-slate-200 text-sm px-3 py-2 text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
            >
              <option value="all">{txt.statusFilter}: {txt.all}</option>
              <option value="pending">{txt.pending}</option>
              <option value="granted">{txt.granted}</option>
              <option value="cancelled">{txt.cancelled}</option>
            </select>
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="rounded-lg border border-slate-200 text-sm px-3 py-2 text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
          >
            <option value="all">{txt.typeFilter}: {txt.all}</option>
            <option value="consultation_completed">{txt.consultation}</option>
            <option value="successful_referral">{txt.referral}</option>
            <option value="sale_achieved">{txt.sale}</option>
          </select>

          {/* Count indicator */}
          <div className="text-xs text-slate-400 ml-auto">
            {filteredRewards.length} / {allRewards.length}
          </div>
        </div>
      </motion.div>

      {/* Rewards Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-white rounded-xl border border-slate-200 overflow-hidden"
      >
        {filteredRewards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Gift className="w-10 h-10 mb-3 opacity-40" />
            <span className="text-sm">{txt.noRecords}</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">{txt.date}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">{txt.referrer}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">{txt.referred}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">{txt.type}</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">{txt.amount}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">{txt.status}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">{txt.description}</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">{txt.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRewards.map((reward: any) => (
                    <tr key={reward.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                        {formatDate(reward.granted_at || reward.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium text-slate-700">{getUserDisplay(reward.referrer_id)}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{getUserEmail(reward.referrer_id)}</div>
                      </td>
                      <td className="px-4 py-3">
                        {reward.referred_id ? (
                          <>
                            <div className="text-xs font-medium text-slate-700">{getUserDisplay(reward.referred_id)}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{getUserEmail(reward.referred_id)}</div>
                          </>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] font-medium", REWARD_COLORS[reward.reward_type] || "")}
                        >
                          {getTypeLabel(reward.reward_type)}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-slate-200 text-slate-400">
                          {REWARD_CATEGORIES[reward.reward_type] === "activity" ? txt.activityReward : txt.consumptionReward}
                        </Badge>
                      </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-bold text-emerald-600 font-mono">
                          +{reward.cp_amount}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-0.5">CP</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] font-medium", STATUS_COLORS[reward.status] || "")}
                        >
                          {getStatusLabel(reward.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-500 max-w-[180px] truncate block">
                          {reward.description || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {reward.status === "pending" && (
                          <button
                            onClick={() => {
                              if (window.confirm(txt.cancelConfirm)) {
                                cancelMutation.mutate(reward.id);
                              }
                            }}
                            disabled={cancelMutation.isPending}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-3 h-3" />
                            {txt.cancel}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center py-4 border-t border-slate-100">
                <button
                  onClick={() => setDisplayLimit((prev) => prev + 50)}
                  className="text-sm text-sky-600 hover:text-sky-700 font-medium px-4 py-2 rounded-lg hover:bg-sky-50 transition-colors"
                >
                  {txt.loadMore} ({filteredRewards.length - displayLimit} more)
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
