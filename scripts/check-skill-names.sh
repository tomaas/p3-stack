#!/usr/bin/env bash
# Fail when a skill's frontmatter `name` is not its folder name, or the folder
# name is not lowercase words joined by hyphens, at most 64 characters.
# T3 Code lists a skill by its frontmatter name and installs it by folder name,
# so the two must match.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
problems=0
checked=0

problem() {
  printf '%s\n' "$1"
  problems=$((problems + 1))
}

for dir in "$ROOT"/skills/*/; do
  folder="$(basename "$dir")"
  file="${dir}SKILL.md"
  checked=$((checked + 1))

  if [[ ! "$folder" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ || ${#folder} -gt 64 ]]; then
    problem "skills/$folder is not lowercase words joined by hyphens, at most 64 characters"
  fi
  if [[ ! -f "$file" ]]; then
    problem "skills/$folder has no SKILL.md"
    continue
  fi

  # Prints "closed<TAB>name" when the frontmatter closes, "open<TAB>name" otherwise.
  read -r fence name < <(awk '
    { sub(/\r$/, "") }
    NR == 1 { sub(/^\xef\xbb\xbf/, ""); if ($0 != "---") exit; next }
    $0 == "---" { closed = 1; exit }
    !found && /^name:/ { sub(/^name:[ \t]*/, ""); sub(/[ \t]+$/, ""); name = $0; found = 1 }
    END { printf "%s\t%s\n", (closed ? "closed" : "open"), name }
  ' "$file") || true

  if [[ "$fence" != "closed" ]]; then
    problem "skills/$folder/SKILL.md has no frontmatter closed by ---"
    continue
  fi
  if [[ "$name" =~ ^\"(.*)\"$ || "$name" =~ ^\'(.*)\'$ ]]; then
    name="${BASH_REMATCH[1]}"
  fi
  if [[ "$name" != "$folder" ]]; then
    problem "skills/$folder/SKILL.md has name \"$name\", not its folder name $folder"
  fi
done

if [[ "$problems" -gt 0 ]]; then
  printf '%d problem(s) in %d skills\n' "$problems" "$checked"
  exit 1
fi
printf 'ok: %d skill names match their folders\n' "$checked"
