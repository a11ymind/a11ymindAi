import Image from "next/image";

export function Logo({
  className = "",
  showAi = true,
}: {
  className?: string;
  showAi?: boolean;
}) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src="/logo.png"
        alt="a11ymind AI"
        width={128}
        height={128}
        quality={95}
        priority
        sizes="32px"
        className="h-8 w-8 drop-shadow-[0_0_14px_rgba(34,211,238,0.45)]"
      />
      <span className="flex items-baseline gap-2">
        <span className="text-[17px] font-semibold tracking-tight text-text">
          a11ymind
        </span>
        {showAi && (
          <span
            className="text-[17px] font-bold tracking-tight text-accent-glow"
            style={{
              textShadow:
                "0 0 8px rgba(34,211,238,0.9), 0 0 18px rgba(34,211,238,0.6), 0 0 32px rgba(6,182,212,0.4)",
            }}
          >
            AI
          </span>
        )}
      </span>
    </div>
  );
}
