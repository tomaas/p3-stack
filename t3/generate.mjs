#!/usr/bin/env node
// Renders harness/t3/ from the upstream pstack files. Adapted from cursor/plugins
// scripts/generate-pstack-harness-trees.mjs (MIT, Lauren Tan).

import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, posix, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS = join(ROOT, "skills");
const PATCHES = join(ROOT, "t3", "patches");
const OUT = join(ROOT, "harness", "t3");
const CLAUDE_ADAPTER = "docs/harness/claude-code.md";
const T3_ADAPTER = "docs/harness/t3.md";
const GUIDE = "docs/guide";
const COMMAND = "node t3/generate.mjs";
const GITHUB = "https://github.com/cursor/plugins";
const LINK = /\]\(([^)\s]+)\)/g;
// The cursor/plugins commit that upstream-pstack was split from. A sync updates t3/UPSTREAM.
const UPSTREAM_COMMIT = readFileSync(join(ROOT, "t3", "UPSTREAM"), "utf8").trim();
if (!/^[0-9a-f]{40}$/.test(UPSTREAM_COMMIT)) {
  console.log("FAIL t3/UPSTREAM must hold the full 40-character cursor/plugins commit sha");
  process.exit(1);
}
const README = `# pstack T3 Code tree

This folder is generated from \`skills\`, \`agents\`, \`${GUIDE}\`, \`${CLAUDE_ADAPTER}\`, \`${T3_ADAPTER}\`, \`README.md\` and \`LICENSE\`, with the patches in \`t3/patches\`. Do not edit it by hand.

\`t3/install.sh\` links \`skills/*\` from this folder into \`~/.claude/skills\` and \`~/.agents/skills\`. A relative link to a pstack file that the tree leaves out points at that file in cursor/plugins at the upstream base commit instead. Each one is listed below.

After editing those sources or a patch, run \`${COMMAND}\` from the repository root and commit the result.
`;

// Upstream's TERMS. Each key needs a table row whose first cell holds it, in either adapter.
const UPSTREAM_TERMS = [
  { key: "`Task`", re: /`Task`|\bTask (tool|subagent|call)/ },
  { key: "`AskQuestion`", re: /AskQuestion/ },
  { key: "todolist", re: /\btodo ?list\b/i },
  { key: "generalPurpose", re: /generalPurpose/ },
  { key: "poteto-agent", re: /poteto-agent/ },
  { key: "comment-sicko", re: /comment-sicko/ },
  { key: "`readonly: true`", re: /readonly: (true|false)|readonly\/Ask/ },
  { key: "`environment: \"cloud\"`", re: /environment: "(cloud|local)"/ },
  { key: "cloud_base_branch", re: /cloud_base_branch/ },
  { key: "`run_in_background: true`", re: /run_in_background/ },
  { key: "`resume`", re: /`resume`/ },
  { key: "`file_attachments`", re: /file_attachments/ },
  { key: "claude-", re: /\bclaude-[a-z]+-\d/ },
  { key: "grok-", re: /\bgrok-\d/ },
  { key: "gpt-", re: /\bgpt-\d/ },
  { key: "inherit-parent", re: /inherit-parent/ },
  { key: "pstack-models.mdc", re: /pstack-models\.mdc/ },
  { key: ".cursor/skills/", re: /\.cursor\/skills/ },
  { key: "~/.cursor/plugins/", re: /\.cursor\/plugins|\.cursor-plugin/ },
  { key: ".cursor/rules/", re: /\.cursor\/rules|always-applied rule/ },
  { key: "agent-transcripts", re: /agent-transcripts|\.cursor\/projects/ },
  // Upstream has one "Cursor-only features" key, which its section heading satisfies. Here each feature needs its own row.
  { key: "Bugbot", re: /Bugbot/ },
  { key: "Cursor Automations", re: /Cursor [Aa]utomation|cursor\.(sh|com)\/automations/ },
  { key: "cloud agents", re: /[Cc]loud [Aa]gent/ },
  { key: "built-in PR tool", re: /built-in PR tool/ },
];
// Cursor names that the Claude Code adapter leaves alone and T3 Code maps. Each key needs a row in the T3 adapter whose first cell holds it.
const T3_TERMS = [
  { key: "`/loop`", re: /\/loop\b/ },
  { key: "watch-pr", re: /watch-pr/ },
  { key: "Project worker", re: /Project worker/ },
  { key: "worker.md", re: /worker\.md/ },
  { key: "cursor-team-kit", re: /cursor-team-kit|\/deslop\b|\bcontrol-(ui|cli)\b/ },
  { key: "create-skill", re: /(?<![\w-])\/?create-skill\b/ },
  { key: "babysit skill", re: /built-in babysit|own skill for the same job/ },
  { key: "Custom Modes", re: /Custom Modes|Agents Window|Plan Mode/ },
  { key: "/add-plugin", re: /\/add-plugin|\/plugin (install|marketplace)/ },
  { key: "gemini-", re: /\bgemini-\d/ },
  { key: "`subagent_type`", re: /subagent_type/ },
  { key: "The active transcript", re: /\btranscript\b/ },
  { key: "SendToUser", re: /SendToUser/ },
  { key: "update_state", re: /update_state/ },
  { key: ".cursor/worktrees", re: /\.cursor\/worktrees|Application Support\/Cursor/ },
];
const ROUTE_KEY = "Run another pstack skill";
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LINE =
  `In T3 Code, read [the Claude Code adapter](../../${CLAUDE_ADAPTER}), then [the T3 adapter](../../${T3_ADAPTER}), ` +
  "once per session before you follow this skill.";

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (name === ".DS_Store" || name === "node_modules") return [];
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function file(path) {
  return { bytes: readFileSync(path), executable: (statSync(path).mode & 0o111) !== 0 };
}

