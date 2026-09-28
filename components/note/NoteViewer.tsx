import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { MarkdownAsync, type Components, type ExtraProps } from "react-markdown";
import rehypePrettyCode, { type Options as PrettyCodeOptions } from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import type { Element } from "hast";
import { ArrowUpRight, Hash } from "lucide-react";
import rehypeCodeTitle from "@/lib/markdown/rehype-code-title";
import remarkCallouts from "@/lib/markdown/remark-callouts";
import remarkMermaid from "@/lib/markdown/remark-mermaid";
import remarkWikiLink from "@/lib/markdown/remark-wiki-link";
import { getNotePreview, resolveWikiTarget } from "@/lib/notes";
import { cx } from "@/lib/utils";
import Callout from "./Callout";
import CodeBlock from "./CodeBlock";
import DiagramViewer from "./DiagramViewer";
import ImageLightbox from "./ImageLightbox";
import WikiLink from "./WikiLink";

const prettyCodeOptions: PrettyCodeOptions = {
  theme: "tokyo-night",
  keepBackground: false, // the app's --code-bg token owns the background
  bypassInlineCode: true,
  defaultLang: { block: "plaintext" },
};

/** Read a data-* attribute react-markdown passed through as a prop. */
function dataAttr(props: object, name: string): string | undefined {
  const value = (props as Record<string, unknown>)[name];
  return typeof value === "string" ? value : undefined;
}

/**
 * Notes reference images relative to content/ (e.g. `assets/heap.svg`), which
 * is what Obsidian resolves too. The app serves content/assets at /content/assets.
 */
function resolveImageSrc(src: string) {
  if (/^([a-z]+:|\/)/i.test(src)) return src;
  return `/content/${src.replace(/^\.\//, "")}`;
}

/** A paragraph that holds nothing but images (and whitespace). */
function isImageOnly(node: Element | undefined) {
  return (
    !!node &&
    node.children.length > 0 &&
    node.children.every(
      (child) =>
        (child.type === "element" && child.tagName === "img") ||
        (child.type === "text" && child.value.trim() === ""),
    )
  );
}

function Heading({
  as: Tag,
  id,
  children,
  node,
  ...props
}: ComponentPropsWithoutRef<"h2"> & ExtraProps & { as: "h2" | "h3" }) {
  return (
    <Tag id={id} className="group/heading relative" {...props}>
      {children}
      {id && (
        <a
          href={`#${id}`}
          aria-label="Link to this section"
          className="ml-2 inline-flex translate-y-[1px] align-middle text-subtle no-underline opacity-0 transition-opacity group-hover/heading:opacity-100 focus-visible:opacity-100 hover:text-accent"
        >
          <Hash aria-hidden className="size-[0.8em]" />
        </a>
      )}
    </Tag>
  );
}

// Every override drops the `node` prop before handing props to a client
// component, so hast trees don't get serialised into the RSC payload.
const components: Components = {
  pre({ node, children, style, ...props }) {
    return (
      <CodeBlock language={dataAttr(props, "data-language")} title={dataAttr(props, "data-title")} style={style}>
        {children}
      </CodeBlock>
    );
  },

  figure({ node, className, ...props }) {
    const isCode = dataAttr(props, "data-rehype-pretty-code-figure") !== undefined;
    return <figure className={cx(className, isCode && "not-prose my-7")} {...props} />;
  },

  div({ node, ...props }) {
    const chart = dataAttr(props, "data-chart");
    if (chart !== undefined) return <DiagramViewer chart={chart} />;
    return <div {...props} />;
  },

  img({ src, alt, title }) {
    if (typeof src !== "string") return null;
    return <ImageLightbox src={resolveImageSrc(src)} alt={alt ?? ""} caption={title ?? undefined} />;
  },

  p({ node, children, ...props }) {
    // <figure> can't live inside <p>; unwrap image-only paragraphs.
    if (isImageOnly(node)) return <>{children}</>;
    return <p {...props}>{children}</p>;
  },

  a({ node, href = "", children, ...props }) {
    const wikiSlug = dataAttr(props, "data-wikilink");
    if (wikiSlug) {
      const preview = getNotePreview(wikiSlug);
      if (preview) {
        return (
          <WikiLink href={href} preview={preview}>
            {children}
          </WikiLink>
        );
      }
    }

    const missing = dataAttr(props, "data-wikilink-missing");
    if (missing !== undefined) {
      return (
        <span className="wikilink wikilink--missing" title={`"${missing}" hasn't been written yet`}>
          {children}
        </span>
      );
    }

    if (/^https?:\/\//.test(href)) {
      return (
        <a href={href} target="_blank" rel="noreferrer" {...props}>
          {children}
          <ArrowUpRight aria-hidden className="ml-0.5 inline size-3.5 align-baseline" />
        </a>
      );
    }

    if (href.startsWith("/")) {
      return (
        <Link href={href} {...props}>
          {children}
        </Link>
      );
    }

    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },

  blockquote({ node, children, ...props }) {
    const type = dataAttr(props, "data-callout");
    if (type === undefined) return <blockquote {...props}>{children}</blockquote>;
    return (
      <Callout type={type} title={dataAttr(props, "data-callout-title")} fold={dataAttr(props, "data-callout-fold")}>
        {children}
      </Callout>
    );
  },

  h2: (props) => <Heading as="h2" {...props} />,
  h3: (props) => <Heading as="h3" {...props} />,

  table({ node, ...props }) {
    return (
      <div className="table-scroll">
        <table {...props} />
      </div>
    );
  },
};

export default async function NoteViewer({ content }: { content: string }) {
  return (
    <div className="note-prose prose prose-invert max-w-none">
      <MarkdownAsync
        remarkPlugins={[remarkGfm, remarkCallouts, remarkMermaid, [remarkWikiLink, { resolve: resolveWikiTarget }]]}
        rehypePlugins={[rehypeSlug, [rehypePrettyCode, prettyCodeOptions], rehypeCodeTitle]}
        components={components}
      >
        {content}
      </MarkdownAsync>
    </div>
  );
}
