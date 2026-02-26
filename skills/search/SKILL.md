---
description: Search the codebase for code, files, or patterns using the codebase-search MCP tools
allowed-tools: [mcp__search-code__search_codebase, mcp__search-code__find_file, mcp__search-code__get_file_structure, mcp__search-code__read_file, mcp__search-code__list_files]
argument-hint: <query or pattern>
---

Search the codebase for: $ARGUMENTS

Use the search-code MCP tools to find what the user is looking for. Pick the best tool for the job:

- **search_codebase**: Search file contents for code, strings, regex patterns, function names, variable names, error messages, etc.
- **find_file**: Locate files by name when the user knows part of the filename.
- **list_files**: Find files matching a glob pattern (e.g. all test files, all components).
- **get_file_structure**: Show the project directory tree to understand layout.
- **read_file**: Read a specific file after locating it.

Start with the most likely tool based on the query. If the first search doesn't find what's needed, try alternative tools or refine the search. Return results concisely.
