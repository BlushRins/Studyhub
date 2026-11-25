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

function assetPaths(directory: string, segments: string[]): { path: string[] }[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const parts = [...segments, entry.name];
    if (entry.isDirectory()) return assetPaths(path.join(directory, entry.name), parts);
    return entry.isFile() && Object.hasOwn(TYPES, path.extname(entry.name).toLowerCase())
      ? [{ path: parts }] : [];
  });
}

export function generateStaticParams() {
  return fs.existsSync(ASSETS_DIR) ? assetPaths(ASSETS_DIR, ["assets"]) : [];
}

export async function GET(_request: Request, { params }: RouteContext<"/content/[...path]">) {
  const segments = (await params).path;
  const file = path.resolve(CONTENT_DIR, ...segments);
  const type = TYPES[path.extname(file).toLowerCase()];

  if (!file.startsWith(ASSETS_DIR + path.sep) || !type) {
    return new Response("Not found", { status: 404 });
  }

  let asset: string;
  try {
    asset = fs.realpathSync(file);
    if (!asset.startsWith(fs.realpathSync(ASSETS_DIR) + path.sep) || !fs.statSync(asset).isFile()) {
      return new Response("Not found", { status: 404 });
    }
  } catch {
    return new Response("Not found", { status: 404 });
  }
  const headers = new Headers({
    "Content-Type": type, "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff",
  });
  if (type === "image/svg+xml") headers.set("Content-Security-Policy", "sandbox; script-src 'none'; object-src 'none'");
  return new Response(fs.readFileSync(asset), { headers });
}
