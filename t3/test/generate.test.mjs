import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const temps = [];
after(() => temps.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

function copyRepo() {
  const dir = mkdtempSync(join(tmpdir(), "pstack-t3-gen-"));
  temps.push(dir);
  for (const name of readdirSync(ROOT).filter((name) => name !== ".git")) {
    cpSync(join(ROOT, name), join(dir, name), { recursive: true, filter: (src) => !src.includes("node_modules") });
  }
  return dir;
}

function generate(dir, ...args) {
  const run = spawnSync(process.execPath, [join(dir, "t3", "generate.mjs"), ...args], { encoding: "utf8" });
  return { status: run.status, output: run.stdout + run.stderr };
}

describe("t3/generate.mjs", () => {
  it("passes --check on the committed tree", () => {
    const run = generate(copyRepo(), "--check");
    assert.equal(run.status, 0, run.output);
    assert.match(run.output, /is up to date/);
  });

  it("fails --check when the tree is stale", () => {
    const dir = copyRepo();
    writeFileSync(join(dir, "harness/t3/skills/how/SKILL.md"), "edited by hand\n");
    const run = generate(dir, "--check");
    assert.equal(run.status, 1);
    assert.match(run.output, /harness\/t3\/skills\/how\/SKILL\.md/);
    assert.match(run.output, /out of date/);
  });

  it("fails when a Cursor name a skill uses has no row in the T3 adapter", () => {
    const dir = copyRepo();
    const path = join(dir, "docs/harness/t3.md");
    writeFileSync(path, readFileSync(path, "utf8").replaceAll("watch-pr", "the PR watcher script"));
    const run = generate(dir, "--check");
    assert.equal(run.status, 1);
    assert.match(run.output, /FAIL T3 adapter has no row for watch-pr, used by poteto-mode/);
  });

  it("fails when a Cursor name appears in the T3 adapter only in prose, not in a row's first cell", () => {
    const dir = copyRepo();
    const path = join(dir, "docs/harness/t3.md");
    const text = readFileSync(path, "utf8").replace("| `scripts/watch-pr/watch-pr` |", "| The PR watcher script |");
    writeFileSync(path, `${text}\nThe PR watcher script is \`watch-pr\`.\n`);
    const run = generate(dir, "--check");
    assert.equal(run.status, 1);
    assert.match(run.output, /FAIL T3 adapter has no row for watch-pr, used by poteto-mode/);
  });

  it("fails when the T3 adapter has no update_state row", () => {
    const dir = copyRepo();
    const path = join(dir, "docs/harness/t3.md");
    const text = readFileSync(path, "utf8");
    assert.ok(text.includes("`update_state` routine calls, "));
    writeFileSync(path, text.replace("`update_state` routine calls, ", ""));
    const run = generate(dir, "--check");
    assert.equal(run.status, 1);
    assert.match(run.output, /FAIL T3 adapter has no row for update_state, used by make-bot-ui/);
  });

  it("fails when an upstream Cursor name sits only under a heading", () => {
    const dir = copyRepo();
    for (const name of ["claude-code.md", "t3.md"]) {
      const path = join(dir, "docs/harness", name);
      const text = readFileSync(path, "utf8").replace(/^\| (A |Cursor )?[Cc]loud agents? .*\n/gm, "");
      writeFileSync(path, `${text}\n## Cursor cloud agents\n`);
    }
    const run = generate(dir, "--check");
    assert.equal(run.status, 1);
    assert.match(run.output, /FAIL neither adapter has a row for cloud agents/);
  });

  it("pins every rewritten link to the upstream base commit and lists it in GENERATED.md", () => {
    const dir = copyRepo();
    const sha = readFileSync(join(dir, "t3/UPSTREAM"), "utf8").trim();
    const generated = readFileSync(join(dir, "harness/t3/GENERATED.md"), "utf8");
    for (const path of ["README.md", "docs/guide/07-overnight.md"]) {
      const text = readFileSync(join(dir, "harness/t3", path), "utf8");
      const onMain = (body) => body.match(/github\.com\/cursor\/plugins\/(blob|tree)\/main\//g)?.length ?? 0;
      assert.equal(onMain(text), onMain(readFileSync(join(dir, path), "utf8")), `${path} gained a link to main`);
      const urls = [...text.matchAll(/https:\/\/github\.com\/cursor\/plugins\/(?:blob|tree)\/([0-9a-f]+)\/pstack\/[^)\s]+/g)];
      assert.ok(urls.length > 0, path);
      for (const [url, commit] of urls) {
        assert.equal(commit, sha);
        assert.ok(generated.includes(url), `${url} is not listed in GENERATED.md`);
      }
    }
  });

  it("fails when an upstream Cursor name has a row in neither adapter", () => {
    const dir = copyRepo();
    for (const name of ["claude-code.md", "t3.md"]) {
      const path = join(dir, "docs/harness", name);
      writeFileSync(path, readFileSync(path, "utf8").replaceAll("cloud_base_branch", "the base branch field"));
    }
    const run = generate(dir, "--check");
    assert.equal(run.status, 1);
    assert.match(run.output, /FAIL neither adapter has a row for cloud_base_branch/);
  });

  it("fails when a patch no longer applies", () => {
    const dir = copyRepo();
    mkdirSync(join(dir, "t3/patches"), { recursive: true });
    writeFileSync(
      join(dir, "t3/patches/99-drift.patch"),
      "Why: a test patch whose context is not in upstream.\n--- a/skills/how/SKILL.md\n+++ b/skills/how/SKILL.md\n@@ -1,1 +1,1 @@\n-this line is not in the file\n+replacement\n",
    );
    const run = generate(dir, "--check");
    assert.equal(run.status, 1);
    assert.match(run.output, /FAIL t3\/patches\/99-drift\.patch no longer applies to skills\/how\/SKILL\.md/);
  });

  it("fails when a patch has no header saying why", () => {
    const dir = copyRepo();
    mkdirSync(join(dir, "t3/patches"), { recursive: true });
    writeFileSync(join(dir, "t3/patches/98-bare.patch"), "--- a/skills/how/SKILL.md\n+++ b/skills/how/SKILL.md\n@@ -1,1 +1,1 @@\n----\n+---\n");
    const run = generate(dir, "--check");
    assert.equal(run.status, 1);
    assert.match(run.output, /has no header saying why/);
  });

  it("regenerates the same bytes", () => {
    const dir = copyRepo();
    assert.equal(generate(dir).status, 0);
    const run = generate(dir, "--check");
    assert.equal(run.status, 0, run.output);
  });
});
