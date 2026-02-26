# search-code-mcp

MCP server for Claude Code that searches local codebases efficiently — saving tokens by offloading file traversal.

## Why?

When Claude Code explores your codebase, it reads files one-by-one, burning through tokens before writing a single line of code. This MCP gives Claude dedicated search tools that run locally with zero token cost during execution, returning only the relevant matches.

## Tools

| Tool                 | Description                                                |
| -------------------- | ---------------------------------------------------------- |
| `search_codebase`    | Full-text/regex search across all files with context lines |
| `find_file`          | Find files by name (partial or exact match)                |
| `get_file_structure` | Directory tree view of any path                            |
| `read_file`          | Read file contents with optional line range                |
| `list_files`         | List files matching a glob pattern                         |

## Quick Start

### Option A: npx (after publishing to npm)

```bash
claude mcp add search-code -- npx search-code-mcp
```

### Option B: Clone and build locally

```bash
git clone https://github.com/charlesmooredev/search-code-mcp.git
cd search-code-mcp
npm install
npm run build
```

Then add to Claude Code:

```bash
claude mcp add search-code -- node /absolute/path/to/search-code-mcp/dist/index.js
```

### Option C: Project-level `.mcp.json`

Create `.mcp.json` in your project root:

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

After updating config, restart Claude Code to load the MCP server.

## Guide Claude to Use It

Add to your project's `CLAUDE.md`:

```markdown
## Codebase Search

Before reading files directly, use the `search-code` MCP tools:

- `search_codebase` — find where something is implemented
- `find_file` — locate a file by name
- `list_files` — discover files by glob pattern
- `get_file_structure` — understand directory layout
- `read_file` — read file contents (with optional line range)

This saves tokens and speeds up your workflow.
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
npm install      # install dependencies
npm run dev      # watch mode (tsc --watch)
npm run build    # compile TypeScript
npm start        # run compiled server
```
