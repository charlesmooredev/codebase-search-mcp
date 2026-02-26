export interface UsageStats {
  filesScanned: number;
  bytesProcessed: number;
  matchesFound: number;
  responseChars: number;
  durationMs: number;
}

export interface SearchMatch {
  file: string;
  lineNumber: number;
  line: string;
  contextBefore: string[];
  contextAfter: string[];
}

export interface FileMatch {
  file: string;
  matchCount: number;
  matches: SearchMatch[];
}

export interface SearchResult {
  query: string;
  totalMatches: number;
  files: FileMatch[];
  truncated: boolean;
  stats?: UsageStats;
}

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
  extension?: string;
}

export interface FoundFile {
  path: string;
  name: string;
  directory: string;
}

export interface FindFileResult {
  files: FoundFile[];
  totalFound: number;
  stats?: UsageStats;
}

export interface ReadFileResult {
  path: string;
  content: string;
  totalLines: number;
  startLine: number;
  endLine: number;
  truncated: boolean;
  sizeBytes: number;
  stats?: UsageStats;
}

export interface ListFilesResult {
  pattern: string;
  files: string[];
  totalFound: number;
  truncated: boolean;
  stats?: UsageStats;
}
