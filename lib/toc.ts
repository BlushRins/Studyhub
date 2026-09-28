import GithubSlugger from "github-slugger";
import { fromMarkdown } from "mdast-util-from-markdown";
import { toString } from "mdast-util-to-string";
import { visit } from "unist-util-visit";
import type { TocHeading } from "@/lib/types";

/**
 * Pull h2/h3 headings out of a note for the table of contents.
 *
 * Every heading is slugged in document order with one slugger — the same
 * algorithm rehype-slug uses — so ids (including `-1` duplicate suffixes)
 * match the rendered article.
 */
export function extractHeadings(markdown: string): TocHeading[] {
  const slugger = new GithubSlugger();
  const headings: TocHeading[] = [];

  visit(fromMarkdown(markdown), "heading", (node) => {
    const text = toString(node);
    const id = slugger.slug(text);
    if (node.depth === 2 || node.depth === 3) {
      headings.push({ id, text, depth: node.depth });
    }
  });

  return headings;
}
