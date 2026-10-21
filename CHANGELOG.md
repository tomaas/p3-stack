# Changelog

## 2026-10-21: sync with pstack 0.15.29

Upstream: [cursor/plugins](https://github.com/cursor/plugins) pstack at `88d4751` (0.15.29), by Lauren Tan (poteto), MIT.

- **Skill names equal folder names** ([#702](https://github.com/cursor/plugins/pull/702)). Every `skills/*/SKILL.md` `name` already matched its folder, so no skill is renamed. New `scripts/check-skill-names.sh` fails when a `name` differs from its folder, or the folder is not lowercase words joined by hyphens, at most 64 characters. `AGENTS.md` adds it to the definition of done.
- **New `/ketchup`** ([#692](https://github.com/cursor/plugins/pull/692), [#708](https://github.com/cursor/plugins/pull/708)). Ported at 0.15.29 with the per-item rule: every waiting item gets its own bullet with its link or PR number, what it changes for users, evidence, risk even when low, and a pick. It never folds items into a count or cuts them to meet a word count, and small replies stay short. T3 wiring: thread instead of chat, `list_thread_pull_requests` and `task_status` for live state, `preview_*` and `device_*` captures and `html_render` charts for visuals.
- **New `/sharpen`** ([#712](https://github.com/cursor/plugins/pull/712), [#729](https://github.com/cursor/plugins/pull/729)). Ported at 0.15.29: the four asks as a numbered list, then a rewritten prompt that leaves the user's choices open. It returns only the rewritten prompt and doesn't do the task. The body is upstream's eval-tuned text, word for word.
- `/p3-help` routes to `/ketchup` and `/sharpen`. The README lists both and credits the upstream commit. `NOTICE` added.

### Follow-up

Not ported in this sync:

- `create-formal-verification-skill`
- `maintain-formal-verification-skill`
- `in-your-own-words` (in upstream pstack, never ported to p3-stack)
