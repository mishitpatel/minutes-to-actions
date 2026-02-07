---
name: whats-next
description: Analyze project state and recommend what to work on next. Gathers open GitHub issues, branch status, recent commits, and planning documents to produce prioritized task recommendations. Use when you need to figure out what to work on next, check project status, or plan your next session.
allowed-tools: Bash, Read, Glob, Grep
argument-hint: [optional filter like "milestone 4" or "bugs only"]
---

# What's Next

Analyze the project state and recommend what to work on next.

## Gathered Context

### Open GitHub Issues
!`gh issue list --state open --limit 20 2>/dev/null || echo "No issues found or gh not configured"`

### Branches
!`git branch -a 2>/dev/null`

### Recent Commits
!`git log --oneline -10 2>/dev/null`

### Project Status
!`cat docs/project/project-status.md 2>/dev/null || echo "No status file found"`

### Recent Changelog
!`head -50 docs/project/changelog.md 2>/dev/null || echo "No changelog found"`

## Instructions

Using the gathered context above, cross-reference and analyze:

1. **Open issues** - Which are highest priority? Any labeled "bug" or "urgent"?
2. **Branches** - Are there feature branches with unfinished work?
3. **Up Next items** - What's already planned in the status file?
4. **Recent activity** - What was just completed (avoid duplicating work)?

If user provided arguments, use them to filter or focus the analysis: $ARGUMENTS

## Output Format

### Recommended Next Tasks

1. **[Top priority item]** - Brief reason why
2. **[Second priority]** - Brief reason
3. **[Third priority]** - Brief reason

### Open Issues Summary
- List open issues with numbers and titles
- Note any that seem stale or blocked

### In-Progress Work
- List any feature branches that may have unfinished work
- Note the current milestone status

### Notes
- Any blockers or dependencies to be aware of
- Suggestions for sequencing work

## Guidelines

- Prioritize bugs over features
- Prioritize items already in "Up Next" over new ideas
- Note if there are stale branches that could be cleaned up
- Be concise but informative
- If no open issues exist, suggest based on the project roadmap
