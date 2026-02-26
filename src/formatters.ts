import { CHARACTER_LIMIT } from "./constants.js";
import type { SearchResult, FileNode, ReadFileResult, ListFilesResult, UsageStats } from "./types.js";

export function formatSearchResults(result: SearchResult): string {
  if (result.totalMatches === 0) {
    return `No matches found for: "${result.query}"`;
  }

  const lines: string[] = [
    `Search: "${result.query}" -- ${result.totalMatches} match${result.totalMatches !== 1 ? "es" : ""} in ${result.files.length} file${result.files.length !== 1 ? "s" : ""}${result.truncated ? " (truncated)" : ""}`,
    "",
  ];

  for (const fileMatch of result.files) {
    lines.push(`--- ${fileMatch.file} (${fileMatch.matchCount} match${fileMatch.matchCount !== 1 ? "es" : ""})`);

    for (const match of fileMatch.matches) {
      if (match.contextBefore.length > 0) {
        for (let i = 0; i < match.contextBefore.length; i++) {
          const lineNum = match.lineNumber - match.contextBefore.length + i;
          lines.push(`  L${lineNum}: ${match.contextBefore[i]}`);
        }
      }
      lines.push(`> L${match.lineNumber}: ${match.line}`);
      if (match.contextAfter.length > 0) {
        for (let i = 0; i < match.contextAfter.length; i++) {
          lines.push(`  L${match.lineNumber + i + 1}: ${match.contextAfter[i]}`);
        }
      }
      lines.push("");
    }
  }

  if (result.truncated) {
    lines.push("[Results truncated. Use a more specific query or add extension filters.]");
  }

  let output = truncateOutput(lines.join("\n"));

  if (result.stats) {
    result.stats.responseChars = output.length;
    output += formatUsageFooter(result.stats);
  }

  return output;
}

export function formatFileTree(node: FileNode, indent: string = ""): string {
  const lines: string[] = [];

  if (indent === "") {
    lines.push(`${node.path}/`);
  }

  if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const isLast = i === node.children.length - 1;
      const connector = isLast ? "└── " : "├── ";
      const suffix = child.type === "directory" ? "/" : "";

      lines.push(`${indent}${connector}${child.name}${suffix}`);

      if (child.type === "directory" && child.children) {
        const childIndent = indent + (isLast ? "    " : "│   ");
        const subtree = formatFileTree(child, childIndent);
        // Skip the first line (root label) from recursive calls
        const subLines = subtree.split("\n").slice(1);
        if (subLines.length > 0) {
          lines.push(subLines.join("\n"));
        }
      }
    }
  }

  return truncateOutput(lines.join("\n"));
}

export function formatReadFile(result: ReadFileResult): string {
  const sizeStr = result.sizeBytes < 1024
    ? `${result.sizeBytes}B`
    : `${(result.sizeBytes / 1024).toFixed(1)}KB`;

  const header = `File: ${result.path} (${result.totalLines} lines, ${sizeStr})`;
  const rangeInfo = `Lines ${result.startLine}-${result.endLine}:`;

  const contentLines = result.content.split("\n");
  const numbered = contentLines.map((line, i) => {
    const lineNum = result.startLine + i;
    return `${String(lineNum).padStart(5)}: ${line}`;
  });

  const parts = [header, rangeInfo, ...numbered];

  if (result.truncated) {
    parts.push("", `[Truncated at ${result.endLine} lines. Use start_line/end_line for specific ranges.]`);
  }

  let output = truncateOutput(parts.join("\n"));

  if (result.stats) {
    result.stats.responseChars = output.length;
    output += formatUsageFooter(result.stats);
  }

  return output;
}

export function formatFileList(result: ListFilesResult): string {
  if (result.totalFound === 0) {
    return `No files found matching: "${result.pattern}"`;
  }

  const lines: string[] = [
    `Pattern: "${result.pattern}" -- ${result.totalFound} file${result.totalFound !== 1 ? "s" : ""}${result.truncated ? " (showing first " + result.files.length + ")" : ""}`,
    "",
    ...result.files,
  ];

  if (result.truncated) {
    lines.push("", "[Results truncated. Use a more specific pattern.]");
  }

  let output = truncateOutput(lines.join("\n"));

  if (result.stats) {
    result.stats.responseChars = output.length;
    output += formatUsageFooter(result.stats);
  }

  return output;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0B";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function formatTokens(count: number): string {
  if (count < 1000) return `~${count}`;
  if (count < 1000000) return `~${(count / 1000).toFixed(1)}K`;
  return `~${(count / 1000000).toFixed(1)}M`;
}

export function formatUsageFooter(stats: UsageStats): string {
  const parts: string[] = [];

  if (stats.filesScanned > 0) {
    parts.push(`${stats.filesScanned} files scanned`);
  }
  if (stats.bytesProcessed > 0) {
    parts.push(`${formatBytes(stats.bytesProcessed)} processed`);
  }
  if (stats.matchesFound > 0) {
    parts.push(`${stats.matchesFound} matches`);
  }

  // Token savings: bytes that would have been sent as context (~4 chars/token)
  // minus the compact response we actually returned
  const tokensIfDirect = Math.round(stats.bytesProcessed / 4);
  const tokensReturned = Math.round(stats.responseChars / 4);
  const tokensSaved = tokensIfDirect - tokensReturned;

  if (tokensSaved > 0) {
    parts.push(`${formatTokens(tokensSaved)} tokens saved`);
  }

  parts.push(`${stats.durationMs}ms`);

  return `\n---\n[search-code-mcp] ${parts.join(" | ")}`;
}

function truncateOutput(output: string): string {
  if (output.length > CHARACTER_LIMIT) {
    return output.slice(0, CHARACTER_LIMIT) + "\n\n[OUTPUT TRUNCATED]";
  }
  return output;
}
