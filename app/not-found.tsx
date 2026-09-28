import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-32 text-center">
      <FileQuestion aria-hidden className="size-10 text-subtle" />
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">Note not found</h1>
      <p className="mt-3 text-muted">
        There&apos;s no note at this address. It may have been renamed, or it hasn&apos;t been written yet.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg border border-border bg-elevated px-4 py-2 text-sm transition-colors hover:border-border-strong hover:text-accent"
      >
        Back to the library
      </Link>
    </div>
  );
}
