import type { ViolationStatus } from "@prisma/client";

export const VIOLATION_STATUS_OPTIONS: ViolationStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "FIXED",
  "VERIFIED",
  "IGNORED",
];

export const VIOLATION_STATUS_LABELS: Record<ViolationStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  IGNORED: "Ignored",
  FIXED: "Fixed",
  VERIFIED: "Verified",
};

export const VIOLATION_STATUS_DESCRIPTIONS: Record<ViolationStatus, string> = {
  OPEN: "Needs review",
  IN_PROGRESS: "Being fixed",
  IGNORED: "Accepted or not relevant",
  FIXED: "Fix shipped, awaiting verification",
  VERIFIED: "Confirmed by a later scan",
};

export const ACTIONABLE_VIOLATION_STATUSES: ViolationStatus[] = [
  "OPEN",
  "IN_PROGRESS",
];

export function isActionableViolationStatus(status: ViolationStatus): boolean {
  return ACTIONABLE_VIOLATION_STATUSES.includes(status);
}
