#!/usr/bin/env python3
"""Block edits to sensitive files and flag potential secrets."""
import json
import sys

PROTECTED_FILES = {'.env', '.env.local', '.env.production', 'credentials.json'}
PROTECTED_PATTERNS = ['id_rsa', '.pem', '.key']


def main():
    try:
        input_data = json.load(sys.stdin)
        file_path = input_data.get('tool_input', {}).get('file_path', '')

        # Check protected files
        filename = file_path.split('/')[-1] if file_path else ''
        if filename in PROTECTED_FILES:
            print(f"BLOCKED: Cannot edit protected file: {filename}")
            sys.exit(2)  # Exit code 2 = block

        # Check protected patterns
        for pattern in PROTECTED_PATTERNS:
            if pattern in file_path:
                print(f"BLOCKED: Cannot edit file matching pattern: {pattern}")
                sys.exit(2)

        sys.exit(0)  # Allow
    except Exception:
        sys.exit(0)  # Don't block on errors


if __name__ == '__main__':
    main()
