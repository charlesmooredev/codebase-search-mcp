import fs from "fs";
import path from "path";
import ignore, { type Ignore } from "ignore";

let cachedIgnore: Ignore | null = null;
let cachedRoot: string | null = null;

export function loadGitignore(rootDir: string): Ignore {
  if (cachedIgnore && cachedRoot === rootDir) return cachedIgnore;

  const ig = ignore();
  const gitignorePath = path.join(rootDir, ".gitignore");

  try {
    const content = fs.readFileSync(gitignorePath, "utf-8");
    ig.add(content);
  } catch {
    // No .gitignore or unreadable — return empty filter
  }

  cachedIgnore = ig;
  cachedRoot = rootDir;
  return ig;
}

export function isGitignored(rootDir: string, relativePath: string): boolean {
  const ig = loadGitignore(rootDir);
  return ig.ignores(relativePath);
}
