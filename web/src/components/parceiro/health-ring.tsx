type Props = {
  score: number; // 0-100
  size?: number;
};

export function HealthRing({ score, size = 96 }: Props) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = size * 0.42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const color =
    clamped >= 80
      ? "#2BB673" // turtle
      : clamped >= 60
        ? "#0B7FA8" // primary
        : clamped >= 40
          ? "#F4B642" // sun
          : "#DC2626"; // destructive

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={size * 0.08}
          fill="none"
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={size * 0.08}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-xl font-bold leading-none tabular-nums"
          style={{ color }}
        >
          {clamped}
        </span>
        <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
          score
        </span>
      </div>
    </div>
  );
}
