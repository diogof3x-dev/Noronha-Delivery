type Cell = { dow: number; hour: number; orders: number };

const DOW_LABEL = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function HeatmapDowHour({ data }: { data: Cell[] }) {
  const max = data.reduce((m, c) => Math.max(m, c.orders), 0);
  const lookup = new Map(data.map((c) => [`${c.dow}-${c.hour}`, c.orders]));

  if (max === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
        Sem dados de horário ainda.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px]">
        <thead>
          <tr>
            <th className="w-8 p-0.5 text-left text-muted-foreground"></th>
            {Array.from({ length: 24 }, (_, h) => (
              <th
                key={h}
                className={`p-0.5 text-center font-normal text-muted-foreground ${
                  h % 2 === 0 ? "" : "opacity-0"
                }`}
              >
                {h}h
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[0, 1, 2, 3, 4, 5, 6].map((d) => (
            <tr key={d}>
              <td className="pr-1 text-right font-semibold text-muted-foreground">
                {DOW_LABEL[d]}
              </td>
              {Array.from({ length: 24 }, (_, h) => {
                const count = lookup.get(`${d}-${h}`) ?? 0;
                const intensity = max === 0 ? 0 : count / max;
                return (
                  <td key={h} className="p-0.5">
                    <div
                      title={`${DOW_LABEL[d]} ${h}h: ${count} pedidos`}
                      className="aspect-square rounded-sm"
                      style={{
                        background:
                          count === 0
                            ? "rgba(0,0,0,0.04)"
                            : `rgba(11, 127, 168, ${0.15 + intensity * 0.85})`,
                      }}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
