#!/usr/bin/env bun
/**
 * Hook to prevent direct modification of drizzle/ directories
 * Blocks rm, mv, cp, sed and other destructive operations on migration files
 */

interface HookInput {
	tool_name?: string;
	tool_input?: {
		file_path?: string;
		command?: string;
	};
}

function checkDrizzleModification(input: HookInput): boolean {
	const toolName = input.tool_name;
	const filePath = input.tool_input?.file_path;
	const command = input.tool_input?.command;

	// Check Edit/Write operations on drizzle/ files
	if (toolName && ["Edit", "Write", "MultiEdit"].includes(toolName)) {
		if (
			filePath &&
			(filePath.includes("/drizzle/") || filePath.startsWith("drizzle/"))
		) {
			return true; // Block
		}
	}

	// Check Bash commands that might modify drizzle/ files
	if (toolName === "Bash" && command) {
		// Check if command targets drizzle/ directory
		if (command.includes("drizzle/")) {
			// Check for destructive operations: rm, mv, cp, sed, awk, redirection
			const destructiveOps = ["rm ", "mv ", "cp ", "sed ", "awk ", ">"];
			for (const op of destructiveOps) {
				if (command.includes(op)) {
					return true; // Block
				}
			}
		}
	}

	return false; // Allow
}

async function main() {
	try {
		// Read JSON input from stdin
		let inputData = "";
		for await (const chunk of process.stdin) {
			inputData += chunk;
		}

		const input: HookInput = JSON.parse(inputData);

		// Check if this operation would modify drizzle/
		const shouldBlock = checkDrizzleModification(input);

		if (shouldBlock) {
			console.error(
				"Direct modification of drizzle/ directory is forbidden. These files are generated during push. Consult the database-troubleshooting skill",
			);
			process.exit(2); // Block
		}

		// Allow the operation
		process.exit(0);
	} catch (error) {
		console.error(
			`Error in drizzle protection hook: ${error instanceof Error ? error.message : String(error)}`,
		);
		process.exit(1);
	}
}

main();
