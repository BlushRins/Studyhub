import type { Blockquote, Root } from "mdast";
import { visit } from "unist-util-visit";

/** `[!type]`, optional fold marker (+ open / - closed), optional title. */
const CALLOUT_RE = /^\[!([A-Za-z-]+)\]([+-])?[ \t]*([^\n]*)\n?/;

/**
 * Obsidian callouts:
 *
 *   > [!tip] Optional title
 *   > Body…
 *
 *   > [!hint]- Folded until clicked
 *   > Body…
 *
 * The blockquote gets `data-callout`, `data-callout-title` and
 * `data-callout-fold` properties so the renderer can swap in <Callout>.
 * Plain blockquotes are left alone.
 */
export default function remarkCallouts() {
  return (tree: Root) => {
    visit(tree, "blockquote", (node: Blockquote) => {
      const first = node.children[0];
      if (first?.type !== "paragraph") return;
      const text = first.children[0];
      if (text?.type !== "text") return;

      const match = text.value.match(CALLOUT_RE);
      if (!match) return;
      const [marker, type, fold, title] = match;

      text.value = text.value.slice(marker.length);
      if (text.value === "") first.children.shift();
      // A line break right after the marker line leaves a leading `break` node.
      if (first.children[0]?.type === "break") first.children.shift();
      if (first.children.length === 0) node.children.shift();

      node.data = {
        ...node.data,
        hProperties: {
          dataCallout: type.toLowerCase(),
          dataCalloutTitle: title.trim(),
          dataCalloutFold: fold ?? "",
        },
      };
    });
  };
}
