# Git Workflow: Auto-Push & PR Practice

Whenever code changes or tasks are completed:
1. **Always use the `develop` branch**:
   - Never commit or push directly to `main`.
   - Ensure you are working on/merging into `develop`.
2. **Push to GitHub**:
   - Stage changes intentionally, verify no `.env` or secret files are included.
   - Commit using Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
   - Push to `origin/develop`: `git push -u origin develop`.
3. **Check Pull Request to `main`**:
   - Check if an open PR from `develop` to `main` already exists:
     ```bash
     gh pr list --base main --head develop --state open
     ```
   - **If open PR exists**: The push to `develop` automatically updates the existing PR. Inform the user with the PR link.
   - **If no open PR exists**: Create one immediately:
     ```bash
     gh pr create --base main --head develop --title "<type>: <concise description>" --body "<summary of changes>"
     ```
   - Provide the PR link to the user so they can review and merge when ready.
