import { redirect } from 'next/navigation';
export default async function EditarLancamento({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  redirect(`/fiscal/faturamento?editar=${encodeURIComponent(id)}`);
}
