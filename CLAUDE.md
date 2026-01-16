# KnowledgeSynthesizer Project Instructions

## Overview

KnowledgeSynthesizer v3 is a CLI application using Bun/TypeScript that synthesizes AI-generated content from course materials using the Claude Agent SDK.

## Architecture

Two-phase processing pipeline:
1. **Extraction Phase**: Worker pool processes course files via subagents to `__cc_validated_files/`
2. **Generation Phase**: Claude CLI generates content based on ccg-* skill SKILL.md prompts

## Key Files

| File | Purpose |
|------|---------|
| `src/cli.ts` | Entry point, argument parsing |
| `src/worker.ts` | Worker pool orchestration |
| `src/generator.ts` | Content generation via Claude CLI |
| `src/processor.ts` | File processing and routing |
| `src/parser.ts` | fileassets.txt parsing |
| `src/skill.ts` | Skill validation and loading |
| `src/tui.ts` | Terminal UI with progress bars |
| `src/logger.ts` | Logging utilities |

## Skills Directory Structure

```
skills/
├── ccg-sop-generator/     # Content synthesis skills (ccg-*)
├── ccg-summary-generator/
├── extractor-*/           # Document extraction skills
├── db-extractor-*/        # Database extraction skills
└── file-identifier/       # File type routing
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
- Extractors: `extractor-<type>` or `db-extractor-<type>`

### Output Directories
- Validated files: `<course>/CODE/__cc_validated_files/`
- Generated content: `<course>/CODE/__ccg_<type>/`
- Logs: `<course>/CODE/__cc_processing_log/`

### Content Generation
The `generator.ts` module invokes Claude CLI with the skill's SKILL.md as the prompt:
```bash
claude --dangerously-skip-permissions --allowedTools "Write,Glob,Read" --max-turns 50 < prompt
```

**Important**: The SKILL.md content drives the entire generation format. The generator only adds:
- Course name
- Output directory path
- Source content from fileassets.txt

Each skill defines its own output structure (e.g., `topics/` for Summary, `procedures/` for SOP).

## Testing

Test course materials are in `__test-courses/`. Run extraction and generation:
```bash
bun run src/cli.ts -i "./__test-courses/OpenAPI (Swagger); Designing & Documenting Rest APIs" --ccg SOP
```

## Development Notes

- Uses `@opentui/core` for terminal UI
- Bun shell (`$`) for subprocess execution
- No direct Anthropic API calls - uses Claude CLI OAuth authentication
