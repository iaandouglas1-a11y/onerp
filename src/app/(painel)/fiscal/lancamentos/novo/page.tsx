import { redirect } from 'next/navigation';
export default async function NovoLancamento({searchParams}:{searchParams:Promise<{cliente?:string}>}) {
  const {cliente}=await searchParams;
  redirect(`/fiscal/faturamento?novo=1${cliente?`&cliente=${encodeURIComponent(cliente)}`:''}`);
}
