// Teams Context Gatherer — pulls recent team activity from M365
// Uses WorkIQ MCP to access Teams messages, calendar, and people data

/**
 * Gather team context from M365 via WorkIQ MCP.
 * Provides the "human side" of onboarding — team dynamics, recent topics,
 * key people, and communication patterns.
 */
export async function gatherTeamContext(session, teamName, projectContext) {
  console.log(`  💬 Querying Teams channels for recent discussions...`);
  const recentDiscussions = await getRecentTeamsActivity(session, teamName);

  console.log(`  👥 Identifying key team members & roles...`);
  const teamMembers = await getKeyPeople(session, teamName, projectContext);

  console.log(`  📅 Checking upcoming team events & meetings...`);
  const upcomingEvents = await getUpcomingEvents(session, teamName);

  console.log(`  📌 Finding team norms & processes...`);
  const teamNorms = await getTeamNorms(session, teamName);

  console.log(`  📧 Searching recent emails for project decisions...`);
  const emailInsights = await getEmailInsights(session, teamName, projectContext);

  console.log(`  📄 Discovering related documents on SharePoint/OneDrive...`);
  const relatedDocuments = await getRelatedDocuments(session, teamName, projectContext);

  return {
    recentDiscussions,
    teamMembers,
    upcomingEvents,
    teamNorms,
    emailInsights,
    relatedDocuments,
  };
}

/**
 * Get recent Teams channel discussions relevant to the project.
 */
async function getRecentTeamsActivity(session, teamName) {
  const prompt = `Use the WorkIQ MCP tools to search for recent messages in Teams channels related to "${teamName}".

Look for:
- Recent technical discussions or decisions
- Announcements or important updates
- Current sprint/project focus areas
- Any recurring themes or hot topics

Summarize the top 5 most relevant discussion threads as JSON:
[{"topic": "...", "channel": "...", "summary": "One-line summary", "date": "approx date", "relevance": "Why a new hire should know this"}]

If WorkIQ is not available, return an empty array.`;

  const response = await session.sendAndWait(prompt);
  try {
    const match = response.message.match(/\[[\s\S]*?\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [];
  }
}

/**
 * Identify key people the new hire should connect with.
 */
async function getKeyPeople(session, teamName, projectContext) {
  const prompt = `Use the WorkIQ MCP tools to find key people related to "${teamName}" and the project context: "${projectContext}".

Identify:
- Team lead / manager
- Senior engineers / tech leads
- People who are most active in discussions
- Subject matter experts for the tech stack

Return as JSON array:
[{"name": "...", "role": "Likely role/expertise", "reason": "Why a new hire should connect with them"}]

Limit to 5-7 key people. If WorkIQ is not available, return an empty array.`;

  const response = await session.sendAndWait(prompt);
  try {
    const match = response.message.match(/\[[\s\S]*?\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [];
  }
}

/**
 * Get upcoming team events relevant for onboarding.
 */
async function getUpcomingEvents(session, teamName) {
  const prompt = `Use the WorkIQ MCP tools to find upcoming meetings and events related to "${teamName}" in the next 2 weeks.

Look for:
- Team standups / syncs
- Sprint planning / retrospectives
- Architecture reviews
- All-hands or team socials
- Any onboarding-specific sessions

Return as JSON array:
[{"event": "...", "date": "...", "recurring": true/false, "relevance": "Why attend as a new hire"}]

Limit to 8 events. If WorkIQ is not available, return an empty array.`;

  const response = await session.sendAndWait(prompt);
  try {
    const match = response.message.match(/\[[\s\S]*?\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [];
  }
}

/**
 * Discover team norms, processes, and culture.
 */
async function getTeamNorms(session, teamName) {
  const prompt = `Use the WorkIQ MCP tools to search for team norms, processes, and cultural information about "${teamName}".

Search in:
- Teams channel descriptions and pinned messages
- SharePoint sites or wikis related to the team
- Recent emails about team processes or guidelines

Summarize as JSON:
{
  "communicationChannels": ["List of key channels/groups to join"],
  "meetingCadence": "Description of regular meetings",
  "codeReviewProcess": "How the team does code reviews",
  "deploymentProcess": "How the team deploys",
  "otherNorms": ["Any other important team norms"]
}

If WorkIQ is not available, return reasonable defaults with "Unknown — ask your team lead" placeholders.`;

  const response = await session.sendAndWait(prompt);
  try {
    // Try to parse JSON from the response
    const jsonMatch = response.message.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return getDefaultNorms();
  } catch {
    return getDefaultNorms();
  }
}

/**
 * Get recent email insights — key decisions, announcements, and context
 * that live in Outlook rather than Teams.
 */
async function getEmailInsights(session, teamName, projectContext) {
  const prompt = `Use the WorkIQ MCP tools to search recent emails related to "${teamName}" and "${projectContext}".

Look for:
- Key decisions communicated over email (architecture changes, policy updates)
- Important announcements from leadership or stakeholders
- Action items or follow-ups that affect the project
- Onboarding-related emails (welcome messages, access requests, setup guides)

Summarize the top 5 most relevant email threads as JSON:
[{"subject": "...", "from": "sender name or role", "date": "approx date", "summary": "One-line summary of the key takeaway", "relevance": "Why a new hire should know this"}]

If WorkIQ is not available, return an empty array.`;

  const response = await session.sendAndWait(prompt);
  try {
    const match = response.message.match(/\[[\s\S]*?\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [];
  }
}

/**
 * Discover related documents on SharePoint / OneDrive — design specs,
 * wikis, architecture diagrams, and other essential reading.
 */
async function getRelatedDocuments(session, teamName, projectContext) {
  const prompt = `Use the WorkIQ MCP tools to search for documents on SharePoint and OneDrive related to "${teamName}" and "${projectContext}".

Look for:
- Architecture or design documents
- Technical specifications and RFCs
- Onboarding guides or team wikis
- Runbooks and operational playbooks
- Slide decks from recent tech talks or reviews

Return the top 8 most relevant documents as JSON:
[{"title": "...", "type": "document type (e.g., Word, PowerPoint, Wiki, PDF)", "location": "SharePoint site or OneDrive folder", "lastModified": "approx date", "summary": "Brief description of what it contains", "relevance": "Why a new hire should read this"}]

If WorkIQ is not available, return an empty array.`;

  const response = await session.sendAndWait(prompt);
  try {
    const match = response.message.match(/\[[\s\S]*?\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [];
  }
}

function getDefaultNorms() {
  return {
    communicationChannels: ["Ask your team lead for relevant Teams channels"],
    meetingCadence: "Check your calendar for recurring team meetings",
    codeReviewProcess: "Check CONTRIBUTING.md in the repo",
    deploymentProcess: "Check CI/CD workflows in .github/workflows/",
    otherNorms: ["Introduce yourself in the team channel on your first day!"],
  };
}

export default { gatherTeamContext };
