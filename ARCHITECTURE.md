# KnowledgeSynthesizer v3 Architecture

CLI application using Bun/TypeScript that synthesizes AI-generated content from course materials via Claude CLI.

## Overview

```
CLI (Bun/TypeScript)
 │
 ├── Parse args: -i, -w, --ccg
 │
 ├── Validate --ccg skill exists (fail early)
 │
 └── Worker Pool (-w workers, default 3)
       │
       ├── Worker 1 → Course A
       │     │
       │     ├── Read fileassets.txt
       │     ├── Parse (directory listing + file entries)
       │     │
       │     └── Run Generator
       │           ├── Load SKILL.md (ccg-* skill)
       │           ├── Build prompt (skill + course context + content)
       │           ├── Invoke Claude CLI
       │           └── Collect generated .md files
       │
       ├── Worker 2 → Course B
       └── Worker N → Course N
```

## CLI Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `-i, --input <paths...>` | Yes | Input directories (courses/projects). Accepts multiple. |
| `-w, --workers <count>` | No | Number of parallel workers (default: 3) |
| `-c, --ccg <type>` | Yes | Content type to generate. Must match existing ccg-* skill. |
| `-l, --list` | No | List available ccg-* skills |
| `-h, --help` | No | Show help message |

### Examples

```bash
# Single course
bun run src/cli.ts -i "./C++ for Beginners" --ccg "SOP"

# Multiple courses with custom workers
bun run src/cli.ts -i ./course1 ./course2 ./course3 -w 5 --ccg "Summary"

# List available skills
bun run src/cli.ts --list
```

## Directory Structure

### Input (Course)

```
C++ for Beginners/
├── fileassets.txt          # Master file (required)
├── class01.srt
├── class02.srt
└── CODE/
    ├── Project01/
    │   ├── car.hpp
    │   ├── car.cpp
    │   └── car.sln
    └── Project02/
        └── ...
```

### Output

```
C++ for Beginners/
└── CODE/
    ├── __ccg_SOP/               # Generated content (skill-specific)
    │   ├── procedures/
    │   │   └── section_01_*.md
    │   ├── README.md
    │   └── glossary.md
    ├── __ccg_Summary/           # Different skill → different output
    │   ├── topics/
    │   │   └── topic_XX_*.md
    │   └── README.md
    └── __cc_processing_log/     # Logs
        └── run_2026-01-15_143022.json
```

Output directory naming is determined by skill:

| Skill | Output Directory |
|-------|------------------|
| `ccg-sop-generator` | `__ccg_SOP` |
| `ccg-summary-generator` | `__ccg_Summary` |
| `ccg-project-*` | `__CC_Projects` |
| Other | `__ccg_<skill-name>` |

## fileassets.txt Format

Generated externally. Contains all course resources in a single file.

### Structure

```
This file is a merged representation...
Generated on: 2026-01-15 11:38:29

================================================================
Directory List
================================================================

├───1 - Introduction
│   ├───2. Welcome to the Course.srt
│   └───3. What Is the OpenAPI Specification.srt
├───CODE
│   └───Project01
│       ├───main.cpp
│       └───...

================================================================
Files
================================================================

================
File: "K:\courses\cpp\1 - Introduction\2. Welcome to the Course.srt"
================
1
00:00:00,000 --> 00:00:03,500
Welcome to the course...

================
File: "K:\courses\cpp\CODE\Project01\main.cpp"
================
#include <iostream>
int main() {
    return 0;
}
```

### Delimiters

| Element | Delimiter |
|---------|-----------|
| Major sections | `================================================================` |
| File entry start | `================\nFile: "` |
| File path | Quoted string after `File: ` |
| File content | Everything after second `================` until next file |

### Parsing Regex

```typescript
const FILE_PATTERN = /================\nFile: "([^"]+)"\n================\n([\s\S]*?)(?=\n================\nFile:|$)/g;
// Group 1: Absolute path
// Group 2: File content
```

## Content Handling

### Size Limits

| Setting | Value |
|---------|-------|
| Max content size | 150,000 chars (~37K tokens) |
| Overflow handling | Truncation with note |

### Binary File Handling

Binary files are skipped (not extracted):

```typescript
const skipExtensions = [
  '.mp4', '.mkv', '.avi', '.mov',  // Video
  '.mp3', '.wav',                   // Audio
  '.exe', '.dll', '.so', '.bin',   // Executables
  '.zip', '.rar', '.7z'            // Archives
];
```

Text-based files (.srt, .txt, .md, code files) pass through directly.

### Content Assembly

```typescript
interface FileEntry {
  path: string;           // Absolute path from fileassets.txt
  filename: string;       // Extracted filename
  extension: string;      // File extension
  content: string;        // Full file content
}

interface ParsedAssets {
  directoryListing: string;
  files: FileEntry[];
}
```

## Worker Architecture

Each worker processes one course independently.

```typescript
interface WorkerConfig {
  workers: number;        // User-provided via -w (default: 3)
}
```

### Why This Design

- **Isolation**: No cross-course contamination possible
- **Tracking**: Easy to know when a course is complete
- **Debugging**: Isolated logs per course

### Worker Flow

