# pstack for T3 Code

This branch, `pstack-t3`, is [pstack](https://github.com/cursor/plugins/tree/main/pstack) by poteto, verbatim, plus an adapter for T3 Code. Upstream ships the same shape for Claude Code: an adapter doc and a generated tree whose skills get one line pointing at it. T3 Code runs Claude Code and Codex sessions, so the T3 layer reuses upstream's Claude Code adapter and covers only what T3 adds: threads and worktrees, `delegate_task`, PR watching, schedules, thread memory, previews and devices.

The skills keep upstream's names and text: `/poteto-mode`, `/poteto-help`, `/setup-pstack`, `poteto-agent`, `comment-sicko`. The old p3-stack fork renamed them (`p3-mode`, `p3-help`, `setup-p3`, `p3-agent`) and rewrote their text. This branch replaces that fork.

## Layout

| Path | What it is |
| --- | --- |
| `skills/`, `agents/`, `docs/guide/`, `docs/harness/claude-code.md`, `README.md`, `LICENSE`, the rest | Upstream's files. Never edit them here. |
| `docs/harness/t3.md` | The T3 adapter. A session reads the Claude Code adapter, then this one, which wins where they differ. |
| `t3/generate.mjs` | Renders `harness/t3/` from upstream's files, the two adapters and `t3/patches`. |
| `t3/patches/` | Local changes, applied to the generated tree only. |
| `harness/t3/` | The generated tree that `t3/install.sh` installs. Committed. Never edit it by hand. |
| `t3/install.sh` | Links `harness/t3/skills/*` into the folders T3 sessions read. |
| `t3/check`, `t3/test/` | The checks. |

Every skill that uses a Cursor name gets one line under its H1: read the Claude Code adapter, then the T3 adapter, once per session. `node t3/generate.mjs --check` fails when the tree is stale, when a patch no longer applies, or when a Cursor name a skill uses has no row in either adapter. The T3 names (`/loop`, `watch-pr`, `cursor-team-kit`, `worker.md` and the others in `T3_TERMS`) need a row in `docs/harness/t3.md`.

## Install

```bash
git clone -b pstack-t3 https://github.com/tomaas/p3-stack.git pstack-t3
pstack-t3/t3/install.sh --dry-run
pstack-t3/t3/install.sh
```

`t3/install.sh` links each skill folder of `harness/t3/skills` into `~/.claude/skills` (Claude Code sessions) and `~/.agents/skills` (Codex sessions). `--project <dir>` installs into the project's `.claude/skills` and `.agents/skills` instead. `--dry-run` prints what it would do. An entry that already has a skill's name is kept and reported as `keep <name> (...)`, unless it is this checkout's own link. Rerunning it is safe.

Coming from the old fork, its links (such as `~/.agents/skills/how`) point at its own `skills/` and are kept. Remove each one you want replaced with `rm ~/.agents/skills/<name>`, with no trailing slash, then rerun `t3/install.sh`. Remove the old renamed skills (`p3-mode`, `p3-help`, `setup-p3`) the same way.

Then run `/setup-pstack` once. In T3 it writes `~/.claude/rules/pstack-models.md`. A project's own `p3-models.md` at the worktree root wins over it.

## Sync with upstream

`upstream-pstack` is `git subtree split --prefix=pstack` of cursor/plugins. The split is deterministic, so each new split extends the last one and this branch takes it with a plain merge.

1. In a cursor/plugins clone: `git fetch origin && git subtree split --prefix=pstack origin/main -b pstack-split`.
2. Push the split to this repository's `upstream-pstack` branch: `git push <p3-stack remote> pstack-split:upstream-pstack`. It must fast-forward.
3. Here, on `pstack-t3`: `git fetch origin && git merge origin/upstream-pstack`.
4. `node t3/generate.mjs`. A failure names what to fix: a patch whose context changed upstream, or a new Cursor name that needs a row in `docs/harness/t3.md`. Rework the patch or add the row, never an upstream file.
5. `t3/check`. It runs the generator in `--check` mode, proves the upstream files match `origin/upstream-pstack` (set `UPSTREAM_REF` for another ref), and runs `t3/test`.
6. Update the upstream commit in `t3/NOTICE-T3`, and commit.

## Patches

Each patch is a header saying why, then a unified diff of one upstream file. The generator applies it to the tree only and fails when a hunk no longer matches exactly.

| Patch | File | Why |
| --- | --- | --- |
| `01-reflect-copy-linked-skill.patch` | `skills/reflect/SKILL.md` | The install links skills into this checkout, so editing a skill through its link changes the shared checkout. The patch replaces upstream's last paragraph with the safe steps to copy a linked skill out before editing it. |
| `02-statechart-render-absolute-path.patch` | `skills/statechart/references/render.md` | T3 shows an image in the thread only when the reply embeds it by absolute path. |

`statechart`'s `scripts/package.json` keeps upstream's package name. Nothing reads the name, and the package tests pass under it.

## Credit

pstack is by Lauren Tan (poteto), MIT. The T3 adaptation continues the p3-stack work started by Uzair Ansar. See [`NOTICE-T3`](NOTICE-T3) and [`LICENSE`](../LICENSE).
