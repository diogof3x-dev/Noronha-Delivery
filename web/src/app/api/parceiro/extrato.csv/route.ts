import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server-client";
import { getAdminClient } from "@/lib/supabase/admin-client";
import { toCsv } from "@/lib/csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const businessId = url.searchParams.get("business_id");
  if (!businessId) return NextResponse.json({ ok: false }, { status: 400 });

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { data: biz } = await supabase
    .from("businesses")
    .select("id, owner_id, name")
    .eq("id", businessId)
    .maybeSingle();
  if (!biz || biz.owner_id !== user.id) {
    return NextResponse.json({ ok: false, error: "Sem permissão" }, { status: 403 });
  }

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ ok: false }, { status: 500 });

  const { data: account } = await admin
    .from("wallet_accounts")
    .select("id")
    .eq("business_id", businessId)
    .maybeSingle();
  if (!account) {
    return new NextResponse("sem_conta\n", { headers: { "content-type": "text/csv" } });
  }

  const { data: txs } = await admin
    .from("wallet_transactions")
    .select(
      "type, amount_cents, balance_after_cents, order_id, withdrawal_id, description, created_at",
    )
    .eq("account_id", account.id)
    .order("created_at", { ascending: false })
    .limit(5000);

  const csv = toCsv(txs ?? [], [
    { key: "created_at", label: "data" },
    { key: "type", label: "tipo" },
    { key: "amount_cents", label: "valor_centavos" },
    { key: "balance_after_cents", label: "saldo_apos_centavos" },
    { key: "order_id", label: "pedido_id" },
    { key: "withdrawal_id", label: "saque_id" },
    { key: "description", label: "descricao" },
  ]);

  const slug = (biz.name ?? "loja").toLowerCase().replace(/[^a-z0-9]/g, "-");
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="extrato-${slug}.csv"`,
    },
  });
}
