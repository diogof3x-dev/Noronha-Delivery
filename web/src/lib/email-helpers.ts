import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { sendOrderStatusUpdate, sendBookingCreatedNotification } from "@/lib/email";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function notifyOrderStatusChange(orderId: string, newStatus: string) {
  try {
    const supa = admin();
    if (!supa) return;

    const { data: order } = await supa
      .from("orders")
      .select(
        "id, code, customer_id, delivery_code, business_id, driver_id, businesses(name), profiles!orders_driver_id_fkey(full_name)",
      )
      .eq("id", orderId)
      .maybeSingle();
    if (!order) return;

    const biz = order.businesses as { name?: string } | null;
    const driver = order.profiles as { full_name?: string } | null;

    const [customerProfile, customerAuth] = await Promise.all([
      order.customer_id
        ? supa.from("profiles").select("full_name").eq("id", order.customer_id).maybeSingle()
        : Promise.resolve({ data: null }),
      order.customer_id
        ? supa.auth.admin.getUserById(order.customer_id)
        : Promise.resolve({ data: { user: null } }),
    ]);

    await sendOrderStatusUpdate({
      orderId: order.id,
      orderCode: order.code,
      newStatus,
      businessName: biz?.name ?? "—",
      customerEmail: customerAuth.data.user?.email ?? null,
      customerName: (customerProfile.data as { full_name?: string } | null)?.full_name ?? null,
      driverName: driver?.full_name ?? null,
      deliveryCode: order.delivery_code,
    });
  } catch (err) {
    console.error("[email-helpers] notifyOrderStatusChange", err);
  }
}

type BookingKind = "lodging" | "tour" | "rental" | "service";

export async function notifyBookingCreated(kind: BookingKind, bookingId: string) {
  try {
    const supa = admin();
    if (!supa) return;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://noronhadelivery.com";

    let detailPath: string;
    let businessName = "";
    let itemName = "";
    let whenLabel = "";
    let totalCents = 0;
    let code = "";
    let customerId: string | null = null;
    let ownerId: string | null = null;

    if (kind === "lodging") {
      detailPath = `/app/reservas/${bookingId}`;
      const { data: b } = await supa
        .from("bookings")
        .select(
          "id, code, total_cents, customer_id, business_id, room_id, check_in, check_out, nights, businesses(name, owner_id), rooms(name)",
        )
        .eq("id", bookingId)
        .maybeSingle();
      if (!b) return;
      const biz = b.businesses as { name?: string; owner_id?: string } | null;
      const room = b.rooms as { name?: string } | null;
      businessName = biz?.name ?? "";
      itemName = room?.name ?? "Quarto";
      whenLabel = `${new Date(b.check_in).toLocaleDateString("pt-BR")} → ${new Date(b.check_out).toLocaleDateString("pt-BR")} (${b.nights} noite${b.nights === 1 ? "" : "s"})`;
      totalCents = b.total_cents;
      code = b.code;
      customerId = b.customer_id;
      ownerId = biz?.owner_id ?? null;
    } else if (kind === "tour") {
      detailPath = `/app/reservas-passeio/${bookingId}`;
      const { data: b } = await supa
        .from("tour_bookings")
        .select(
          "id, code, total_cents, customer_id, business_id, pax_count, businesses(name, owner_id), services(name), tour_sessions(start_at)",
        )
        .eq("id", bookingId)
        .maybeSingle();
      if (!b) return;
      const biz = b.businesses as { name?: string; owner_id?: string } | null;
      const svc = b.services as { name?: string } | null;
      const session = b.tour_sessions as { start_at?: string } | null;
      businessName = biz?.name ?? "";
      itemName = `${svc?.name ?? "Passeio"} (${b.pax_count} pax)`;
      whenLabel = session?.start_at ? new Date(session.start_at).toLocaleString("pt-BR") : "—";
      totalCents = b.total_cents;
      code = b.code;
      customerId = b.customer_id;
      ownerId = biz?.owner_id ?? null;
    } else if (kind === "rental") {
      detailPath = `/app/locacoes/${bookingId}`;
      const { data: b } = await supa
        .from("rental_bookings")
        .select(
          "id, code, total_cents, customer_id, business_id, pickup_at, return_at, total_days, businesses(name, owner_id), services(name)",
        )
        .eq("id", bookingId)
        .maybeSingle();
      if (!b) return;
      const biz = b.businesses as { name?: string; owner_id?: string } | null;
      const svc = b.services as { name?: string } | null;
      businessName = biz?.name ?? "";
      itemName = svc?.name ?? "Equipamento";
      whenLabel = `${new Date(b.pickup_at).toLocaleString("pt-BR")} → ${new Date(b.return_at).toLocaleString("pt-BR")} (${b.total_days} dia${b.total_days === 1 ? "" : "s"})`;
      totalCents = b.total_cents;
      code = b.code;
      customerId = b.customer_id;
      ownerId = biz?.owner_id ?? null;
    } else {
      detailPath = `/app/agendamentos/${bookingId}`;
      const { data: b } = await supa
        .from("service_bookings")
        .select(
          "id, code, total_cents, customer_id, business_id, businesses(name, owner_id), services(name), service_slots(start_at, staff_name)",
        )
        .eq("id", bookingId)
        .maybeSingle();
      if (!b) return;
      const biz = b.businesses as { name?: string; owner_id?: string } | null;
      const svc = b.services as { name?: string } | null;
      const slot = b.service_slots as { start_at?: string; staff_name?: string } | null;
      businessName = biz?.name ?? "";
      itemName = svc?.name ?? "Serviço";
      whenLabel = slot?.start_at
        ? `${new Date(slot.start_at).toLocaleString("pt-BR")}${slot.staff_name ? ` · ${slot.staff_name}` : ""}`
        : "—";
      totalCents = b.total_cents;
      code = b.code;
      customerId = b.customer_id;
      ownerId = biz?.owner_id ?? null;
    }

    const [ownerProfile, customerProfile, ownerAuth, customerAuth] = await Promise.all([
      ownerId ? supa.from("profiles").select("full_name").eq("id", ownerId).maybeSingle() : Promise.resolve({ data: null }),
      customerId ? supa.from("profiles").select("full_name").eq("id", customerId).maybeSingle() : Promise.resolve({ data: null }),
      ownerId ? supa.auth.admin.getUserById(ownerId) : Promise.resolve({ data: { user: null } }),
      customerId ? supa.auth.admin.getUserById(customerId) : Promise.resolve({ data: { user: null } }),
    ]);

    await sendBookingCreatedNotification({
      kind,
      code,
      totalCents,
      businessName,
      itemName,
      whenLabel,
      detailLink: `${appUrl}${detailPath}`,
      ownerEmail: ownerAuth.data.user?.email ?? null,
      ownerName: (ownerProfile.data as { full_name?: string } | null)?.full_name ?? null,
      customerEmail: customerAuth.data.user?.email ?? null,
      customerName: (customerProfile.data as { full_name?: string } | null)?.full_name ?? null,
    });
  } catch (err) {
    console.error("[email-helpers] notifyBookingCreated", err);
  }
}
