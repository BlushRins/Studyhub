"use client";

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import { cx } from "@/lib/utils";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const STEP = 0.5;

const clamp = (value: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));

interface DragState {
  x: number;
  y: number;
  ox: number;
  oy: number;
  moved: boolean;
  onStage: boolean;
}

interface ZoomDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Full-screen viewer shared by images and diagrams. Native <dialog> gives us
 * the focus trap, Esc-to-close, and top-layer stacking for free.
 */
export default function ZoomDialog({ open, onClose, title, children }: ZoomDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const drag = useRef<DragState | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    dialog.showModal();
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
      if (dialog.open) dialog.close();
    };
  }, [open]);

  function zoomTo(next: number) {
    const clamped = clamp(next);
    setScale(clamped);
    if (clamped === 1) setOffset({ x: 0, y: 0 });
  }

  // Closing is driven by React state (the effect cleanup calls dialog.close()),
  // not by the native "close" event: that event is queued asynchronously and,
  // if it's missed, `open` stays true and the trigger can never reopen it.
  function requestClose() {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    onClose();
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      ox: offset.x,
      oy: offset.y,
      moved: false,
      onStage: event.target === event.currentTarget,
    };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || scale === 1) return;
    const dx = event.clientX - d.x;
    const dy = event.clientY - d.y;
    if (!d.moved && Math.abs(dx) + Math.abs(dy) > 3) {
      d.moved = true;
      setPanning(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (d.moved) setOffset({ x: d.ox + dx, y: d.oy + dy });
  }

  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    setPanning(false);
    // A plain click on the empty stage (not a pan, not the content) closes it.
    if (d && !d.moved && d.onStage) requestClose();
  }

  if (!open) return null;

  const toolButton =
    "inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-elevated hover:text-fg disabled:opacity-30 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-accent";

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      onCancel={(event) => {
        // Esc: close through state instead of letting the browser do it.
        event.preventDefault();
        requestClose();
      }}
      onClose={requestClose}
      onKeyDown={(event) => {
        if (event.key === "+" || event.key === "=") zoomTo(scale + STEP);
        if (event.key === "-") zoomTo(scale - STEP);
        if (event.key === "0") zoomTo(1);
      }}
      className="zoom-dialog m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-fg"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-1 border-b border-border bg-bg/80 px-3 py-2 backdrop-blur">
          <p className="min-w-0 flex-1 truncate px-2 text-sm text-muted">{title}</p>
          <button type="button" className={toolButton} onClick={() => zoomTo(scale - STEP)} disabled={scale <= MIN_SCALE} aria-label="Zoom out">
            <ZoomOut aria-hidden className="size-4" />
          </button>
          <span className="w-12 text-center font-mono text-xs tabular-nums text-subtle">{Math.round(scale * 100)}%</span>
          <button type="button" className={toolButton} onClick={() => zoomTo(scale + STEP)} disabled={scale >= MAX_SCALE} aria-label="Zoom in">
            <ZoomIn aria-hidden className="size-4" />
          </button>
          <button type="button" className={toolButton} onClick={() => zoomTo(1)} disabled={scale === 1} aria-label="Reset zoom">
            <RotateCcw aria-hidden className="size-4" />
          </button>
          <span aria-hidden className="mx-1 h-5 w-px bg-border" />
          <button type="button" className={toolButton} onClick={requestClose} aria-label="Close">
            <X aria-hidden className="size-4" />
          </button>
        </div>

        <div
          className={cx(
            "relative flex flex-1 touch-none select-none items-center justify-center overflow-hidden p-6 sm:p-10",
            scale > 1 ? (panning ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in",
          )}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            drag.current = null;
            setPanning(false);
          }}
          onWheel={(event) => zoomTo(scale + (event.deltaY < 0 ? STEP / 2 : -STEP / 2))}
          onDoubleClick={() => zoomTo(scale === 1 ? 2 : 1)}
        >
          <div
            className={cx(
              "flex max-h-full max-w-full items-center justify-center",
              !panning && "transition-transform duration-150 ease-out",
            )}
            style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
          >
            {children}
          </div>
        </div>

        <p className="pb-3 text-center text-xs text-subtle">
          Scroll or double-click to zoom · drag to pan · Esc to close
        </p>
      </div>
    </dialog>
  );
}
