import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { noteSlugFromPath } from "../lib/utils";

test("validates metadata and resolves backlinks through rendered wikilinks", async (t) => {
  const previous = process.cwd();
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "studyhub-notes-"));
  t.after(() => {
    process.chdir(previous);
    fs.rmSync(root, { recursive: true });
  });
  process.chdir(root);
  fs.mkdirSync("content");
  const write = (name: string, frontmatter: string, body: string) => {
    fs.writeFileSync(path.join("content", name), `---\nlevel: basic\nsummary: Example\n${frontmatter}\n---\n${body}\n`);
  };
  write("File Name.md", "title: Display Title\ncategory: foundations\nstep: 1", "Target");
  write("Source.md", "category: foundations\nstep: 2", "[[File Name]] twice [[Display Title]]");
  write("Code.md", "category: foundations\nstep: 3", "`[[File Name]]`\n\n~~~txt\n[[File Name]]\n~~~");

  const { getAllNotes, getBacklinks, resolveWikiTarget } = await import("../lib/notes");
  assert.equal(resolveWikiTarget("file name"), "display-title");
  assert.deepEqual(getBacklinks("display-title").map(({ slug }) => slug), ["source"]);
  write("Invalid.md", "category: lectures\ndate: 2026-02-30", "Lecture");
  assert.throws(getAllNotes, /valid.*YYYY-MM-DD/);
  write("Invalid.md", "category: foundations\nstep: 3.5", "Fractional lesson");
  assert.throws(getAllNotes, /positive integer/);
});

test("extracts only a single valid note slug", () => {
  assert.equal(noteSlugFromPath("/notes/an-adt/"), "an-adt");
  assert.equal(noteSlugFromPath("/notes/invalid%"), null);
  assert.equal(noteSlugFromPath("/notes/nested%2Ffile"), null);
});
