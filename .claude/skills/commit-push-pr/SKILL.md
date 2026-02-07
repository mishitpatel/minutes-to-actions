---
name: commit-push-pr
description: Commit, push, and create a pull request with conventional commits and project PR format. Supports partial workflows via arguments like "commit only" or "push only".
allowed-tools: Bash(git:*), Bash(gh:*)
argument-hint: [optional: PR title hint, "commit only", or "push only"]
disable-model-invocation: true
---

# Commit, Push & Pull Request

Automate the full git workflow: stage, commit, push, and create a PR — with safety checks and project conventions enforced.

## Gathered Context

### Current Branch
!`git branch --show-current`

### Default Branch (PR base)
!`git remote show origin 2>/dev/null | grep 'HEAD branch' | awk '{print $NF}'`

### Remote URL
!`git remote get-url origin 2>/dev/null`

### Working Tree Status
!`git status --short`

### Staged Changes (stat)
!`git diff --cached --stat`

### Unstaged Changes (stat)
!`git diff --stat`

### Untracked Files
!`git ls-files --others --exclude-standard | head -20`

### Unpushed Commits
!`git log @{u}..HEAD --oneline 2>/dev/null || echo "No upstream tracking branch"`

### Recent Commits (style reference)
!`git log --oneline -5`

### Existing PR for Branch
!`gh pr view --json number,title,url,state 2>/dev/null || echo "No existing PR for this branch"`

## Arguments

User arguments: $ARGUMENTS

### Argument Handling

- `"commit only"` — Run steps 1-3 only (safety checks, stage, commit). Do NOT push or create a PR.
- `"push only"` — Run steps 1-4 only (safety checks, stage, commit, push). Do NOT create a PR.
- Any other text — Use as a hint for the PR title. If it contains `#<number>`, include it in Related Issues.
- No arguments — Run the full workflow (steps 1-6).

## Workflow

Execute these steps in order. Stop early if arguments dictate a partial workflow.

### Step 1: Safety Checks

Before ANY mutations, verify all of the following:

1. **Branch check** — If on `main` or `master`, STOP immediately. Tell the user to create a feature branch first:
   ```
   git checkout -b feature/<name>
   ```

2. **Sensitive file scan** — Check `git status` output for files matching: `.env`, `.env.*`, `*credentials*`, `*secret*`, `*.key`, `*.pem`, `id_rsa*`. If found, WARN the user and ask for explicit confirmation before staging these files. Do NOT stage them by default.

3. **Large file scan** — For any new or modified files, check if any exceed 5MB. If so, warn the user.

If any safety check fails or the user declines to proceed, STOP the workflow.

### Step 2: Stage

Review the working tree status, unstaged changes, and untracked files from gathered context.

- If there are unstaged or untracked changes, **ask the user** which files to stage. Present the list clearly.
- Stage files **by specific name** — NEVER use `git add .` or `git add -A`.
- If everything is already staged and the user is satisfied, proceed.

### Step 3: Commit

1. **Analyze staged changes** — Run `git diff --cached` if you need more detail beyond the stat view.

2. **Compose commit message** using conventional commit format:
   ```
   <type>(<scope>): <description>
   ```

   **Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`

   **Scope inference** from changed files:
   | Path pattern | Scope |
   |-------------|-------|
   | `apps/web/` | `web` |
   | `apps/api/` | `api` |
   | `packages/shared/` | `shared` |
   | `docs/project/` | `project` |
   | `docs/devops/` | `devops` |
   | `docs/` (other) | `docs` |
   | `tests/` | `test` |
   | `.claude/` | `tooling` |
   | Mixed/root | omit scope or use most relevant |

   **Rules:**
   - Imperative mood ("add feature" not "added feature")
   - Under 72 characters for subject line
   - Capitalize first letter of description
   - No period at end of subject
   - Add body with bullet points if changes are complex

3. **Show the full commit message to the user for approval** before committing. Wait for confirmation.

4. **Commit** using HEREDOC format with Co-Authored-By:
   ```bash
   git commit -m "$(cat <<'EOF'
   <type>(<scope>): <description>

   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
   EOF
   )"
   ```

5. **If pre-commit hook fails:** Fix the issue, re-stage, and create a NEW commit (never `--amend`).

6. Run `git status` to verify the commit succeeded.

If arguments are `"commit only"`, STOP here and show a summary.

### Step 4: Push

1. Check if the branch has a remote tracking branch (from "Unpushed Commits" context).
2. Push with upstream tracking if needed:
   ```bash
   git push -u origin <branch-name>
   ```
   Or plain push if upstream is already set:
   ```bash
   git push
   ```
3. **NEVER force push.** If push is rejected, inform the user and suggest `git pull --rebase` first.

If arguments are `"push only"` or `"commit only"`, STOP here and show a summary.

### Step 5: Create Pull Request

1. **Check for existing PR** — If one already exists (from gathered context), inform the user and ask if they want to update it or skip PR creation.

2. **Compose PR** using the project template format. Use the commit history for the branch (`git log <base>..HEAD`) to build the summary.

   **PR Title:** Use conventional commit format matching the primary change. If the user provided a title hint in arguments, use it.

   **PR Body:**
   ```markdown
   ## Summary
   <1-3 bullet points describing the changes>

   ## Changes
   <Detailed list of what was changed>

   ## Test Plan
   - [ ] <Relevant test steps>

   ## Related Issues
   <"Closes #XX" or "Related to #XX" if applicable>

   ## Checklist
   - [ ] Code follows project style guidelines
   - [ ] Self-review completed
   - [ ] Tests added for new functionality
   - [ ] Documentation updated
   - [ ] No console.log or debug code

   ---
   Generated with [Claude Code](https://claude.com/claude-code)
   ```

3. **Create the PR:**
   ```bash
   gh pr create --title "<title>" --body "$(cat <<'EOF'
   <body>
   EOF
   )"
   ```

### Step 6: Verify

1. Run `git status` to confirm clean state.
2. Print a summary of everything that was done:
   - Files staged and committed
   - Commit hash and message
   - Branch pushed to
   - PR URL (if created)

## Safety Rules (Non-Negotiable)

- **NEVER** force push (`--force`, `-f`, `--force-with-lease`)
- **NEVER** amend commits unless the user explicitly says "amend"
- **NEVER** skip hooks (`--no-verify`)
- **NEVER** use `git add .` or `git add -A` — always stage specific files
- **NEVER** stage `.env` or secret files without explicit user consent
- **NEVER** commit to `main` or `master` directly
- **ALWAYS** show the commit message for user approval before committing
- **ALWAYS** create a NEW commit if a pre-commit hook fails (never amend)
