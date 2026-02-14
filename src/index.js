#!/usr/bin/env node

// ╔══════════════════════════════════════════════════════════════╗
// ║  🤖 OnboardBot — AI-Powered New Hire Onboarding Accelerator ║
// ║                                                              ║
// ║  Scans repos, fetches docs, gathers team context, and       ║
// ║  generates personalized onboarding guides using MCP.        ║
// ╚══════════════════════════════════════════════════════════════╝

import { Command } from "commander";
import chalk from "chalk";
import { mcpServers } from "./config/mcp-servers.js";
import { APP_NAME, APP_VERSION, APP_TAGLINE, DEFAULT_MODEL } from "./config/constants.js";
import { runOnboardBot } from "./agents/onboardbot.js";
import {
  showBanner,
  showResults,
  showStep,
  showSuccess,
  showError,
  showWarning,
  formatDuration,
  createSpinner,
} from "./utils/helpers.js";

// ── CLI Setup ────────────────────────────────────────────────

const program = new Command();

program
  .name("onboardbot")
  .description(APP_TAGLINE)
  .version(APP_VERSION);

// ── Main Command: generate ──────────────────────────────────

program
  .command("generate")
  .description("Generate a personalized onboarding guide for a new hire")
  .requiredOption("-o, --owner <owner>", "GitHub organization or user (e.g., microsoft)")
  .requiredOption("-r, --repo <repo>", "GitHub repository name (e.g., vscode)")
  .option("-t, --team <team>", "Team name for M365 context (defaults to repo name)")
  .option("-n, --name <name>", "New hire's name for personalization", "New Team Member")
  .option("-m, --model <model>", "AI model to use", DEFAULT_MODEL)
  .option("--skip-teams", "Skip Teams/M365 context gathering", false)
  .option("--skip-docs", "Skip Microsoft Learn docs fetching", false)
  .action(async (opts) => {
    showBanner();

    const startTime = Date.now();

    console.log(chalk.bold("\n🎯 Configuration:"));
    console.log(chalk.dim(`   Repository: ${opts.owner}/${opts.repo}`));
    console.log(chalk.dim(`   Team:       ${opts.team || opts.repo}`));
    console.log(chalk.dim(`   New Hire:   ${opts.name}`));
    console.log(chalk.dim(`   Model:      ${opts.model}`));
    console.log(chalk.dim(`   Skip Teams: ${opts.skipTeams}`));
    console.log(chalk.dim(`   Skip Docs:  ${opts.skipDocs}`));

    // Initialize Copilot SDK session
    const spinner = createSpinner("Initializing Copilot SDK session...");
    spinner.start();

    let session;
    try {
      // Dynamic import to handle if SDK is not installed
      const { CopilotClient } = await import("@github/copilot-sdk");
      const client = new CopilotClient();

      // Configure MCP servers based on options
      const activeMcpServers = { ...mcpServers };
      if (opts.skipTeams) {
        delete activeMcpServers.workiq;
      }
      if (opts.skipDocs) {
        delete activeMcpServers["microsoft-learn"];
      }

      session = await client.createSession({
        model: opts.model,
        streaming: true,
        mcpServers: activeMcpServers,
        systemMessage: {
          content: `You are OnboardBot, an AI-powered onboarding specialist. Your job is to help new hires get up to speed quickly by analyzing codebases, finding relevant documentation, and understanding team context.

When using MCP tools:
- Use GitHub MCP tools to analyze repository structure, code, PRs, issues, and discussions
- Use Microsoft Learn MCP tools to find relevant documentation and tutorials
- Use WorkIQ MCP tools to gather team context from Teams, calendar, and people data

Always return structured data when asked. Prefer JSON format for data extraction.
Be thorough but concise. Focus on actionable insights for new team members.`,
        },
      });

      spinner.succeed("Copilot SDK session initialized");
    } catch (err) {
      spinner.fail("Failed to initialize Copilot SDK");

      if (err.message?.includes("Cannot find package")) {
        showWarning(
          "Copilot SDK not installed. Running in demo mode with simulated data."
        );
        session = createDemoSession();
      } else {
        showError(`Error: ${err.message}`);
        showWarning("Falling back to demo mode...");
        session = createDemoSession();
      }
    }

    // Run the OnboardBot pipeline
    console.log(chalk.bold("\n🚀 Starting OnboardBot pipeline...\n"));

    try {
      const results = await runOnboardBot(session, {
        owner: opts.owner,
        repo: opts.repo,
        teamName: opts.team || opts.repo,
        newHireName: opts.name,
      });

      const duration = Date.now() - startTime;
      console.log(chalk.dim(`\n⏱️  Total time: ${formatDuration(duration)}`));

      showResults(results);

      if (results.guide) {
        console.log(
          chalk.bold.green(
            `\n🎉 Onboarding guide generated successfully!\n`
          )
        );
        console.log(
          chalk.dim(`   Open it with: ${chalk.cyan(`code ${results.guide.outputPath}`)}`)
        );
      }
    } catch (err) {
      showError(`Pipeline failed: ${err.message}`);
      console.error(chalk.dim(err.stack));
      process.exit(1);
    }
  });

