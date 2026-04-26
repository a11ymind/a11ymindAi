export function buildScanResultHref(scanId: string) {
  return `/scan/${encodeURIComponent(scanId)}`;
}
