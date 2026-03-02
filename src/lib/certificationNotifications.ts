import { supabase } from "@/integrations/supabase/client";

interface NotificationPayload {
  recipientId: string;
  subject: string;
  content: string;
  messageType: "notification" | "reminder";
  metadata?: Record<string, unknown>;
  organizationId?: string | null;
}

async function sendNotification(payload: NotificationPayload): Promise<void> {
  const { error } = await supabase.from("messages").insert({
    recipient_id: payload.recipientId,
    subject: payload.subject,
    content: payload.content,
    message_type: payload.messageType,
    channel: "system" as const,
    metadata: payload.metadata || {},
    organization_id: payload.organizationId || null,
  });
  if (error) {
    console.error("Failed to send certification notification:", error);
  }
}

export async function notifyCduReviewResult(params: {
  recipientId: string;
  activityTitle: string;
  decision: "approved" | "rejected";
  reviewerComment?: string;
  organizationId?: string | null;
}): Promise<void> {
  const isApproved = params.decision === "approved";
  await sendNotification({
    recipientId: params.recipientId,
    subject: isApproved
      ? `CDU record approved: ${params.activityTitle} / CDU 记录已通过：${params.activityTitle}`
      : `CDU record rejected: ${params.activityTitle} / CDU 记录已驳回：${params.activityTitle}`,
    content: isApproved
      ? `Your CDU activity "${params.activityTitle}" has been approved.${params.reviewerComment ? `\n\nReviewer comment: ${params.reviewerComment}` : ""}\n\n您的 CDU 活动「${params.activityTitle}」已通过审核。${params.reviewerComment ? `\n\n审核意见：${params.reviewerComment}` : ""}`
      : `Your CDU activity "${params.activityTitle}" has been rejected.${params.reviewerComment ? `\n\nReviewer comment: ${params.reviewerComment}` : ""}\n\n您的 CDU 活动「${params.activityTitle}」未通过审核。${params.reviewerComment ? `\n\n审核意见：${params.reviewerComment}` : ""}`,
    messageType: "notification",
    metadata: {
      notification_type: "cdu_review_result",
      decision: params.decision,
      activity_title: params.activityTitle,
    },
    organizationId: params.organizationId,
  });
}

export async function notifyRenewalReviewResult(params: {
  recipientId: string;
  certificationNumber: string;
  decision: "approved" | "rejected";
  newExpiryDate?: string;
  reviewerComment?: string;
  organizationId?: string | null;
}): Promise<void> {
  const isApproved = params.decision === "approved";
  await sendNotification({
    recipientId: params.recipientId,
    subject: isApproved
      ? `Renewal approved — ${params.certificationNumber} / 换证已通过 — ${params.certificationNumber}`
      : `Renewal rejected — ${params.certificationNumber} / 换证被驳回 — ${params.certificationNumber}`,
    content: isApproved
      ? `Your renewal application for certification ${params.certificationNumber} has been approved.${params.newExpiryDate ? ` New expiry date: ${params.newExpiryDate}.` : ""}${params.reviewerComment ? `\n\nReviewer comment: ${params.reviewerComment}` : ""}\n\n您的认证 ${params.certificationNumber} 换证申请已通过。${params.newExpiryDate ? `新到期日：${params.newExpiryDate}。` : ""}${params.reviewerComment ? `\n\n审核意见：${params.reviewerComment}` : ""}`
      : `Your renewal application for certification ${params.certificationNumber} has been rejected.${params.reviewerComment ? `\n\nReviewer comment: ${params.reviewerComment}` : ""} Please review the feedback and submit a new application when ready.\n\n您的认证 ${params.certificationNumber} 换证申请被驳回。${params.reviewerComment ? `\n\n审核意见：${params.reviewerComment}` : ""}请查看反馈意见并在准备好后重新提交申请。`,
    messageType: "notification",
    metadata: {
      notification_type: "renewal_review_result",
      decision: params.decision,
      certification_number: params.certificationNumber,
      new_expiry_date: params.newExpiryDate,
    },
    organizationId: params.organizationId,
  });
}

export async function notifyCertificationIssued(params: {
  recipientId: string;
  certificationNumber: string;
  certificationType: string;
  expiryDate: string;
  organizationId?: string | null;
}): Promise<void> {
  const typeLabel =
    params.certificationType === "scpc_professional"
      ? "SCPC Certified Professional"
      : params.certificationType;

  await sendNotification({
    recipientId: params.recipientId,
    subject: `Congratulations! SCPC certification issued — ${params.certificationNumber} / 恭喜！SCPC 认证已颁发 — ${params.certificationNumber}`,
    content: `Congratulations! You have been awarded the ${typeLabel} certification (${params.certificationNumber}). Your certification is valid until ${params.expiryDate}. You can download your certificate from the "My Certification" page.\n\n恭喜！您已获得 ${typeLabel} 认证（${params.certificationNumber}）。认证有效期至 ${params.expiryDate}。您可以在"我的认证"页面下载电子证书。`,
    messageType: "notification",
    metadata: {
      notification_type: "certification_issued",
      certification_number: params.certificationNumber,
      certification_type: params.certificationType,
    },
    organizationId: params.organizationId,
  });
}
