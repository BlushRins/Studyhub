import type { Paragraph, Root } from "mdast";
import { visit } from "unist-util-visit";

/**
 * Replaces ```mermaid fences with an empty `<div data-chart="…">` before the
 * syntax highlighter runs, so the renderer can mount <DiagramViewer> instead
 * of a highlighted code block.
 */
export default function remarkMermaid() {
  return (tree: Root) => {
    visit(tree, "code", (node, index, parent) => {
      if (node.lang !== "mermaid" || !parent || index === undefined) return;

      const placeholder: Paragraph = {
        type: "paragraph",
        children: [],
        data: { hName: "div", hProperties: { dataChart: node.value } },
      };
      parent.children.splice(index, 1, placeholder);
    });
  };
}
