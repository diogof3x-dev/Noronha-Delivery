"use server";

import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";
import { getAdminClient } from "@/lib/supabase/admin-client";
import { sendPushToUser } from "@/lib/push";
import { captureError } from "@/lib/observability";
import { consumeRateLimit, rateLimitKey } from "@/lib/rate-limit";

const SendSchema = z.object({
  order_id: z.string().uuid(),
  body: z.string().min(1).max(1000),
});

export type SendMessageResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

export async function sendOrderMessage(
  formData: FormData,
): Promise<SendMessageResult> {
  const parsed = SendSchema.safeParse({
    order_id: formData.get("order_id"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { ok: false, error: "Mensagem inválida" };

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada" };

  const rl = await consumeRateLimit(rateLimitKey("chat", user.id), {
    limit: 30,
    windowSeconds: 60,
  });
  if (!rl.ok) return { ok: false, error: rl.error };

  // detecta sender_kind
  const admin = getAdminClient();
  if (!admin) return { ok: false, error: "Service role não configurado" };

  const { data: order } = await admin
    .from("orders")
    .select("id, customer_id, driver_id, business_id, code, businesses(name, owner_id)")
    .eq("id", parsed.data.order_id)
    .maybeSingle();
  if (!order) return { ok: false, error: "Pedido não encontrado" };

  const { data: profile } = await admin
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  const biz = order.businesses as { name?: string; owner_id?: string } | null;
  let senderKind: "customer" | "business" | "driver" | "admin";
  if (profile?.role === "admin") senderKind = "admin";
  else if (order.customer_id === user.id) senderKind = "customer";
  else if (order.driver_id === user.id) senderKind = "driver";
  else if (biz?.owner_id === user.id) senderKind = "business";
  else return { ok: false, error: "Sem permissão pra mandar nesse pedido" };

  const { data: inserted, error } = await supabase
    .from("order_messages")
    .insert({
      order_id: parsed.data.order_id,
      sender_id: user.id,
      sender_kind: senderKind,
      body: parsed.data.body.trim(),
    })
    .select("id")
    .single();
  if (error || !inserted) {
    return { ok: false, error: error?.message ?? "Falha ao enviar" };
  }

  // notifica os outros 2 participantes via push (fire-and-forget)
  void notifyChatRecipients({
    senderId: user.id,
    senderName: profile?.full_name ?? "Alguém",
    senderKind,
    order: {
      id: order.id,
      code: order.code,
      customerId: order.customer_id,
      driverId: order.driver_id,
      ownerId: biz?.owner_id ?? null,
      businessName: biz?.name ?? "Pedido",
    },
    body: parsed.data.body.trim(),
  });

  // auto-mark sender como lido na própria mensagem
  void admin.from("order_message_reads").upsert(
    {
      order_id: parsed.data.order_id,
      user_id: user.id,
      last_read_at: new Date().toISOString(),
    },
    { onConflict: "order_id,user_id" },
  );

  return { ok: true, messageId: inserted.id };
}

async function notifyChatRecipients(args: {
  senderId: string;
  senderName: string;
  senderKind: "customer" | "business" | "driver" | "admin";
  order: {
    id: string;
    code: string;
    customerId: string;
    driverId: string | null;
    ownerId: string | null;
    businessName: string;
  };
  body: string;
}) {
  try {
    const recipients = new Set<string>();
    if (args.order.customerId !== args.senderId) recipients.add(args.order.customerId);
    if (args.order.driverId && args.order.driverId !== args.senderId)
      recipients.add(args.order.driverId);
    if (args.order.ownerId && args.order.ownerId !== args.senderId)
      recipients.add(args.order.ownerId);

    const senderRole =
      args.senderKind === "customer"
        ? "Cliente"
        : args.senderKind === "driver"
          ? "Motoboy"
          : args.senderKind === "business"
            ? args.order.businessName
            : "Suporte";

    await Promise.all(
      Array.from(recipients).map((uid) =>
        sendPushToUser(uid, {
          title: `💬 ${senderRole} · #${args.order.code}`,
          body: args.body.length > 80 ? args.body.slice(0, 77) + "..." : args.body,
          url: `/app/pedidos/${args.order.id}?chat=1`,
          tag: `chat-${args.order.id}`,
        }),
      ),
    );
  } catch (e) {
    captureError(e, {
      message: "chat push notify failed",
      tags: { order_id: args.order.id },
    });
  }
}

export async function markOrderMessagesAsRead(
  orderId: string,
): Promise<{ ok: boolean }> {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  await supabase.from("order_message_reads").upsert(
    {
      order_id: orderId,
      user_id: user.id,
      last_read_at: new Date().toISOString(),
    },
    { onConflict: "order_id,user_id" },
  );
  return { ok: true };
}
