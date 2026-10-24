---
name: reflect
description: Delegate three parallel reviewers over the active thread, surface learnings, and route each to a concrete edit on an existing skill. Use when the user says reflect.
disable-model-invocation: true
---

# Reflect

Mine the current conversation for durable learnings, then route them into skill edits.

## When to invoke

Invoke when the user says "reflect" or "/reflect". Skip when the conversation is trivial, off-topic, or already covered by an existing skill the parent followed correctly. One-offs are not learnings.

## Process

### 1. Locate the active transcript

The transcript is the current T3 thread. Read it with `t3_thread_read`; use `t3_thread_search` to pull exact passages. Do not search across other threads. That crosses workspace boundaries and reads private chats from unrelated projects.

Reviewers get only their brief, never the parent's context. Pass the thread id and tell them to read it with `t3_thread_read`, or write a tight digest of the session and pass that instead.

### 2. Delegate three reviewers in parallel

One turn, three `delegate_task` calls with `mode: "async"`. Reviewers need tool access for context lookups (tickets, chat threads, observability traces referenced in the transcript), so do not restrict their tools.

Resolve each model from the role line in `p3-models.md` via `orchestrator_capabilities`. Never hardcode a slug.

| Lens | Role line | Prompt template |
|---|---|---|
| Judgment | `reflect judgment, divergent, synthesizer` | `references/judgment-reviewer.md` |
| Tooling | `reflect tooling` | `references/tooling-reviewer.md` |
| Divergent | `reflect judgment, divergent, synthesizer` | `references/divergent-reviewer.md` |

Pass each template verbatim as the brief, substituting the thread id or digest where marked. Drain with `task_status`; reviewers return findings in their task result.

### 3. Synthesize

One `delegate_task` call, model from the `reflect judgment, divergent, synthesizer` line. The synthesizer's quality check includes spot-verifying citations, which can require tool access. Use `references/synthesizer.md` verbatim as the brief, with each reviewer's full output inlined where marked. The synthesizer returns a structured Accepted / Rejected / Backlog list.

### 4. Structural enforcement check

Sanity-check the synthesizer's Accepted list. For any item that would be enforced more reliably by a lint rule, script, metadata flag, or runtime check, move it from Accepted to Backlog. See the **encode-lessons-in-structure** principle skill.

### 5. Apply

Before applying any Accepted edit, present the synthesizer's full Accepted/Rejected/Backlog output to the user and wait for explicit approval. The user picks which subset to apply and may redirect routings. Skill changes affect every future agent in the org. Do not auto-apply.

Backlog items file to whatever devex / backlog tracker your team uses automatically. Only the Accepted list waits for approval.

Never edit a skill through its symlink into the p3-stack checkout. `install.sh` links each skill there, so an edit lands in the shared checkout, mixed in with upstream's files and read by every project that uses the install. Before approval, show its destination, `.agents/skills/<skill>` in the project or `~/.agents/skills/<skill>`, and say the copy will be detached: it stops updating on `git pull` (`install.sh` prints `skip <skill>` for it), and deleting the copy and rerunning `install.sh` restores the linked skill.

After approval, `<dest>` is `~/.agents/skills/<skill>` or the project's `.agents/skills/<skill>`, written with no trailing slash. `rm -r` on a link with a trailing slash deletes files inside the checkout, and `cp -r` of a link copies the link. Never `cp -r` the link itself: copy from the real folder. Pick the case by what `<dest>` is now:

- A symlink: run steps 1 to 5, with `<link>` = `<dest>`.
- Missing, because the skill is only installed globally: run steps 1, 2, 4 and 5, with `<link>` = `~/.agents/skills/<skill>`. Skip step 3, so the global link stays. Create the project's `.agents/skills` folder first if it does not exist.
- A plain folder: there is nothing to replace. Edit it in place.

1. `readlink -f <link>` prints the real folder.
2. `tmp=$(mktemp -d) && cp -R <real folder>/. "$tmp"/` copies its contents into a fresh temp folder.
3. `rm <dest>` removes the link. Never `-r`, never a trailing slash.
4. `test ! -e <dest> && mv "$tmp" <dest>` moves the copy into place.
5. `test -d <dest> && test ! -L <dest> && test -f <dest>/SKILL.md` must succeed before you edit.

Run steps 2 to 5 as one shell command joined with `&&`, so `$tmp` stays set and a failed step stops the rest. If a step fails, stop and tell the user. Never delete or recreate a folder to make a step pass.

A copy under a project's `.agents/skills/` lives in the user's repo. Never stage or commit it unless the user asks. Never open a PR or push.

For each approved Accepted item, follow the Routing field exactly:

- Trivial existing-skill edit (a one-line bullet, a tightened sentence, a stale fact corrected): parent does directly.
- Substantive existing-skill edit (a new section, a new pattern table, more than ~10 lines): follow the authoring-a-skill playbook and run its draft / test / iterate loop.
- `tune description: <skill path>` (the skill exists but didn't trigger when it should have): follow the authoring-a-skill playbook and run its description-optimization loop.
- `new skill via authoring-a-skill: <kebab-name>`: hand creation to the authoring-a-skill playbook. Do not invent the shape ad hoc.

If your environment ships a SKILL.md validator, run it on every touched skill before declaring done. Skip this step if it doesn't.

### 6. Summarize for the user

Short list, no preamble:

- Edits applied: `<skill path>`. What changed, one line each. For a skill copied out of the p3-stack checkout, say it is detached: it no longer updates on `git pull` (`install.sh` prints `skip <skill>`), and deleting the copy and rerunning `install.sh` restores it.
- New skills created: `<skill path>`. One line each (rare).
- Backlog filed to the devex tracker: `<issue title>` (`<tags>`). One line each.
- Dropped: one line per rejected finding + reason from the synthesizer.
