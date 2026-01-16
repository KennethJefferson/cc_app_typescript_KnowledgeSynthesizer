# KnowledgeSynthesizer Project Instructions

## Overview

KnowledgeSynthesizer v3 is a CLI application using Bun/TypeScript that synthesizes AI-generated content from course materials via Claude CLI.

## Architecture

Single-phase generation pipeline:
1. Parse `fileassets.txt` (directory listing + file contents)
2. Build prompt from ccg-* skill's SKILL.md + course content
3. Invoke Claude CLI to generate output files

## Key Files

| File | Purpose |
|------|---------|
| `src/cli.ts` | Entry point, argument parsing |
| `src/worker.ts` | Worker pool orchestration |
| `src/generator.ts` | Content generation via Claude CLI |
| `src/parser.ts` | fileassets.txt parsing |
| `src/skill.ts` | Skill validation and discovery |
| `src/tui.ts` | Terminal UI with progress bars |
| `src/logger.ts` | Logging utilities |
| `src/types.ts` | TypeScript interfaces |

## Skills Directory Structure

```
skills/
├── ccg-sop-generator/       # Content synthesis (active)
├── ccg-summary-generator/
├── ccg-project-*/
├── ccg-github-sync/
├── extractor-*/             # Reserved for future use
├── db-extractor-*/
└── file-identifier/
```

## Running the Application

```bash
# Single course with SOP generation
bun run src/cli.ts -i "./course-name" --ccg SOP

# Multiple courses with custom worker count
bun run src/cli.ts -i ./course1 ./course2 -w 5 --ccg "Summary"

# List available skills
bun run src/cli.ts --list
```

## Important Patterns

### Skill Naming
- Content generators: `ccg-<name>` (e.g., `ccg-sop-generator`)
- Extractors: `extractor-<type>` or `db-extractor-<type>` (reserved)

### Output Directories
- Generated content: `<course>/CODE/__ccg_<type>/` (e.g., `__ccg_SOP/`)
- Logs: `<course>/CODE/__cc_processing_log/`

### Content Generation
The `generator.ts` module invokes Claude CLI with the skill's SKILL.md as the prompt:
```bash
claude --dangerously-skip-permissions --allowedTools "Write,Glob,Read" --max-turns 50 < prompt
```

**Important**: The SKILL.md content drives the entire generation format. The generator only adds:
- Course name
- Output directory path
- Source content from fileassets.txt (150K char limit, binary files skipped)

Each skill defines its own output structure (e.g., `topics/` for Summary, `procedures/` for SOP).

## Testing

Test course materials are in `__test-courses/`. Run generation:
```bash
bun run src/cli.ts -i "./__test-courses/OpenAPI (Swagger); Designing & Documenting Rest APIs" --ccg SOP
```

## Development Notes

- Uses `@opentui/core` for terminal UI
- Bun shell (`$`) for subprocess execution
- No direct Anthropic API calls - uses Claude CLI OAuth authentication
- Binary files (.mp4, .zip, .exe, etc.) are skipped, not extracted
