export function Logo({
  className = "",
  showAi = true,
}: {
  className?: string;
  showAi?: boolean;
}) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className="flex items-baseline gap-1.5">
        <span className="text-[15px] font-semibold tracking-tight text-text">
          a11ymind
        </span>
        {showAi && (
          <span className="rounded-sm bg-accent/15 px-1.5 py-[1px] text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
            AI
          </span>
        )}
      </span>
    </div>
  );
}

function LogoMark() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="drop-shadow-[0_0_12px_rgba(6,182,212,0.35)]"
    >
      <defs>
        <linearGradient id="lm-fill" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
        <linearGradient id="lm-stroke" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect
        x="2"
        y="2"
        width="24"
        height="24"
        rx="7"
        fill="url(#lm-fill)"
        fillOpacity="0.16"
        stroke="url(#lm-stroke)"
        strokeWidth="1.25"
      />
      <path
        d="M9 19 L13 9 L15 9 L19 19"
        stroke="url(#lm-stroke)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M10.5 15.5 H17.5"
        stroke="url(#lm-stroke)"
        strokeWidth="1.75"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="14" cy="6.5" r="1.4" fill="#67e8f9" />
    </svg>
  );
}
