// MCP Server configuration for OnboardBot
// These servers provide the data backbone for onboarding intelligence

export const mcpServers = {
  // GitHub MCP — repo structure, code, PRs, issues, discussions
  github: {
    type: "http",
    url: "https://api.githubcopilot.com/mcp/",
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN || ""}`,
    },
  },

  // Playwright MCP — browser automation for live doc previews
  playwright: {
    command: "npx",
    args: ["@playwright/mcp@latest"],
  },

  // WorkIQ MCP — M365 data (Teams, Outlook, SharePoint, Planner)
  workiq: {
    command: "npx",
    args: [
      "-y",
      "@microsoft/workiq",
      "mcp",
      ...(process.env.WORKIQ_TENANT_ID
        ? ["--tenant-id", process.env.WORKIQ_TENANT_ID]
        : []),
    ],
  },

  // Microsoft Learn MCP — official docs, tutorials, code samples
  "microsoft-learn": {
    type: "http",
    url: "https://learn.microsoft.com/api/mcp",
  },
};

// Toolset selections for GitHub MCP
export const githubToolsets = [
  "repos",      // Repository browsing, file contents, commits
  "issues",     // Issue tracking, labels
  "pull_requests", // PR activity, reviews
  "discussions",   // Community discussions
  "context",       // Current user context
];
