# search-code-mcp

Claude Code plugin that gives Claude dedicated codebase search tools — saving tokens by offloading file traversal to a local MCP server.

## Why?

When Claude Code explores your codebase, it reads files one-by-one, burning through tokens before writing a single line of code. This plugin gives Claude search tools that run locally with zero token cost during execution, returning only the relevant matches.

## Install as Claude Code Plugin

**1. Add the marketplace:**

```
/plugin marketplace add charlesmooredev/codebase-search-mcp
```

**2. Install the plugin:**

```
/plugin install codebase-search@codebase-search
```

**3. Restart Claude Code** to load the MCP server.

That's it. Claude will automatically prefer the plugin's tools over built-in Grep/Glob/Read when searching your codebase.

### Updating

```
/plugin marketplace update
/plugin install codebase-search@codebase-search
```

## Tools

| Tool | Description |
| --- | --- |
| `search_codebase` | Full-text/regex search across all files with context lines |
| `find_file` | Find files by name (partial or exact match) |
| `get_file_structure` | Directory tree view of any path |
| `read_file` | Read file contents with optional line range |
| `list_files` | List files matching a glob pattern |

All tools automatically skip `node_modules`, `.git`, build outputs, binary files, and anything in your `.gitignore`.

## /search Skill

The plugin includes a `/search` slash command:

```
/codebase-search:search useCallback hooks
```

This invokes the MCP tools with pre-approved permissions — no confirmation prompts.

## Usage Stats

Every tool response includes a footer showing what work was done:

```
---
[search-code-mcp] 247 files scanned | 1.2MB processed | 12 matches | ~300K tokens saved | 45ms
```

- **Files scanned** — how many files the tool traversed
- **Processed** — total bytes of file content read
- **Matches** — results found
- **Tokens saved** — estimated tokens Claude would have spent reading all those files directly
- **Duration** — wall-clock execution time

## Alternative: Manual MCP Setup

If you prefer not to use the plugin system, you can add the MCP server directly.

**Clone and build:**

```bash
git clone https://github.com/charlesmooredev/codebase-search-mcp.git
cd codebase-search-mcp
npm install
npm run build
```

**Add to Claude Code:**

```bash
claude mcp add search-code -- node /absolute/path/to/search-code-mcp/dist/index.js
```

**Or via project `.mcp.json`:**

```json
{
  "mcpServers": {
    "search-code": {
      "command": "node",
      "args": ["/absolute/path/to/search-code-mcp/dist/index.js"]
    }
  }
}
```

The MCP uses the directory where Claude Code is running as the search root. To pin to a specific path, pass it as an argument:

```json
{
  "mcpServers": {
    "search-code": {
      "command": "node",
      "args": [
        "/path/to/search-code-mcp/dist/index.js",
        "/path/to/your/project"
      ]
    }
  }
}
```

## What Gets Ignored

Automatically excluded from searches:

- `node_modules`, `.git`, `dist`, `build`, `.next`, and other build directories
- Binary files (images, videos, fonts, archives)
- Minified files (`.min.js`, `.min.css`)
- Source maps (`.map`)
- Files matched by your project's `.gitignore`

## Development

```bash
npm install       # install dependencies
npm run dev       # watch mode (tsc --watch)
npm run build     # compile TypeScript
npm run bundle    # create self-contained dist/index.cjs
npm start         # run compiled server
```
