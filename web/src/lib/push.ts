import webpush from "web-push";
import { getAdminClient } from "./supabase/admin-client";
import { captureError } from "./observability";

let configured = false;
function configureOnce() {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:pedidos@noronhadelivery.com";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
};

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!configureOnce()) return 0;
  const admin = getAdminClient();
  if (!admin) return 0;

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId)
    .is("failed_at", null);

  if (!subs?.length) return 0;

  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          JSON.stringify(payload),
          { TTL: 60 * 60 },
        );
        sent++;
        void admin
          .from("push_subscriptions")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", s.id);
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          // subscription gone — marca como falha pra parar de tentar
          void admin
            .from("push_subscriptions")
            .update({ failed_at: new Date().toISOString() })
            .eq("id", s.id);
        } else {
          captureError(e, {
            message: "sendPushToUser failed",
            tags: { user_id: userId, subscription_id: s.id, status_code: status },
          });
        }
      }
    }),
  );

  return sent;
}
