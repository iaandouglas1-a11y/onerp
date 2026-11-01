/** Motor restrito a folha MENSAL integral CLT, com parametros versionados e homologados.
 * Não abrange férias, rescisão, 13º, trabalho doméstico, múltiplos vínculos,
 * licença/afastamento, teto compartilhado ou base reduzida por decisão judicial.
 */
export type TipoEventoFolha = 'PROVENTO' | 'DESCONTO' | 'INFORMATIVO';
export type EventoCalculado = {
  codigo: string; descricao: string; referencia: string;
  tipo: TipoEventoFolha; valor: number;
  incide_inss: boolean; incide_fgts: boolean; incide_irrf: boolean;
  reduz_base: boolean;
};
export type FaixaInss = { ate:number; aliquota:number };
export type FaixaIrrf = { ate:number; aliquota:number; deducao:number };
export type RegraInss = { faixas: FaixaInss[]; teto:number };
export type RegraIrrf = {faixas:FaixaIrrf[]; desconto_simplificado:number; deducao_dependente:number;
  reducao_integral_ate:number; reducao_progressiva_ate:number; reducao_constante:number; reducao_fator:number};
export type RegraFgts = { aliquota:number };
export type ParametrosFolha = { inss:RegraInss; irrf:RegraIrrf; fgts:RegraFgts;
 referencias:{INSS:string;IRRF:string;FGTS:string} };
