// Onboarding Guide Generator — synthesizes all data into a personalized guide
// Takes repo analysis, learning resources, and team context → polished Markdown

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { OUTPUT_DIR } from "../config/constants.js";

/**
 * Generate a comprehensive onboarding guide from all gathered data.
 * Uses the Copilot session for AI-powered synthesis and writing.
 */
export async function generateOnboardingGuide(
  session,
  repoAnalysis,
  learningResources,
  teamContext,
  options = {}
) {
  const { owner, repo, newHireName = "New Team Member" } = options;

  console.log(`\n  ✍️  Generating personalized onboarding guide...`);

  // Build the comprehensive prompt with all gathered data
  const synthesisPrompt = buildSynthesisPrompt(
    repoAnalysis,
    learningResources,
    teamContext,
    { owner, repo, newHireName }
  );

  // Let the AI synthesize everything into a polished guide
  const response = await session.sendAndWait(synthesisPrompt);
  let guideContent = response.message;

  // Add the metadata header
  guideContent = addGuideHeader(guideContent, {
    owner,
    repo,
    newHireName,
    generatedAt: new Date().toISOString(),
    techStack: repoAnalysis.techStack,
  });

  // Save to file
  const outputPath = await saveGuide(guideContent, owner, repo);

  return { content: guideContent, outputPath };
}

/**
 * Build the synthesis prompt that combines all gathered intelligence.
 */
function buildSynthesisPrompt(repoAnalysis, learningResources, teamContext, options) {
  return `You are an expert onboarding specialist. Generate a comprehensive, personalized onboarding guide for a new developer joining the ${options.owner}/${options.repo} project.

Use ALL of the following data to create the guide. The guide should be warm, encouraging, and actionable.

---

## REPOSITORY ANALYSIS DATA

**Repository:** ${repoAnalysis.repoFullName}
**Detected Tech Stack:** ${repoAnalysis.techStack.join(", ") || "Not detected"}

### Key Documentation Found:
${JSON.stringify(repoAnalysis.docs, null, 2)}

### Recent Pull Requests (shows current work focus):
${JSON.stringify(repoAnalysis.prActivity, null, 2)}

### Active Issues (shows current priorities):
${JSON.stringify(repoAnalysis.issues, null, 2)}

### Team Discussions:
${JSON.stringify(repoAnalysis.discussions, null, 2)}

---

## LEARNING RESOURCES FROM MICROSOFT LEARN

${JSON.stringify(learningResources, null, 2)}

---

## TEAM CONTEXT FROM M365

### Recent Team Discussions:
${JSON.stringify(teamContext.recentDiscussions, null, 2)}

### Key People to Connect With:
${JSON.stringify(teamContext.teamMembers, null, 2)}

### Upcoming Events to Attend:
${JSON.stringify(teamContext.upcomingEvents, null, 2)}

### Team Norms & Processes:
${JSON.stringify(teamContext.teamNorms, null, 2)}

### Email Insights (key decisions & announcements):
${JSON.stringify(teamContext.emailInsights || [], null, 2)}

### Related Documents (SharePoint/OneDrive):
${JSON.stringify(teamContext.relatedDocuments || [], null, 2)}

---

## OUTPUT FORMAT

Generate a Markdown onboarding guide with these EXACT sections:

# 🚀 Welcome to ${options.owner}/${options.repo}!

## 👋 Hello, ${options.newHireName}!
(Warm welcome message, what the project is about, and why their work matters)

## 🏗️ Architecture Overview
(Based on repo structure and docs — explain the codebase layout, key directories, and design patterns)

## 🔧 Tech Stack
(List each technology with a one-line explanation of how it's used in this project)
(Include links to relevant Microsoft Learn resources for each)

## 🛠️ Development Environment Setup
(Step-by-step setup instructions based on package.json, Dockerfile, etc.)
(Prerequisites, installation, running locally, running tests)

## 📚 Essential Reading
(Curated list of docs they MUST read, organized by priority)
- 🔴 Read First (before writing code)
- 🟡 Read This Week (context and patterns)
- 🟢 Reference (bookmark for later)

## 🔀 Current Work in Progress
(Summary of recent PRs and active issues — what the team is working on RIGHT NOW)
(This helps the new hire understand context and find good first tasks)

## 🐛 Good First Issues
(Identify any issues labeled "good first issue" or suggest areas where a newcomer could contribute)

## 👥 Key People to Connect With
(Table of people, their roles, and why to reach out to them)
(Include a suggested intro message template)

## 📅 Your First Two Weeks
(Day-by-day suggested plan)

### Week 1: Learn & Setup
- Day 1: Environment setup, read essential docs, introduce yourself
- Day 2-3: Explore codebase, run the app, read recent PRs
- Day 4-5: Pick a good first issue, attend team meetings

### Week 2: Contribute & Connect
- Day 6-7: Submit your first PR, get code review feedback
- Day 8-9: Dive deeper into one component, pair with a team member
- Day 10: Retrospect on your onboarding, share feedback

## 📅 Important Meetings & Events
(List upcoming team meetings the new hire should attend)

## 💬 Communication Guide
(Which channels to join, team norms, how to ask for help)

## 📧 Recent Decisions from Email
(Key decisions, announcements, and context from email threads that a new hire should know about)
(Table with Subject, From, Date, Summary columns)

## 📄 Key Documents & Resources
(Important documents discovered on SharePoint/OneDrive — design specs, wikis, runbooks, slide decks)
(Table with Title, Type, Location, Summary columns — sorted by relevance to a new hire)

## 🎯 30-60-90 Day Goals
(Suggested milestones for the first 3 months)

### 30 Days: Foundation
- Complete environment setup
- Merge 2-3 PRs
- Understand core architecture

### 60 Days: Contribution
- Own a feature or component
- Participate in code reviews
- Present in a team meeting

### 90 Days: Ownership
- Lead a small initiative
- Mentor the next new hire
- Contribute to architecture decisions

## 📖 Additional Resources
(Links to all Microsoft Learn resources, tutorials, and docs gathered)

---

Make the guide:
- Warm and encouraging (not corporate/dry)
- Specific to THIS repo (not generic)
- Actionable (every section has clear next steps)
- Well-formatted with emojis, tables, and code blocks where appropriate
- Between 800-1500 words`;
}

/**
 * Add metadata header to the guide.
 */
function addGuideHeader(content, metadata) {
  const header = `---
title: "Onboarding Guide — ${metadata.owner}/${metadata.repo}"
generated_by: "🤖 OnboardBot — AI-Powered Onboarding Accelerator"
generated_at: "${metadata.generatedAt}"
tech_stack: [${metadata.techStack.map((t) => `"${t}"`).join(", ")}]
new_hire: "${metadata.newHireName}"
---

`;
  return header + content;
}

/**
 * Save the guide to the output directory.
 */
async function saveGuide(content, owner, repo) {
  const outputDir = OUTPUT_DIR;
  await mkdir(outputDir, { recursive: true });

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `onboarding-${owner}-${repo}-${timestamp}.md`;
  const outputPath = join(outputDir, filename);

  await writeFile(outputPath, content, "utf-8");
  return outputPath;
}

export default { generateOnboardingGuide };
