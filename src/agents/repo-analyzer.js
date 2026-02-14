// GitHub Repo Analyzer — scans repos for architecture, tech stack, patterns
// Uses GitHub MCP to read repo structure, key files, PRs, issues, discussions

import {
  ARCHITECTURE_FILES,
  TECH_PATTERNS,
  MAX_FILES_TO_ANALYZE,
  MAX_DISCUSSIONS_TO_FETCH,
  MAX_ISSUES_TO_FETCH,
  MAX_PRS_TO_FETCH,
} from "../config/constants.js";

/**
 * Analyze a GitHub repository for onboarding-relevant information.
 * Returns structured data about the repo's architecture, tech stack,
 * contribution patterns, and team activity.
 */
export async function analyzeRepository(session, owner, repo) {
  const repoFullName = `${owner}/${repo}`;

  console.log(`  📂 Scanning repository structure...`);
  const structure = await getRepoStructure(session, owner, repo);

  console.log(`  🔧 Detecting tech stack...`);
  const techStack = detectTechStack(structure);

  console.log(`  📖 Reading key documentation files...`);
  const docs = await getKeyDocuments(session, owner, repo, structure);

  console.log(`  🔀 Analyzing recent pull requests...`);
  const prActivity = await getRecentPRs(session, owner, repo);

  console.log(`  🐛 Fetching active issues & priorities...`);
  const issues = await getActiveIssues(session, owner, repo);

  console.log(`  💬 Gathering team discussions...`);
  const discussions = await getDiscussions(session, owner, repo);

  return {
    repoFullName,
    structure,
    techStack,
    docs,
    prActivity,
    issues,
    discussions,
  };
}

/**
 * Get the top-level repo structure (file/directory listing).
 */
async function getRepoStructure(session, owner, repo) {
  const prompt = `Use the GitHub MCP tools to get the repository tree/contents for ${owner}/${repo}. 
List the top-level files and directories. Return ONLY a JSON array of file/directory names, like:
["README.md", "src/", "package.json", "docs/", ".github/"]
Do not include any explanation, just the JSON array.`;

  const response = await session.sendAndWait(prompt);
  try {
    const match = response.message.match(/\[[\s\S]*?\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [];
  }
}

/**
 * Detect tech stack from repo structure.
 */
function detectTechStack(structure) {
  const detected = [];
  const structureStr = structure.join(" ").toLowerCase();

  for (const [tech, patterns] of Object.entries(TECH_PATTERNS)) {
    for (const pattern of patterns) {
      const normalizedPattern = pattern.replace("*.", "").toLowerCase();
      if (structureStr.includes(normalizedPattern.replace("/", ""))) {
        detected.push(tech);
        break;
      }
    }
  }

  return [...new Set(detected)];
}

/**
 * Read key documentation files from the repo.
 */
async function getKeyDocuments(session, owner, repo, structure) {
  const docsToFetch = ARCHITECTURE_FILES.filter((f) => {
    const normalizedFile = f.toLowerCase().replace("/", "");
    return structure.some(
      (s) =>
        s.toLowerCase().includes(normalizedFile) ||
        normalizedFile.includes(s.toLowerCase().replace("/", ""))
    );
  }).slice(0, MAX_FILES_TO_ANALYZE);

  if (docsToFetch.length === 0) {
    docsToFetch.push("README.md"); // Always try README
  }

  const prompt = `Use the GitHub MCP tools to get the file contents of these files from ${owner}/${repo}:
${docsToFetch.map((f) => `- ${f}`).join("\n")}

For each file, return its name and a SUMMARY (not full content) of what it tells a new developer:
- What the project does
- How to set it up
- Key architecture decisions
- Important conventions or patterns

Format as JSON: [{"file": "name", "summary": "..."}]`;

  const response = await session.sendAndWait(prompt);
  try {
    const match = response.message.match(/\[[\s\S]*?\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [{ file: "README.md", summary: "Could not parse documentation." }];
  }
}

/**
 * Get recent pull request activity for context on current work.
 */
async function getRecentPRs(session, owner, repo) {
  const prompt = `Use the GitHub MCP tools to list the ${MAX_PRS_TO_FETCH} most recent pull requests for ${owner}/${repo}.
Include both open and recently merged PRs.

For each PR, return: number, title, state, author, and a one-line description of the change.
Format as JSON array: [{"number": 1, "title": "...", "state": "open|merged", "author": "...", "description": "..."}]`;

  const response = await session.sendAndWait(prompt);
  try {
    const match = response.message.match(/\[[\s\S]*?\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [];
  }
}

/**
 * Get active issues to understand current priorities.
 */
async function getActiveIssues(session, owner, repo) {
  const prompt = `Use the GitHub MCP tools to list the ${MAX_ISSUES_TO_FETCH} most recent open issues for ${owner}/${repo}.
Sort by most recently updated.

For each issue, return: number, title, labels (as array), and a one-line summary.
Format as JSON array: [{"number": 1, "title": "...", "labels": ["bug", "priority"], "summary": "..."}]`;

  const response = await session.sendAndWait(prompt);
  try {
    const match = response.message.match(/\[[\s\S]*?\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [];
  }
}

/**
 * Get team discussions for community context.
 */
async function getDiscussions(session, owner, repo) {
  const prompt = `Use the GitHub MCP tools to list the ${MAX_DISCUSSIONS_TO_FETCH} most recent discussions for ${owner}/${repo}.
If the repo has no discussions enabled, return an empty array.

For each discussion, return: title, category, author, and a one-line summary.
Format as JSON array: [{"title": "...", "category": "...", "author": "...", "summary": "..."}]`;

  const response = await session.sendAndWait(prompt);
  try {
    const match = response.message.match(/\[[\s\S]*?\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [];
  }
}

export default { analyzeRepository };