// ── Quick Command: scan ─────────────────────────────────────

program
  .command("scan")
  .description("Quick scan — just analyze a repo without generating a full guide")
  .requiredOption("-o, --owner <owner>", "GitHub organization or user")
  .requiredOption("-r, --repo <repo>", "GitHub repository name")
  .action(async (opts) => {
    showBanner();
    console.log(chalk.bold(`\n🔍 Quick scanning: ${opts.owner}/${opts.repo}\n`));

    let session;
    try {
      const { CopilotClient } = await import("@github/copilot-sdk");
      const client = new CopilotClient();
      session = await client.createSession({
        model: DEFAULT_MODEL,
        streaming: true,
        mcpServers: { github: mcpServers.github },
        systemMessage: {
          content: "You are a codebase analyzer. Return structured JSON data about repositories.",
        },
      });
    } catch {
      showWarning("Copilot SDK not available. Using demo mode.");
      session = createDemoSession();
    }

    const { analyzeRepository } = await import("./agents/repo-analyzer.js");
    const analysis = await analyzeRepository(session, opts.owner, opts.repo);

    console.log(chalk.bold("\n📊 Scan Results:\n"));
    console.log(chalk.cyan("  Tech Stack: ") + (analysis.techStack.join(", ") || "Unknown"));
    console.log(chalk.cyan("  Files:      ") + analysis.structure.length + " top-level items");
    console.log(chalk.cyan("  Docs:       ") + analysis.docs.length + " key docs found");
    console.log(chalk.cyan("  PRs:        ") + analysis.prActivity.length + " recent PRs");
    console.log(chalk.cyan("  Issues:     ") + analysis.issues.length + " active issues");
    console.log(chalk.cyan("  Discussions: ") + analysis.discussions.length + " recent discussions");
  });

// ── Demo Session (fallback when SDK not available) ──────────

