import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import {
  notifyCduReviewResult,
  notifyRenewalReviewResult,
  notifyCertificationIssued,
} from "@/lib/certificationNotifications";

// ==================== Types ====================

export interface Certification {
  id: string;
  user_id: string;
  certification_type: string;
  certification_number: string;
  issue_date: string;
  expiry_date: string;
  renewal_cycle_years: number;
  certification_status: string;
  minimum_cdu_hours: number;
  issued_by: string | null;
  organization_id: string | null;
  notes: string | null;
  cycle_start_date: string | null;
  certificate_hash: string | null;
  cert_code: string | null;
  first_name_en: string | null;
  last_name_en: string | null;
  recertification_date: string | null;
  recertification_count: number;
  certificate_type_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CertificateType {
  id: string;
  cert_code: string;
  cert_name_en: string;
  cert_name_zh_cn: string | null;
  cert_name_zh_tw: string | null;
  description_en: string | null;
  description_zh_cn: string | null;
  description_zh_tw: string | null;
  gcqa_code: string | null;
  renewal_cycle_years: number;
  minimum_cdu_hours: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CduRecord {
  id: string;
  user_id: string;
  certification_id: string;
  activity_type: string;
  activity_title: string;
  activity_provider: string | null;
  activity_date: string;
  cdu_hours: number;
  proof_document_url: string | null;
  approval_status: string;
  reviewer_id: string | null;
  review_comment: string | null;
  reviewed_at: string | null;
  organization_id: string | null;
  cdu_type: "A" | "B";
  auto_verified: boolean;
  start_date: string | null;
  end_date: string | null;
  course_catalog_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseCatalogEntry {
  id: string;
  course_code: string;
  course_name: string;
  course_name_zh: string | null;
  description: string | null;
  description_zh: string | null;
  course_provider: string;
  course_type: string;
  cdu_hours: number;
  is_official: boolean;
  is_active: boolean;
  prerequisites: string | null;
  organization_id: string | null;
  created_by: string | null;
  institution: string | null;
  year_tag: string | null;
  cdu_class: "A" | "B";
  is_recorded: boolean;
  course_url: string | null;
  credit_conditions: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseEnrollment {
  id: string;
  course_id: string;
  user_id: string;
  certification_id: string | null;
  enrollment_date: string;
  attendance_confirmed: boolean;
  attendance_date: string | null;
  assignment_submitted: boolean;
  assignment_submitted_at: string | null;
  assignment_grade: string | null;
  completion_status: string;
  completed_at: string | null;
  cdu_auto_generated: boolean;
  cdu_record_id: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface RenewalApplication {
  id: string;
  user_id: string;
  certification_id: string;
  application_date: string;
  status: string;
  total_cdu_hours: number;
  cdu_summary: unknown[];
  supporting_documents: unknown[];
  reviewer_id: string | null;
  review_comment: string | null;
  reviewed_at: string | null;
  new_issue_date: string | null;
  new_expiry_date: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CertificationReviewLog {
  id: string;
  reviewer_id: string;
  reviewer_email: string | null;
  target_type: string;
  target_id: string;
  action: string;
  previous_status: string | null;
  new_status: string | null;
  comment: string | null;
  organization_id: string | null;
  created_at: string;
}

// ==================== My Certification (Consultant) ====================

export function useMyCertification() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-certification", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("certifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Certification | null;
    },
    enabled: !!user?.id,
  });
}

// ==================== CDU Records ====================

export function useMyCduRecords(certificationId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-cdu-records", user?.id, certificationId],
    queryFn: async () => {
      if (!user?.id) return [];
      let query = supabase
        .from("cdu_records")
        .select("*")
        .eq("user_id", user.id)
        .order("activity_date", { ascending: false });
      if (certificationId) {
        query = query.eq("certification_id", certificationId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CduRecord[];
    },
    enabled: !!user?.id,
  });
}

export function useCreateCduRecord() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (record: Omit<CduRecord, "id" | "created_at" | "updated_at" | "reviewer_id" | "review_comment" | "reviewed_at" | "approval_status">) => {
      const { data, error } = await supabase
        .from("cdu_records")
        .insert({ ...record, user_id: user!.id, approval_status: "pending" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-cdu-records"] });
    },
  });
}

// ==================== Renewal Applications ====================

export function useMyRenewals(certificationId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-renewals", user?.id, certificationId],
    queryFn: async () => {
      if (!user?.id) return [];
      let query = supabase
        .from("renewal_applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (certificationId) {
        query = query.eq("certification_id", certificationId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as RenewalApplication[];
    },
    enabled: !!user?.id,
  });
}

export function useCreateRenewal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: { certification_id: string; total_cdu_hours: number; cdu_summary: unknown[]; organization_id?: string }) => {
      const { data, error } = await supabase
        .from("renewal_applications")
        .insert({
          user_id: user!.id,
          certification_id: payload.certification_id,
          total_cdu_hours: payload.total_cdu_hours,
          cdu_summary: payload.cdu_summary,
          status: "submitted",
          organization_id: payload.organization_id || null,
        })
        .select()
        .single();
      if (error) throw error;
      // Update certification status
      await supabase
        .from("certifications")
        .update({ certification_status: "under_review", updated_at: new Date().toISOString() })
        .eq("id", payload.certification_id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-renewals"] });
      queryClient.invalidateQueries({ queryKey: ["my-certification"] });
    },
  });
}

