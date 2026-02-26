import fg from "fast-glob";
import fs from "fs";
import path from "path";
import {
  DEFAULT_CONTEXT_LINES,
  IGNORED_DIRS,
  IGNORED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  MAX_READ_LINES,
  MAX_SEARCH_RESULTS,
  SENSITIVE_FILE_PATTERNS,
} from "./constants.js";
import { isGitignored, loadGitignore } from "./gitignore.js";
import type {
  FileMatch,
  FileNode,
  FindFileResult,
  FoundFile,
  ListFilesResult,
  ReadFileResult,
  SearchMatch,
  SearchResult,
  UsageStats,
} from "./types.js";

function shouldIgnoreFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  if (IGNORED_EXTENSIONS.has(ext)) return true;

  const basename = path.basename(filePath);
  if (basename.endsWith(".min.js") || basename.endsWith(".min.css"))
    return true;

  return false;
}

function shouldIgnoreDir(dirName: string): boolean {
  return IGNORED_DIRS.has(dirName) || dirName.startsWith(".");
}

function isSensitiveFile(filePath: string): boolean {
  const basename = path.basename(filePath).toLowerCase();
  return SENSITIVE_FILE_PATTERNS.some((p) => basename === p);
}

interface CollectResult {
  files: string[];
  bytesProcessed: number;
}

function collectFiles(rootDir: string, extensions?: string[]): CollectResult {
  const files: string[] = [];
  let bytesProcessed = 0;

  function walk(dir: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(rootDir, fullPath);

      if (entry.isDirectory()) {
        if (
          !shouldIgnoreDir(entry.name) &&
          !isGitignored(rootDir, relativePath + "/")
        ) {
          walk(fullPath);
        }
      } else if (entry.isFile()) {
        if (shouldIgnoreFile(fullPath)) continue;
        if (isSensitiveFile(fullPath)) continue;
        if (isGitignored(rootDir, relativePath)) continue;

        // Skip files larger than the size limit
        let fileSize: number;
        try {
          const stat = fs.statSync(fullPath);
          if (stat.size > MAX_FILE_SIZE_BYTES) continue;
          fileSize = stat.size;
        } catch {
          continue;
        }

        if (extensions && extensions.length > 0) {
          const ext = path.extname(entry.name).toLowerCase().replace(".", "");
          if (!extensions.includes(ext)) continue;
        }

        files.push(fullPath);
        bytesProcessed += fileSize;
      }
    }
  }

  walk(rootDir);
  return { files, bytesProcessed };
}

function searchFile(
  filePath: string,
  pattern: RegExp,
  contextLines: number,
): SearchMatch[] {
  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }

  const lines = content.split("\n");
  const matches: SearchMatch[] = [];

  for (let i = 0; i < lines.length; i++) {
    // Reset lastIndex for global regex
    pattern.lastIndex = 0;
    if (pattern.test(lines[i])) {
      matches.push({
        file: filePath,
        lineNumber: i + 1,
        line: lines[i],
        contextBefore: lines.slice(Math.max(0, i - contextLines), i),
        contextAfter: lines.slice(
          i + 1,
          Math.min(lines.length, i + 1 + contextLines),
        ),
      });
    }
  }

  return matches;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function searchCodebase(
  rootDir: string,
  query: string,
  options: {
    extensions?: string[];
    contextLines?: number;
    caseSensitive?: boolean;
    useRegex?: boolean;
    maxResults?: number;
  } = {},
): SearchResult {
  const startTime = performance.now();
  const {
    contextLines = DEFAULT_CONTEXT_LINES,
    caseSensitive = false,
    useRegex = false,
    extensions,
    maxResults = MAX_SEARCH_RESULTS,
  } = options;

  let pattern: RegExp;
  try {
    const flags = caseSensitive ? "g" : "gi";
    pattern = useRegex
      ? new RegExp(query, flags)
      : new RegExp(escapeRegex(query), flags);
  } catch {
    throw new Error(`Invalid regex pattern: ${query}`);
  }

  const { files, bytesProcessed } = collectFiles(rootDir, extensions);
  const fileMatches: FileMatch[] = [];
  let totalMatches = 0;
  let truncated = false;

  for (const file of files) {
    if (totalMatches >= maxResults) {
      truncated = true;
      break;
    }

    const matches = searchFile(file, pattern, contextLines);
    if (matches.length > 0) {
      const relPath = path.relative(rootDir, file);
      fileMatches.push({
        file: relPath,
        matchCount: matches.length,
        matches: matches.map((m) => ({ ...m, file: relPath })),
      });
      totalMatches += matches.length;
    }
  }

  const stats: UsageStats = {
    filesScanned: files.length,
    bytesProcessed,
    matchesFound: totalMatches,
    responseChars: 0,
    durationMs: Math.round(performance.now() - startTime),
  };

  return { query, totalMatches, files: fileMatches, truncated, stats };
}

