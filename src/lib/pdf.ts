type PdfViolation = {
  axeId: string;
  impact: string;
  help: string;
  description: string;
  selector: string;
  legalRationale: string | null;
  plainEnglishFix: string | null;
  codeExample: string | null;
};

type PdfScan = {
  id: string;
  url: string;
  score: number;
  createdAt: Date;
  violations: PdfViolation[];
};

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const FONT_SIZE = 10;
const LINE_HEIGHT = 14;
const MAX_LINES_PER_PAGE = 44;
const WRAP_WIDTH = 92;

export function renderScanPdf(scan: PdfScan): Buffer {
  const lines = buildLines(scan);
  const pageChunks = chunk(lines, MAX_LINES_PER_PAGE);
  const pages = pageChunks.map((pageLines, index) =>
    buildPageStream(pageLines, index + 1, pageChunks.length),
  );
  return buildPdfDocument(pages);
}

function buildLines(scan: PdfScan): string[] {
  const counts = summarizeViolations(scan.violations);
  const lines: string[] = [
    "Accessly accessibility report",
    "",
    `Scan ID: ${scan.id}`,
    `Scanned URL: ${scan.url}`,
    `Generated: ${scan.createdAt.toISOString()}`,
    `Accessibility score: ${scan.score}/100`,
    `Violations found: ${scan.violations.length}`,
    `Critical: ${counts.critical} | Serious: ${counts.serious} | Moderate: ${counts.moderate} | Minor: ${counts.minor}`,
    "",
  ];

  if (scan.violations.length === 0) {
    lines.push("No automated WCAG violations were detected in this scan.");
    return wrapAll(lines);
  }

  scan.violations.forEach((violation, index) => {
    lines.push(`Violation ${index + 1}: ${violation.help}`);
    lines.push(`Rule: ${violation.axeId}`);
    lines.push(`Severity: ${violation.impact}`);
    lines.push(`Selector: ${violation.selector || "(no selector captured)"}`);
    lines.push(`Description: ${violation.description}`);
    if (violation.legalRationale) {
      lines.push(`Legal rationale: ${violation.legalRationale}`);
    }
    if (violation.plainEnglishFix) {
      lines.push(`Recommended fix: ${violation.plainEnglishFix}`);
    }
    if (violation.codeExample) {
      lines.push("Code example:");
      lines.push(stripFences(violation.codeExample));
    }
    lines.push("");
  });

  return wrapAll(lines);
}

function wrapAll(lines: string[]): string[] {
  return lines.flatMap((line) => wrapLine(sanitize(line), WRAP_WIDTH));
}

function wrapLine(line: string, width: number): string[] {
  if (!line) return [""];

  const words = line.split(/\s+/);
  const wrapped: string[] = [];
  let current = "";

  for (const word of words) {
    if (!current) {
      current = word;
      continue;
    }

    if (`${current} ${word}`.length <= width) {
      current = `${current} ${word}`;
      continue;
    }

    wrapped.push(current);
    current = word;
  }

  if (current) wrapped.push(current);
  return wrapped.length > 0 ? wrapped : [""];
}

function buildPageStream(lines: string[], pageNumber: number, totalPages: number): string {
  const startY = PAGE_HEIGHT - 48;
  const pdfLines = lines.map((line) => `(${escapePdfText(line)}) Tj T*`).join("\n");
  const footer = `BT
/F1 9 Tf
40 24 Td
(${escapePdfText(`Accessly report | Page ${pageNumber} of ${totalPages}`)}) Tj
ET`;
  return `BT
/F1 ${FONT_SIZE} Tf
40 ${startY} Td
${LINE_HEIGHT} TL
${pdfLines}
ET
${footer}`;
}

function buildPdfDocument(pageStreams: string[]): Buffer {
  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");

  const pageObjectIds = pageStreams.map((_, index) => 4 + index * 2);
  objects.push(
    `<< /Type /Pages /Count ${pageStreams.length} /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] >>`,
  );
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  pageStreams.forEach((stream, index) => {
    const pageObjectId = 4 + index * 2;
    const contentObjectId = pageObjectId + 1;
    objects[pageObjectId - 1] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectId} 0 R >>`;
    objects[contentObjectId - 1] =
      `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`;
  });

  let body = "%PDF-1.4\n";
  const offsets: number[] = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(body, "utf8"));
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(body, "utf8");
  body += `xref
0 ${objects.length + 1}
0000000000 65535 f 
${offsets
  .slice(1)
  .map((offset) => `${String(offset).padStart(10, "0")} 00000 n `)
  .join("\n")}
trailer
<< /Size ${objects.length + 1} /Root 1 0 R >>
startxref
${xrefOffset}
%%EOF`;

  return Buffer.from(body, "utf8");
}

function chunk<T>(items: T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    pages.push(items.slice(index, index + size));
  }
  return pages.length > 0 ? pages : [[]];
}

function stripFences(text: string): string {
  return text.replace(/^```[a-zA-Z0-9]*\n?/, "").replace(/```\s*$/, "").trim();
}

function summarizeViolations(violations: PdfViolation[]) {
  return violations.reduce(
    (summary, violation) => {
      if (violation.impact === "critical") summary.critical += 1;
      else if (violation.impact === "serious") summary.serious += 1;
      else if (violation.impact === "moderate") summary.moderate += 1;
      else summary.minor += 1;
      return summary;
    },
    { critical: 0, serious: 0, moderate: 0, minor: 0 },
  );
}

function sanitize(text: string): string {
  return text.replace(/[^\x20-\x7E]/g, "?");
}

function escapePdfText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
