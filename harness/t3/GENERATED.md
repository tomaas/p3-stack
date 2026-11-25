# pstack T3 Code tree

This folder is generated from `skills`, `agents`, `docs/guide`, `docs/harness/claude-code.md`, `docs/harness/t3.md`, `README.md` and `LICENSE`, with the patches in `t3/patches` and the vendored skills in `t3/extra` (see `t3/extra/SOURCES`). Do not edit it by hand.

`t3/install.sh` links `skills/*` from this folder into `~/.claude/skills` and `~/.agents/skills`. A relative link to a pstack file that the tree leaves out points at that file in cursor/plugins at the upstream base commit instead. Each one is listed below.

After editing those sources or a patch, run `node t3/generate.mjs` from the repository root and commit the result.

Upstream base: cursor/plugins `9e278fe4d4ecd8bfe98b1b79bf4be662efb338cc` (from `t3/UPSTREAM`).

## Rewritten links

- `docs/guide/07-overnight.md`: `../../automations/benny/README.md` -> https://github.com/cursor/plugins/blob/9e278fe4d4ecd8bfe98b1b79bf4be662efb338cc/pstack/automations/benny/README.md
- `docs/guide/07-overnight.md`: `../../automations/benny/FOR_AGENTS.md` -> https://github.com/cursor/plugins/blob/9e278fe4d4ecd8bfe98b1b79bf4be662efb338cc/pstack/automations/benny/FOR_AGENTS.md
- `README.md`: `./automations/benny/` -> https://github.com/cursor/plugins/tree/9e278fe4d4ecd8bfe98b1b79bf4be662efb338cc/pstack/automations/benny
- `README.md`: `./automations/benny/FOR_AGENTS.md` -> https://github.com/cursor/plugins/blob/9e278fe4d4ecd8bfe98b1b79bf4be662efb338cc/pstack/automations/benny/FOR_AGENTS.md
