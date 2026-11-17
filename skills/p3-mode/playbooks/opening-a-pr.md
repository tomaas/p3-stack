### Opening a PR

Invoked at the end of every other playbook.

Work from a git worktree off trunk, and keep unrelated work out of it. Parallel workers on one branch each get their own worktree through `t3_thread_launch` with a `workspaceStrategy`, one writer per worktree. Rebase into small, landable commits. Run the **unslop** skill over the diff before commit.

Title: `type(scope): subject`, naming a real symbol when one carries the change. Body: a one-minute briefing under 40 lines with these `##` headings in order, dropping empty ones: `## Why`, `## What changed`, `## Scope`, `## Tradeoffs` (only rejected alternatives a reviewer would otherwise ask about), `## Blast Radius`, `## Verification`.

Stack follow-ups by base branch. Open PRs ready with `gh pr create` without `--draft`. Call `link_pull_request` with the full URL the moment each PR opens, every layer of a stack included. Opening a PR does not start a babysit.
