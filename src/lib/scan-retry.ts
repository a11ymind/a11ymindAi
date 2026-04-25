import type { ScanStatus } from "@prisma/client";

export const MAX_SCAN_ATTEMPTS = 2;

export function canRetryScan(scan: {
  status: ScanStatus;
  attemptCount: number;
}): boolean {
  return scan.status === "FAILED" && scan.attemptCount < MAX_SCAN_ATTEMPTS;
}

export function retryAttemptsRemaining(scan: { attemptCount: number }): number {
  return Math.max(0, MAX_SCAN_ATTEMPTS - scan.attemptCount);
}
