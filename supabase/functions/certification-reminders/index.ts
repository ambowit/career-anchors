import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[certification-reminders] ${step}${detailsStr}`);
};

interface CertificationRow {
  id: string;
  user_id: string;
  certification_number: string;
  certification_status: string;
  expiry_date: string;
  minimum_cdu_hours: number;
  organization_id: string | null;
  cert_code: string | null;
}

interface CduRecordRow {
  certification_id: string;
  cdu_hours: number;
  cdu_type: string;
}

interface CourseCatalogRow {
  id: string;
  course_name: string;
  course_name_zh: string | null;
  course_provider: string;
  cdu_hours: number;
  cdu_class: string;
  is_recorded: boolean;
  year_tag: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    logStep("Starting certification reminder check");

    const today = new Date();
    const currentYear = today.getFullYear();
    const sixMonthsFromNow = new Date(today);
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

    // Fetch all active certifications expiring within 6 months
    const { data: expiringCerts, error: certError } = await supabase
      .from("certifications")
      .select("id, user_id, certification_number, certification_status, expiry_date, minimum_cdu_hours, organization_id, cert_code")
      .in("certification_status", ["active", "pending_renewal"])
      .lte("expiry_date", sixMonthsFromNow.toISOString().split("T")[0])
      .gte("expiry_date", today.toISOString().split("T")[0]);

    if (certError) {
      logStep("Error fetching certifications", certError);
      throw certError;
    }

    logStep("Found expiring certifications", { count: expiringCerts?.length || 0 });

    if (!expiringCerts || expiringCerts.length === 0) {
      return new Response(
        JSON.stringify({ message: "No certifications expiring soon", reminders_sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Fetch CDU approved hours for these certifications (including A/B type breakdown)
    const certIds = expiringCerts.map((certRow: CertificationRow) => certRow.id);
    const { data: cduData, error: cduError } = await supabase
      .from("cdu_records")
      .select("certification_id, cdu_hours, cdu_type")
      .in("certification_id", certIds)
      .eq("approval_status", "approved");

    if (cduError) {
      logStep("Error fetching CDU records", cduError);
      throw cduError;
    }

    // Aggregate CDU hours per certification with A/B type breakdown
    const cduHoursMap: Record<string, number> = {};
    const cduTypeAMap: Record<string, number> = {};
    const cduTypeBMap: Record<string, number> = {};
    for (const record of (cduData || []) as CduRecordRow[]) {
      const certId = record.certification_id;
      const hours = Number(record.cdu_hours);
      cduHoursMap[certId] = (cduHoursMap[certId] || 0) + hours;
      if (record.cdu_type === "A") {
        cduTypeAMap[certId] = (cduTypeAMap[certId] || 0) + hours;
      } else {
        cduTypeBMap[certId] = (cduTypeBMap[certId] || 0) + hours;
      }
    }

    // Fetch recommended courses for CDU shortfall users
    // 1. Recorded courses (on-demand, can watch anytime)
    const { data: recordedCourses } = await supabase
      .from("cdu_course_catalog")
      .select("id, course_name, course_name_zh, course_provider, cdu_hours, cdu_class, is_recorded, year_tag")
      .eq("is_active", true)
      .eq("is_recorded", true)
      .order("cdu_hours", { ascending: false })
      .limit(5);

    // 2. Latest courses (current year or previous year)
    const { data: latestCourses } = await supabase
      .from("cdu_course_catalog")
      .select("id, course_name, course_name_zh, course_provider, cdu_hours, cdu_class, is_recorded, year_tag")
      .eq("is_active", true)
      .or(`year_tag.ilike.%${currentYear}%,year_tag.ilike.%${currentYear - 1}%`)
      .order("created_at", { ascending: false })
      .limit(5);

    // Fetch user enrollments to filter out already-enrolled courses
    const userIds = expiringCerts.map((certRow: CertificationRow) => certRow.user_id);
    const { data: userEnrollments } = await supabase
      .from("course_enrollments")
      .select("user_id, course_id")
      .in("user_id", userIds);

    const userEnrollmentMap: Record<string, Set<string>> = {};
    for (const enrollment of userEnrollments || []) {
      if (!userEnrollmentMap[enrollment.user_id]) {
        userEnrollmentMap[enrollment.user_id] = new Set();
      }
      userEnrollmentMap[enrollment.user_id].add(enrollment.course_id);
    }

    // Build course recommendation text per user
    const buildCourseRecommendation = (userId: string): string => {
      const enrolledSet = userEnrollmentMap[userId] || new Set();

      // Unwatched recorded courses
      const unwatchedRecorded = (recordedCourses || [])
        .filter((course: CourseCatalogRow) => !enrolledSet.has(course.id))
        .slice(0, 3);

      // Latest new courses not enrolled
      const newCourses = (latestCourses || [])
        .filter((course: CourseCatalogRow) => !enrolledSet.has(course.id) && !unwatchedRecorded.some((rc: CourseCatalogRow) => rc.id === course.id))
        .slice(0, 2);

      if (unwatchedRecorded.length === 0 && newCourses.length === 0) return "";

      let recommendation = "\n\n--- Recommended Courses / 推薦課程 / 推荐课程 ---\n";

      if (unwatchedRecorded.length > 0) {
        recommendation += "\n📹 Recorded Courses / 錄播課程 / 录播课程:\n";
        for (const course of unwatchedRecorded) {
          const courseName = course.course_name_zh || course.course_name;
          recommendation += `  • ${courseName} (${course.cdu_class}-Class, ${course.cdu_hours}h) — ${course.course_provider}\n`;
        }
      }

      if (newCourses.length > 0) {
        recommendation += "\n🆕 Latest Courses / 最新課程 / 最新课程:\n";
        for (const course of newCourses) {
          const courseName = course.course_name_zh || course.course_name;
          recommendation += `  • ${courseName} (${course.cdu_class}-Class, ${course.cdu_hours}h) — ${course.course_provider}`;
          if (course.year_tag) recommendation += ` [${course.year_tag}]`;
          recommendation += "\n";
        }
      }

      return recommendation;
    };

    // Check for existing recent reminders (within the past 7 days) to avoid duplicates
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recipientIds = expiringCerts.map((certRow: CertificationRow) => certRow.user_id);
    const { data: recentReminders } = await supabase
      .from("messages")
      .select("recipient_id, metadata")
      .in("recipient_id", recipientIds)
      .eq("message_type", "reminder")
      .eq("channel", "system")
      .gte("created_at", sevenDaysAgo.toISOString());

    const recentReminderSet = new Set<string>();
    for (const reminder of recentReminders || []) {
      const meta = reminder.metadata as Record<string, unknown>;
      if (meta?.reminder_type && meta?.certification_id) {
        recentReminderSet.add(`${reminder.recipient_id}:${meta.reminder_type}:${meta.certification_id}`);
      }
    }

    // Build reminder messages
    const messagesToInsert: Array<Record<string, unknown>> = [];

    for (const cert of expiringCerts as CertificationRow[]) {
      const daysUntilExpiry = Math.ceil(
        (new Date(cert.expiry_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      const approvedHours = cduHoursMap[cert.id] || 0;
      const cduShortfall = cert.minimum_cdu_hours - approvedHours;
      const isThreeMonthWindow = daysUntilExpiry <= 90;
      const isCduInsufficient = cduShortfall > 0;
      const certLabel = cert.cert_code || "SCPC";

      // Expiry reminder
      const expiryReminderType = isThreeMonthWindow ? "expiry_3month" : "expiry_6month";
      const expiryKey = `${cert.user_id}:${expiryReminderType}:${cert.id}`;

      if (!recentReminderSet.has(expiryKey)) {
        const urgency = isThreeMonthWindow ? "urgent" : "warning";
        messagesToInsert.push({
          recipient_id: cert.user_id,
          subject: isThreeMonthWindow
            ? `[Urgent] Your ${certLabel} certification expires in ${daysUntilExpiry} days / [緊急] 您的 ${certLabel} 認證將在 ${daysUntilExpiry} 天後到期 / [紧急] 您的 ${certLabel} 认证将在 ${daysUntilExpiry} 天后到期`
            : `Your ${certLabel} certification expires in ${daysUntilExpiry} days / 您的 ${certLabel} 認證將在 ${daysUntilExpiry} 天後到期 / 您的 ${certLabel} 认证将在 ${daysUntilExpiry} 天后到期`,
          content: isThreeMonthWindow
            ? `Your certification ${cert.certification_number} will expire on ${cert.expiry_date}. You have ${daysUntilExpiry} days remaining. Please ensure your CDU requirements are met and submit a renewal application as soon as possible.\n\n您的認證 ${cert.certification_number} 將於 ${cert.expiry_date} 到期。剩餘 ${daysUntilExpiry} 天。請儘快確保 CDU 學分達標並提交換證申請。\n\n您的认证 ${cert.certification_number} 将于 ${cert.expiry_date} 到期。剩余 ${daysUntilExpiry} 天。请尽快确保 CDU 学分达标并提交换证申请。`
            : `Your certification ${cert.certification_number} will expire on ${cert.expiry_date}. You have ${daysUntilExpiry} days remaining. Please plan ahead to complete your CDU requirements and prepare for renewal.\n\n您的認證 ${cert.certification_number} 將於 ${cert.expiry_date} 到期。剩餘 ${daysUntilExpiry} 天。請提前規劃完成 CDU 學分要求。\n\n您的认证 ${cert.certification_number} 将于 ${cert.expiry_date} 到期。剩余 ${daysUntilExpiry} 天。请提前规划完成 CDU 学分要求。`,
          message_type: "reminder",
          channel: "system",
          metadata: {
            reminder_type: expiryReminderType,
            certification_id: cert.id,
            certification_number: cert.certification_number,
            cert_code: certLabel,
            days_until_expiry: daysUntilExpiry,
            urgency,
          },
          organization_id: cert.organization_id,
        });
      }

      // CDU shortfall reminder with course recommendations
      if (isCduInsufficient) {
        const typeAHours = cduTypeAMap[cert.id] || 0;
        const typeBHours = cduTypeBMap[cert.id] || 0;
        const cduKey = `${cert.user_id}:cdu_shortfall:${cert.id}`;
        if (!recentReminderSet.has(cduKey)) {
          const courseRecommendation = buildCourseRecommendation(cert.user_id);

          messagesToInsert.push({
            recipient_id: cert.user_id,
            subject: `CDU hours insufficient — ${cduShortfall}h needed for ${certLabel} renewal / CDU 學分不足 — 還需 ${cduShortfall} 小時 / CDU 学分不足 — 还需 ${cduShortfall} 小时`,
            content: `Your certification ${cert.certification_number} requires ${cert.minimum_cdu_hours} CDU hours for renewal. You currently have ${approvedHours} approved hours (A-Class: ${typeAHours}h, B-Class: ${typeBHours}h), which is ${cduShortfall} hours short. Expires: ${cert.expiry_date}.\n\n您的認證 ${cert.certification_number} 換證需要 ${cert.minimum_cdu_hours} CDU 學時。已獲批 ${approvedHours} 學時（A類: ${typeAHours}h, B類: ${typeBHours}h），距達標還差 ${cduShortfall} 學時。到期日：${cert.expiry_date}。\n\n您的认证 ${cert.certification_number} 换证需要 ${cert.minimum_cdu_hours} CDU 学时。已获批 ${approvedHours} 学时（A类: ${typeAHours}h, B类: ${typeBHours}h），距达标还差 ${cduShortfall} 学时。到期日：${cert.expiry_date}。${courseRecommendation}`,
            message_type: "reminder",
            channel: "system",
            metadata: {
              reminder_type: "cdu_shortfall",
              certification_id: cert.id,
              certification_number: cert.certification_number,
              cert_code: certLabel,
              approved_hours: approvedHours,
              type_a_hours: typeAHours,
              type_b_hours: typeBHours,
              required_hours: cert.minimum_cdu_hours,
              shortfall: cduShortfall,
            },
            organization_id: cert.organization_id,
          });
        }
      }
    }

    // Auto-update newly expired certifications
    const { data: newlyExpired } = await supabase
      .from("certifications")
      .select("id, user_id, certification_number, organization_id, cert_code")
      .eq("certification_status", "active")
      .lt("expiry_date", today.toISOString().split("T")[0]);

    if (newlyExpired && newlyExpired.length > 0) {
      logStep("Found newly expired certifications", { count: newlyExpired.length });

      for (const expired of newlyExpired) {
        await supabase
          .from("certifications")
          .update({ certification_status: "expired", updated_at: new Date().toISOString() })
          .eq("id", expired.id);

        const certLabel = expired.cert_code || "SCPC";
        messagesToInsert.push({
          recipient_id: expired.user_id,
          subject: `Your ${certLabel} certification has expired / 您的 ${certLabel} 認證已過期 / 您的 ${certLabel} 认证已过期`,
          content: `Your certification ${expired.certification_number} has expired. Please contact your organization admin or submit a renewal application to reinstate your certification.\n\n您的認證 ${expired.certification_number} 已過期。請聯繫您的機構管理員或提交換證申請以恢復認證。\n\n您的认证 ${expired.certification_number} 已过期。请联系您的机构管理员或提交换证申请以恢复认证。`,
          message_type: "notification",
          channel: "system",
          metadata: {
            reminder_type: "expired",
            certification_id: expired.id,
            certification_number: expired.certification_number,
            cert_code: certLabel,
          },
          organization_id: expired.organization_id,
        });
      }
    }

    // Insert all messages
    let remindersSent = 0;
    if (messagesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("messages")
        .insert(messagesToInsert);

      if (insertError) {
        logStep("Error inserting reminder messages", insertError);
        throw insertError;
      }
      remindersSent = messagesToInsert.length;
    }

    logStep("Reminders sent successfully", { remindersSent });

    return new Response(
      JSON.stringify({
        message: "Certification reminders processed",
        reminders_sent: remindersSent,
        expiring_certifications: expiringCerts?.length || 0,
        newly_expired: newlyExpired?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in certification-reminders", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
