#!/usr/bin/env python3
"""
File path validator for hook system.
Ensures file operations only occur within src/ directories or PRD.md
"""

import json
import sys


def validate_file_path():
    """
    Validates that file operations are restricted to src/ directories.

    Reads JSON from stdin, extracts file_path from tool_input,
    and blocks operations outside of src/ directories.

    Exit codes:
        0: Path is allowed
        2: Path is blocked
        1: Errors parsing JSON input
    """
    try:
        # Read JSON input from stdin
        data = json.load(sys.stdin)

        # Extract file path from tool_input
        file_path = data.get("tool_input", {}).get("file_path", "")

        # Check if path is allowed (starts with 'src/' or contains '/src/', or is DATA-PLAN.md in planning/)
        # Block any edits to .agc/ directory
        is_blocked = (
            file_path.startswith(".agc/")
            or "/.agc/" in file_path
            or not (
                file_path.startswith("src/")
                or "/src/" in file_path
                or file_path.endswith("PRD.md")
                or file_path == "planning/DATA-PLAN.md"
                or file_path.endswith("/DATA-PLAN.md")
                or file_path.endswith("agent.yaml")
            )
        )

        if is_blocked:
            error_msg = (
                f'File operation blocked: Path "{file_path}" is not allowed. '
                f"Only files in src directories, agent.yaml, PRD.md, or planning/DATA-PLAN.md are allowed for editing. "
                f"The .agc/ directory is managed by dreamer and cannot be edited directly."
            )
            print(error_msg, file=sys.stderr)
            sys.exit(2)

        # Path is allowed
        sys.exit(0)

    except json.JSONDecodeError as e:
        print(f"Error parsing JSON input: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    validate_file_path()
