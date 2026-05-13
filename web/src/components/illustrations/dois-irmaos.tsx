export function DoisIrmaosScene(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 480 480"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
      {...props}
    >
      <defs>
        <linearGradient id="ndSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.0" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.18" />
        </linearGradient>
        <radialGradient id="ndSun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#F4C430" stopOpacity="1" />
          <stop offset="60%" stopColor="#F4C430" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#F4C430" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ndRockFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0F2A3B" />
          <stop offset="100%" stopColor="#1B4660" />
        </linearGradient>
        <linearGradient id="ndRockNear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0A1E2C" />
          <stop offset="100%" stopColor="#143850" />
        </linearGradient>
        <linearGradient id="ndWater" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      <rect width="480" height="480" fill="url(#ndSky)" />

      <circle cx="340" cy="190" r="120" fill="url(#ndSun)" />
      <circle cx="340" cy="190" r="46" fill="#F4C430" opacity="0.95" />

      <path
        d="M-20 360 Q40 348 95 354 T200 350 T320 360 T480 354 L480 480 L-20 480 Z"
        fill="url(#ndWater)"
      />
      <path
        d="M-20 380 Q60 370 130 376 T280 380 T480 376 L480 480 L-20 480 Z"
        fill="#FFFFFF"
        opacity="0.06"
      />

      <path
        d="M0 360 L120 360 L160 310 L195 195 L230 260 L260 250 L295 310 L320 360 Z"
        fill="url(#ndRockFar)"
      />

      <path
        d="M180 360 L260 360 L295 280 L345 130 L400 290 L430 360 Z"
        fill="url(#ndRockNear)"
      />

      <path
        d="M345 130 L370 180 L335 210 Z"
        fill="#FFFFFF"
        opacity="0.18"
      />
      <path
        d="M195 195 L215 230 L185 245 Z"
        fill="#FFFFFF"
        opacity="0.12"
      />

      <g opacity="0.85">
        <circle cx="60" cy="80" r="1.6" fill="#FFFFFF" />
        <circle cx="120" cy="50" r="1.2" fill="#FFFFFF" />
        <circle cx="190" cy="90" r="1.4" fill="#FFFFFF" />
        <circle cx="260" cy="40" r="1.0" fill="#FFFFFF" />
        <circle cx="80" cy="160" r="1.0" fill="#FFFFFF" opacity="0.6" />
      </g>

      <g stroke="#FFFFFF" strokeLinecap="round" strokeWidth="1.2" opacity="0.6">
        <path d="M40 420 Q60 416 80 420" fill="none" />
        <path d="M130 432 Q150 428 170 432" fill="none" />
        <path d="M260 424 Q280 420 300 424" fill="none" />
        <path d="M360 436 Q380 432 400 436" fill="none" />
      </g>
    </svg>
  );
}
