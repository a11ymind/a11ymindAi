export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <ShieldMark />
      <span className="text-lg font-semibold tracking-tight">a11ymind</span>
    </div>
  );
}

function ShieldMark() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 2.5 4 5.2v6.1c0 4.7 3.2 8.9 8 10.2 4.8-1.3 8-5.5 8-10.2V5.2l-8-2.7Z"
        fill="#06b6d4"
        fillOpacity="0.18"
        stroke="#06b6d4"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="m8.5 12.2 2.5 2.5 4.5-5"
        stroke="#06b6d4"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
