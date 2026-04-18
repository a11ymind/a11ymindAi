import * as core from "@actions/core";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { scanUrl } from "../../src/lib/scan";
import { computeScore } from "../../src/lib/score";
import {
  ACTION_JSON_FILENAME,
  ACTION_MARKDOWN_FILENAME,
  buildJsonReport,
  countSeverities,
  formatSuccessMessage,
  parseBooleanInput,
  parseFailOn,
  renderMarkdownReport,
  thresholdExceeded,
} from "./report";

async function run() {
  const url = core.getInput("url", { required: true });
  const failOn = parseFailOn(core.getInput("fail-on"));
  const outputJson = parseBooleanInput(core.getInput("output-json"), true);
  const outputMarkdown = parseBooleanInput(core.getInput("output-markdown"), true);
  const outputDir = core.getInput("output-dir") || ".accesslint";

  core.info(`AccessLint: scanning ${url}`);
  let result: Awaited<ReturnType<typeof scanUrl>>;
  try {
    result = await scanUrl(url);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown scan failure";
    throw new Error(
      `AccessLint could not scan ${url}. ${message} This action currently expects a reachable preview/live URL on a GitHub-hosted Linux runner with Chrome available.`,
    );
  }
  const score = computeScore(result.violations);
  const counts = countSeverities(result.violations);
  const exceeded = thresholdExceeded(result.violations, failOn);
  const markdown = renderMarkdownReport({
    url: result.url,
    finalUrl: result.finalUrl,
    score,
    failOn,
    counts,
    thresholdExceeded: exceeded,
    result,
  });

  await mkdir(outputDir, { recursive: true });

  let jsonPath = "";
  if (outputJson) {
    jsonPath = path.join(outputDir, ACTION_JSON_FILENAME);
    const jsonReport = buildJsonReport({
      url: result.url,
      finalUrl: result.finalUrl,
      score,
      failOn,
      counts,
      thresholdExceeded: exceeded,
      result,
    });
    await writeFile(jsonPath, `${JSON.stringify(jsonReport, null, 2)}\n`, "utf8");
    core.info(`AccessLint: wrote JSON report to ${jsonPath}`);
  }

  let markdownPath = "";
  if (outputMarkdown) {
    markdownPath = path.join(outputDir, ACTION_MARKDOWN_FILENAME);
    await writeFile(markdownPath, `${markdown}\n`, "utf8");
    core.info(`AccessLint: wrote Markdown report to ${markdownPath}`);
  }

  core.summary.addRaw(markdown, true);
  await core.summary.write();

  emitAnnotations(result.violations);

  core.info(
    formatSuccessMessage({
      score,
      totalRisks: result.violations.length,
      counts,
      thresholdExceeded: exceeded,
      failOn,
    }),
  );

  core.setOutput("score", String(score));
  core.setOutput("total-risks", String(result.violations.length));
  core.setOutput("critical-count", String(counts.critical));
  core.setOutput("serious-count", String(counts.serious));
  core.setOutput("moderate-count", String(counts.moderate));
  core.setOutput("minor-count", String(counts.minor));
  core.setOutput("json-path", jsonPath);
  core.setOutput("markdown-path", markdownPath);
  core.setOutput("threshold-exceeded", exceeded ? "true" : "false");

  if (exceeded) {
    core.setFailed(
      `AccessLint found ${result.violations.length} accessibility risk${result.violations.length === 1 ? "" : "s"} and the configured fail-on threshold (${failOn}) was exceeded. Review the job summary and uploaded report artifacts for details.`,
    );
  }
}

function emitAnnotations(violations: Awaited<ReturnType<typeof scanUrl>>["violations"]) {
  for (const violation of violations.slice(0, 20)) {
    const message = `${violation.help} (${violation.nodes.length} node${violation.nodes.length === 1 ? "" : "s"})`;

    if (violation.impact === "critical" || violation.impact === "serious") {
      core.error(message);
      continue;
    }

    if (violation.impact === "moderate") {
      core.warning(message);
      continue;
    }

    core.notice(message);
  }
}

void run().catch((error) => {
  core.setFailed(error instanceof Error ? error.message : "AccessLint failed");
});
