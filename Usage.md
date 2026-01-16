# KnowledgeSynthesizer Usage Guide

## Command Line Interface

```bash
bun run src/cli.ts [options]
```

### Required Arguments

| Argument | Short | Description |
|----------|-------|-------------|
| `--input <paths...>` | `-i` | Input directories containing course materials. Accepts multiple paths. |
| `--ccg <type>` | `-c` | Content type to generate. Must match an existing ccg-* skill. |

### Optional Arguments

| Argument | Short | Default | Description |
|----------|-------|---------|-------------|
| `--workers <count>` | `-w` | 3 | Number of parallel workers for processing courses |
| `--output <path>` | `-o` | `<course>/CODE/__cc_validated_files/` | Custom output directory for validated files |
| `--list` | `-l` | - | List available ccg-* skills |
| `--help` | `-h` | - | Show help message |

## Examples

### Single Course Processing

```bash
# Generate SOPs from a course
bun run src/cli.ts -i "./OpenAPI Course" --ccg SOP

# Generate summaries
bun run src/cli.ts -i "./Python Basics" --ccg Summary
```

### Multiple Course Processing

```bash
# Process multiple courses in parallel
bun run src/cli.ts -i ./course1 ./course2 ./course3 --ccg SOP

# With custom worker count
bun run src/cli.ts -i ./course1 ./course2 -w 5 --ccg SOP
```

### Custom Output Directory

```bash
# Output to a specific location
bun run src/cli.ts -i "./My Course" -o ./output --ccg Summary
```

### List Available Skills

```bash
bun run src/cli.ts --list
```

Output:
```
Available ccg-* skills:

  ccg-sop-generator
    Generate Standard Operating Procedures from course content

  ccg-summary-generator
    Generate course summaries and study guides
```

## Input Requirements

### fileassets.txt

Each course directory must contain a `fileassets.txt` file. This file is generated externally and contains all course resources in a single merged file.

**Required structure:**
```
================================================================
Directory List
================================================================

├───1 - Introduction
│   └───lecture.srt
├───CODE
│   └───project/
│       └───main.py

================================================================
Files
================================================================

================
File: "path/to/lecture.srt"
================
[file content here]

================
File: "path/to/main.py"
================
[file content here]
```

### Supported File Types

| Category | Extensions |
|----------|------------|
| Subtitles | `.srt` |
| Documents | `.pdf`, `.docx`, `.pptx`, `.html`, `.htm` |
| Code | `.py`, `.ts`, `.js`, `.cpp`, `.hpp`, `.c`, `.h`, `.java`, `.go`, `.rs` |
| Data | `.json`, `.yaml`, `.yml`, `.csv`, `.xml` |
| Text | `.txt`, `.md` |
| Databases | `.db`, `.sqlite`, `.sqlite3`, `.xlsx` |
| Archives | `.zip`, `.rar`, `.7z`, `.tar.gz` |
| Images | `.png`, `.jpg`, `.jpeg`, `.gif` (OCR extraction) |

### Skipped File Types

Binary media files are skipped during extraction:
- Video: `.mp4`, `.mkv`, `.avi`, `.mov`
- Audio: `.mp3`, `.wav`, `.flac`
- Executables: `.exe`, `.dll`, `.so`

## Output Structure

### Validated Files

After extraction, validated text content is saved to:
```
<course>/CODE/__cc_validated_files/
├── lecture_1.txt
├── lecture_2.txt
├── project_main.py
└── ...
```

### Generated Content

After generation, synthesized content is saved to `<course>/CODE/__ccg_<type>/`. The structure depends on the skill used:

**SOP Skill (`--ccg SOP`):**
```
__ccg_SOP/
├── README.md           # Index of all procedures
├── procedures/         # Individual procedure files
│   ├── SOP-001_*.md
│   └── ...
├── quick_reference.md  # Condensed checklists
└── glossary.md         # Terms and definitions
```

**Summary Skill (`--ccg Summary`):**
```
__ccg_Summary/
├── README.md           # Course overview and navigation
├── topics/             # Individual topic summaries
│   ├── topic_01_*.md
│   └── ...
├── glossary.md         # Key terms and definitions
├── quick_reference.md  # Condensed reference guide
└── study_guide.md      # Combined study material
```

Each skill's SKILL.md defines its output structure.

### Processing Logs

Run logs are saved to:
```
<course>/CODE/__cc_processing_log/
├── run_<timestamp>.json   # Per-run details
└── errors.json            # Cumulative error log
```

## Terminal UI

During processing, the TUI displays:

```
KnowledgeSynthesizer v3

⠹ ██████████░░░░░░░░░░░░░░░░░░░░  33% (8/24)
  Worker 1: processing lecture_08.srt
```

### Status Indicators

| Symbol | Color | Meaning |
|--------|-------|---------|
| ⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏ | Yellow | Processing files |
| ⚡ | Magenta | Generating content |
| ✓ | Green | Completed successfully |
| ✗ | Red | Failed |

## Troubleshooting

### "fileassets.txt not found"

Ensure the input directory contains a valid `fileassets.txt` file.

### "No validated files found to process"

The extraction phase completed but no files were successfully processed. Check:
- File format support
- File content validity
- Processing log for errors

### "Claude CLI failed"

Ensure Claude Code CLI is installed and authenticated:
```bash
claude --version
claude auth status
```

### Generation produces no files

Check `_generation_log.txt` in the output directory for Claude CLI output.

## Performance Tuning

### Worker Count

- **Default (3)**: Good for most systems
- **5-10**: For high-core-count machines with fast storage
- **1-2**: For memory-constrained systems

### Processing Time

Approximate times per course (varies by content):
- Extraction: 1-5 minutes (depends on file count)
- Generation: 2-10 minutes (depends on content size)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `CLAUDE_CONFIG_DIR` | Custom Claude Code configuration directory |