```
Worker (Course A)
 │
 ├── 1. Load fileassets.txt
 ├── 2. Parse (extract directory listing + files)
 ├── 3. Run Generator
 │      │
 │      ├── Read SKILL.md from ccg-* skill
 │      ├── Build prompt (skill instructions + course content)
 │      ├── Write temp prompt file
 │      ├── Invoke: claude --dangerously-skip-permissions \
 │      │           --allowedTools "Write,Glob,Read" \
 │      │           --max-turns 50 < prompt.txt
 │      └── Collect generated .md files
 │
 └── 4. Save run log → __cc_processing_log/
```

## Generation Pipeline

### Prompt Structure

The generator builds a prompt combining:

1. **Skill instructions** (from SKILL.md)
2. **Generation context** (course name, output directory)
3. **Source content** (directory listing + file contents)

```
<SKILL.md content>

## Generation Context

**Course Name:** C++ for Beginners
**Output Directory:** /path/to/CODE/__ccg_SOP

Write all generated files to the output directory above using the Write tool.

## Source Content

# Course Content

## Directory Structure
<directory listing>

## Files
### File: class01.srt
<content>
...
```

### Claude CLI Invocation

```bash
claude --dangerously-skip-permissions \
       --allowedTools "Write,Glob,Read" \
       --max-turns 50 \
       < prompt.txt
```

- **Write**: Create output files
- **Glob**: Find files if needed
- **Read**: Read files if needed
- **max-turns 50**: Allow multiple conversation turns for complex generation

### Skill-Driven Output

Each skill's SKILL.md defines its own output structure. The generator does not impose any format - the skill controls:

- Directory structure (e.g., `procedures/`, `topics/`)
- File naming conventions
- Content organization
- Required files (README.md, glossary.md, etc.)

## Skill Validation

Before processing begins:

1. Parse --ccg argument
2. Normalize name (lowercase, spaces → hyphens)
3. Look for matching skill in `skills/` directory
4. If not found: error with list of available skills
5. If found: proceed with processing

### Skill Matching

```typescript
// Exact match first
skills/ccg-<name>/SKILL.md

// Fallback: partial match
skills/*<name>*/SKILL.md

// Example: --ccg "SOP" → skills/ccg-sop-generator/SKILL.md
```

### Skill Discovery

```bash
bun run src/cli.ts --list

Available ccg-* skills:

  ccg-github-sync
    Publish generated content to GitHub

  ccg-project-architect
    Extract architecture from large projects

  ccg-sop-generator
    Generate SOPs from course content
  ...
```

## Logging

### Log Location

```
<course>/CODE/__cc_processing_log/
└── run_<timestamp>.json    # Per-run log
```

### Log Schema

```typescript
interface RunLog {
  run_id: string;           // "2026-01-15_143022"
  started_at: string;       // ISO timestamp
  completed_at: string;     // ISO timestamp
  status: "success" | "completed_with_warnings" | "failed";
  files_processed: number;
  files_failed: number;
  warnings: Warning[];
  errors: Error[];
}

interface Warning {
  file: string;
  path: string;
  reason: "unsupported_format" | "extraction_failed" | "chunk_failed";
  message?: string;
}

interface Error {
  file: string;
  path: string;
  error: string;
  stack?: string;
}
```

## Error Handling

### Generation Failures

- Log error with details
- Save Claude CLI output to `_generation_log.txt` for debugging
- Mark worker as failed
- Continue with other courses

### Empty Input

- If no files found in fileassets.txt: error and skip course
- Continue with other courses

## Source Files

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

## Dependencies

### Runtime

- Bun 1.0+
- TypeScript
- Claude CLI (OAuth authenticated)

### NPM Packages

```json
{
  "@anthropic-ai/sdk": "^0.52.0",
  "@opentui/core": "^0.1.73"
}
```

Note: The Anthropic SDK is a dependency but not directly used - generation is via Claude CLI subprocess.

## Skills Inventory

### Content Synthesis (Active)

| Skill | Purpose |
|-------|---------|
| `ccg-sop-generator` | Generate SOPs from course content |
| `ccg-summary-generator` | Generate summaries and study guides |
| `ccg-project-discovery` | Identify projects in course files |
| `ccg-project-architect` | Extract architecture from large projects |
| `ccg-project-generator` | Generate code from course content |
| `ccg-project-maker` | Project orchestrator |
| `ccg-github-sync` | Publish to GitHub |

### Extractors (Reserved)

These skills exist but are not invoked in the current pipeline. They're available for future use when binary file extraction is needed:

| Skill | Purpose |
|-------|---------|
| `file-identifier` | Identify file types |
| `extractor-pdf` | PDF → text/markdown |
| `extractor-docx` | Word → text/markdown |
| `extractor-pptx` | PowerPoint → text/markdown |
| `extractor-html` | HTML → markdown |
| `extractor-image` | Image → text (OCR) |
| `db-identify` | Identify database type |
| `db-router` | Route to correct extractor |
| `db-extractor-sqlite` | SQLite → CSV/JSON/MD |
| `db-extractor-mysql` | MySQL → CSV/JSON/MD |
| `db-extractor-postgresql` | PostgreSQL → CSV/JSON/MD |
| `db-extractor-xlsx` | Excel → CSV |
| `archive-extractor` | Extract archives |

## Future Considerations

### Potential Enhancements

- Binary file extraction pipeline (invoke extractor skills)
- Chunking for very large courses (>150K chars)
- Caching of parsed content
- Incremental processing (skip unchanged files)
- Parallel generation with merge step

### Planned Skills

- `ccg-podcast` (Podcast script generation)
- `ccg-exam` (Exam/quiz generation)
