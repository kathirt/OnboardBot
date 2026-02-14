// Web server for OnboardBot UI
// Serves the dashboard and provides an API endpoint for guide generation

import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { join, dirname, extname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = join(__dirname, "public");

// MIME types
const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

// ── Demo data generator (same logic as CLI demo mode) ────────

function generateDemoData(owner, repo, team, name) {
  const analysis = {
    repoFullName: `${owner}/${repo}`,
    structure: [
      "README.md", "src/", "package.json", "tsconfig.json", "docs/",
      ".github/", "Dockerfile", "docker-compose.yml", "tests/",
      ".eslintrc.json", "jest.config.js", "CONTRIBUTING.md",
    ],
    techStack: ["Node.js / JavaScript", "TypeScript", "Docker", "React"],
    docs: [
      { file: "README.md", summary: "Project overview with setup instructions, architecture diagram, and contributing guidelines. Uses a microservice architecture with Node.js backend and React frontend." },
      { file: "CONTRIBUTING.md", summary: "Contribution guide: fork, branch, PR workflow. Code review required from 2 reviewers. Must pass CI checks before merge." },
      { file: "docs/architecture.md", summary: "Detailed system architecture with data flow diagrams, service boundaries, and API contracts." },
    ],
    prActivity: [
      { number: 234, title: "feat: Add user authentication module", state: "open", author: "senior-dev", description: "Implements OAuth2 authentication with Azure AD integration" },
      { number: 231, title: "fix: Resolve memory leak in data pipeline", state: "merged", author: "tech-lead", description: "Fixed connection pool exhaustion under high load" },
      { number: 228, title: "docs: Update API documentation", state: "merged", author: "docs-team", description: "Added OpenAPI specs for new endpoints" },
      { number: 225, title: "feat: Add real-time notifications", state: "merged", author: "frontend-dev", description: "WebSocket-based live notification system" },
      { number: 222, title: "refactor: Migrate to ESM modules", state: "merged", author: "senior-dev", description: "Converted CommonJS imports to ES modules" },
    ],
    issues: [
      { number: 100, title: "Implement caching layer", labels: ["enhancement", "performance"], summary: "Add Redis caching for frequently accessed data" },
      { number: 95, title: "Add unit tests for auth module", labels: ["testing", "good first issue"], summary: "New auth module needs comprehensive test coverage" },
      { number: 88, title: "Migrate to Node.js 22", labels: ["infrastructure", "tech-debt"], summary: "Upgrade runtime for performance improvements" },
      { number: 82, title: "Improve error handling in API layer", labels: ["bug", "good first issue"], summary: "Standardize error responses across all endpoints" },
    ],
    discussions: [
      { title: "RFC: New API versioning strategy", category: "Ideas", author: "architect", summary: "Proposing URL-based versioning for the public API" },
      { title: "Team retro: Q4 highlights", category: "General", author: "manager", summary: "Celebrating shipped features and lessons learned" },
    ],
  };

  const learningResources = [
    {
      technology: "Node.js / JavaScript",
      resources: [
        { title: "Getting started with Node.js on Azure", url: "https://learn.microsoft.com/en-us/azure/developer/javascript/", description: "Complete guide for building Node.js apps on Azure" },
        { title: "Node.js best practices", url: "https://learn.microsoft.com/en-us/azure/developer/javascript/node-azure-tools", description: "Production best practices for Node.js applications" },
      ],
    },
    {
      technology: "TypeScript",
      resources: [
        { title: "TypeScript Learning Path", url: "https://learn.microsoft.com/en-us/training/paths/build-javascript-applications-typescript/", description: "Learn TypeScript fundamentals and advanced patterns" },
      ],
    },
    {
      technology: "Docker",
      resources: [
        { title: "Docker containers on Azure", url: "https://learn.microsoft.com/en-us/azure/container-instances/", description: "Deploy containerized applications to Azure" },
        { title: "Introduction to Docker containers", url: "https://learn.microsoft.com/en-us/training/modules/intro-to-docker-containers/", description: "Learn containerization fundamentals" },
      ],
    },
    {
      technology: "Architecture & Best Practices",
      resources: [
        { title: "Microservice architecture guide", url: "https://learn.microsoft.com/en-us/azure/architecture/microservices/", description: "Design patterns for microservice architectures", type: "doc" },
        { title: "Azure Node.js samples", url: "https://learn.microsoft.com/en-us/samples/browse/?languages=javascript", description: "Official Azure SDK samples for Node.js", type: "sample" },
      ],
    },
    {
      technology: "Getting Started Tutorials",
      resources: [
        { title: "Build a Node.js web app", url: "https://learn.microsoft.com/en-us/training/modules/create-nodejs-project-dependencies/", description: "Hands-on tutorial for full-stack development", estimatedTime: "45 min" },
      ],
    },
  ];

  const teamContext = {
    recentDiscussions: [
      { topic: "Sprint 24 Planning", channel: "Engineering", summary: "Team agreed to prioritize auth module and caching layer", date: "2026-02-10", relevance: "Current sprint priorities" },
      { topic: "Architecture Decision: Event-Driven", channel: "Architecture", summary: "Moving to event-driven architecture for real-time features", date: "2026-02-08", relevance: "Key architectural shift" },
      { topic: "New hire onboarding improvements", channel: "General", summary: "Team discussing how to improve onboarding process", date: "2026-02-07", relevance: "Your onboarding feedback is valuable!" },
    ],
    teamMembers: [
      { name: "Alex Chen", role: "Engineering Manager", reason: "Your direct manager — schedule a 1:1 in week 1" },
      { name: "Sarah Johnson", role: "Tech Lead", reason: "Architecture guidance and codebase questions" },
      { name: "Mike Park", role: "Senior Engineer", reason: "Most active PR reviewer" },
      { name: "Lisa Wang", role: "DevOps Lead", reason: "CI/CD and deployment questions" },
      { name: "David Kim", role: "Frontend Lead", reason: "React components and UI patterns" },
    ],
    upcomingEvents: [
      { event: "Daily Standup", date: "Every day 9:30 AM", recurring: true, relevance: "Join from Day 1" },
      { event: "Sprint Planning", date: "2026-02-17", recurring: true, relevance: "Understand upcoming work" },
      { event: "Architecture Review", date: "2026-02-19", recurring: true, relevance: "Learn system design" },
      { event: "Team Social", date: "2026-02-21", recurring: false, relevance: "Meet the team!" },
    ],
    teamNorms: {
      communicationChannels: ["#engineering-general", "#project-alpha", "#code-reviews", "#social"],
      meetingCadence: "Daily standup 9:30 AM, sprint planning bi-weekly Monday, retro bi-weekly Friday",
      codeReviewProcess: "All PRs require 2 approvals. Conventional commits. Link issues in PR description.",
      deploymentProcess: "CI/CD via GitHub Actions. Staging on PR merge to main. Production weekly Tuesday.",
      otherNorms: ["Use threads in Teams", "Update standup by 9:30 AM", "Pair programming encouraged"],
    },
    emailInsights: [
      { subject: "Architecture Review: Moving to Event-Driven", from: "Sarah Johnson (Tech Lead)", date: "2026-02-09", summary: "Final decision to adopt event-driven architecture using Azure Service Bus", relevance: "Major architectural shift — all new services should follow this pattern" },
      { subject: "Security Audit Results & Action Items", from: "Security Team", date: "2026-02-06", summary: "Audit completed with 3 medium findings — fix auth token rotation and rate limiting", relevance: "Understand current security priorities" },
      { subject: "Q1 OKRs Finalized", from: "VP of Engineering", date: "2026-02-01", summary: "Ship auth module, reduce P95 latency by 30%, achieve 90% test coverage", relevance: "What the team is measured on this quarter" },
      { subject: "Database Migration Plan", from: "Lisa Wang (DevOps Lead)", date: "2026-02-05", summary: "PostgreSQL to Cosmos DB migration in March — new code should use Cosmos SDK", relevance: "Affects which database APIs to use" },
    ],
    relatedDocuments: [
      { title: "System Architecture Overview", type: "PowerPoint", location: "Engineering SharePoint", lastModified: "2026-02-08", summary: "Comprehensive system architecture diagram with data flow and service boundaries", relevance: "Single source of truth for system design" },
      { title: "API Design Guidelines", type: "Word", location: "Engineering SharePoint", lastModified: "2026-01-20", summary: "REST API conventions, naming standards, and error response formats", relevance: "Must follow when building new endpoints" },
      { title: "Runbook: Production Incidents", type: "Wiki", location: "Engineering SharePoint", lastModified: "2026-02-03", summary: "Step-by-step guide for handling production incidents and escalation paths", relevance: "Reference for on-call rotation" },
      { title: "Event-Driven Architecture RFC", type: "Word", location: "Engineering SharePoint", lastModified: "2026-02-09", summary: "Detailed proposal for event-driven migration with Azure Service Bus", relevance: "Active RFC — contribute to the discussion" },
      { title: "New Hire Technical Onboarding", type: "Word", location: "HR SharePoint", lastModified: "2026-01-15", summary: "Access request forms, dev environment setup checklist, and team resource links", relevance: "Complements this guide with HR-specific steps" },
    ],
  };

  // Generate the markdown guide
  const guide = generateGuideMarkdown(owner, repo, name, analysis, learningResources, teamContext);

  return { analysis, learningResources, teamContext, guide };
}

function generateGuideMarkdown(owner, repo, name, analysis, learningResources, teamContext) {
  return `# 🚀 Welcome to ${owner}/${repo}!

## 👋 Hello, ${name}!

Welcome to the team! We're thrilled to have you on board. The **${repo}** project is at the heart of our engineering efforts, and your contributions will make a real difference. This guide was generated by 🤖 OnboardBot to help you hit the ground running.

## 🏗️ Architecture Overview

The project follows a **microservice architecture** with clear separation of concerns:

\`\`\`
${repo}/
├── src/              # Main application source code
│   ├── api/          # REST API endpoints
│   ├── services/     # Business logic layer
│   ├── models/       # Data models and schemas
│   └── utils/        # Shared utilities
├── tests/            # Test suites (unit, integration, e2e)
├── docs/             # Project documentation
├── .github/          # CI/CD workflows and issue templates
├── Dockerfile        # Container definition
└── docker-compose.yml # Local development stack
\`\`\`

**Key architectural decisions:**
- Event-driven communication between services
- OAuth2 authentication with Azure AD integration
- Redis caching for frequently accessed data
- Docker-based deployment with GitHub Actions CI/CD

## 🔧 Tech Stack

| Technology | Usage | Learn More |
|------------|-------|------------|
| **Node.js** | Backend runtime | [Azure Node.js Guide](https://learn.microsoft.com/en-us/azure/developer/javascript/) |
| **TypeScript** | Type-safe development | [TypeScript Learning Path](https://learn.microsoft.com/en-us/training/paths/build-javascript-applications-typescript/) |
| **Docker** | Containerization | [Docker on Azure](https://learn.microsoft.com/en-us/azure/container-instances/) |
| **React** | Frontend framework | [React docs](https://react.dev) |
| **Jest** | Testing framework | Check \`jest.config.js\` in repo root |
| **ESLint** | Code linting | Check \`.eslintrc.json\` in repo root |

## 🛠️ Development Environment Setup

\`\`\`bash
# 1. Clone the repository
git clone https://github.com/${owner}/${repo}.git
cd ${repo}

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your values

# 4. Start local development stack
docker-compose up -d

# 5. Run the application
npm run dev

# 6. Run tests
npm test
\`\`\`

**Prerequisites:** Node.js 22+, Docker Desktop, Git, VS Code with ESLint extension

## 📚 Essential Reading

### 🔴 Read First (before writing code)
- **README.md** — Project overview, setup instructions, architecture diagram
- **CONTRIBUTING.md** — Fork, branch, PR workflow. 2 reviewers required.

### 🟡 Read This Week
- **docs/architecture.md** — Detailed system design and data flow
- **RFC: API Versioning Strategy** — Upcoming changes to the API layer

### 🟢 Reference (bookmark for later)
- [Azure Node.js Samples](https://learn.microsoft.com/en-us/samples/browse/?languages=javascript)
- [Microservice Architecture Guide](https://learn.microsoft.com/en-us/azure/architecture/microservices/)

## 🔀 Current Work in Progress

| PR | Title | Author | Status |
|----|-------|--------|--------|
| #234 | Add user authentication module | senior-dev | 🟡 Open |
| #231 | Fix memory leak in data pipeline | tech-lead | ✅ Merged |
| #228 | Update API documentation | docs-team | ✅ Merged |
| #225 | Add real-time notifications | frontend-dev | ✅ Merged |
| #222 | Migrate to ESM modules | senior-dev | ✅ Merged |

**Current sprint focus:** Authentication module and caching layer.

## 🐛 Good First Issues

| Issue | Title | Labels |
|-------|-------|--------|
| #95 | **Add unit tests for auth module** | \`testing\`, \`good first issue\` |
| #82 | **Improve error handling in API layer** | \`bug\`, \`good first issue\` |
| #100 | Implement caching layer | \`enhancement\`, \`performance\` |

> 💡 **Recommendation:** Start with Issue #95 — it'll help you understand the auth module while adding valuable test coverage!

## 👥 Key People to Connect With

| Person | Role | Why Reach Out |
|--------|------|---------------|
| **Alex Chen** | Engineering Manager | Your direct manager — schedule a 1:1 in week 1 |
| **Sarah Johnson** | Tech Lead | Architecture guidance and codebase questions |
| **Mike Park** | Senior Engineer | Most active PR reviewer |
| **Lisa Wang** | DevOps Lead | CI/CD and deployment questions |
| **David Kim** | Frontend Lead | React components and UI patterns |

> 💬 **Intro template:** _"Hi [name]! I'm ${name}, just joined the team. I'd love to chat about [their area] when you have 15 min this week!"_

## 📅 Your First Two Weeks

### Week 1: Learn & Setup
| Day | Focus | Tasks |
|-----|-------|-------|
| **Day 1** | 🏠 Setup | Environment setup, read essential docs, introduce yourself in #engineering-general |
| **Day 2** | 📖 Learn | Explore codebase, understand folder structure, read architecture docs |
| **Day 3** | 🏃 Run | Run the app locally, explore the API, run test suites |
| **Day 4** | 👀 Observe | Read recent PRs (#234, #231), attend standup, shadow a code review |
| **Day 5** | 🎯 Pick | Choose your first issue (#95), start working on it |

### Week 2: Contribute & Connect
| Day | Focus | Tasks |
|-----|-------|-------|
| **Day 6-7** | 💻 Code | Submit your first PR, respond to code review feedback |
| **Day 8-9** | 🤝 Connect | Pair with Sarah on architecture, attend sprint planning |
| **Day 10** | 📝 Reflect | Share onboarding feedback, identify areas to improve |

## 📅 Important Meetings & Events

| Event | When | Why Attend |
|-------|------|------------|
| **Daily Standup** | Every day 9:30 AM | Understand daily progress and blockers |
| **Sprint Planning** | Feb 17, 2026 | See upcoming work, volunteer for tasks |
| **Architecture Review** | Feb 19, 2026 | Learn system design, propose improvements |
| **Team Social** | Feb 21, 2026 | Meet the team in a relaxed setting! |

## 💬 Communication Guide

**Channels to join:**
- \`#engineering-general\` — Main engineering discussions
- \`#project-alpha\` — Project-specific updates
- \`#code-reviews\` — PR notifications and review discussions
- \`#social\` — Team bonding and casual chat

**Team norms:**
- 💬 Use threads in Teams for focused discussions
- 📝 Update your standup by 9:30 AM daily
- 👯 Pair programming encouraged — just ask!
- 📦 Use conventional commit messages
- 🔀 Link issues in PR descriptions
- 🚀 Staging deploys on PR merge; production weekly on Tuesday

## 📧 Recent Decisions from Email

| Subject | From | Date | Summary |
|---------|------|------|---------|
${teamContext.emailInsights.map(e => `| **${e.subject}** | ${e.from} | ${e.date} | ${e.summary} |`).join("\n")}

> 💡 These decisions shape your day-to-day work. Ask your tech lead if anything is unclear!

## 📄 Key Documents & Resources

| Document | Type | Location | Why Read It |
|----------|------|----------|-------------|
${teamContext.relatedDocuments.map(d => `| **${d.title}** | ${d.type} | ${d.location} | ${d.relevance} |`).join("\n")}

## 🎯 30-60-90 Day Goals

### 🎯 30 Days: Foundation
- [ ] Complete environment setup
- [ ] Merge 2-3 PRs
- [ ] Understand core architecture
- [ ] Meet all key team members

### 🎯 60 Days: Contribution
- [ ] Own a feature or component
- [ ] Participate in 5+ code reviews
- [ ] Present in a team meeting
- [ ] Resolve a production issue

### 🎯 90 Days: Ownership
- [ ] Lead a small initiative or RFC
- [ ] Mentor the next new hire
- [ ] Contribute to architecture decisions
- [ ] Present a tech talk to the team

## 📖 Additional Resources

${learningResources.map(cat => `**${cat.technology}:**\n${cat.resources.map(r => `- [${r.title}](${r.url}) — ${r.description}`).join("\n")}`).join("\n\n")}

---

*Generated by 🤖 OnboardBot — AI-Powered Onboarding Accelerator*
*Powered by GitHub Copilot + MCP (GitHub MCP, Microsoft Learn MCP, WorkIQ MCP)*
`;
}

// ── HTTP Server ──────────────────────────

const server = createServer(async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  // API: Generate guide
  if (req.method === "POST" && req.url === "/api/generate") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try {
        const { owner, repo, team, name } = JSON.parse(body);
        const data = generateDemoData(owner, repo, team, name);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(data));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Static files
  let filePath = req.url === "/" ? "/index.html" : req.url;
  const fullPath = join(PUBLIC_DIR, filePath);

  if (!existsSync(fullPath)) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
    return;
  }

  const ext = extname(fullPath);
  const mime = MIME[ext] || "application/octet-stream";

  try {
    const content = readFileSync(fullPath);
    res.writeHead(200, { "Content-Type": mime });
    res.end(content);
  } catch {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
});

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║   🤖 OnboardBot — Web UI                            ║
║                                                      ║
║   Dashboard:  http://localhost:${PORT}                  ║
║   API:        http://localhost:${PORT}/api/generate     ║
║                                                      ║
║   Press Ctrl+C to stop                               ║
╚══════════════════════════════════════════════════════╝
  `);
});