const problems = [];
function fail(problem) {
  problems.push(problem);
}
function stopOnProblems() {
  for (const problem of problems) console.log(`FAIL ${problem}`);
  if (problems.length > 0) process.exit(1);
}

// Sources, keyed by their path from the repository root.
const sources = new Map(
  [...walk(SKILLS), ...walk(join(ROOT, "agents")), ...walk(join(ROOT, GUIDE)), join(ROOT, CLAUDE_ADAPTER), join(ROOT, T3_ADAPTER), join(ROOT, "README.md"), join(ROOT, "LICENSE")].map(
    (path) => [relative(ROOT, path), file(path)],
  ),
);

// A patch is a header saying why, then a unified diff of one upstream file (`--- a/<path>`, `+++ b/<path>`).
// Every hunk must match the upstream text exactly at its line, so a patch that drifts fails instead of fuzzing.
function applyPatch(name, patch) {
  const lines = patch.split("\n");
  const start = lines.findIndex((line) => line.startsWith("--- a/"));
  if (start < 0 || !lines[start + 1]?.startsWith("+++ b/")) return fail(`t3/patches/${name} has no --- a/ and +++ b/ lines`);
  if (start === 0 || !lines.slice(0, start).some((line) => line.trim())) return fail(`t3/patches/${name} has no header saying why`);
  const path = lines[start].slice(6);
  if (lines[start + 1].slice(6) !== path) return fail(`t3/patches/${name} patches two paths`);
  const entry = sources.get(path);
  if (!entry) return fail(`t3/patches/${name} patches ${path}, which is not a tree source`);
  const text = entry.bytes.toString("utf8");
  const target = text.split("\n");
  let offset = 0;
  let i = start + 2;
  while (i < lines.length) {
    const head = lines[i].match(/^@@ -(\d+)(?:,(\d+))? \+\d+(?:,\d+)? @@/);
    if (!head) {
      if (lines[i] === "") {
        i++;
        continue;
      }
      return fail(`t3/patches/${name} line ${i + 1} is not a hunk header`);
    }
    i++;
    const before = [];
    const after = [];
    while (i < lines.length && !lines[i].startsWith("@@")) {
      const line = lines[i];
      if (line.startsWith("\\")) {
        i++;
        continue;
      }
      if (line === "" && (i === lines.length - 1 || lines[i + 1]?.startsWith("@@"))) {
        i++;
        continue;
      }
      const [mark, rest] = [line[0], line.slice(1)];
      if (mark === " " || mark === "-") before.push(rest);
      if (mark === " " || mark === "+") after.push(rest);
      if (![" ", "-", "+"].includes(mark)) return fail(`t3/patches/${name} line ${i + 1} has no diff mark`);
      i++;
    }
    const at = Number(head[1]) - 1 + offset - (before.length === 0 ? -1 : 0);
    const found = target.slice(at, at + before.length);
    if (found.length !== before.length || found.some((line, k) => line !== before[k])) {
      return fail(`t3/patches/${name} no longer applies to ${path} at line ${head[1]}: upstream changed. Rework the patch.`);
    }
    target.splice(at, before.length, ...after);
    offset += after.length - before.length;
  }
  entry.bytes = Buffer.from(target.join("\n"));
  return path;
}

