import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server-client";
import { getAdminClient } from "@/lib/supabase/admin-client";
import { toCsv } from "@/lib/csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ ok: false }, { status: 500 });

  const { data: account } = await admin
    .from("wallet_accounts")
    .select("id")
    .eq("owner_id", user.id)
    .is("business_id", null)
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

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="extrato-motoboy.csv"`,
    },
  });
}
