import { notFound, redirect } from "next/navigation";
import { getAllNotes } from "@/lib/notes";

export default function Home() {
  const first = getAllNotes()[0];
  if (!first) notFound();
  redirect(`/notes/${first.slug}`);
}