// ==================== Org Admin Queries ====================

export function useOrgCertifications() {
  const { organizationId } = usePermissions();
  return useQuery({
    queryKey: ["org-certifications", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("certifications")
        .select("*")
        .eq("organization_id", organizationId)
        .order("expiry_date", { ascending: true });
      if (error) throw error;
      return (data || []) as Certification[];
    },
    enabled: !!organizationId,
  });
}

export function useOrgCduRecords() {
  const { organizationId } = usePermissions();
  return useQuery({
    queryKey: ["org-cdu-records", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("cdu_records")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as CduRecord[];
    },
    enabled: !!organizationId,
  });
}

export function useOrgRenewals() {
  const { organizationId } = usePermissions();
  return useQuery({
    queryKey: ["org-renewals", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("renewal_applications")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as RenewalApplication[];
    },
    enabled: !!organizationId,
  });
}

// ==================== Super Admin Queries ====================

export function useAllCertifications() {
  return useQuery({
    queryKey: ["all-certifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certifications")
        .select("*")
        .order("expiry_date", { ascending: true });
      if (error) throw error;
      return (data || []) as Certification[];
    },
  });
}

export function useAllCduRecords() {
  return useQuery({
    queryKey: ["all-cdu-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cdu_records")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as CduRecord[];
    },
  });
}

export function useAllRenewals() {
  return useQuery({
    queryKey: ["all-renewals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("renewal_applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as RenewalApplication[];
    },
  });
}

export function useAllReviewLogs() {
  return useQuery({
    queryKey: ["all-review-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certification_review_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as CertificationReviewLog[];
    },
  });
}

// ==================== Review Mutations ====================

