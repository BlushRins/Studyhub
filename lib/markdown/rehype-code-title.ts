import type { Element, Root } from "hast";
import { visit } from "unist-util-visit";

const isElement = (node: unknown): node is Element =>
  typeof node === "object" && node !== null && (node as Element).type === "element";

/**
 * rehype-pretty-code renders a fence's `title="…"` as a <figcaption> sibling of
 * the <pre>. Move it onto the <pre> as `data-title` so <CodeBlock> can show it
 * in its own header.
 */
export default function rehypeCodeTitle() {
  return (tree: Root) => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "figure" || !("data-rehype-pretty-code-figure" in node.properties)) return;

      const titleIndex = node.children.findIndex(
        (child) => isElement(child) && "data-rehype-pretty-code-title" in child.properties,
      );
      if (titleIndex === -1) return;

      const title = node.children[titleIndex] as Element;
      const pre = node.children.find((child) => isElement(child) && child.tagName === "pre");
      if (isElement(pre)) {
        pre.properties["data-title"] = title.children
          .map((child) => (child.type === "text" ? child.value : ""))
          .join("");
      }
      node.children.splice(titleIndex, 1);
    });
  };
}
