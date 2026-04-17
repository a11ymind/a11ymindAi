type ScanResultFlags = {
  aiEnabled?: boolean;
  aiUsageCurrent?: number;
  aiUsageLimit?: number | null;
  aiUsageRemaining?: number | null;
  requiresLoginForAI?: boolean;
  requiresUpgradeForAI?: boolean;
  aiLimitReached?: boolean;
};

export function buildScanResultHref(scanId: string, flags: ScanResultFlags = {}) {
  const params = new URLSearchParams();

  if (flags.aiEnabled !== undefined) {
    params.set("aiEnabled", flags.aiEnabled ? "1" : "0");
  }
  if (flags.aiUsageCurrent !== undefined) {
    params.set("aiUsageCurrent", String(flags.aiUsageCurrent));
  }
  if (flags.aiUsageLimit !== undefined && flags.aiUsageLimit !== null) {
    params.set("aiUsageLimit", String(flags.aiUsageLimit));
  }
  if (flags.aiUsageRemaining !== undefined && flags.aiUsageRemaining !== null) {
    params.set("aiUsageRemaining", String(flags.aiUsageRemaining));
  }
  if (flags.requiresLoginForAI) {
    params.set("requiresLoginForAI", "1");
  }
  if (flags.requiresUpgradeForAI) {
    params.set("requiresUpgradeForAI", "1");
  }
  if (flags.aiLimitReached) {
    params.set("aiLimitReached", "1");
  }

  const query = params.toString();
  return query ? `/scan/${scanId}?${query}` : `/scan/${scanId}`;
}
