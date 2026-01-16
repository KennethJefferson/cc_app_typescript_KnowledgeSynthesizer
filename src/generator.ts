import { $ } from "bun";
import type { SkillInfo, ParsedAssets } from "./types";
import path from "path";

const MAX_CONTENT_SIZE = 150_000; // ~37K tokens, leave room for response

export interface GeneratorConfig {
  skill: SkillInfo;
  assets: ParsedAssets;
  outputDir: string;
  courseName: string;
}

export interface GeneratorResult {
  success: boolean;
  filesGenerated: string[];
  error?: string;
}

/**
 * Build the prompt content from parsed file assets
 */
function buildContentPrompt(assets: ParsedAssets): string {
  let content = "# Course Content\n\nThe following files have been extracted from the course:\n\n";

  // Add directory listing for context
  if (assets.directoryListing) {
    content += "## Directory Structure\n\n```\n" + assets.directoryListing + "\n```\n\n";
  }

  content += "## Files\n\n";
  let totalSize = content.length;

  for (const file of assets.files) {
    // Skip binary files that aren't useful as text
    const skipExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.mp3', '.wav', '.exe', '.dll', '.so', '.bin', '.zip', '.rar', '.7z'];
    if (skipExtensions.includes(file.extension.toLowerCase())) {
      continue;
    }

    const fileSection = `### File: ${file.filename}\n\n\`\`\`\n${file.content}\n\`\`\`\n\n`;

    if (totalSize + fileSection.length > MAX_CONTENT_SIZE) {
      content += `\n[Note: Additional files truncated due to size limits]\n`;
      break;
    }

    content += fileSection;
    totalSize += fileSection.length;
  }

  return content;
}

/**
 * Generate content using Claude CLI (Claude Agent SDK)
 */
export async function runGenerator(config: GeneratorConfig): Promise<GeneratorResult> {
  const { skill, assets, outputDir, courseName } = config;

  try {
    // Read skill instructions
    const skillContent = await Bun.file(skill.path).text();

    if (assets.files.length === 0) {
      return {
        success: false,
        filesGenerated: [],
        error: "No files found in fileassets.txt to process",
      };
    }

    // Build content prompt directly from parsed assets
    const contentPrompt = buildContentPrompt(assets);

    // Build the full prompt for Claude CLI
    // The SKILL.md content drives the generation format - no hardcoded instructions
    const fullPrompt = `${skillContent}

## Generation Context

**Course Name:** ${courseName}
**Output Directory:** ${outputDir}

Write all generated files to the output directory above using the Write tool.

## Source Content

${contentPrompt}`;

    // Write prompt to temp file
    const tempPromptFile = path.join(outputDir, "..", "_temp_prompt.txt");
    await Bun.write(tempPromptFile, fullPrompt);

    // Ensure output directory exists
    await Bun.write(path.join(outputDir, ".gitkeep"), "");

    // Run Claude CLI with Write tool allowed
    const result = await $`claude --dangerously-skip-permissions --allowedTools "Write,Glob,Read" --max-turns 50 < ${tempPromptFile}`
      .quiet()
      .nothrow();

    // Clean up temp file
    try {
      await $`rm ${tempPromptFile}`.quiet().nothrow();
    } catch {
      // Ignore cleanup errors
    }

    if (result.exitCode !== 0) {
      const errorMsg = result.stderr?.toString() || "Unknown error";
      return {
        success: false,
        filesGenerated: [],
        error: `Claude CLI failed with exit code ${result.exitCode}: ${errorMsg}`,
      };
    }

    // Check what files were created in the output directory
    const createdFiles: string[] = [];
    const glob = new Bun.Glob("**/*.md");

    for await (const file of glob.scan({ cwd: outputDir, onlyFiles: true })) {
      createdFiles.push(file);
    }

    if (createdFiles.length === 0) {
      // Save stdout for debugging
      const debugPath = path.join(outputDir, "_generation_log.txt");
      await Bun.write(debugPath, result.stdout?.toString() || "No output");

      return {
        success: false,
        filesGenerated: [],
        error: "No files were generated. Check _generation_log.txt for details.",
      };
    }

    return {
      success: true,
      filesGenerated: createdFiles,
    };
  } catch (error) {
    return {
      success: false,
      filesGenerated: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Determine output directory based on skill name
 */
export function getSkillOutputDir(skillName: string, courseBasePath: string): string {
  // Map skill names to output directories
  const outputDirMap: Record<string, string> = {
    "ccg-sop-generator": "__ccg_SOP",
    "ccg-summary-generator": "__ccg_Summary",
    "ccg-project-maker": "__CC_Projects",
    "ccg-project-discovery": "__CC_Projects",
    "ccg-project-generator": "__CC_Projects",
    "ccg-project-architect": "__CC_Projects",
  };

  const dirName = outputDirMap[skillName] || `__ccg_${skillName.replace("ccg-", "")}`;
  return path.join(courseBasePath, "CODE", dirName);
}
