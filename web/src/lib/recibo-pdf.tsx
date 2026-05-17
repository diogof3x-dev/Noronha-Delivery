import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  brandRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16, borderBottom: "1pt solid #ccc", paddingBottom: 12 },
  brandTitle: { fontSize: 16, fontWeight: "bold", color: "#0B7FA8" },
  brandSubtitle: { fontSize: 9, color: "#666", marginTop: 2 },
  brandRight: { textAlign: "right" },
  h1: { fontSize: 12, fontWeight: "bold", marginBottom: 4 },
  muted: { color: "#666", fontSize: 9 },
  section: { marginTop: 14, paddingTop: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  bold: { fontWeight: "bold" },
  divider: { borderBottom: "0.5pt solid #ddd", marginVertical: 8 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1pt solid #333" },
  totalText: { fontSize: 13, fontWeight: "bold" },
  footer: { marginTop: 24, fontSize: 8, color: "#888", textAlign: "center" },
});

function fmt(cents: number): string {
  return `R$ ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

export type ReciboData = {
  orderCode: string;
  createdAt: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  businessName: string;
  customerName: string | null;
  destinationKind: string | null;
  destinationLabel: string | null;
  items: { name: string; quantity: number; totalCents: number }[];
  subtotalCents: number;
  deliveryFeeCents: number;
  serviceFeeCents: number;
  couponCode: string | null;
  couponDiscountCents: number;
  totalCents: number;
  deliveryCode: string | null;
};

const PAYMENT_LABEL: Record<string, string> = {
  pix: "PIX",
  card: "Cartão",
  cash: "Dinheiro na entrega",
  wallet: "Carteira",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando",
  confirmed: "Confirmado",
  preparing: "Em preparo",
  ready: "Pronto",
  in_transit: "A caminho",
  delivered: "Entregue",
  completed: "Concluído",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

export function ReciboDocument({ data }: { data: ReciboData }) {
  return (
    <Document title={`Recibo ${data.orderCode}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow}>
          <View>
            <Text style={styles.brandTitle}>Noronha Delivery</Text>
            <Text style={styles.brandSubtitle}>noronhadelivery.com · aqui você tem Tudo</Text>
          </View>
          <View style={styles.brandRight}>
            <Text style={styles.h1}>Recibo #{data.orderCode}</Text>
            <Text style={styles.muted}>
              {new Date(data.createdAt).toLocaleString("pt-BR")}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.h1}>Estabelecimento</Text>
          <Text>{data.businessName}</Text>
        </View>

        {data.customerName && (
          <View style={styles.section}>
            <Text style={styles.h1}>Cliente</Text>
            <Text>{data.customerName}</Text>
            {data.destinationLabel && (
              <Text style={styles.muted}>
                {data.destinationKind ? `${data.destinationKind}: ` : ""}
                {data.destinationLabel}
              </Text>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.h1}>Itens</Text>
          <View style={styles.divider} />
          {data.items.map((it, idx) => (
            <View key={idx} style={styles.row}>
              <Text>
                {it.quantity}× {it.name}
              </Text>
              <Text>{fmt(it.totalCents)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.muted}>Subtotal</Text>
            <Text>{fmt(data.subtotalCents)}</Text>
          </View>
          {data.couponDiscountCents > 0 && (
            <View style={styles.row}>
              <Text style={styles.muted}>Cupom {data.couponCode}</Text>
              <Text>-{fmt(data.couponDiscountCents)}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.muted}>Entrega</Text>
            <Text>
              {data.deliveryFeeCents === 0 ? "Grátis" : fmt(data.deliveryFeeCents)}
            </Text>
          </View>
          {data.serviceFeeCents > 0 && (
            <View style={styles.row}>
              <Text style={styles.muted}>Taxa de serviço</Text>
              <Text>{fmt(data.serviceFeeCents)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalText}>Total</Text>
            <Text style={styles.totalText}>{fmt(data.totalCents)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.h1}>Pagamento</Text>
          <Text>
            {PAYMENT_LABEL[data.paymentMethod] ?? data.paymentMethod} ·{" "}
            <Text style={styles.bold}>
              {data.paymentStatus === "paid" ? "PAGO" : data.paymentStatus.toUpperCase()}
            </Text>
          </Text>
          <Text style={styles.muted}>
            Status do pedido: {STATUS_LABEL[data.status] ?? data.status}
          </Text>
        </View>

        {data.deliveryCode && (
          <View style={styles.section}>
            <Text style={styles.muted}>
              Código de entrega: {data.deliveryCode} (passar pro motoboy só na entrega)
            </Text>
          </View>
        )}

        <Text style={styles.footer}>
          Documento gerado eletronicamente pelo Noronha Delivery. Não tem valor fiscal.
          Para nota fiscal, consulte o estabelecimento.
        </Text>
      </Page>
    </Document>
  );
}
