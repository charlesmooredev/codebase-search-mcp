// Max characters returned in a single response to keep token usage controlled
export const CHARACTER_LIMIT = 50_000;

// Default number of context lines around each match
export const DEFAULT_CONTEXT_LINES = 3;

// Max results per search to avoid flooding Claude's context
export const MAX_SEARCH_RESULTS = 30;

// Max file size to read (skip binary/huge files)
export const MAX_FILE_SIZE_BYTES = 1_048_576; // 1MB

// Max lines for read_file without a range specified
export const MAX_READ_LINES = 2000;

// Directories to always ignore
export const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".nuxt",
  "coverage",
  ".cache",
  "__pycache__",
  ".venv",
  "venv",
  ".idea",
  ".vscode",
  "vendor",
  "tmp",
  "temp",
  ".turbo",
  ".nx",
  ".output",
  ".svelte-kit",
  ".parcel-cache",
  "out",
]);

// Sensitive files that must never be read, searched, or returned (security)
export const SENSITIVE_FILE_PATTERNS: string[] = [
  ".env",
  ".env.local",
  ".env.development",
  ".env.development.local",
  ".env.production",
  ".env.production.local",
  ".env.staging",
  ".env.staging.local",
  ".env.test",
  ".env.test.local",
];

// File extensions to ignore in searches
export const IGNORED_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp", ".bmp",
  ".mp4", ".mov", ".avi", ".mp3", ".wav", ".ogg",
  ".zip", ".tar", ".gz", ".rar", ".7z",
  ".lock", ".sum",
  ".pdf", ".docx", ".xlsx",
  ".woff", ".woff2", ".ttf", ".eot",
  ".min.js", ".min.css",
  ".map",
  ".pyc", ".pyo", ".class", ".o", ".obj", ".exe", ".dll", ".so", ".dylib",
]);
