# Changelog

## 2026-11-05: formal verification skills (pstack 0.15.36)

Upstream: [cursor/plugins](https://github.com/cursor/plugins) pstack at `c742dd6` (0.15.36), by Lauren Tan (poteto), MIT. Ports the pair listed under "Not ported" on 2026-10-24 and 2026-11-02 (DEV-1542).

- **New `/create-formal-verification-skill`**. Finds the code where a bug costs the most and tests reach the least, verifies one property of it with the tool that fits (TLA+ by default for ordering and races), shows each property failing on a broken variant, and leaves a project-local verify skill with a coverage record and a sync commit. Carries the `/statechart` wording from [#794](https://github.com/cursor/plugins/pull/794) and [#977](https://github.com/cursor/plugins/pull/977): a TLA+ result is read with `/statechart`, by name, with none of its commands copied. T3 wiring: the generated skill goes in `.agents/skills/`, questions go plainly in the thread, and the pointer names p3-stack's `/statechart`.
- **New `/maintain-formal-verification-skill`**. The upkeep loop: reads every commit that touched verified code since the sync commit, updates the model or harness from the code, reruns, and calls each failure drift or a bug. Upstream's text, with one T3 change: verify skills are looked for under `.agents/skills/`.
- **`/setup-p3` step 8** offers once to generate a formal verification skill when the project has none, as upstream's `setup-pstack`. The "resolves wherever pstack is installed" aside is dropped, as in step 7.
- `/statechart` needs no change: its `SKILL.md` already matches upstream at `c742dd6`, and the #977 wording that depended on the new skills lives in `create-formal-verification-skill`.
- The README lists both skills.

Not ported, because p3-stack has no counterpart or it is out of scope here:

- `docs/guide` and `poteto-help/references/recipes.md` mentions of the two skills: p3-stack has no guide and no recipes file.
- `poteto-help` routing rows and state hint for the two skills: `/p3-help` is left for a follow-up.

## 2026-11-02: sync with pstack 0.15.36

Upstream: [cursor/plugins](https://github.com/cursor/plugins) pstack at `c742dd6` (0.15.36), by Lauren Tan (poteto), MIT.

- **`/statechart` is now a compiler** ([#977](https://github.com/cursor/plugins/pull/977)). One command, `scripts/statechart SPEC.tla`, checks a TLA+ model with TLC, draws the Mermaid statechart, and reports the shortest path to each rule that breaks. A POSIX launcher runs the TypeScript on Node 22.18+, Bun 1.1.5+ or Deno 2.0+, with no build step. The chart-to-TLA+ skeleton and the audit against an existing spec are gone, as upstream. The skill and its `scripts/` are upstream's at 0.15.36, with two T3 changes: `references/render.md` embeds the SVG in the thread by its absolute path, and the private `package.json` is named `@p3-stack/statechart`.
- **Qualified action names in property traces** ([#982](https://github.com/cursor/plugins/pull/982)). An INSTANCE action such as `C!Up` keeps its full name in traces, so a PROPERTY that it breaks gets its bug path. Comes in with the upstream scripts.
- **SIGKILL view test waits for the reap** ([#981](https://github.com/cursor/plugins/pull/981)). Test-only fix for macOS. Comes in with the upstream scripts.
- **Recent skill updates** ([#986](https://github.com/cursor/plugins/pull/986)):
  - `/p3-mode` restates the user's goal in the first message, each delegate brief, each PR's `## Why`, and each final report. A steer or follow-up to a running worker is async too. A rejected model falls back through the calling skill's fallback, then the closest model of the same provider, then the parent model, and the agent says so. Explain the Number applies before you measure.
  - Autopilot-full blocks a PR only for a problem a run or a wrong doc line shows, pushes each finished unit before the next, rebases when a known concurrent change to the same files lands, and gives a wording-only push no verifier. Its reply lists parked follow-ups.
  - Autopilot-stack is now Autopilot-full without the merge. A PR stacks only on a PR it builds on. The STACK-READY state, the root-owned topology, and the "choosing between the autopilots" rule are gone. The multi-phase plan, babysit and opening-a-PR playbooks follow, and a PR-opening worker no longer runs `/interrogate`.
  - Autonomous run owns only mid-run discoveries that support the goal.
  - `/interrogate`: adversaries prove each finding with a run, and the lead keeps only findings that a rerun confirms. Its `references/` (reviewer prompt, rubric, code-quality lens, lead judgment) are deleted. Upstream's pointer to the `in-your-own-words` skill is inlined, because p3-stack has no such skill yet.
  - `/arena` drops or replaces a rejected runner seat. Its cross-judge never comes from the parent's provider, and Arena skips the judge when no other provider runs. `/setup-p3` describes the pool the same way.
  - `/ketchup-video` subtitles each slide and measures holds from the rendered file.
  - `principle-explain-the-number`: write the decision before you run.
- **Agent-run Orchestrate** ([#1043](https://github.com/cursor/plugins/pull/1043)). The Orchestrate playbook runs the program with the coordinator's own tools: `delegate_task` workers, one owner per PR, a verifier from another model family, `watch_pull_request` with an hourly `schedule_task` fallback, and state kept in plain files and linked PRs. The store layout, brief template, inbox drain, frontier and ledger machinery are gone. p3-stack never shipped upstream's `orch` scripts, and no consumer calls them, so no script is deleted here.
- `/reflect` copy steps (DEV-1181 review nits, deferred from #4): `chmod 755` after `mktemp -d`, so the copy is not left readable only by its owner. Clearer wording on which steps run as one command for each case. A recovery note for when step 4 fails after the link is gone. Paths are quoted.
- `/p3-help`, the README and `NOTICE` match: the new `/statechart`, `/interrogate` and `/ketchup-video` wording, "autopilot, don't merge" for Autopilot-stack, and the upstream commit `c742dd6`.

Not ported, because p3-stack has no counterpart:

- Version bumps to 0.15.33 through 0.15.36 ([#978](https://github.com/cursor/plugins/pull/978), [#983](https://github.com/cursor/plugins/pull/983), and the bumps inside #986 and #1043): no `plugin.json`.
- `orch` script deletion and the `poteto-mode/scripts/package.json` test entry (#1043): never ported (see the 2026-10-24 entry).
- `create-formal-verification-skill` wording on `/statechart` (#977): that skill is not ported yet.
- `docs/guide` changes (#977, #986, #1043) and the CI move to Node 22 (#977): p3-stack has no guide and no CI.
- `poteto-help/references/recipes.md` wording (#986): p3-help has no recipes file.

## 2026-10-24: sync with pstack 0.15.32

Upstream: [cursor/plugins](https://github.com/cursor/plugins) pstack at `9580c23` (0.15.32), by Lauren Tan (poteto), MIT.

- **New `/statechart`** ([#741](https://github.com/cursor/plugins/pull/741), [#776](https://github.com/cursor/plugins/pull/776), [#779](https://github.com/cursor/plugins/pull/779), [#791](https://github.com/cursor/plugins/pull/791)). Draws how a system moves between states as a Mermaid statechart generated from a TLA+ model, with each bug TLC finds as a numbered path. Also turns an agreed chart into a TLA+ skeleton, or audits code against an existing spec. The skill and its `scripts/` are upstream's at 0.15.32, unchanged: nothing in them is Cursor-specific.
- **New `/ketchup-video`** ([#797](https://github.com/cursor/plugins/pull/797)). `/ketchup` as a short silent video of slides, with the waiting calls as text under it. T3 wiring: "chat" becomes "thread", and the video is embedded in the thread by its absolute path.
- **`/reflect` keeps edits out of the installed checkout** ([#800](https://github.com/cursor/plugins/pull/800)). Upstream forbids editing skills under `plugins/cache/`. Here the equivalent is the p3-stack checkout that `install.sh` symlinks into `~/.agents/skills/`: reflect replaces the symlink with a copy and edits the copy, which `install.sh` then leaves alone. Never opens a PR or pushes.
- **`/swarm` report wording** ([#807](https://github.com/cursor/plugins/pull/807)). Phase D names "a result table" instead of "the table". The step renumbering in #807 was already right here, because p3-stack kept the "Set N" step that upstream had dropped.
- `/p3-help` routes to `/ketchup-video` and `/statechart`. The README lists both and credits the new upstream commit. `NOTICE` names the new commit.
- `/reflect` spells out a safe symlink-to-copy procedure (`readlink -f`, copy to a temp folder, `rm` the link with no trailing slash, `mv`, `test ! -L`), keeps project copies out of commits, and tells the user a copied skill is detached from `git pull` and how to restore it (DEV-1181 review follow-up).
- `/reflect` copy steps take a `<dest>` placeholder for the global or project path, cover a project with no copy yet (copy from the global link, which stays), use `mktemp -d` instead of a fixed temp path, refuse to `mv` onto an existing path, and verify `test -d`, `test ! -L` and `SKILL.md` before editing (DEV-1181 second review follow-up).

Not ported, because p3-stack has no counterpart:

- Version bumps to 0.15.31 and 0.15.32 ([#792](https://github.com/cursor/plugins/pull/792), [#798](https://github.com/cursor/plugins/pull/798)): no `plugin.json`.
- `watch-pr` fixes ([#801](https://github.com/cursor/plugins/pull/801), [#802](https://github.com/cursor/plugins/pull/802)): `watch_pull_request` replaces `scripts/watch-pr`.
- `check-plan.mjs` ([#803](https://github.com/cursor/plugins/pull/803)), `orch` ([#804](https://github.com/cursor/plugins/pull/804)), `worktree-audit.sh` ([#805](https://github.com/cursor/plugins/pull/805)): p3-mode ships no scripts. Delegation and worktrees go through T3 tools.
- Claude Code marketplace auto-update note ([#806](https://github.com/cursor/plugins/pull/806)): install is a symlink from a git clone. `git pull` updates it.
- `create-formal-verification-skill` pointer to `/statechart` ([#794](https://github.com/cursor/plugins/pull/794)): that skill is not ported yet. Carry the line over when it is.
- `docs/guide` sections for `/statechart` and `/ketchup-video` (#741, #797): p3-stack has no guide.

### Follow-up

Still not ported:

- `create-formal-verification-skill` (with #794)
- `maintain-formal-verification-skill`
- `in-your-own-words`

## 2026-10-21: sync with pstack 0.15.29

Upstream: [cursor/plugins](https://github.com/cursor/plugins) pstack at `88d4751` (0.15.29), by Lauren Tan (poteto), MIT.

- **Skill names equal folder names** ([#702](https://github.com/cursor/plugins/pull/702)). Every `skills/*/SKILL.md` `name` already matched its folder, so no skill is renamed. New `scripts/check-skill-names.sh` fails when a `name` differs from its folder, or the folder is not lowercase words joined by hyphens, at most 64 characters. `AGENTS.md` adds it to the definition of done, and lists `html_preview`/`html_render` in its T3 tool quick reference.
- **New `/ketchup`** ([#692](https://github.com/cursor/plugins/pull/692), [#708](https://github.com/cursor/plugins/pull/708)). Ported at 0.15.29 with the per-item rule: every waiting item gets its own bullet with its link or PR number, what it changes for users, evidence, risk even when low, and a pick. It never folds items into a count or cuts them to meet a word count, and small replies stay short. T3 wiring: thread instead of chat, `list_thread_pull_requests`, `task_status` and `t3_thread_read` for live state, `preview_*` and `device_*` captures and `html_render` charts for visuals.
- **New `/sharpen`** ([#712](https://github.com/cursor/plugins/pull/712), [#729](https://github.com/cursor/plugins/pull/729)). Ported at 0.15.29: the four asks as a numbered list, then a rewritten prompt that leaves the user's choices open. It hands back the rewritten prompt and doesn't do the task. The body is upstream's eval-tuned text, word for word.
- `/p3-help` routes to `/ketchup` and `/sharpen`. The README lists both and credits the upstream commit. `NOTICE` added.

### Follow-up

Not ported in this sync:

- `create-formal-verification-skill`
- `maintain-formal-verification-skill`
- `in-your-own-words` (in upstream pstack, never ported to p3-stack)
