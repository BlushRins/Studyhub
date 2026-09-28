import type { Link, Root } from "mdast";
import { findAndReplace } from "mdast-util-find-and-replace";
import { slug as slugify } from "github-slugger";

/**
 * Obsidian wikilink syntax: [[Target]], [[Target|alias]], [[Target#Heading]],
 * [[Target#Heading|alias]]. Groups: 1 target, 2 heading, 3 alias.
 */
export const WIKI_LINK_RE = /\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;

export interface WikiLinkOptions {
  /** Map a link target (note title or slug) to a slug, or null if no such note exists. */
  resolve: (target: string) => string | null;
}

/**
 * Turns wikilinks into mdast links. Resolved links carry `data-wikilink="<slug>"`,
 * unresolved ones `data-wikilink-missing="<target>"`, so the renderer can swap in
 * the hover-card component or a dimmed placeholder.
 */
export default function remarkWikiLink({ resolve }: WikiLinkOptions) {
  return (tree: Root) => {
    findAndReplace(tree, [
      WIKI_LINK_RE,
      (_match: string, target: string, heading?: string, alias?: string) => {
        const name = target.trim();
        const section = heading?.trim();
        const slug = resolve(name);
        const label = alias?.trim() || (section ? `${name} › ${section}` : name);

        const link: Link = {
          type: "link",
          url: slug ? `/notes/${slug}${section ? `#${slugify(section)}` : ""}` : "#",
          children: [{ type: "text", value: label }],
          data: {
            hProperties: slug ? { dataWikilink: slug } : { dataWikilinkMissing: name },
          },
        };
        return link;
      },
    ]);
  };
}
