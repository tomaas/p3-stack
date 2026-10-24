# Changelog

## 2026-10-24: sync with pstack 0.15.32

Upstream: [cursor/plugins](https://github.com/cursor/plugins) pstack at `9580c23` (0.15.32), by Lauren Tan (poteto), MIT.

- **New `/statechart`** ([#741](https://github.com/cursor/plugins/pull/741), [#776](https://github.com/cursor/plugins/pull/776), [#779](https://github.com/cursor/plugins/pull/779), [#791](https://github.com/cursor/plugins/pull/791)). Draws how a system moves between states as a Mermaid statechart generated from a TLA+ model, with each bug TLC finds as a numbered path. Also turns an agreed chart into a TLA+ skeleton, or audits code against an existing spec. The skill and its `scripts/` are upstream's at 0.15.32, unchanged: nothing in them is Cursor-specific.
- **New `/ketchup-video`** ([#797](https://github.com/cursor/plugins/pull/797)). `/ketchup` as a short silent video of slides, with the waiting calls as text under it. T3 wiring: "chat" becomes "thread", and the video is embedded in the thread by its absolute path.
- **`/reflect` keeps edits out of the installed checkout** ([#800](https://github.com/cursor/plugins/pull/800)). Upstream forbids editing skills under `plugins/cache/`. Here the equivalent is the p3-stack checkout that `install.sh` symlinks into `~/.agents/skills/`: reflect replaces the symlink with a copy and edits the copy, which `install.sh` then leaves alone. Never opens a PR or pushes.
- **`/swarm` report wording** ([#807](https://github.com/cursor/plugins/pull/807)). Phase D names "a result table" instead of "the table". The step renumbering in #807 was already right here, because p3-stack kept the "Set N" step that upstream had dropped.
- `/p3-help` routes to `/ketchup-video` and `/statechart`. The README lists both and credits the new upstream commit. `NOTICE` names the new commit.
- `/reflect` spells out a safe symlink-to-copy procedure (`readlink -f`, copy to a temp folder, `rm` the link with no trailing slash, `mv`, `test ! -L`), keeps project copies out of commits, and tells the user a copied skill is detached from `git pull` and how to restore it (DEV-1181 review follow-up).

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
