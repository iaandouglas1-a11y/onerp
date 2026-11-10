import { redirect } from 'next/navigation';
export default async function EditarCliente({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  redirect(`/societario/clientes/${encodeURIComponent(id)}?editar=cadastro`);
}
