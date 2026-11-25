# pstack T3 Code tree

This folder is generated from `skills`, `agents`, `docs/guide`, `docs/harness/claude-code.md`, `docs/harness/t3.md`, `README.md` and `LICENSE`, with the patches in `t3/patches`. Do not edit it by hand.

`t3/install.sh` links `skills/*` from this folder into `~/.claude/skills` and `~/.agents/skills`. A relative link to a pstack file that the tree leaves out points at that file on GitHub `main` instead.

After editing those sources or a patch, run `node t3/generate.mjs` from the repository root and commit the result.
