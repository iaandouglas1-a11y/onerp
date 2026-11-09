import { redirect } from "next/navigation";

// Acessos de clientes agora vive dentro de Gestão PJ (aba "Acessos clientes").
export default function ClientesPage() {
  redirect("/gestao-pj?aba=clientes");
}
