export function NoronhaMark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="17.5" cy="6.2" r="2.1" fill="currentColor" opacity="0.85" />
      <path
        d="M3.4 17.5 L8.9 6.8 L14.4 17.5 Z"
        fill="currentColor"
      />
      <path
        d="M10.5 17.5 L15 9.6 L19.5 17.5 Z"
        fill="currentColor"
        opacity="0.55"
      />
      <path
        d="M2 19.6 Q5 18.4 8.5 19.6 T15.5 19.6 T22 19.6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
    </svg>
  );
}