export function findFile(
  rootDir: string,
  name: string,
  options: {
    exact?: boolean;
    extensions?: string[];
    maxResults?: number;
  } = {},
): FindFileResult {
  const startTime = performance.now();
  const { exact = false, extensions, maxResults = 20 } = options;
  const lowerName = name.toLowerCase();
  const results: FoundFile[] = [];
  let filesScanned = 0;

  function walk(dir: string): void {
    if (results.length >= maxResults) return;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (results.length >= maxResults) return;
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(rootDir, fullPath);

      if (entry.isDirectory()) {
        if (
          !shouldIgnoreDir(entry.name) &&
          !isGitignored(rootDir, relativePath + "/")
        ) {
          walk(fullPath);
        }
      } else if (entry.isFile()) {
        if (shouldIgnoreFile(fullPath)) continue;
        if (isSensitiveFile(fullPath)) continue;
        if (isGitignored(rootDir, relativePath)) continue;
        filesScanned++;

        if (extensions && extensions.length > 0) {
          const ext = path.extname(entry.name).toLowerCase().replace(".", "");
          if (!extensions.includes(ext)) continue;
        }

        const entryLower = entry.name.toLowerCase();
        const matches = exact
          ? entryLower === lowerName
          : entryLower.includes(lowerName);

        if (matches) {
          results.push({
            path: relativePath,
            name: entry.name,
            directory: path.relative(rootDir, dir) || ".",
          });
        }
      }
    }
  }

  walk(rootDir);

  const stats: UsageStats = {
    filesScanned,
    bytesProcessed: 0,
    matchesFound: results.length,
    responseChars: 0,
    durationMs: Math.round(performance.now() - startTime),
  };

  return { files: results, totalFound: results.length, stats };
}

export function getFileStructure(
  rootDir: string,
  targetPath: string = "",
  maxDepth: number = 4,
): FileNode {
  const absTarget = targetPath ? path.resolve(rootDir, targetPath) : rootDir;

  function buildTree(dirPath: string, depth: number): FileNode {
    const name = path.basename(dirPath) || dirPath;
    const node: FileNode = {
      name,
      path: path.relative(rootDir, dirPath) || ".",
      type: "directory",
      children: [],
    };

    if (depth >= maxDepth) return node;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch {
      return node;
    }

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(rootDir, fullPath);

      if (entry.isDirectory()) {
        if (
          !shouldIgnoreDir(entry.name) &&
          !isGitignored(rootDir, relativePath + "/")
        ) {
          node.children!.push(buildTree(fullPath, depth + 1));
        }
      } else if (entry.isFile()) {
        if (
          !shouldIgnoreFile(entry.name) &&
          !isSensitiveFile(entry.name) &&
          !isGitignored(rootDir, relativePath)
        ) {
          node.children!.push({
            name: entry.name,
            path: relativePath,
            type: "file",
            extension: path.extname(entry.name).replace(".", ""),
          });
        }
      }
    }

    return node;
  }

  return buildTree(absTarget, 0);
}

export function readFile(
  rootDir: string,
  filePath: string,
  startLine?: number,
  endLine?: number,
): ReadFileResult {
  const startTime = performance.now();

  // Resolve and validate path — prevent traversal attacks
  const absPath = path.resolve(rootDir, filePath);
  const normalizedRoot = path.resolve(rootDir);

  if (
    !absPath.startsWith(normalizedRoot + path.sep) &&
    absPath !== normalizedRoot
  ) {
    throw new Error("Path traversal denied: path is outside project root");
  }

  if (isSensitiveFile(absPath)) {
    throw new Error("Access denied: .env files are excluded for security");
  }

  if (!fs.existsSync(absPath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const stat = fs.statSync(absPath);
  if (!stat.isFile()) {
    throw new Error(`Not a file: ${filePath}`);
  }

  if (stat.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File too large (${(stat.size / 1024 / 1024).toFixed(1)}MB). Max: ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`,
    );
  }

  const content = fs.readFileSync(absPath, "utf-8");
  const allLines = content.split("\n");
  const totalLines = allLines.length;

  // Apply line range
  const start = startLine ? Math.max(1, startLine) : 1;
  const end = endLine
    ? Math.min(totalLines, endLine)
    : Math.min(totalLines, start + MAX_READ_LINES - 1);

  const selectedLines = allLines.slice(start - 1, end);
  const truncated = !endLine && totalLines > MAX_READ_LINES;

  const stats: UsageStats = {
    filesScanned: 1,
    bytesProcessed: stat.size,
    matchesFound: 0,
    responseChars: 0,
    durationMs: Math.round(performance.now() - startTime),
  };

  return {
    path: path.relative(rootDir, absPath),
    content: selectedLines.join("\n"),
    totalLines,
    startLine: start,
    endLine: Math.min(end, totalLines),
    truncated,
    sizeBytes: stat.size,
    stats,
  };
}

export function listFiles(
  rootDir: string,
  pattern: string,
  maxResults: number = 100,
): ListFilesResult {
  const startTime = performance.now();
  const ig = loadGitignore(rootDir);

  // Build ignore patterns from IGNORED_DIRS
  const ignorePatterns = [...IGNORED_DIRS].map((d) => `**/${d}/**`);

  const files = fg.sync(pattern, {
    cwd: rootDir,
    ignore: ignorePatterns,
    dot: false,
    onlyFiles: true,
    suppressErrors: true,
  });

  // Post-filter through gitignore and sensitive file list
  const filtered = files.filter((f) => !ig.ignores(f) && !isSensitiveFile(f));

  const truncated = filtered.length > maxResults;
  const capped = filtered.slice(0, maxResults);

  const stats: UsageStats = {
    filesScanned: files.length,
    bytesProcessed: 0,
    matchesFound: filtered.length,
    responseChars: 0,
    durationMs: Math.round(performance.now() - startTime),
  };

  return {
    pattern,
    files: capped,
    totalFound: filtered.length,
    truncated,
    stats,
  };
}
