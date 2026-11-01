/** Lê consultas paginadas sem truncar totalizações após o limite padrão da API. */
export async function consultarTodasPaginas<T>(
  consultar: (inicio:number,fim:number)=>PromiseLike<{data:T[]|null;error:{message:string}|null}>,
  tamanhoPagina=500,
):Promise<T[]> {
  const registros:T[]=[];
  for(let inicio=0;inicio<1000000;inicio+=tamanhoPagina){
    const {data,error:erro}=await consultar(inicio,inicio+tamanhoPagina-1);
    if(erro)throw new Error(`Consulta paginada: ${erro.message}`);
    registros.push(...(data??[]));
    if((data?.length??0)<tamanhoPagina)return registros;
  }
  throw new Error('Consulta excedeu o limite de segurança. Use um intervalo menor.');
}
