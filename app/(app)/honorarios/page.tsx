import { redirect } from "next/navigation";

// Honorários agora vive dentro de Gestão PJ (aba "Honorários").
export default function HonorariosPage() {
  redirect("/gestao-pj");
}