const patched = [];
if (existsSync(PATCHES)) {
  for (const name of readdirSync(PATCHES).filter((name) => name.endsWith(".patch")).sort()) {
    const path = applyPatch(name, readFileSync(join(PATCHES, name), "utf8"));
    if (path) patched.push(`${name} -> ${path}`);
  }
}
stopOnProblems();

const skills = readdirSync(SKILLS).filter((name) => existsSync(join(SKILLS, name, "SKILL.md")));

function textOf(path) {
  return sources.get(path).bytes.toString("utf8");
}

function classify(skill) {
  const prefix = `skills/${skill}/`;
  const others = skills.filter((name) => name !== skill).join("|");
  const route = new RegExp(`the \\*\\*(?<bold>${others})\\*\\* skill|\`/(?<command>${others})\``, "g");
  const linksToSkill = (line, name) => line.includes(`(../${name}/`);
  const namesBareSkill = (line) =>
    [...line.matchAll(route)].some(({ groups }) => !linksToSkill(line, groups.bold ?? groups.command));
  const usesCursorNames = new Set();
  for (const path of [...sources.keys()].filter((path) => path.startsWith(prefix) && path.endsWith(".md"))) {
    const text = textOf(path);
    for (const term of [...UPSTREAM_TERMS, ...T3_TERMS]) if (term.re.test(text)) usesCursorNames.add(term.key);
    if (text.split("\n").some(namesBareSkill)) usesCursorNames.add(ROUTE_KEY);
  }
  const wrap = usesCursorNames.size > 0 && /^# /m.test(textOf(`${prefix}SKILL.md`));
  return { usesCursorNames, wrap };
}

