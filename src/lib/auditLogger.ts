import { supabase } from "@/integrations/supabase/client";

export type AuditOperationType =
  | "login"
  | "logout"
  | "create_user"
  | "bulk_import"
  | "assign_assessment"
  | "export_report"
  | "role_change"
  | "sso_config_change"
  | "delete_user"
  | "password_reset"
  | "certification_issued"
  | "cdu_approved"
  | "cdu_rejected"
  | "batch_created"
  | "report_generated"
  | "subscription_changed"
  | "settings_changed";

interface AuditLogEntry {
  operationType: AuditOperationType;
  targetType?: string;
  targetId?: string;
  targetDescription?: string;
  details?: Record<string, unknown>;
}

/**
 * Insert a record into the audit_logs table.
 * Silently ignores errors so it never breaks calling code.
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("audit_logs").insert({
    user_id: user.id,
    user_email: user.email || "unknown",
    operation_type: entry.operationType,
    target_type: entry.targetType || null,
    target_id: entry.targetId || null,
    target_description: entry.targetDescription || null,
    details: entry.details || null,
    ip_address: null,
  });

  if (error) {
    console.warn("[audit] Failed to log:", error.message);
  }
}

/**
 * Log a login event. Called after successful authentication.
 */
export function logLoginEvent(userEmail: string, userId: string): void {
  supabase.from("audit_logs").insert({
    user_id: userId,
    user_email: userEmail,
    operation_type: "login",
    target_type: "session",
    target_id: userId,
    target_description: `User logged in: ${userEmail}`,
    details: { timestamp: new Date().toISOString() },
    ip_address: null,
  }).then(({ error }) => {
    if (error) console.warn("[audit] login log failed:", error.message);
  });
}

/**
 * Log a logout event.
 */
export function logLogoutEvent(userEmail: string, userId: string): void {
  supabase.from("audit_logs").insert({
    user_id: userId,
    user_email: userEmail,
    operation_type: "logout",
    target_type: "session",
    target_id: userId,
    target_description: `User logged out: ${userEmail}`,
    details: { timestamp: new Date().toISOString() },
    ip_address: null,
  }).then(({ error }) => {
    if (error) console.warn("[audit] logout log failed:", error.message);
  });
}
