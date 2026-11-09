import { notFound } from "next/navigation";
import { getNota } from "@/lib/queries";
import NotaEditorBody from "./NotaEditorBody";

export default async function NotaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let nota;
  try {
    nota = await getNota(id);
  } catch {
    notFound();
  }
  if (!nota) notFound();

  return <NotaEditorBody nota={nota} />;
}
