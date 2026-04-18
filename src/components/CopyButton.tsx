"use client";

import { useState } from "react";

export function CopyButton({
  text,
  label = "Copy",
  className = "btn-ghost text-xs",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked — user can select manually.
    }
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {copied ? "Copied" : label}
    </button>
  );
}
