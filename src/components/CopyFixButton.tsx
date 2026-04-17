"use client";

import { useState } from "react";

export function CopyFixButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" onClick={onClick} className="btn-ghost text-xs">
      {copied ? "Copied" : "Copy fix"}
    </button>
  );
}