function createDemoSession() {
  return {
    async sendAndWait(prompt) {
      // Simulate responses based on prompt content
      if (prompt.includes("repository tree") || prompt.includes("top-level")) {
        return {
          message: `["README.md", "src/", "package.json", "tsconfig.json", "docs/", ".github/", "Dockerfile", "docker-compose.yml", "tests/", ".eslintrc.json", "jest.config.js"]`,
        };
      }
      if (prompt.includes("file contents") || prompt.includes("key documentation")) {
        return {
          message: `[{"file": "README.md", "summary": "Project overview with setup instructions, architecture diagram, and contributing guidelines. Uses a microservice architecture with Node.js backend and React frontend."}, {"file": "CONTRIBUTING.md", "summary": "Contribution guide: fork, branch, PR workflow. Code review required from 2 reviewers. Must pass CI checks before merge."}]`,
        };
      }
      if (prompt.includes("pull requests")) {
        return {
          message: `[{"number": 234, "title": "feat: Add user authentication module", "state": "open", "author": "senior-dev", "description": "Implements OAuth2 authentication with Azure AD integration"}, {"number": 231, "title": "fix: Resolve memory leak in data pipeline", "state": "merged", "author": "tech-lead", "description": "Fixed connection pool exhaustion under high load"}, {"number": 228, "title": "docs: Update API documentation", "state": "merged", "author": "docs-team", "description": "Added OpenAPI specs for new endpoints"}]`,
        };
      }
      if (prompt.includes("open issues")) {
        return {
          message: `[{"number": 100, "title": "Implement caching layer", "labels": ["enhancement", "performance"], "summary": "Add Redis caching for frequently accessed data"}, {"number": 95, "title": "Add unit tests for auth module", "labels": ["testing", "good first issue"], "summary": "New auth module needs comprehensive test coverage"}, {"number": 88, "title": "Migrate to Node.js 22", "labels": ["infrastructure", "tech-debt"], "summary": "Upgrade runtime for performance improvements"}]`,
        };
      }
      if (prompt.includes("discussions")) {
        return {
          message: `[{"title": "RFC: New API versioning strategy", "category": "Ideas", "author": "architect", "summary": "Proposing URL-based versioning for the public API"}, {"title": "Team retro: Q4 highlights", "category": "General", "author": "manager", "summary": "Celebrating shipped features and lessons learned"}]`,
        };
      }
      if (prompt.includes("Microsoft Learn") || prompt.includes("documentation")) {
        return {
          message: `[{"title": "Getting started with Node.js on Azure", "url": "https://learn.microsoft.com/en-us/azure/developer/javascript/", "description": "Complete guide for building Node.js apps on Azure"}, {"title": "TypeScript Handbook", "url": "https://learn.microsoft.com/en-us/training/paths/build-javascript-applications-typescript/", "description": "Learn TypeScript fundamentals and advanced patterns"}, {"title": "Docker containers on Azure", "url": "https://learn.microsoft.com/en-us/azure/container-instances/", "description": "Deploy containerized applications to Azure"}]`,
        };
      }
      if (prompt.includes("code samples") || prompt.includes("architecture")) {
        return {
          message: `[{"title": "Azure Node.js samples", "url": "https://learn.microsoft.com/en-us/samples/browse/?languages=javascript", "description": "Official Azure SDK samples for Node.js", "type": "sample"}, {"title": "Microservice architecture guide", "url": "https://learn.microsoft.com/en-us/azure/architecture/microservices/", "description": "Design patterns for microservice architectures", "type": "doc"}]`,
        };
      }
      if (prompt.includes("tutorials") || prompt.includes("learning paths")) {
        return {
          message: `[{"title": "Build a Node.js web app with Azure", "url": "https://learn.microsoft.com/en-us/training/modules/create-nodejs-project-dependencies/", "description": "Hands-on tutorial for full-stack Node.js development", "estimatedTime": "45 min"}, {"title": "Introduction to Docker containers", "url": "https://learn.microsoft.com/en-us/training/modules/intro-to-docker-containers/", "description": "Learn containerization fundamentals", "estimatedTime": "30 min"}]`,
        };
      }
      if (prompt.includes("Teams") || prompt.includes("recent messages")) {
        return {
          message: `[{"topic": "Sprint 24 Planning", "channel": "Engineering", "summary": "Team agreed to prioritize auth module and caching layer for next sprint", "date": "2026-02-10", "relevance": "Understand current sprint priorities and your potential first tasks"}, {"topic": "Architecture Decision: Event-Driven", "channel": "Architecture", "summary": "Moving to event-driven architecture for real-time features", "date": "2026-02-08", "relevance": "Key architectural shift that affects how you'll write new services"}]`,
        };
      }
      if (prompt.includes("key people") || prompt.includes("find key people")) {
        return {
          message: `[{"name": "Alex Chen", "role": "Engineering Manager", "reason": "Your direct manager — schedule a 1:1 in your first week"}, {"name": "Sarah Johnson", "role": "Tech Lead", "reason": "Leads architecture decisions — great for codebase questions"}, {"name": "Mike Park", "role": "Senior Engineer", "reason": "Most active reviewer — will likely review your first PRs"}, {"name": "Lisa Wang", "role": "DevOps Lead", "reason": "Owns CI/CD and deployment — reach out for infra questions"}]`,
        };
      }
      if (prompt.includes("upcoming meetings") || prompt.includes("upcoming events")) {
        return {
          message: `[{"event": "Daily Standup", "date": "Every day 9:30 AM", "recurring": true, "relevance": "Join from Day 1 to understand daily progress and blockers"}, {"event": "Sprint Planning", "date": "2026-02-17", "recurring": true, "relevance": "Great way to understand upcoming work and volunteer for tasks"}, {"event": "Architecture Review", "date": "2026-02-19", "recurring": true, "relevance": "Learn about system design decisions and propose improvements"}]`,
        };
      }
      if (prompt.includes("team norms") || prompt.includes("team processes")) {
        return {
          message: `{"communicationChannels": ["#engineering-general", "#project-alpha", "#code-reviews", "#social"], "meetingCadence": "Daily standup at 9:30 AM, sprint planning bi-weekly Monday, retro bi-weekly Friday", "codeReviewProcess": "All PRs require 2 approvals. Use conventional commit messages. Link issues in PR description.", "deploymentProcess": "CI/CD via GitHub Actions. Staging deploys on PR merge to main. Production deploys weekly on Tuesday.", "otherNorms": ["Use threads in Teams for focused discussions", "Update your standup in the #standup channel by 9:30 AM", "Pair programming encouraged — just ask in the channel"]}`,
        };
      }
      if (prompt.includes("recent emails") || prompt.includes("email")) {
        return {
          message: `[{"subject": "Architecture Review: Moving to Event-Driven", "from": "Sarah Johnson (Tech Lead)", "date": "2026-02-09", "summary": "Final decision to adopt event-driven architecture using Azure Service Bus for async communication between services", "relevance": "Major architectural shift — all new services should follow this pattern"}, {"subject": "Security Audit Results & Action Items", "from": "Security Team", "date": "2026-02-06", "summary": "Audit completed with 3 medium findings. Action items assigned to fix auth token rotation and add rate limiting by Sprint 25", "relevance": "Understand current security priorities and potential tasks"}, {"subject": "Welcome to the Team!", "from": "Alex Chen (Engineering Manager)", "date": "2026-02-12", "summary": "Onboarding checklist: request access to Azure subscription, join Teams channels, schedule 1:1s with key people", "relevance": "Your onboarding action items from your manager"}, {"subject": "Q1 OKRs Finalized", "from": "VP of Engineering", "date": "2026-02-01", "summary": "Team OKRs: ship auth module, reduce P95 latency by 30%, achieve 90% test coverage on critical paths", "relevance": "Understand what the team is measured on this quarter"}, {"subject": "RE: Database Migration Plan", "from": "Lisa Wang (DevOps Lead)", "date": "2026-02-05", "summary": "PostgreSQL to Cosmos DB migration scheduled for March. All new features should use the Cosmos DB SDK", "relevance": "Affects which database APIs to use in new code"}]`,
        };
      }
      if (prompt.includes("documents on SharePoint") || prompt.includes("SharePoint") || prompt.includes("OneDrive")) {
        return {
          message: `[{"title": "System Architecture Overview", "type": "PowerPoint", "location": "Engineering SharePoint > Architecture", "lastModified": "2026-02-08", "summary": "Comprehensive system architecture diagram with data flow, service boundaries, and deployment topology", "relevance": "Essential reading — the single source of truth for system design"}, {"title": "API Design Guidelines", "type": "Word", "location": "Engineering SharePoint > Standards", "lastModified": "2026-01-20", "summary": "REST API conventions, naming standards, error response formats, and versioning strategy", "relevance": "Must follow these guidelines when building new endpoints"}, {"title": "Runbook: Production Incidents", "type": "Wiki", "location": "Engineering SharePoint > Operations", "lastModified": "2026-02-03", "summary": "Step-by-step guide for handling production incidents, escalation paths, and post-mortem template", "relevance": "Reference for when you join the on-call rotation"}, {"title": "New Hire Technical Onboarding", "type": "Word", "location": "HR SharePoint > Onboarding", "lastModified": "2026-01-15", "summary": "Access request forms, dev environment setup checklist, and links to all team resources", "relevance": "Complements this guide with HR-specific onboarding steps"}, {"title": "Sprint 23 Retrospective", "type": "PowerPoint", "location": "Engineering SharePoint > Retros", "lastModified": "2026-02-07", "summary": "Key learnings: improve PR review turnaround, add integration tests before shipping, better sprint estimation", "relevance": "Understand recent team improvements and expectations"}, {"title": "Event-Driven Architecture RFC", "type": "Word", "location": "Engineering SharePoint > RFCs", "lastModified": "2026-02-09", "summary": "Detailed proposal for migrating to event-driven architecture with Azure Service Bus — includes trade-offs and migration plan", "relevance": "Active RFC — understanding this will help you contribute to architectural discussions"}]`,
        };
      }

      // For the guide generation prompt — generate a comprehensive guide
      if (prompt.includes("onboarding specialist") || prompt.includes("Welcome to")) {
        return {
          message: generateDemoGuide(prompt),
        };
      }

      return { message: "[]" };
    },
  };
}

