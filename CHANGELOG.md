# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.2.1] - 2026-01-16

### Fixed

- **SKILL.md-Driven Generation**: Removed hardcoded SOP prompt from `generator.ts` that was overriding skill-specific output formats
- **Summary Skill Output**: Summary skill now correctly generates `topics/` directory with `topic_XX_*.md` files instead of `procedures/SOP-*` files
- Each ccg-* skill's SKILL.md now fully controls the generation format, output structure, and file naming

### Changed

- **generator.ts**: Simplified prompt construction - SKILL.md content is now the primary prompt with minimal metadata (course name, output directory, source content)
- **Documentation**: Updated CLAUDE.md, README.md, and Usage.md to reflect skill-specific output structures

---

## [3.2.0] - 2026-01-15

### Changed

- **Simplified Pipeline**: Removed extraction phase - content now passes directly from fileassets.txt to generator
- **Removed processor.ts**: File extraction/routing no longer needed since fileassets.txt contains all content
- **Removed -o flag**: Output directory option removed as __cc_validated_files/ no longer created
- **Updated generator.ts**: Now accepts ParsedAssets directly instead of reading from validated files directory
- **Updated worker.ts**: Simplified to parse assets and run generator in one step

### Removed

- `src/processor.ts` - No longer needed
- `__cc_validated_files/` output directory - Content passed directly to generator
- `-o, --output` CLI flag - No intermediate output directory needed

---

## [3.1.0] - 2026-01-15

### Added

- **Content Generation Phase**: Implemented two-phase pipeline with extraction followed by content generation
- **generator.ts**: New module for content generation using Claude CLI with OAuth authentication
- **Claude Agent SDK Integration**: Uses `claude` CLI subprocess with `--allowedTools "Write,Glob,Read"` for file operations
- **ccg-sop-generator**: Added SOP (Standard Operating Procedure) generation skill with YAML frontmatter
- **ccg-summary-generator**: Added course summary and study guide generation skill
- **TUI Generation Status**: Added `setGenerating()` and `setGenerationComplete()` methods for generation phase visualization
- **Skill Output Directory Mapping**: `getSkillOutputDir()` function maps skill names to output directories (e.g., `ccg-sop-generator` -> `__ccg_SOP`)

### Changed

- **worker.ts**: Updated to integrate generator after extraction phase completes
- **cli.ts**: Updated to pass `skillInfo` to `runWorkerPool()`
- **Skill Directory Naming**: Renamed skills to use `ccg-` prefix (`sop-generator` -> `ccg-sop-generator`)
- **ARCHITECTURE.md**: Updated skills inventory to include new ccg-* skills

### Fixed

- **Skill Compatibility**: Added YAML frontmatter to skill SKILL.md files for proper parsing
- **OAuth Authentication**: Resolved authentication issue by using Claude CLI instead of direct Anthropic API

### Technical Details

- Content generation invokes: `claude --dangerously-skip-permissions --allowedTools "Write,Glob,Read" --max-turns 50 < prompt`
- Maximum content size per generation: 150,000 characters (~37K tokens)
- Generated output includes: README.md, procedures/*.md, quick_reference.md, glossary.md

## [3.0.0] - 2026-01-15

### Added

- Initial v3 architecture with Bun/TypeScript
- Worker pool for parallel course processing
- Subagent pool for file extraction (5 concurrent)
- Interactive TUI with progress bars using `@opentui/core`
- fileassets.txt parser
- File type routing via processor module
- Comprehensive logging system
- Skill validation and loading

### Architecture

- Two-level parallelism: workers (courses) and subagents (files)
- Chunking support for large files (>100K characters)
- Modular skill system in `skills/` directory

### Skills Included

- File identification and routing
- Document extractors (PDF, DOCX, PPTX, HTML)
- Database extractors (SQLite, MySQL, PostgreSQL, Excel)
- Archive extractor
- Image OCR extractor

---

## Version History

| Version | Date | Summary |
|---------|------|---------|
| 3.2.1 | 2026-01-16 | Fixed SKILL.md-driven generation - skills control output format |
| 3.2.0 | 2026-01-15 | Simplified pipeline - removed extraction phase |
| 3.1.0 | 2026-01-15 | Content generation via Claude Agent SDK |
| 3.0.0 | 2026-01-15 | Initial v3 release with extraction pipeline |
