# Migration Guide: Workflow Optimization v2

> Deploy staging files from `docs/staging/workflow-v2/` to their final locations.

## Pre-Flight Checks

- [ ] All 21 staging files reviewed and approved
- [ ] No active work-in-progress that depends on current CLAUDE.md
- [ ] Git clean state (`git stash` if needed)

## Step 1: Deploy Root Config

```bash
# Back up current files
cp CLAUDE.md CLAUDE.md.bak
cp .claude/settings.local.json .claude/settings.local.json.bak

# Deploy new CLAUDE.md
cp docs/staging/workflow-v2/CLAUDE.md ./CLAUDE.md

# Deploy hooks config (merge with existing settings.local.json)
cp docs/staging/workflow-v2/hooks/settings.local.json .claude/settings.local.json

# Deploy security hook
mkdir -p .claude/hooks
cp docs/staging/workflow-v2/hooks/security-check.py .claude/hooks/
chmod +x .claude/hooks/security-check.py
```

## Step 2: Deploy Guidelines

```bash
# Archive old guidelines
mkdir -p docs/guidelines/archive
mv docs/guidelines/frontend_guidelines.md docs/guidelines/archive/
mv docs/guidelines/ui_ux_guidelines.md docs/guidelines/archive/
mv docs/guidelines/backend_guidelines.md docs/guidelines/archive/
mv docs/guidelines/api_guidelines.md docs/guidelines/archive/
mv docs/guidelines/database_guidelines.md docs/guidelines/archive/
mv docs/guidelines/testing_guidelines.md docs/guidelines/archive/
mv docs/guidelines/api_testing_guidelines.md docs/guidelines/archive/
mv docs/guidelines/naming_guidelines.md docs/guidelines/archive/
mv docs/guidelines/architecture_guidelines.md docs/guidelines/archive/
mv docs/guidelines/security_guidelines.md docs/guidelines/archive/

# Deploy compressed guidelines
cp docs/staging/workflow-v2/guidelines/frontend-rules.md docs/guidelines/
cp docs/staging/workflow-v2/guidelines/backend-rules.md docs/guidelines/
cp docs/staging/workflow-v2/guidelines/conventions.md docs/guidelines/
```

## Step 3: Deploy Skills

```bash
# Deploy new skills (directory format)
cp -r docs/staging/workflow-v2/skills/start-task .claude/skills/
cp -r docs/staging/workflow-v2/skills/verify-changes .claude/skills/
cp -r docs/staging/workflow-v2/skills/new-api-module .claude/skills/
cp -r docs/staging/workflow-v2/skills/new-component .claude/skills/
cp -r docs/staging/workflow-v2/skills/ship .claude/skills/
cp -r docs/staging/workflow-v2/skills/review .claude/skills/
cp -r docs/staging/workflow-v2/skills/security-scan .claude/skills/
cp -r docs/staging/workflow-v2/skills/api-test-generator .claude/skills/
cp -r docs/staging/workflow-v2/skills/e2e-test-generator .claude/skills/

# Remove old flat skill files (replaced by directory format)
rm -f .claude/skills/api-test-generator.md
rm -f .claude/skills/e2e-test-generator.md
```

## Step 4: Deploy Agents

```bash
mkdir -p .claude/agents
cp docs/staging/workflow-v2/agents/build-validator.md .claude/agents/
cp docs/staging/workflow-v2/agents/code-reviewer.md .claude/agents/
cp docs/staging/workflow-v2/agents/code-simplifier.md .claude/agents/
cp docs/staging/workflow-v2/agents/verify-app.md .claude/agents/
```

## Step 5: Update MEMORY.md

```bash
# This is a user-specific file — copy content manually or:
cp docs/staging/workflow-v2/MEMORY.md /Users/mishit/.claude/projects/-Users-mishit-Documents-code-minutes-to-actions/memory/MEMORY.md
```

## Step 6: Post-Deployment Fixes

### DevOps Cross-References

These files reference old guideline names and need updating:

| File | Old Reference | New Reference |
|------|--------------|---------------|
| `docs/devops/commands.md` | `backend_guidelines.md` | `backend-rules.md` |
| `docs/devops/troubleshooting.md` | `testing_guidelines.md` | `conventions.md` + `/api-test-generator` |
| `docs/guidelines/README.md` | Lists all old files | Update to list 3 new files |

### Verify Skills Work

```bash
# Test each skill is discoverable
# In a new Claude Code session, try:
# /start-task #42
# /verify-changes --quick
# /review
# /ship --no-pr
# /new-api-module test
# /new-component TestComponent
# /security-scan --deps-only
# /api-test-generator action-items --check
# /e2e-test-generator auth
```

## Files NOT Touched (Preserved As-Is)

| File/Dir | Reason |
|----------|--------|
| `.claude/skills/commit-push-pr/SKILL.md` | Already new format, working well |
| `.claude/skills/whats-next/SKILL.md` | Already new format, working well |
| `.claude/skills/templates/test-preflight-checklist.md` | Referenced by test skills |
| `docs/devops/*` | Critical operational docs |
| `docs/project/*` | Project status, plans, changelog |
| `docs/product/*` | Product spec, user stories |
| `docs/engineering/*` | API spec, DB schema, architecture |

## Archive Inventory (Old Files Preserved)

After migration, `docs/guidelines/archive/` will contain:

| File | Lines | Replaced By |
|------|-------|-------------|
| `frontend_guidelines.md` | 472 | `frontend-rules.md` |
| `ui_ux_guidelines.md` | 1,174 | `frontend-rules.md` |
| `backend_guidelines.md` | 1,059 | `backend-rules.md` |
| `api_guidelines.md` | 341 | `backend-rules.md` |
| `database_guidelines.md` | 357 | `backend-rules.md` |
| `testing_guidelines.md` | 877 | `conventions.md` + test skills |
| `api_testing_guidelines.md` | 257 | `api-test-generator` skill |
| `naming_guidelines.md` | 174 | `conventions.md` |
| `architecture_guidelines.md` | 321 | `conventions.md` |
| `security_guidelines.md` | 76 | `backend-rules.md` |
| **TOTAL** | **5,108** | **~345 lines** (93% reduction) |

## Rollback

If anything goes wrong:

```bash
# Restore CLAUDE.md
cp CLAUDE.md.bak CLAUDE.md

# Restore settings
cp .claude/settings.local.json.bak .claude/settings.local.json

# Restore guidelines (move back from archive)
mv docs/guidelines/archive/*.md docs/guidelines/

# Remove new files
rm -rf .claude/skills/{start-task,verify-changes,new-api-module,new-component,ship,review,security-scan}
rm -rf .claude/skills/{api-test-generator,e2e-test-generator}  # directory versions
rm -rf .claude/agents
rm -f .claude/hooks/security-check.py
```