const classes = new Map(skills.map((skill) => [skill, classify(skill)]));
const users = new Map();
for (const [skill, { usesCursorNames, wrap }] of classes) {
  if (usesCursorNames.size > 0 && !wrap) fail(`skills/${skill}/SKILL.md uses Cursor names but has no H1`);
  for (const key of usesCursorNames) users.set(key, [...(users.get(key) ?? []), skill]);
  const frontmatter = textOf(`skills/${skill}/SKILL.md`).match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  const name = frontmatter.match(/^name:(.*)$/m)?.[1].trim().replace(/^(["'])(.*)\1$/, "$2");
  if (name !== skill) fail(`skills/${skill}/SKILL.md has name ${JSON.stringify(name ?? "")}, not its folder name ${skill}`);
  if (!SKILL_NAME.test(skill) || skill.length > 64) fail(`skills/${skill} is not lowercase words joined by hyphens, at most 64 characters`);
}
// The first cells of an adapter's mapping rows. Prose, headings, fenced code and the other cells never count as a row.
function rowKeys(text) {
  let fence = null;
  const outside = text.split("\n").filter((line) => {
    // CommonMark: a fence has at most three leading spaces. A line indented four or more is content.
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = null;
      return false;
    }
    if (marker) {
      fence = marker[1];
      return false;
    }
    return true;
  });
  return outside
    .filter((line) => line.startsWith("|") && !/^\|\s*-{3}/.test(line))
    .map((line) => line.split("|")[1].trim())
    .filter((cell) => cell !== "Cursor");
}
const claudeRows = rowKeys(textOf(CLAUDE_ADAPTER));
const t3Rows = rowKeys(textOf(T3_ADAPTER));
const hasRow = (rows, key) => rows.some((cell) => cell.includes(key));
const t3Keys = new Set(T3_TERMS.map(({ key }) => key));
for (const [key, using] of users) {
  if (t3Keys.has(key)) {
    if (!hasRow(t3Rows, key)) fail(`T3 adapter has no row for ${key}, used by ${using.join(", ")}`);
  } else if (!hasRow(claudeRows, key) && !hasRow(t3Rows, key)) {
    fail(`neither adapter has a row for ${key}, used by ${using.join(", ")}`);
  }
}
stopOnProblems();

// The repository-relative path that a relative link in `from` points at, if that path exists upstream.
function resolve(from, href) {
  const target = href.replace(/[#?].*/, "");
  if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target)) return undefined;
  const path = posix.join(posix.dirname(from), target).replace(/\/$/, "");
  return existsSync(join(ROOT, path)) ? path : undefined;
}

function has(files, path) {
  return files.has(path) || [...files.keys()].some((key) => key.startsWith(`${path}/`));
}

for (const [skill, { wrap }] of classes) {
  const entry = sources.get(`skills/${skill}/SKILL.md`);
  if (wrap) entry.bytes = Buffer.from(entry.bytes.toString("utf8").replace(/^(# .*)\n+/m, `$1\n\n${LINE}\n\n`));
}
// A relative link to an upstream file the tree leaves out points at that file in cursor/plugins at the upstream base commit.
const rewritten = [];
for (const [path, entry] of sources) {
  if (!path.endsWith(".md")) continue;
  const text = entry.bytes.toString("utf8").replace(LINK, (link, href) => {
    const target = resolve(path, href);
    if (!target || target.split("/")[0] === ".." || has(sources, target)) return link;
    if (target.startsWith("t3/") || target.startsWith("harness/")) return link;
    const kind = statSync(join(ROOT, target)).isDirectory() ? "tree" : "blob";
    const url = `${GITHUB}/${kind}/${UPSTREAM_COMMIT}/pstack/${target}${href.slice(href.search(/[#?]|$/))}`;
    rewritten.push(`- \`${path}\`: \`${href}\` -> ${url}`);
    return `](${url})`;
  });
  entry.bytes = Buffer.from(text);
}

// t3/install.sh installs only the tree, so a relative link that works from the repository root has to work inside it too.
const generated = `${README}
Upstream base: cursor/plugins \`${UPSTREAM_COMMIT}\` (from \`t3/UPSTREAM\`).

## Rewritten links

${rewritten.length > 0 ? rewritten.join("\n") : "None."}
`;
const rendered = new Map([["GENERATED.md", { bytes: Buffer.from(generated), executable: false }]]);
for (const [path, entry] of sources) {
  rendered.set(path, entry);
  if (!path.endsWith(".md")) continue;
  for (const [, href] of entry.bytes.toString("utf8").matchAll(LINK)) {
    const target = resolve(path, href);
    if (target && !has(sources, target)) fail(`harness/t3/${path} links to ${href}, which is not in the tree`);
  }
}
stopOnProblems();

const out = relative(ROOT, OUT);
if (process.argv.includes("--check")) {
  const onDisk = new Map(existsSync(OUT) ? walk(OUT).map((path) => [relative(OUT, path), file(path)]) : []);
  const drifted = [...new Set([...rendered.keys(), ...onDisk.keys()])].sort().filter((path) => {
    const [want, have] = [rendered.get(path), onDisk.get(path)];
    return !want || !have || !want.bytes.equals(have.bytes) || want.executable !== have.executable;
  });
  for (const path of drifted.slice(0, 20)) console.log(`${out}/${path}`);
  if (drifted.length > 0) {
    console.log(`${out} is out of date. Run \`${COMMAND}\` and commit the result.`);
    process.exit(1);
  }
  console.log(`${out} is up to date. ${skills.length} skills, ${patched.length} patches.`);
} else {
  rmSync(OUT, { recursive: true, force: true });
  for (const [path, { bytes, executable }] of rendered) {
    mkdirSync(dirname(join(OUT, path)), { recursive: true });
    writeFileSync(join(OUT, path), bytes);
    chmodSync(join(OUT, path), executable ? 0o755 : 0o644);
  }
  const wrapped = [...classes.values()].filter(({ wrap }) => wrap).length;
  console.log(`${skills.length} skills, ${wrapped} SKILL.md files with the adapter line, ${patched.length} patches`);
  for (const line of patched) console.log(`  patched ${line}`);
}
