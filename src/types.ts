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
}

export interface ReadFileResult {
  path: string;
  content: string;
  totalLines: number;
  startLine: number;
  endLine: number;
  truncated: boolean;
  sizeBytes: number;
}

export interface ListFilesResult {
  pattern: string;
  files: string[];
  totalFound: number;
  truncated: boolean;
}
