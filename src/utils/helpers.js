// Utilities — shared helpers for formatting, parsing, and display

import chalk from "chalk";
import boxen from "boxen";
import ora from "ora";

/**
 * Create a styled spinner with consistent branding.
 */
export function createSpinner(text) {
  return ora({
    text,
    spinner: "dots",
    color: "cyan",
  });
}

/**
 * Display the OnboardBot banner.
 */
export function showBanner() {
  const banner = boxen(
    chalk.bold.cyan("🤖 OnboardBot") +
      "\n" +
      chalk.dim("AI-Powered New Hire Onboarding Accelerator") +
      "\n\n" +
      chalk.gray("Powered by GitHub Copilot + MCP"),
    {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "cyan",
      textAlignment: "center",
    }
  );
  console.log(banner);
}

/**
 * Display a step header in the pipeline.
 */
export function showStep(stepNumber, totalSteps, title, icon = "🔄") {
  console.log(
    chalk.bold(`\n${icon} Step ${stepNumber}/${totalSteps} — ${title}`)
  );
  console.log(chalk.dim("─".repeat(50)));
}

/**
 * Display a success message.
 */
export function showSuccess(message) {
  console.log(chalk.green(`  ✅ ${message}`));
}

/**
 * Display an error message.
 */
export function showError(message) {
  console.log(chalk.red(`  ❌ ${message}`));
}

/**
 * Display a warning message.
 */
export function showWarning(message) {
  console.log(chalk.yellow(`  ⚠️  ${message}`));
}

/**
 * Display the final results summary.
 */
export function showResults(results) {
  console.log("\n");

  const successSteps = results.steps.filter((s) => s.status === "success");
  const failedSteps = results.errors;

  let summaryText =
    chalk.bold.cyan("📊 OnboardBot Results\n\n") +
    chalk.green(`  ✅ ${successSteps.length} steps completed successfully\n`);

  if (failedSteps.length > 0) {
    summaryText += chalk.red(
      `  ❌ ${failedSteps.length} steps had errors\n`
    );
  }

  if (results.guide) {
    summaryText += chalk.bold(
      `\n  📄 Guide saved to: ${results.guide.outputPath}\n`
    );
    summaryText += chalk.dim(
      `  📏 Guide size: ${(results.guide.content.length / 1024).toFixed(1)} KB`
    );
  }

  // Show step details
  summaryText += "\n\n" + chalk.bold("  Pipeline Steps:\n");
  for (const step of results.steps) {
    const icon = step.status === "success" ? "✅" : "❌";
    summaryText += `  ${icon} ${step.step}`;
    if (step.techStack) summaryText += ` (${step.techStack.join(", ")})`;
    if (step.resourceCount) summaryText += ` (${step.resourceCount} resources)`;
    if (step.people) summaryText += ` (${step.people} people found)`;
    summaryText += "\n";
  }

  console.log(
    boxen(summaryText, {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: successSteps.length >= 3 ? "green" : "yellow",
    })
  );
}

/**
 * Format a duration in milliseconds to a human-readable string.
 */
export function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

/**
 * Safely parse JSON, returning a fallback on failure.
 */
export function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
