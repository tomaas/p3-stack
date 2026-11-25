import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SKILLS = readdirSync(join(ROOT, "harness/t3/skills")).filter((name) => existsSync(join(ROOT, "harness/t3/skills", name, "SKILL.md")));
const LINE = "In T3 Code, read [the Claude Code adapter](../../docs/harness/claude-code.md), then [the T3 adapter](../../docs/harness/t3.md)";
const temps = [];
after(() => temps.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

function tempHome() {
  const dir = mkdtempSync(join(tmpdir(), "pstack-t3-home-"));
  temps.push(dir);
  return dir;
}

function install(home, ...args) {
  const run = spawnSync("bash", [join(ROOT, "t3/install.sh"), ...args], { encoding: "utf8", env: { ...process.env, HOME: home } });
  return { status: run.status, output: run.stdout + run.stderr };
}

describe("t3/install.sh", () => {
  it("changes nothing with --dry-run", () => {
    const home = tempHome();
    const run = install(home, "--dry-run");
    assert.equal(run.status, 0, run.output);
    assert.match(run.output, new RegExp(`would link ${SKILLS.length} skills into ${home}/\\.claude/skills`));
    assert.deepEqual(readdirSync(home), []);
  });

  it("links every skill into both folders, and the installed poteto-mode shows the adapter line", () => {
    const home = tempHome();
    const run = install(home);
    assert.equal(run.status, 0, run.output);
    for (const folder of [".claude/skills", ".agents/skills"]) {
      assert.match(run.output, new RegExp(`linked ${SKILLS.length} skills into ${home}/${folder.replace(".", "\\.")} \\(0 already linked, 0 kept\\)`));
      assert.deepEqual(readdirSync(join(home, folder)).sort(), [...SKILLS].sort());
      assert.ok(lstatSync(join(home, folder, "poteto-mode")).isSymbolicLink());
      assert.ok(readFileSync(join(home, folder, "poteto-mode/SKILL.md"), "utf8").includes(LINE));
    }
  });

  it("is idempotent", () => {
    const home = tempHome();
    install(home);
    const run = install(home);
    assert.equal(run.status, 0, run.output);
    assert.match(run.output, new RegExp(`linked 0 skills into .* \\(${SKILLS.length} already linked, 0 kept\\)`));
  });

  it("keeps and reports an entry that already has a skill's name", () => {
    const home = tempHome();
    mkdirSync(join(home, ".claude/skills/how"), { recursive: true });
    writeFileSync(join(home, ".claude/skills/how/SKILL.md"), "mine\n");
    const run = install(home);
    assert.equal(run.status, 0, run.output);
    assert.match(run.output, /keep how \(.*\/\.claude\/skills\/how exists and is not a link\)/);
    assert.equal(readFileSync(join(home, ".claude/skills/how/SKILL.md"), "utf8"), "mine\n");
    assert.ok(lstatSync(join(home, ".agents/skills/how")).isSymbolicLink());
  });

  it("installs into a project with --project", () => {
    const home = tempHome();
    const project = tempHome();
    const run = install(home, "--project", project);
    assert.equal(run.status, 0, run.output);
    assert.ok(readFileSync(join(project, ".agents/skills/poteto-mode/SKILL.md"), "utf8").includes(LINE));
    assert.ok(existsSync(join(project, ".claude/skills/setup-pstack/SKILL.md")));
    assert.deepEqual(readdirSync(home), []);
  });
});
