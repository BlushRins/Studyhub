"use client";

/* eslint-disable @next/next/no-img-element -- markdown images have unknown dimensions */

import { useState } from "react";
import { Maximize2 } from "lucide-react";
import ZoomDialog from "./ZoomDialog";

interface ImageLightboxProps {
  src: string;
  alt: string;
  caption?: string;
}

export default function ImageLightbox({ src, alt, caption }: ImageLightboxProps) {
  const [open, setOpen] = useState(false);
  const label = caption ?? alt;

  return (
    <figure className="not-prose my-8">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Expand image: ${alt}`}
        className="group/img relative block w-full cursor-zoom-in overflow-hidden rounded-xl border border-border bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-auto w-full transition-transform duration-300 group-hover/img:scale-[1.01]"
        />
        <span className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-bg/80 px-2 py-1 text-xs text-muted opacity-0 backdrop-blur transition-opacity group-hover/img:opacity-100 group-focus-visible/img:opacity-100">
          <Maximize2 aria-hidden className="size-3.5" />
          Expand
        </span>
      </button>
      {label && <figcaption className="mt-3 text-center text-sm text-subtle">{label}</figcaption>}

      <ZoomDialog open={open} onClose={() => setOpen(false)} title={label}>
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="max-h-[calc(100dvh-10rem)] max-w-full rounded-lg object-contain shadow-2xl"
        />
      </ZoomDialog>
    </figure>
  );
}
