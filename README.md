# KnowledgeSynthesizer v3

CLI application using Bun/TypeScript with Claude Agent SDK to synthesize AI-generated content from course materials.

## Features

- **Multi-Course Processing**: Process multiple courses in parallel with configurable worker pools
- **Two-Phase Pipeline**: Extract content from various file formats, then generate synthesized output
- **Extensible Skills**: Modular skill system for extraction and content generation
- **Interactive TUI**: Real-time progress visualization with spinner animations
- **Comprehensive Logging**: Detailed run logs and error tracking

## Requirements

- [Bun](https://bun.sh) 1.0+
- [Claude Code CLI](https://claude.ai/cli) (authenticated via OAuth)
- Node.js 18+ (for TypeScript)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd __ccg_KnowledgeSynthesizer

# Install dependencies
bun install
```

## Quick Start

```bash
# Process a single course with SOP generation
bun run src/cli.ts -i "./My Course" --ccg SOP

# List available content generators
bun run src/cli.ts --list
```

## How It Works

### Phase 1: Extraction

1. Reads `fileassets.txt` from the course directory
2. Parses file entries and routes them to appropriate extractors
3. Processes files in parallel using a subagent pool (5 concurrent)
4. Outputs validated text files to `__cc_validated_files/`

### Phase 2: Generation

1. Loads the specified ccg-* skill (e.g., `ccg-sop-generator`)
2. Builds a prompt from skill instructions + validated content
3. Invokes Claude CLI to generate documentation
4. Outputs generated files to `__ccg_<type>/` directory

## Available Skills

### Content Generators (ccg-*)

| Skill | Description |
|-------|-------------|
| `ccg-sop-generator` | Generate Standard Operating Procedures |
| `ccg-summary-generator` | Generate course summaries and study guides |
| `ccg-project-maker` | Generate project scaffolding |

### Extractors

| Skill | Formats |
|-------|---------|
| `extractor-pdf` | PDF documents |
| `extractor-docx` | Word documents |
| `extractor-pptx` | PowerPoint presentations |
| `extractor-html` | HTML pages |
| `db-extractor-*` | SQLite, MySQL, PostgreSQL, Excel |

## Project Structure

```
__ccg_KnowledgeSynthesizer/
├── src/
│   ├── cli.ts          # Entry point
│   ├── worker.ts       # Worker pool management
│   ├── generator.ts    # Content generation
│   ├── processor.ts    # File processing
│   ├── parser.ts       # fileassets.txt parsing
│   ├── skill.ts        # Skill validation
│   ├── tui.ts          # Terminal UI
│   ├── logger.ts       # Logging
│   └── types.ts        # TypeScript interfaces
├── skills/             # Skill definitions
├── __test-courses/     # Test data
└── __docs/             # Generated documentation
```

## Output Structure

After processing, course directories contain skill-specific output:

```
My Course/
└── CODE/
    ├── __ccg_SOP/                # SOP skill output
    │   ├── README.md
    │   ├── procedures/
    │   │   ├── SOP-001_*.md
    │   │   └── ...
    │   ├── quick_reference.md
    │   └── glossary.md
    ├── __ccg_Summary/            # Summary skill output
    │   ├── README.md
    │   ├── topics/
    │   │   ├── topic_01_*.md
    │   │   └── ...
    │   ├── glossary.md
    │   ├── quick_reference.md
    │   └── study_guide.md
    └── __cc_processing_log/      # Run logs
```

Each ccg-* skill defines its own output structure via its SKILL.md file.

## Documentation

- [Usage Guide](Usage.md) - Detailed usage instructions
- [Architecture](ARCHITECTURE.md) - Technical architecture documentation
- [Changelog](CHANGELOG.md) - Version history

## License

MIT
