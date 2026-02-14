// Application-wide constants and defaults

export const APP_NAME = "OnboardBot";
export const APP_VERSION = "1.0.0";
export const APP_TAGLINE = "🤖 AI-Powered New Hire Onboarding Accelerator";

// Default model for Copilot SDK sessions
export const DEFAULT_MODEL = "gpt-4.1";

// Output settings
export const OUTPUT_DIR = process.env.OUTPUT_DIR || "./onboarding-guides";
export const OUTPUT_FORMAT = "markdown"; // markdown | html

// Analysis limits (to keep within token budgets)
export const MAX_FILES_TO_ANALYZE = 20;
export const MAX_DISCUSSIONS_TO_FETCH = 10;
export const MAX_ISSUES_TO_FETCH = 15;
export const MAX_PRS_TO_FETCH = 10;

// File patterns to look for in repos (architecture clues)
export const ARCHITECTURE_FILES = [
  "README.md",
  "CONTRIBUTING.md",
  "ARCHITECTURE.md",
  "docs/",
  "package.json",
  "requirements.txt",
  "Cargo.toml",
  "go.mod",
  "pom.xml",
  "build.gradle",
  "Makefile",
  "Dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  ".github/workflows/",
  "tsconfig.json",
  "pyproject.toml",
  "setup.py",
  ".eslintrc",
  ".prettierrc",
  "jest.config",
  "vitest.config",
];

// Tech stack detection patterns
export const TECH_PATTERNS = {
  "Node.js / JavaScript": ["package.json", "node_modules", ".nvmrc"],
  "TypeScript": ["tsconfig.json", "*.ts", "*.tsx"],
  "Python": ["requirements.txt", "pyproject.toml", "setup.py", "Pipfile"],
  "Rust": ["Cargo.toml", "*.rs"],
  "Go": ["go.mod", "go.sum", "*.go"],
  "Java": ["pom.xml", "build.gradle", "*.java"],
  "C# / .NET": ["*.csproj", "*.sln", "Program.cs"],
  "Docker": ["Dockerfile", "docker-compose.yml"],
  "Kubernetes": ["k8s/", "*.yaml"],
  "React": ["react", "jsx", "tsx"],
  "Next.js": ["next.config"],
  "Azure Functions": ["host.json", "function.json"],
  "Terraform": ["*.tf", "terraform/"],
  "Bicep": ["*.bicep", "main.bicep"],
};
