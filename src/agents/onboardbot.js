// OnboardBot Core — orchestrates all agents to produce the onboarding guide
// This is the main agent that coordinates the multi-step pipeline

import { analyzeRepository } from "./repo-analyzer.js";
import { fetchLearningResources } from "./docs-fetcher.js";
import { gatherTeamContext } from "./teams-gatherer.js";
import { generateOnboardingGuide } from "./guide-generator.js";

/**
 * The OnboardBot agent — orchestrates the full onboarding pipeline:
 *
 * 1. 📂 Scan repo structure, tech stack, docs, PRs, issues
 * 2. 📚 Fetch relevant Microsoft Learn docs & tutorials
 * 3. 💬 Gather team context from M365 (Teams, calendar, people)
 * 4. ✍️  Synthesize into a personalized onboarding guide
 */
export async function runOnboardBot(session, options) {
  const { owner, repo, teamName, newHireName } = options;

  const results = {
    steps: [],
    errors: [],
  };

  // ──────────────────────────────────────────────
  // Steps 1-3: Run in parallel for faster execution
  // ──────────────────────────────────────────────
  console.log(`\n⚡ Running Steps 1-3 in parallel...\n`);
  console.log(`  📂 Step 1/4 — Analyzing repository: ${owner}/${repo}`);
  console.log(`  📚 Step 2/4 — Fetching learning resources`);
  console.log(`  💬 Step 3/4 — Gathering team context\n`);

  const parallelStart = Date.now();

  // Step 1 task: Repository Analysis
  const repoTask = analyzeRepository(session, owner, repo)
    .then((analysis) => {
      results.steps.push({
        step: "repo-analysis",
        status: "success",
        techStack: analysis.techStack,
        filesFound: analysis.structure.length,
        docsFound: analysis.docs.length,
        prsFound: analysis.prActivity.length,
        issuesFound: analysis.issues.length,
      });
      console.log(`  ✅ Step 1 — Repo analysis complete`);
      return analysis;
    })
    .catch((err) => {
      console.error(`  ❌ Repo analysis failed: ${err.message}`);
      results.errors.push({ step: "repo-analysis", error: err.message });
      return {
        repoFullName: `${owner}/${repo}`,
        structure: [],
        techStack: [],
        docs: [],
        prActivity: [],
        issues: [],
        discussions: [],
      };
    });

  // Step 2 task: Microsoft Learn Docs
  // Note: ideally uses repoAnalysis.techStack but we start it
  // immediately with a fallback; it can still discover tech via prompts
  const docsTask = repoTask
    .then((repoAnalysis) =>
      fetchLearningResources(session, repoAnalysis.techStack, repoAnalysis)
    )
    .then((resources) => {
      results.steps.push({
        step: "docs-fetch",
        status: "success",
        resourceCount: resources.reduce(
          (sum, r) => sum + r.resources.length,
          0
        ),
      });
      console.log(`  ✅ Step 2 — Docs fetch complete`);
      return resources;
    })
    .catch((err) => {
      console.error(`  ❌ Docs fetch failed: ${err.message}`);
      results.errors.push({ step: "docs-fetch", error: err.message });
      return [];
    });

  // Step 3 task: Team Context from M365 (independent — runs in parallel with Step 1)
  const teamTask = gatherTeamContext(
    session,
    teamName || repo,
    `${owner}/${repo}`
  )
    .then((context) => {
      results.steps.push({
        step: "team-context",
        status: "success",
        discussions: context.recentDiscussions.length,
        people: context.teamMembers.length,
        events: context.upcomingEvents.length,
        emails: context.emailInsights.length,
        documents: context.relatedDocuments.length,
      });
      console.log(`  ✅ Step 3 — Team context complete`);
      return context;
    })
    .catch((err) => {
      console.error(`  ❌ Team context failed: ${err.message}`);
      results.errors.push({ step: "team-context", error: err.message });
      return {
        recentDiscussions: [],
        teamMembers: [],
        upcomingEvents: [],
        teamNorms: {
          communicationChannels: [],
          meetingCadence: "Unknown",
          codeReviewProcess: "Check CONTRIBUTING.md",
          deploymentProcess: "Check CI/CD workflows",
          otherNorms: [],
        },
        emailInsights: [],
        relatedDocuments: [],
      };
    });

  // Wait for all parallel steps to finish
  const [repoAnalysis, learningResources, teamContext] = await Promise.all([
    repoTask,
    docsTask,
    teamTask,
  ]);

  const parallelDuration = ((Date.now() - parallelStart) / 1000).toFixed(1);
  console.log(`\n  ⚡ Steps 1-3 completed in ${parallelDuration}s (parallel)\n`);

  // ──────────────────────────────────────────────
  // Step 4: Generate the Onboarding Guide
  // ──────────────────────────────────────────────
  console.log(`\n✍️  Step 4/4 — Generating onboarding guide`);
  try {
    const guide = await generateOnboardingGuide(
      session,
      repoAnalysis,
      learningResources,
      teamContext,
      { owner, repo, newHireName }
    );
    results.steps.push({
      step: "guide-generation",
      status: "success",
      outputPath: guide.outputPath,
      contentLength: guide.content.length,
    });
    results.guide = guide;
  } catch (err) {
    console.error(`  ❌ Guide generation failed: ${err.message}`);
    results.errors.push({ step: "guide-generation", error: err.message });
  }

  return results;
}

export default { runOnboardBot };
