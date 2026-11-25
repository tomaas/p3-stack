#!/usr/bin/env bash
# Links the pstack skills from harness/t3/skills into the folders T3 Code's sessions read:
# ~/.claude/skills (Claude Code) and ~/.agents/skills (Codex), or a project's .claude/skills and .agents/skills.
# An entry that already has a skill's name is kept and reported, unless it is this checkout's own link.
set -euo pipefail

usage() {
  printf 'usage: t3/install.sh [--project <dir>] [--dry-run]\n' >&2
  exit 64
}

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
SOURCE="$ROOT/harness/t3/skills"
base="$HOME"
dry_run=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --project)
      [[ $# -ge 2 && -n "$2" ]] || usage
      [[ -d "$2" ]] || { printf 'no project folder at %s\n' "$2" >&2; exit 66; }
      base="$(cd "$2" && pwd -P)"
      shift 2
      ;;
    --dry-run) dry_run=1; shift ;;
    *) usage ;;
  esac
done

if [[ ! -f "$SOURCE/poteto-mode/SKILL.md" ]]; then
  printf 'no generated tree at %s: run node t3/generate.mjs\n' "$SOURCE" >&2
  exit 66
fi

run() {
  if [[ "$dry_run" -eq 1 ]]; then
    printf 'would run:'
    printf ' %q' "$@"
    printf '\n'
  else
    "$@"
  fi
}

status=0
for target in "$base/.claude/skills" "$base/.agents/skills"; do
  linked=0
  current=0
  kept=0
  [[ -d "$target" ]] || run mkdir -p "$target"
  for skill in "$SOURCE"/*/; do
    skill="${skill%/}"
    name="$(basename "$skill")"
    entry="$target/$name"
    if [[ -L "$entry" ]]; then
      if [[ "$(readlink "$entry")" == "$skill" ]]; then
        current=$((current + 1))
        continue
      fi
      printf 'keep %s (%s is a link to %s)\n' "$name" "$entry" "$(readlink "$entry")"
      kept=$((kept + 1))
      continue
    fi
    if [[ -e "$entry" ]]; then
      printf 'keep %s (%s exists and is not a link)\n' "$name" "$entry"
      kept=$((kept + 1))
      continue
    fi
    run ln -s "$skill" "$entry" || status=1
    linked=$((linked + 1))
  done
  verb="linked"
  [[ "$dry_run" -eq 1 ]] && verb="would link"
  printf '%s %d skills into %s (%d already linked, %d kept)\n' "$verb" "$linked" "$target" "$current" "$kept"
done
exit "$status"
