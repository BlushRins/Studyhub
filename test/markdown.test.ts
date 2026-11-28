import assert from "node:assert/strict";
import { test } from "node:test";
import { fromMarkdown } from "mdast-util-from-markdown";
import remarkCallouts from "../lib/markdown/remark-callouts";
import remarkMermaid from "../lib/markdown/remark-mermaid";
import remarkWikiLink from "../lib/markdown/remark-wiki-link";
import { extractHeadings } from "../lib/toc";

test("heading IDs reserve duplicates in document order", () => {
  const markdown = "# Example\n\n## Example\n\n### Example\n\n#### Other";
  assert.deepEqual(extractHeadings(markdown), [
    { id: "example-1", text: "Example", depth: 2 },
    { id: "example-2", text: "Example", depth: 3 },
  ]);
});

test("wikilink labels share the rendered heading's duplicate sequence", () => {
  const markdown = "## Comparing [[Closed Hashing|closed tables]]\n\n### Comparing closed tables";
  assert.deepEqual(extractHeadings(markdown), [
    { id: "comparing-closed-tables", text: "Comparing closed tables", depth: 2 },
    { id: "comparing-closed-tables-1", text: "Comparing closed tables", depth: 3 },
  ]);
});

test("callouts preserve their body and expose the fold marker", () => {
  const tree = fromMarkdown("> [!Tip]- Short title\n> Body.\n\n> Ordinary quote.");
  remarkCallouts()(tree);
  const [callout, quote] = tree.children;
  assert.deepEqual(callout.data?.hProperties, {
    dataCallout: "tip", dataCalloutTitle: "Short title", dataCalloutFold: "-",
  });
  assert.equal(callout.type, "blockquote");
  const line = callout.children[0];
  assert.equal(line.type, "paragraph");
  assert.equal(line.children[0].type, "text");
  assert.equal(line.children[0].value, "Body.");
  assert.equal(quote.data, undefined);
});

test("Mermaid becomes a chart placeholder and ordinary code remains a code block", () => {
  const tree = fromMarkdown("~~~mermaid\nflowchart LR\n~~~\n\n~~~c\nint x;\n~~~");
  remarkMermaid()(tree);
  assert.deepEqual(tree.children[0].data, { hName: "div", hProperties: { dataChart: "flowchart LR" } });
  assert.equal(tree.children[1].type, "code");
});

test("wikilinks retain labels and anchors while code spans stay literal", () => {
  const tree = fromMarkdown("[[Topic#Part Two|Read more]] `[[Topic]]`");
  remarkWikiLink({ resolve: (target) => target === "Topic" ? "topic" : null })(tree);
  const paragraph = tree.children[0];
  assert.equal(paragraph.type, "paragraph");
  const [link, , code] = paragraph.children;
  assert.equal(link.type, "link");
  assert.equal(link.url, "/notes/topic#part-two");
  assert.deepEqual(link.children, [{ type: "text", value: "Read more" }]);
  assert.equal(code.type, "inlineCode");
  assert.equal(code.value, "[[Topic]]");
});
