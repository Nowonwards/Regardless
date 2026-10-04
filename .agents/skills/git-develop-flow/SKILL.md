---
name: git-develop-flow
description: Enforce and execute the Git workflow where all code changes are pushed to GitHub via the develop branch, never directly to main, and then merged from develop to main. Use whenever pushing changes to GitHub, synchronizing branches, or handling release and merge workflows.
---

# Git Develop Flow

This skill defines and guides the branching and release workflow for the repository:
1. **Never commit or push directly to `main`**.
2. **All changes are pushed upstream via the `develop` branch** (or scoped feature branches targeting `develop`).
3. **Merging to `main` happens from `develop`** once changes are verified and ready for production.
4. **Automated PR Management**:
   - Whenever code changes are made and pushed to `develop`, check if an open PR from `develop` to `main` already exists.
   - If an open PR exists, the push to `develop` automatically updates it. Inform the user with the PR URL.
   - If no open PR exists, create one immediately via `gh pr create --base main --head develop` and provide the PR URL.

---

## Workflow Rules & Guidelines

- **Protected Main**: The `main` branch represents production-ready code. Direct pushes to `origin/main` are prohibited.
- **Integration Branch (`develop`)**: All ongoing development, features, and fixes are merged and pushed to `develop`.
- **Branch Naming**:
  - `feature/<description>` for new capabilities
  - `bugfix/<description>` or `fix/<description>` for fixes
  - `chore/<description>` for maintenance and dependency updates
- **Conventional Commits**: Every commit message must follow the Conventional Commits specification:
  - `feat: <description>`
  - `fix: <description>`
  - `chore: <description>`
  - `docs: <description>`
  - `refactor: <description>`
  - `test: <description>`
- **Security Check**: Never commit `.env*`, API credentials, tokens, or temporary files. Always verify with `git status` before staging.

---

## Step-by-Step Procedure

### 1. Pre-flight & Working Tree Check
Before staging or branching, ensure the working tree is clean of sensitive or temporary files:
```bash
git status
```
Verify that no secret files (like `.env`, `.env.local`, API keys) are untracked or staged.

### 2. Prepare the `develop` Branch
Check whether the `develop` branch exists locally or on remote:
```bash
# If develop branch already exists locally:
git checkout develop
git pull origin develop

# If develop does not exist yet locally:
git checkout -b develop
```

If uncommitted work exists on another branch (e.g. `main`), either:
- Create and switch to `develop` while keeping uncommitted changes (`git checkout -b develop`), OR
- Stash changes (`git stash`), switch to `develop`, and apply them (`git stash pop`).

Ensure local `main` stays cleanly synced with `origin/main`:
```bash
git checkout main
git reset --hard origin/main
git checkout develop
```

### 3. Stage and Commit Changes
Stage modified and new files intentionally:
```bash
git add <files>
```
Commit using Conventional Commits format:
```bash
git commit -m "feat(scope): descriptive message"
```

### 4. Push to Remote `develop`
Push the commits to the remote `develop` branch:
```bash
git push -u origin develop
```

### 5. Check and Manage Pull Request to `main`
Check if an open pull request already exists from `develop` to `main`:
```bash
gh pr list --base main --head develop --state open
```

- **If an open PR exists**:
  The push to `origin/develop` will automatically update the PR. Retrieve and share the URL:
  ```bash
  gh pr view --web
  ```
- **If no open PR exists**:
  Create one immediately:
  ```bash
  gh pr create --base main --head develop --title "feat: <summary>" --body "<description>"
  ```
  Share the newly opened PR URL with the user.

### 6. Merge into `main`
Once the changes on `develop` are approved/validated, merge `develop` into `main`:

#### Option A: GitHub Pull Request (Recommended)
Merge via GitHub UI or CLI:
```bash
gh pr merge <PR_NUMBER> --merge
```

#### Option B: Local Fast-Forward / Merge
```bash
git checkout main
git pull origin main
git merge develop --no-ff -m "chore(release): merge develop into main"
git push origin main
git checkout develop
```

---

## Troubleshooting & Edge Cases

- **Merge conflicts between `develop` and `main`**:
  Resolve conflicts on `develop` first, run tests (`yarn tsc --noEmit` / `yarn test`), and then proceed with the merge.
- **Accidental commit on `main`**:
  Soft-reset the commit on `main` (`git reset --soft HEAD~1`), checkout `develop`, and commit there.