export function useReviewCduRecord() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  return useMutation({
    mutationFn: async (payload: { recordId: string; decision: "approved" | "rejected"; comment?: string; organizationId?: string }) => {
      // Fetch record details before updating for notification
      const { data: recordData } = await supabase
        .from("cdu_records")
        .select("user_id, activity_title")
        .eq("id", payload.recordId)
        .single();

      const { error: updateError } = await supabase
        .from("cdu_records")
        .update({
          approval_status: payload.decision,
          reviewer_id: user!.id,
          review_comment: payload.comment || null,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.recordId);
      if (updateError) throw updateError;

      await supabase.from("certification_review_logs").insert({
        reviewer_id: user!.id,
        reviewer_email: profile?.email || null,
        target_type: "cdu_record",
        target_id: payload.recordId,
        action: payload.decision === "approved" ? "approve" : "reject",
        previous_status: "pending",
        new_status: payload.decision,
        comment: payload.comment || null,
        organization_id: payload.organizationId || null,
      });

      // Send notification to the CDU record owner
      if (recordData) {
        notifyCduReviewResult({
          recipientId: recordData.user_id,
          activityTitle: recordData.activity_title,
          decision: payload.decision,
          reviewerComment: payload.comment,
          organizationId: payload.organizationId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-cdu-records"] });
      queryClient.invalidateQueries({ queryKey: ["all-cdu-records"] });
      queryClient.invalidateQueries({ queryKey: ["all-review-logs"] });
    },
  });
}

export function useReviewRenewal() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  return useMutation({
    mutationFn: async (payload: {
      renewalId: string;
      certificationId: string;
      decision: "approved" | "rejected";
      comment?: string;
      renewalCycleYears?: number;
      organizationId?: string;
    }) => {
      const newStatus = payload.decision === "approved" ? "approved" : "rejected";

      // Fetch renewal and certification info for notification
      const { data: renewalData } = await supabase
        .from("renewal_applications")
        .select("user_id")
        .eq("id", payload.renewalId)
        .single();

      const { data: certData } = await supabase
        .from("certifications")
        .select("certification_number")
        .eq("id", payload.certificationId)
        .single();

      const renewalUpdate: Record<string, unknown> = {
        status: newStatus,
        reviewer_id: user!.id,
        review_comment: payload.comment || null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      let newExpiryDateStr: string | undefined;

      if (payload.decision === "approved") {
        const today = new Date();
        const cycleYears = payload.renewalCycleYears || 5;
        const newExpiry = new Date(today);
        newExpiry.setFullYear(newExpiry.getFullYear() + cycleYears);
        renewalUpdate.new_issue_date = today.toISOString().split("T")[0];
        renewalUpdate.new_expiry_date = newExpiry.toISOString().split("T")[0];
        newExpiryDateStr = newExpiry.toISOString().split("T")[0];

        // Fetch current recertification_count to increment
        const { data: currentCert } = await supabase
          .from("certifications")
          .select("recertification_count")
          .eq("id", payload.certificationId)
          .single();

        const currentCount = currentCert?.recertification_count ?? 0;

        // Update certification with new cycle — reset cycle_start_date, increment recertification_count
        await supabase
          .from("certifications")
          .update({
            certification_status: "active",
            issue_date: today.toISOString().split("T")[0],
            expiry_date: newExpiry.toISOString().split("T")[0],
            cycle_start_date: today.toISOString().split("T")[0],
            recertification_count: currentCount + 1,
            recertification_date: today.toISOString().split("T")[0],
            updated_at: new Date().toISOString(),
          })
          .eq("id", payload.certificationId);
      } else {
        // Rejected - revert to pending_renewal
        await supabase
          .from("certifications")
          .update({
            certification_status: "pending_renewal",
            updated_at: new Date().toISOString(),
          })
          .eq("id", payload.certificationId);
      }

      const { error } = await supabase
        .from("renewal_applications")
        .update(renewalUpdate)
        .eq("id", payload.renewalId);
      if (error) throw error;

      await supabase.from("certification_review_logs").insert({
        reviewer_id: user!.id,
        reviewer_email: profile?.email || null,
        target_type: "renewal_application",
        target_id: payload.renewalId,
        action: payload.decision === "approved" ? "approve" : "reject",
        previous_status: "under_review",
        new_status: newStatus,
        comment: payload.comment || null,
        organization_id: payload.organizationId || null,
      });

      // Send notification to the renewal applicant
      if (renewalData && certData) {
        notifyRenewalReviewResult({
          recipientId: renewalData.user_id,
          certificationNumber: certData.certification_number,
          decision: payload.decision,
          newExpiryDate: newExpiryDateStr,
          reviewerComment: payload.comment,
          organizationId: payload.organizationId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-renewals"] });
      queryClient.invalidateQueries({ queryKey: ["all-renewals"] });
      queryClient.invalidateQueries({ queryKey: ["org-certifications"] });
      queryClient.invalidateQueries({ queryKey: ["all-certifications"] });
      queryClient.invalidateQueries({ queryKey: ["all-review-logs"] });
    },
  });
}

// ==================== Certificate Types ====================

export function useCertificateTypes() {
  return useQuery({
    queryKey: ["certificate-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificate_types")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as CertificateType[];
    },
  });
}

export function useActiveCertificateTypes() {
  return useQuery({
    queryKey: ["certificate-types-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificate_types")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as CertificateType[];
    },
  });
}

// ==================== Certificate Number Generation ====================

export async function generateCertificateNumber(
  certCode: string,
  gcqaCode: string | null,
  accountSuffix: string
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = gcqaCode || certCode;

  // Query the max existing serial for this cert_code and year
  const pattern = `${prefix}${year}%`;
  const { data: existingCerts } = await supabase
    .from("certifications")
    .select("certification_number")
    .like("certification_number", pattern)
    .order("certification_number", { ascending: false })
    .limit(1);

  let nextSerial = 1;
  if (existingCerts && existingCerts.length > 0) {
    const lastNumber = existingCerts[0].certification_number;
    const prefixLength = prefix.length + 4; // prefix + year (4 digits)
    const serialPart = lastNumber.substring(prefixLength, prefixLength + 3);
    const parsed = parseInt(serialPart, 10);
    if (!isNaN(parsed)) {
      nextSerial = parsed + 1;
    }
  }

  const serialStr = String(nextSerial).padStart(3, "0");
  return `${prefix}${year}${serialStr}${accountSuffix}`;
}

export async function generateCertificateHash(certNumber: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(certNumber + Date.now().toString());
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

// ==================== Issue Certification ====================

export function useIssueCertification() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  return useMutation({
    mutationFn: async (payload: {
      userId: string;
      certificateTypeId: string;
      certCode: string;
      gcqaCode?: string | null;
      firstNameEn?: string;
      lastNameEn?: string;
      certificationType?: string;
      renewalCycleYears?: number;
      minimumCduHours?: number;
      organizationId?: string;
    }) => {
      const cycleYears = payload.renewalCycleYears || 5;
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const expiryDate = new Date(today);
      expiryDate.setFullYear(expiryDate.getFullYear() + cycleYears);
      const expiryStr = expiryDate.toISOString().split("T")[0];

      // Generate account suffix from user ID (first 4 chars uppercase)
      const accountSuffix = payload.userId.substring(0, 4).toUpperCase();

      // Generate V8.1 certificate number: {certCode}{YYYY}{serial}{accountSuffix}
      const certNumber = await generateCertificateNumber(
        payload.certCode,
        payload.gcqaCode || null,
        accountSuffix
      );

      // Generate certificate hash for security
      const certificateHash = await generateCertificateHash(certNumber);

      const { data, error } = await supabase
        .from("certifications")
        .insert({
          user_id: payload.userId,
          certification_type: payload.certificationType || payload.certCode.toLowerCase(),
          certification_number: certNumber,
          issue_date: todayStr,
          expiry_date: expiryStr,
          cycle_start_date: todayStr,
          renewal_cycle_years: cycleYears,
          minimum_cdu_hours: payload.minimumCduHours || 80,
          issued_by: user!.id,
          organization_id: payload.organizationId || null,
          certification_status: "active",
          certificate_hash: certificateHash,
          cert_code: payload.certCode,
          first_name_en: payload.firstNameEn || null,
          last_name_en: payload.lastNameEn || null,
          recertification_date: todayStr,
          recertification_count: 0,
          certificate_type_id: payload.certificateTypeId,
        })
        .select()
        .single();
      if (error) throw error;

      await supabase.from("certification_review_logs").insert({
        reviewer_id: user!.id,
        reviewer_email: profile?.email || null,
        target_type: "certification",
        target_id: data.id,
        action: "issue",
        new_status: "active",
        comment: `Issued ${payload.certCode} certification: ${certNumber}`,
        organization_id: payload.organizationId || null,
      });

      // Send notification to the new certificate holder
      notifyCertificationIssued({
        recipientId: payload.userId,
        certificationNumber: certNumber,
        certificationType: payload.certificationType || payload.certCode.toLowerCase(),
        expiryDate: expiryStr,
        organizationId: payload.organizationId,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-certifications"] });
      queryClient.invalidateQueries({ queryKey: ["org-certifications"] });
      queryClient.invalidateQueries({ queryKey: ["all-review-logs"] });
    },
  });
}

// ==================== Public Verification ====================

export interface CertificationSearchResult {
  certification: Certification;
  profile: { id: string; full_name: string | null; email: string | null; first_name_en?: string | null; last_name_en?: string | null } | null;
}

export function useSearchCertifications(searchTerm: string | null) {
  return useQuery({
    queryKey: ["search-certifications", searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.trim().length < 2) return [];

      const term = searchTerm.trim();
      const results: CertificationSearchResult[] = [];
      const certIds = new Set<string>();

      // Search by certificate number (partial match)
      const { data: certsByNumber } = await supabase
        .from("certifications")
        .select("*")
        .ilike("certification_number", `%${term}%`);

      if (certsByNumber) {
        certsByNumber.forEach((cert) => {
          if (!certIds.has(cert.id)) {
            certIds.add(cert.id);
            results.push({ certification: cert as Certification, profile: null });
          }
        });
      }

      // Search profiles by name (Chinese full_name, English first/last)
      const { data: profilesByName } = await supabase
        .from("profiles")
        .select("id, full_name, email, first_name_en, last_name_en")
        .or(`full_name.ilike.%${term}%,first_name_en.ilike.%${term}%,last_name_en.ilike.%${term}%`);

      if (profilesByName && profilesByName.length > 0) {
        const userIds = profilesByName.map((profileRow) => profileRow.id);
        const { data: certsByUsers } = await supabase
          .from("certifications")
          .select("*")
          .in("user_id", userIds);

        if (certsByUsers) {
          certsByUsers.forEach((cert) => {
            if (!certIds.has(cert.id)) {
              certIds.add(cert.id);
              results.push({ certification: cert as Certification, profile: null });
            }
          });
        }
      }

      // Fetch profiles for all results
      const allUserIds = [...new Set(results.map((resultItem) => resultItem.certification.user_id))];
      if (allUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email, first_name_en, last_name_en")
          .in("id", allUserIds);

        const profileMap: Record<string, CertificationSearchResult["profile"]> = {};
        (profiles || []).forEach((profileRow) => {
          profileMap[profileRow.id] = profileRow as CertificationSearchResult["profile"];
        });

        results.forEach((resultItem) => {
          resultItem.profile = profileMap[resultItem.certification.user_id] || null;
        });
      }

      return results;
    },
    enabled: !!searchTerm && searchTerm.trim().length >= 2,
    retry: false,
  });
}

export function useVerifyCertification(certificationNumber: string | null) {
  return useQuery({
    queryKey: ["verify-certification", certificationNumber],
    queryFn: async () => {
      if (!certificationNumber) return null;
      const { data, error } = await supabase
        .from("certifications")
        .select("id, certification_number, certification_type, certification_status, issue_date, expiry_date, renewal_cycle_years, user_id")
        .eq("certification_number", certificationNumber)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      // Fetch holder profile (name only)
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", data.user_id)
        .maybeSingle();

      return {
        certificationNumber: data.certification_number,
        certificationType: data.certification_type,
        certificationStatus: data.certification_status,
        issueDate: data.issue_date,
        expiryDate: data.expiry_date,
        renewalCycleYears: data.renewal_cycle_years,
        holderName: profileData?.full_name || null,
        holderEmailMasked: profileData?.email
          ? profileData.email.replace(/(.{2})(.*)(@.*)/, "$1***$3")
          : null,
      };
    },
    enabled: !!certificationNumber && certificationNumber.length > 3,
    retry: false,
  });
}

// ==================== CDU Summary Calculations ====================

export function useCduSummary(certificationId?: string) {
  const cduQuery = useMyCduRecords(certificationId);
  const certQuery = useMyCertification();

  const approvedRecords = (cduQuery.data || []).filter((record) => record.approval_status === "approved");
  const pendingRecords = (cduQuery.data || []).filter((record) => record.approval_status === "pending");
  const totalApprovedHours = approvedRecords.reduce((sum, record) => sum + Number(record.cdu_hours), 0);
  const totalPendingHours = pendingRecords.reduce((sum, record) => sum + Number(record.cdu_hours), 0);
  const minimumRequired = certQuery.data?.minimum_cdu_hours || 80;
  const remainingHours = Math.max(0, minimumRequired - totalApprovedHours);
  const progressPercent = Math.min(100, (totalApprovedHours / minimumRequired) * 100);
  const isEligibleForRenewal = totalApprovedHours >= minimumRequired;

  const typeARecords = approvedRecords.filter((r) => (r as CduRecord).cdu_type === "A");
  const typeBRecords = approvedRecords.filter((r) => (r as CduRecord).cdu_type === "B");
  const typeAHours = typeARecords.reduce((sum, r) => sum + Number(r.cdu_hours), 0);
  const typeBHours = typeBRecords.reduce((sum, r) => sum + Number(r.cdu_hours), 0);

  return {
    approvedRecords,
    pendingRecords,
    totalApprovedHours,
    totalPendingHours,
    minimumRequired,
    remainingHours,
    progressPercent,
    isEligibleForRenewal,
    typeAHours,
    typeBHours,
    isLoading: cduQuery.isLoading || certQuery.isLoading,
  };
}

// ==================== Course Catalog ====================

export function useCourseCatalog(organizationId?: string | null) {
  return useQuery({
    queryKey: ["course-catalog", organizationId],
    queryFn: async () => {
      let query = supabase
        .from("cdu_course_catalog")
        .select("*")
        .eq("is_active", true)
        .order("course_code", { ascending: true });
      if (organizationId) {
        query = query.or(`organization_id.eq.${organizationId},organization_id.is.null`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CourseCatalogEntry[];
    },
  });
}

export function useAllCourseCatalog() {
  return useQuery({
    queryKey: ["all-course-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cdu_course_catalog")
        .select("*")
        .order("course_code", { ascending: true });
      if (error) throw error;
      return (data || []) as CourseCatalogEntry[];
    },
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (course: Omit<CourseCatalogEntry, "id" | "created_at" | "updated_at" | "created_by">) => {
      const { data, error } = await supabase
        .from("cdu_course_catalog")
        .insert({ ...course, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-catalog"] });
      queryClient.invalidateQueries({ queryKey: ["all-course-catalog"] });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { courseId: string; updates: Partial<CourseCatalogEntry> }) => {
      const { error } = await supabase
        .from("cdu_course_catalog")
        .update({ ...payload.updates, updated_at: new Date().toISOString() })
        .eq("id", payload.courseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-catalog"] });
      queryClient.invalidateQueries({ queryKey: ["all-course-catalog"] });
    },
  });
}

// ==================== Course Enrollments ====================

export function useCourseEnrollments(courseId?: string) {
  return useQuery({
    queryKey: ["course-enrollments", courseId],
    queryFn: async () => {
      let query = supabase
        .from("course_enrollments")
        .select("*")
        .order("created_at", { ascending: false });
      if (courseId) query = query.eq("course_id", courseId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CourseEnrollment[];
    },
    enabled: !!courseId,
  });
}

export function useAutoGenerateATypeCdu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      enrollmentId: string;
      userId: string;
      certificationId: string;
      courseId: string;
      courseName: string;
      courseProvider: string;
      cduHours: number;
      startDate: string;
      endDate: string;
      organizationId?: string;
    }) => {
      // 1. Create A-type CDU record (auto-approved)
      const { data: cduRecord, error: cduError } = await supabase
        .from("cdu_records")
        .insert({
          user_id: payload.userId,
          certification_id: payload.certificationId,
          activity_type: "training",
          activity_title: payload.courseName,
          activity_provider: payload.courseProvider,
          activity_date: payload.endDate,
          start_date: payload.startDate,
          end_date: payload.endDate,
          cdu_hours: payload.cduHours,
          cdu_type: "A",
          auto_verified: true,
          approval_status: "approved",
          course_catalog_id: payload.courseId,
          organization_id: payload.organizationId || null,
        })
        .select()
        .single();
      if (cduError) throw cduError;

      // 2. Update enrollment with CDU link
      await supabase
        .from("course_enrollments")
        .update({
          cdu_auto_generated: true,
          cdu_record_id: cduRecord.id,
          completion_status: "completed",
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.enrollmentId);

      return cduRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-cdu-records"] });
      queryClient.invalidateQueries({ queryKey: ["org-cdu-records"] });
      queryClient.invalidateQueries({ queryKey: ["all-cdu-records"] });
      queryClient.invalidateQueries({ queryKey: ["course-enrollments"] });
    },
  });
}

// ==================== Certification Applications ====================

export interface CertificationApplication {
  id: string;
  user_id: string;
  certificate_type_id: string;
  certification_type: string | null;
  first_name_en: string | null;
  last_name_en: string | null;
  full_name_zh: string | null;
  application_data: Record<string, unknown> | null;
  supporting_documents: Array<{ name: string; url: string }> | null;
  status: string;
  reviewer_id: string | null;
  review_comment: string | null;
  reviewed_at: string | null;
  certification_id: string | null;
  organization_id: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useMyCertificationApplications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-certification-applications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("certification_applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as CertificationApplication[];
    },
    enabled: !!user?.id,
  });
}

export function useCreateCertificationApplication() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: {
      certificateTypeId: string;
      certificationType: string;
      firstNameEn: string;
      lastNameEn: string;
      fullNameZh: string;
      applicationData?: Record<string, unknown>;
      organizationId?: string;
    }) => {
      const { data, error } = await supabase
        .from("certification_applications")
        .insert({
          user_id: user!.id,
          certificate_type_id: payload.certificateTypeId,
          certification_type: payload.certificationType,
          first_name_en: payload.firstNameEn,
          last_name_en: payload.lastNameEn,
          full_name_zh: payload.fullNameZh,
          application_data: payload.applicationData || null,
          status: "submitted",
          submitted_at: new Date().toISOString(),
          organization_id: payload.organizationId || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as CertificationApplication;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-certification-applications"] });
    },
  });
}

// ==================== Batch Operations ====================

export function useBatchReviewCdu() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  return useMutation({
    mutationFn: async (payload: { recordIds: string[]; decision: "approved" | "rejected"; comment?: string; organizationId?: string }) => {
      const { error } = await supabase
        .from("cdu_records")
        .update({
          approval_status: payload.decision,
          reviewer_id: user!.id,
          review_comment: payload.comment || null,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .in("id", payload.recordIds);
      if (error) throw error;

      // Batch insert review logs
      const logs = payload.recordIds.map((recordId) => ({
        reviewer_id: user!.id,
        reviewer_email: profile?.email || null,
        target_type: "cdu_record" as const,
        target_id: recordId,
        action: payload.decision === "approved" ? "approve" : "reject",
        previous_status: "pending",
        new_status: payload.decision,
        comment: payload.comment || null,
        organization_id: payload.organizationId || null,
      }));
      await supabase.from("certification_review_logs").insert(logs);

      return { count: payload.recordIds.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-cdu-records"] });
      queryClient.invalidateQueries({ queryKey: ["all-cdu-records"] });
      queryClient.invalidateQueries({ queryKey: ["all-review-logs"] });
    },
  });
}

export function useBatchAssignATypeCdu() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: {
      userCertPairs: Array<{ userId: string; certificationId: string }>;
      courseId: string;
      courseName: string;
      courseProvider: string;
      cduHours: number;
      activityDate: string;
      organizationId?: string;
    }) => {
      const records = payload.userCertPairs.map((pair) => ({
        user_id: pair.userId,
        certification_id: pair.certificationId,
        activity_type: "training",
        activity_title: payload.courseName,
        activity_provider: payload.courseProvider,
        activity_date: payload.activityDate,
        start_date: payload.activityDate,
        end_date: payload.activityDate,
        cdu_hours: payload.cduHours,
        cdu_type: "A",
        auto_verified: true,
        approval_status: "approved",
        course_catalog_id: payload.courseId,
        organization_id: payload.organizationId || null,
      }));
      const { error } = await supabase.from("cdu_records").insert(records);
      if (error) throw error;
      return { count: records.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-cdu-records"] });
      queryClient.invalidateQueries({ queryKey: ["org-cdu-records"] });
      queryClient.invalidateQueries({ queryKey: ["all-cdu-records"] });
    },
  });
}