/**
 * Generate a demo onboarding guide when SDK is not available.
 */
function generateDemoGuide(prompt) {
  // Extract owner/repo from prompt
  const repoMatch = prompt.match(/(\w+)\/(\w+)/);
  const owner = repoMatch?.[1] || "org";
  const repo = repoMatch?.[2] || "project";
  const nameMatch = prompt.match(/Hello, (.+?)!/);
  const name = nameMatch?.[1] || "New Team Member";

  return `# 🚀 Welcome to ${owner}/${repo}!

## 👋 Hello, ${name}!

Welcome to the team! We're thrilled to have you on board. This project is at the heart of our engineering efforts, and your contributions will make a real difference. This guide was generated by 🤖 OnboardBot to help you hit the ground running.

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
| **Jest** | Testing framework | [Testing Best Practices](https://learn.microsoft.com/en-us/training/modules/create-nodejs-project-dependencies/) |
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

**Current sprint focus:** Authentication module and caching layer.

## 🐛 Good First Issues

| Issue | Title | Labels |
|-------|-------|--------|
| #95 | **Add unit tests for auth module** | \`testing\`, \`good first issue\` |
| #100 | Implement caching layer | \`enhancement\`, \`performance\` |

> 💡 **Suggestion:** Issue #95 is a perfect first contribution! It'll help you understand the auth module while adding valuable test coverage.

## 👥 Key People to Connect With

| Person | Role | Why Reach Out |
|--------|------|---------------|
| **Alex Chen** | Engineering Manager | Your direct manager — schedule a 1:1 in week 1 |
| **Sarah Johnson** | Tech Lead | Architecture questions and codebase guidance |
| **Mike Park** | Senior Engineer | Most active reviewer — will review your first PRs |
| **Lisa Wang** | DevOps Lead | CI/CD and deployment questions |

> 💬 **Intro template:** *"Hi [name]! I'm ${name}, just joined the team. I'm working on getting up to speed with ${repo}. Would love to chat about [their area] when you have 15 min!"*

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
| **Day 10** | 📝 Reflect | Share onboarding feedback, identify areas to improve for next new hire |

## 📅 Important Meetings & Events

| Event | When | Why Attend |
|-------|------|------------|
| **Daily Standup** | Every day 9:30 AM | Understand daily progress and blockers |
| **Sprint Planning** | Feb 17, 2026 | See upcoming work, volunteer for tasks |
| **Architecture Review** | Feb 19, 2026 | Learn system design, propose improvements |

## 💬 Communication Guide

**Channels to join:**
- \`#engineering-general\` — Main engineering discussions
- \`#project-alpha\` — Project-specific updates
- \`#code-reviews\` — PR notifications and review discussions
- \`#social\` — Team bonding and casual chat

**Team norms:**
- 💬 Use threads in Teams for focused discussions
- 📝 Update your standup in #standup by 9:30 AM
- 👯 Pair programming encouraged — just ask!
- 📦 Use conventional commit messages
- 🔀 Link issues in PR descriptions

## 📧 Recent Decisions from Email

| Subject | From | Date | Summary |
|---------|------|------|---------|
| **Architecture Review: Event-Driven** | Sarah Johnson (Tech Lead) | Feb 9 | Adopted event-driven architecture with Azure Service Bus |
| **Security Audit Results** | Security Team | Feb 6 | 3 medium findings — fix auth token rotation & rate limiting by Sprint 25 |
| **Q1 OKRs Finalized** | VP of Engineering | Feb 1 | Ship auth module, reduce P95 latency 30%, 90% test coverage |
| **Database Migration Plan** | Lisa Wang (DevOps) | Feb 5 | PostgreSQL → Cosmos DB in March. New code should use Cosmos SDK |

> 💡 These decisions shape your day-to-day work. Ask your tech lead if anything is unclear!

## 📄 Key Documents & Resources

| Document | Type | Location | Why Read It |
|----------|------|----------|-------------|
| **System Architecture Overview** | PowerPoint | Engineering SharePoint | Single source of truth for system design |
| **API Design Guidelines** | Word | Engineering SharePoint | Must-follow conventions for new endpoints |
| **Runbook: Production Incidents** | Wiki | Engineering SharePoint | Reference for on-call rotation |
| **Event-Driven Architecture RFC** | Word | Engineering SharePoint | Active RFC — join the discussion! |
| **New Hire Technical Onboarding** | Word | HR SharePoint | Access requests and setup checklist |

## 🎯 30-60-90 Day Goals

### 🎯 30 Days: Foundation
- [x] Complete environment setup
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

- [Getting started with Node.js on Azure](https://learn.microsoft.com/en-us/azure/developer/javascript/)
- [TypeScript Learning Path](https://learn.microsoft.com/en-us/training/paths/build-javascript-applications-typescript/)
- [Docker containers on Azure](https://learn.microsoft.com/en-us/azure/container-instances/)
- [Azure Node.js samples](https://learn.microsoft.com/en-us/samples/browse/?languages=javascript)
- [Microservice architecture guide](https://learn.microsoft.com/en-us/azure/architecture/microservices/)

---

*Generated by 🤖 OnboardBot — AI-Powered Onboarding Accelerator*
*Powered by GitHub Copilot + MCP (GitHub MCP, Microsoft Learn MCP, WorkIQ MCP)*
`;
}

// ── Run CLI ─────────────────────────────────────────────────

program.parse();

// Default to help if no command specified
if (!process.argv.slice(2).length) {
  showBanner();
  program.outputHelp();
}