export type MemoriaContracheque = {
  versao:'1'; competencia:string; empresa:{nome:string; cidade:string; cnpj:string};
  funcionario:{nome:string;codigo:string;cpf:string;cbo:string;cargo:string;salario_base:number};
  eventos: EventoCalculado[]; total_proventos:number; total_descontos:number; liquido:number;
  base_inss:number; base_fgts:number; deposito_fgts:number; base_irrf:number;
  aliquota_irrf:number; inss_desconto:number; irrf_desconto:number; dependentes_irrf:number;
  regras:{INSS:string;IRRF:string;FGTS:string};
};
export function arredondar(valor:number):number { return Math.round((valor + Math.sign(valor)*1e-9)*100)/100; }
export function conferirRegras(parametros:ParametrosFolha):void {
  for(const nome of ['inss','irrf'] as const){
    const faixas=parametros[nome]?.faixas;
    if(!Array.isArray(faixas)||!faixas.length||faixas.some(f=>!Number.isFinite(f.ate)||f.ate<=0||!Number.isFinite(f.aliquota)||f.aliquota<0||f.aliquota>1)||faixas.some((f,i)=>i>0&&f.ate<=faixas[i-1].ate))throw new Error(`Tabela ${nome.toUpperCase()} não está válida.`);
  }
  if(!Number.isFinite(parametros.inss.teto)||parametros.inss.teto!==parametros.inss.faixas.at(-1)?.ate)throw new Error('Teto INSS inconsistente.');
  if(!Number.isFinite(parametros.fgts.aliquota)||parametros.fgts.aliquota<0||parametros.fgts.aliquota>1)throw new Error('Alíquota de FGTS inválida.');
  const ir=parametros.irrf;
  if([ir.desconto_simplificado,ir.deducao_dependente,ir.reducao_integral_ate,ir.reducao_progressiva_ate,ir.reducao_constante,ir.reducao_fator].some(v=>!Number.isFinite(v)||v<0))throw new Error('Parâmetros IRRF inválidos.');
}
export function contribuicaoInss(base:number, regra:RegraInss):number {
  const limitada=Math.min(Math.max(0,base),regra.teto);
  let anterior=0,total=0;
  for(const faixa of regra.faixas){
    const parcela=Math.min(Math.max(limitada-anterior,0),faixa.ate-anterior);
    // INSS progressivo: contribuição de cada faixa arredondada em centavos.
    total+=arredondar(parcela*faixa.aliquota);
    anterior=faixa.ate;
    if(limitada<=anterior)break;
  }
  return arredondar(total);
}
export function impostoIrrf(rendimentos:number,inss:number,dependentes:number,regra:RegraIrrf){
  const deducoesLegais=inss + dependentes*regra.deducao_dependente;
  const deducao=Math.max(deducoesLegais,regra.desconto_simplificado);
  const base=arredondar(Math.max(0,rendimentos-deducao));
  const faixa=regra.faixas.find(f=>base<=f.ate)??regra.faixas.at(-1)!;
  const impostoTabela=arredondar(Math.max(0,arredondar(base*faixa.aliquota)-faixa.deducao));
  let reducao=0;
  if(rendimentos<=regra.reducao_integral_ate)reducao=impostoTabela;
  else if(rendimentos<=regra.reducao_progressiva_ate)
    reducao=Math.min(impostoTabela,Math.max(0,arredondar(regra.reducao_constante-regra.reducao_fator*rendimentos)));
  return {base,valor:arredondar(Math.max(0,impostoTabela-reducao)),aliquota:faixa.aliquota*100};
}
export function calcularContracheque(entrada:{competencia:string;empresa:MemoriaContracheque['empresa'];
 funcionario:MemoriaContracheque['funcionario'];dependentes_irrf:number;eventos:EventoCalculado[];parametros:ParametrosFolha}):MemoriaContracheque{
  conferirRegras(entrada.parametros);
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(entrada.competencia))throw new Error('Competência inválida.');
  if(!Number.isFinite(entrada.funcionario.salario_base)||entrada.funcionario.salario_base<=0)throw new Error('Salário-base deve ser positivo.');
  if(!Number.isInteger(entrada.dependentes_irrf)||entrada.dependentes_irrf<0||entrada.dependentes_irrf>99)throw new Error('Número de dependentes inválido.');
  if(entrada.eventos.length>13)throw new Error('O modelo de contracheque admite no máximo 13 eventos adicionais para manter duas vias em uma folha.');
  const salario:EventoCalculado={codigo:'1',descricao:'SALÁRIO',referencia:'30d',tipo:'PROVENTO',valor:arredondar(entrada.funcionario.salario_base),incide_inss:true,incide_fgts:true,incide_irrf:true,reduz_base:false};
  const extras=entrada.eventos.map(item=>({...item,valor:arredondar(item.valor)}));
  for(const item of extras){
    if(!item.codigo||['1','26','27','28'].includes(item.codigo)||!Number.isFinite(item.valor)||item.valor<0)throw new Error('Evento incompatível com o cálculo.');
    if(item.tipo==='INFORMATIVO'&&(item.incide_inss||item.incide_fgts||item.incide_irrf))throw new Error('Evento informativo não deve integrar bases de cálculo.');
  }
  const operando=(tipo:'inss'|'fgts'|'irrf')=>arredondar([salario,...extras].reduce((total,e)=>{
    const incide=tipo==='inss'?e.incide_inss:tipo==='fgts'?e.incide_fgts:e.incide_irrf;
    if(!incide)return total;
    const sinal=e.tipo==='PROVENTO'?1:(e.tipo==='DESCONTO'&&e.reduz_base?-1:0);
    return total+sinal*e.valor;
  },0));
  const baseInss=Math.max(0,operando('inss'));
  const baseFgts=Math.max(0,operando('fgts'));
  const rendimentos=Math.max(0,operando('irrf'));
  const inss=contribuicaoInss(baseInss,entrada.parametros.inss);
  const irrf=impostoIrrf(rendimentos,inss,entrada.dependentes_irrf,entrada.parametros.irrf);
  const fgts=arredondar(baseFgts*entrada.parametros.fgts.aliquota);
  const aliquotaFaixaInss=(entrada.parametros.inss.faixas.find(f=>baseInss<=f.ate)??entrada.parametros.inss.faixas.at(-1)!).aliquota*100;
  const eventosFinais:EventoCalculado[]=[salario,...extras,
   {codigo:'26',descricao:'CONTRIBUIÇÃO PREVIDENCIÁRIA',referencia:`${aliquotaFaixaInss.toFixed(2).replace('.',',')}%`,tipo:'DESCONTO',valor:inss,incide_inss:false,incide_fgts:false,incide_irrf:false,reduz_base:false},
   ...(irrf.valor>0?[{codigo:'27',descricao:'IMPOSTO DE RENDA RETIDO',referencia:`${irrf.aliquota.toFixed(1).replace('.',',')}%`,tipo:'DESCONTO' as const,valor:irrf.valor,incide_inss:false,incide_fgts:false,incide_irrf:false,reduz_base:false}]:[])];
  const proventos=arredondar(eventosFinais.filter(e=>e.tipo==='PROVENTO').reduce((total,e)=>total+e.valor,0));
  const descontos=arredondar(eventosFinais.filter(e=>e.tipo==='DESCONTO').reduce((total,e)=>total+e.valor,0));
  return {versao:'1',competencia:entrada.competencia,empresa:entrada.empresa,funcionario:entrada.funcionario,
    eventos:eventosFinais,total_proventos:proventos,total_descontos:descontos,liquido:arredondar(proventos-descontos),
    base_inss:arredondar(baseInss),base_fgts:arredondar(baseFgts),deposito_fgts:fgts,base_irrf:irrf.base,
    aliquota_irrf:irrf.aliquota,inss_desconto:inss,irrf_desconto:irrf.valor,dependentes_irrf:entrada.dependentes_irrf,regras:entrada.parametros.referencias};
}
