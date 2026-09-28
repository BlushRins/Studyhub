import fs from "node:fs";
import path from "node:path";
import { CONTENT_DIR } from "@/lib/notes";

// Serves images that notes reference relatively (content/assets/…), so the same
// Markdown renders in Obsidian and in the app. Prerendered at build time.

const ASSETS_DIR = path.join(CONTENT_DIR, "assets");
const TYPES: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export const dynamicParams = false;

export function generateStaticParams() {
  if (!fs.existsSync(ASSETS_DIR)) return [];
  return fs
    .readdirSync(ASSETS_DIR)
    .filter((file) => path.extname(file).toLowerCase() in TYPES)
    .map((file) => ({ path: ["assets", file] }));
}

export async function GET(_request: Request, { params }: RouteContext<"/content/[...path]">) {
  const segments = (await params).path;
  const file = path.resolve(CONTENT_DIR, ...segments);
  const type = TYPES[path.extname(file).toLowerCase()];

  // Only files inside content/assets with an allowed image type.
  if (!file.startsWith(ASSETS_DIR + path.sep) || !type || !fs.existsSync(file)) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(fs.readFileSync(file), {
    headers: { "Content-Type": type, "Cache-Control": "public, max-age=3600" },
  });
}
