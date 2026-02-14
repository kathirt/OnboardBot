# 🤖 OnboardBot — AI-Powered New Hire Onboarding Accelerator

> *Scans repos, fetches docs, gathers team context, and generates personalized onboarding guides — all powered by GitHub Copilot + MCP.*

[![Built with GitHub Copilot](https://img.shields.io/badge/Built%20with-GitHub%20Copilot-blue?logo=github)](https://github.com/features/copilot)
[![MCP Integrated](https://img.shields.io/badge/MCP-Integrated-green?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+PC9zdmc+)](https://modelcontextprotocol.io/)
[![Agents League](https://img.shields.io/badge/Agents%20League-TechConnect-purple)](https://github.com/microsoft/agentsleague-techconnect)

---

## 🎯 The Problem

Starting a new role is overwhelming. New hires face:
- **Scattered documentation** across repos, wikis, and SharePoint
- **Unknown team dynamics** — who to talk to, which meetings matter
- **Tech stack mystery** — what frameworks, patterns, and tools are used
- **No clear roadmap** — what to do in the first day, week, or month

## 💡 The Solution

**OnboardBot** is an AI agent that automatically generates a **comprehensive, personalized onboarding guide** by:

1. 📂 **Scanning the repo** — structure, tech stack, docs, PRs, issues, discussions
2. 📚 **Fetching relevant docs** — Microsoft Learn tutorials, code samples, best practices
3. 💬 **Gathering team context** — Teams discussions, key people, meetings, team norms
4. ✍️ **Synthesizing everything** — into a beautiful, actionable onboarding guide

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    🤖 OnboardBot CLI                         │
│                  (Copilot CLI SDK)                           │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  📂 Repo     │  📚 Docs     │  💬 Teams    │  ✍️ Guide     │
│  Analyzer    │  Fetcher     │  Gatherer    │  Generator     │
│              │              │              │                │
│  GitHub MCP  │  Learn MCP   │  WorkIQ MCP  │  AI Synthesis  │
├──────────────┴──────────────┴──────────────┴────────────────┤
│              Model Context Protocol (MCP)                    │
├──────────────┬──────────────┬───────────────────────────────┤
│  🐙 GitHub   │  📖 MS Learn │  🏢 WorkIQ (M365)            │
│  MCP Server  │  MCP Server  │  MCP Server                   │
└──────────────┴──────────────┴───────────────────────────────┘
```

### MCP Servers Used

| Server | Data Accessed | Purpose |
|--------|--------------|---------|
| **GitHub MCP** | Repos, files, PRs, issues, discussions | Understand codebase architecture & activity |
| **Microsoft Learn MCP** | Docs, tutorials, code samples | Find learning resources for the tech stack |
| **WorkIQ MCP** | Teams, calendar, people, SharePoint | Gather team dynamics & communication context |

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+**
- **VS Code** with GitHub Copilot enabled
- **GitHub Token** (for GitHub MCP)
- **M365 License** (optional, for WorkIQ MCP)

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/onboardbot.git
cd onboardbot

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your GitHub token
```

### Usage

#### Generate a Full Onboarding Guide

```bash
# Full pipeline: repo analysis + docs + team context → guide
npm start -- generate -o microsoft -r vscode -n "Jane Smith"

# With team name for M365 context
npm start -- generate -o microsoft -r vscode -t "VS Code Team" -n "Jane Smith"

# Skip Teams context (if no M365 access)
npm start -- generate -o microsoft -r vscode --skip-teams -n "Jane Smith"

# Skip docs fetching (faster, repo-only analysis)
npm start -- generate -o microsoft -r vscode --skip-docs --skip-teams
```

#### Quick Repo Scan (no guide generation)

```bash
# Just analyze the repo — see tech stack, docs, PRs, issues
npm start -- scan -o microsoft -r vscode
```

### CLI Options

```
Usage: onboardbot generate [options]

Options:
  -o, --owner <owner>    GitHub org or user (required)
  -r, --repo <repo>      Repository name (required)
  -t, --team <team>      Team name for M365 context
  -n, --name <name>      New hire's name (default: "New Team Member")
  -m, --model <model>    AI model (default: "gpt-4.1")
  --skip-teams           Skip Teams/M365 gathering
  --skip-docs            Skip Microsoft Learn fetching
  -h, --help             Show help
```

## 📄 Sample Output

The generated guide includes:

| Section | Content |
|---------|---------|
| 👋 Welcome | Personalized greeting with project overview |
| 🏗️ Architecture | Codebase layout, key directories, design patterns |
| 🔧 Tech Stack | Technologies with learn-more links |
| 🛠️ Setup | Step-by-step local development setup |
| 📚 Essential Reading | Priority-ranked documentation (🔴🟡🟢) |
| 🔀 Current Work | Active PRs and issues for context |
| 🐛 Good First Issues | Suggested starter tasks |
| 👥 Key People | Who to connect with and why |
| 📅 First Two Weeks | Day-by-day onboarding plan |
| 📅 Meetings | Important recurring events |
| 💬 Communication | Channels, norms, how to ask for help |
| 🎯 30-60-90 Goals | Milestone targets for first 3 months |
| 📖 Resources | Curated Microsoft Learn links |

## 🧰 Project Structure

```
onboardbot/
├── src/
│   ├── index.js              # CLI entry point + demo mode
│   ├── config/
│   │   ├── mcp-servers.js    # MCP server configurations
│   │   └── constants.js      # App constants & tech patterns
│   ├── agents/
│   │   ├── onboardbot.js     # Main orchestrator agent
│   │   ├── repo-analyzer.js  # GitHub repo analysis
│   │   ├── docs-fetcher.js   # Microsoft Learn docs
│   │   ├── teams-gatherer.js # M365 team context
│   │   └── guide-generator.js# Guide synthesis & output
│   └── utils/
│       └── helpers.js        # CLI display utilities
├── onboarding-guides/        # Generated guides output
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## 🎨 How GitHub Copilot Was Used

This project was **built entirely with GitHub Copilot** assistance:

- **Agent Mode** — Used to scaffold the entire project structure, generate module code, and iterate on the guide template
- **Inline Suggestions** — Accelerated writing of MCP integration code and JSON parsing logic
- **Copilot Chat** — Brainstormed the multi-agent architecture, prompt engineering for guide synthesis, and error handling patterns
- **Copilot CLI SDK** — Powers the runtime agent session, connecting to MCP servers and orchestrating the AI pipeline

## 🔗 MCP Integration Details

### How MCP Powers OnboardBot

OnboardBot uses **Model Context Protocol (MCP)** as its data backbone:

1. **GitHub MCP Server** — The agent queries repository structure, reads key files (README, CONTRIBUTING, package.json), fetches recent PRs/issues, and gathers discussion threads — all through MCP tool calls.

2. **Microsoft Learn MCP Server** — For each detected technology in the repo's stack, the agent searches Microsoft's documentation for getting-started guides, best practices, and code samples. It uses `microsoft_docs_search` and `microsoft_code_sample_search` tools.

3. **WorkIQ MCP Server** — Connects to the organization's M365 tenant to pull Teams channel discussions, identify key team members via the People graph, find upcoming meetings, and discover team norms from SharePoint.

### Multi-Step Reasoning Pipeline

```
User Input (owner/repo/team)
    │
    ▼
Step 1: GitHub MCP ──→ Repo structure, docs, PRs, issues
    │
    ▼
Step 2: Learn MCP  ──→ Relevant tutorials for detected tech stack
    │
    ▼
Step 3: WorkIQ MCP ──→ Team discussions, people, meetings, norms
    │
    ▼
Step 4: AI Synthesis ──→ Comprehensive onboarding guide (Markdown)
    │
    ▼
Output: Personalized guide saved to ./onboarding-guides/
```

## 🏆 Hackfest Submission

**Track:** 🎨 Creative Apps with GitHub Copilot
**Event:** Agents League @ TechConnect

### Evaluation Criteria Mapping

| Criterion | Weight | How OnboardBot Addresses It |
|-----------|--------|-----------------------------|
| Accuracy & Relevance | 20% | All data sourced from real repos, official docs, and live M365 |
| Reasoning & Multi-step | 20% | 4-stage pipeline with 15+ MCP tool calls across 3 servers |
| Reliability & Safety | 20% | Graceful error handling, demo fallback mode, no secrets in code |
| Creativity & Originality | 15% | Novel cross-platform synthesis (GitHub + M365 + MS Learn) |
| UX & Presentation | 15% | Beautiful CLI UX with spinners, colors, and boxed results |
| Community Vote | 10% | Solves a universal pain point every developer has experienced |

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

---

*Built with ❤️ at Agents League @ TechConnect 2026*
