// Microsoft Learn Docs Fetcher — finds relevant docs, tutorials, and code samples
// Uses Microsoft Learn MCP to search and fetch official documentation

/**
 * Fetch relevant Microsoft Learn documentation for the detected tech stack.
 * Returns curated learning resources organized by technology.
 */
export async function fetchLearningResources(session, techStack, repoContext) {
  console.log(`  📚 Searching Microsoft Learn for relevant docs...`);

  const resources = [];

  // Search for each detected technology
  for (const tech of techStack) {
    console.log(`    🔍 Finding resources for: ${tech}`);
    const techResources = await searchDocsForTech(session, tech);
    resources.push({
      technology: tech,
      resources: techResources,
    });
  }

  // Search for architecture-specific docs based on repo context
  console.log(`  🏗️ Finding architecture & best practice guides...`);
  const archResources = await searchArchitectureDocs(session, repoContext);
  resources.push({
    technology: "Architecture & Best Practices",
    resources: archResources,
  });

  // Search for getting-started tutorials
  console.log(`  🎓 Finding getting-started tutorials...`);
  const tutorials = await searchTutorials(session, techStack);
  resources.push({
    technology: "Getting Started Tutorials",
    resources: tutorials,
  });

  return resources;
}

/**
 * Search Microsoft Learn for a specific technology.
 */
async function searchDocsForTech(session, tech) {
  const prompt = `Use the Microsoft Learn MCP tools to search for "${tech} getting started guide" documentation.

Return the top 5 most relevant results as JSON array:
[{"title": "...", "url": "...", "description": "One-line description of what the doc covers"}]

Focus on:
- Official getting-started guides
- Best practices
- Architecture patterns
- Common pitfalls to avoid`;

  const response = await session.sendAndWait(prompt);
  try {
    const match = response.message.match(/\[[\s\S]*?\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [];
  }
}

/**
 * Search for architecture-specific documentation.
 */
async function searchArchitectureDocs(session, repoContext) {
  const techList = repoContext.techStack.join(", ");
  const prompt = `Use the Microsoft Learn MCP tools to search for architecture best practices related to: ${techList}.

Also search for code samples using the microsoft_code_sample_search tool for: ${techList}

Return the top 5 most relevant results as JSON array:
[{"title": "...", "url": "...", "description": "...", "type": "doc|sample"}]

Focus on:
- Solution architecture patterns
- Cloud-native patterns (if applicable)
- Security best practices
- Performance optimization guides`;

  const response = await session.sendAndWait(prompt);
  try {
    const match = response.message.match(/\[[\s\S]*?\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [];
  }
}

/**
 * Search for interactive tutorials and learning paths.
 */
async function searchTutorials(session, techStack) {
  const query = techStack.slice(0, 3).join(" and ");
  const prompt = `Use the Microsoft Learn MCP tools to search for interactive tutorials and learning paths for: ${query}.

Return the top 5 results as JSON array:
[{"title": "...", "url": "...", "description": "...", "estimatedTime": "30 min"}]

Prioritize:
- Hands-on tutorials (not just reference docs)
- Microsoft Learn training modules
- Quickstart guides`;

  const response = await session.sendAndWait(prompt);
  try {
    const match = response.message.match(/\[[\s\S]*?\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [];
  }
}

/**
 * Fetch a specific doc page and convert to markdown summary.
 */
export async function fetchDocPage(session, url) {
  const prompt = `Use the Microsoft Learn MCP tools to fetch the content of this page: ${url}
Return a brief markdown summary (3-5 bullet points) of the key takeaways.`;

  const response = await session.sendAndWait(prompt);
  return response.message;
}

export default { fetchLearningResources, fetchDocPage };
