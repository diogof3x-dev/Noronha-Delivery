import { getAdminClient } from "./supabase/admin-client";
import { captureError } from "./observability";

type AuditAction =
  | "approve_lead"
  | "reject_lead"
  | "approve_business"
  | "suspend_business"
  | "unsuspend_business"
  | "approve_driver"
  | "ban_customer"
  | "unban_customer"
  | "impersonate_start"
  | "impersonate_stop"
  | "set_business_take_rate"
  | "approve_withdrawal"
  | "reject_withdrawal"
  | "edit_platform_settings"
  | "create_coupon"
  | "delete_coupon";

export async function logAdminAction(args: {
  adminId: string;
  action: AuditAction;
  targetType?: "business" | "profile" | "lead" | "order" | "withdrawal" | "coupon" | "setting";
  targetId?: string;
  targetLabel?: string | null;
  payload?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  const admin = getAdminClient();
  if (!admin) return;

  const { error } = await admin.from("admin_audit_log").insert({
    admin_id: args.adminId,
    action: args.action,
    target_type: args.targetType ?? null,
    target_id: args.targetId ?? null,
    target_label: args.targetLabel ?? null,
    payload: (args.payload ?? null) as never,
    ip: args.ip ?? null,
    user_agent: args.userAgent ?? null,
  });

  if (error) {
    captureError(error, { message: "logAdminAction failed", tags: { action: args.action } });
  }
}
