#!/usr/bin/env bash
# Fail when a skill's frontmatter `name` is not its folder name, or the folder
# name is not lowercase words joined by hyphens, at most 64 characters.
# T3 Code lists a skill by its frontmatter name and installs it by folder name,
# so the two must match.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
problems=0
checked=0

for file in "$ROOT"/skills/*/SKILL.md; do
  folder="$(basename "$(dirname "$file")")"
  checked=$((checked + 1))

  name="$(awk '
    NR == 1 && $0 != "---" { exit }
    NR > 1 && $0 == "---" { exit }
    NR > 1 && /^name:/ { sub(/^name:[ \t]*/, ""); sub(/[ \t]+$/, ""); print; exit }
  ' "$file")"
  name="${name#[\"\']}"
  name="${name%[\"\']}"

  if [[ "$name" != "$folder" ]]; then
    printf 'skills/%s/SKILL.md has name "%s", not its folder name %s\n' "$folder" "$name" "$folder"
    problems=$((problems + 1))
  fi
  if [[ ! "$folder" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ || ${#folder} -gt 64 ]]; then
    printf 'skills/%s is not lowercase words joined by hyphens, at most 64 characters\n' "$folder"
    problems=$((problems + 1))
  fi
done

if [[ "$problems" -gt 0 ]]; then
  printf '%d problem(s) in %d skills\n' "$problems" "$checked"
  exit 1
fi
printf 'ok: %d skill names match their folders\n' "$checked"
