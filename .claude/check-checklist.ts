#!/usr/bin/env bun
/**
 * Development checklist validation hook
 * Ensures required checklist items are complete before editing or pushing
 */

import { spawnSync } from "node:child_process";

interface HookInput {
  tool_name?: string;
  tool_input?: {
    file_path?: string;
    command?: string;
  };
}

interface Stage {
  type: "edit" | "push" | "none";
}

function classifyStage(input: HookInput): Stage {
  const toolName = input.tool_name;
  const filePath = input.tool_input?.file_path;
  const command = input.tool_input?.command;

  // Check for edit stage: Edit/Write/MultiEdit operations on files under src/
  if (toolName && ["Edit", "Write", "MultiEdit"].includes(toolName)) {
    if (filePath && (filePath.startsWith("src/") || filePath.includes("/src/"))) {
      return { type: "edit" };
    }
  }

  // Check for push stage: Bash commands containing "agc push" or "dreamer push"
  if (toolName === "Bash" && command) {
    if (command.includes("dreamer push")) {
      return { type: "push" };
    }
  }

  return { type: "none" };
}

function verifyStage(stage: "edit" | "push"): boolean {
  // Run dreamer checklist verify <stage>
  // Returns true if verification passes (exit code 0)
  // Returns false if verification fails (exit code 1)
  const result = spawnSync("dreamer", ["checklist", "verify", stage], {
    encoding: "utf8",
    stdio: ["pipe", "inherit", "inherit"], // Let verify command print its own output
    cwd: process.cwd(),
  });

  // Exit code 0 means all items complete for this stage
  // Exit code 1 means some items incomplete (verify already printed details)
  return result.status === 0;
}

async function main() {
  try {
    // Read JSON input from stdin
    let inputData = "";
    for await (const chunk of process.stdin) {
      inputData += chunk;
    }

    const input: HookInput = JSON.parse(inputData);

    // Classify the stage
    const stage = classifyStage(input);

    // If no relevant stage, allow the operation
    if (stage.type === "none") {
      process.exit(0);
    }

    // Verify checklist for this stage
    const isComplete = verifyStage(stage.type);

    if (!isComplete) {
      // Block the operation
      // (verify command already printed error details)
      console.error(
        `\nOperation blocked due to incomplete checklist items for "${stage.type}" stage.\n`,
      );
      process.exit(2);
    }

    // All items complete, allow the operation
    process.exit(0);
  } catch (error) {
    // On error, log and exit with error code
    console.error(
      `Error in checklist hook: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

main();
