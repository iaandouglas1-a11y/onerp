import { arredondar, somarCentavos, conferirRegras, contribuicaoInss, impostoIrrf, type ParametrosFolha, type MemoriaContracheque, type EventoCalculado } from './calculos';
export type TipoDecimoTerceiro = 'ADIANTAMENTO_13'|'SEGUNDA_PARCELA_13';
export type Memoria13 = MemoriaContracheque & { tipo_13:TipoDecimoTerceiro; ano_13:number; avos_13:number; antecipacao_13:number; remuneracao_13:number; medias_trabalhistas?:{origem:string;competencia_limite:string;divisor:number;media_monetaria:number;media_horas:number;valor:number;linhas:import('./medias').LinhaMedia[];avisos:string[]} };
/** Conta mês com pelo menos 15 dias no vínculo; afastamentos e períodos especiais devem ser conferidos antes do processamento. */
export function avosDecimoTerceiro(admissao:string,ano:number):number {
 const data=new Date(`${admissao}T12:00:00Z`);
 if(!Number.isInteger(ano)||ano<2000||ano>2100||Number.isNaN(data.getTime())||data.toISOString().slice(0,10)!==admissao)throw new Error('Data de admissão ou exercício inválidos.');
 if(data.getUTCFullYear()>ano)return 0;
 if(data.getUTCFullYear()<ano)return 12;
 let avos=0;
 for(let mes=data.getUTCMonth();mes<12;mes++){
  const ultimo=new Date(Date.UTC(ano,mes+1,0)).getUTCDate();
  const dias=mes===data.getUTCMonth()?ultimo-data.getUTCDate()+1:ultimo;
  if(dias>=15)avos++;
 }
 return avos;
}
export function calcularDecimoTerceiro(e:{tipo:TipoDecimoTerceiro;ano:2026;avos:number;adicionais:number;mediaVariavel:number;adiantamentoPago:number;empresa:MemoriaContracheque['empresa'];funcionario:MemoriaContracheque['funcionario'];dependentes:number;parametros:ParametrosFolha;}):Memoria13 {
 conferirRegras(e.parametros);
 if(!Number.isInteger(e.avos)||e.avos<1||e.avos>12)throw new Error('Avos inválidos.');
 for(const [nome,v] of Object.entries({salario:e.funcionario.salario_base,adicionais:e.adicionais,mediaVariavel:e.mediaVariavel,adiantamentoPago:e.adiantamentoPago}))
  if(!Number.isFinite(v)||v<0)throw new Error(`${nome} inválido.`);
 const remuneracao=arredondar(e.funcionario.salario_base+e.adicionais+e.mediaVariavel);
 const integral=arredondar(remuneracao*e.avos/12);
 const primeira=e.tipo==='ADIANTAMENTO_13';
 if(primeira&&e.adiantamentoPago!==0)throw new Error('Adiantamento anterior já registrado: requer rotina específica de complemento.');
 if(!primeira&&e.adiantamentoPago>integral)throw new Error('Adiantamento maior que o total devido. Revisar apuração.');
 const provento=primeira?arredondar(integral/2):integral;
 const inss=primeira?0:contribuicaoInss(integral,e.parametros.inss);
 const irrf=primeira?{base:0,valor:0,aliquota:0}:impostoIrrf(integral,inss,e.dependentes,e.parametros.irrf);
 const baseFgts=primeira?provento:arredondar(Math.max(0,integral-e.adiantamentoPago));
 const evento=(codigo:string,descricao:string,tipo:'PROVENTO'|'DESCONTO',valor:number,referencia=''):EventoCalculado=>({codigo,descricao,tipo,valor,referencia,incide_inss:false,incide_irrf:false,incide_fgts:false,reduz_base:false});
 const eventos=[evento(primeira?'130':'131',primeira?'ADIANTAMENTO DO 13º':'13º SALÁRIO','PROVENTO',provento,`${e.avos}/12`),
  ...(!primeira&&e.adiantamentoPago>0?[evento('132','ADIANTAMENTO DO 13º','DESCONTO',e.adiantamentoPago)]:[]),
  ...(!primeira&&inss>0?[evento('133','INSS SOBRE 13º','DESCONTO',inss)]:[]),
  ...(!primeira&&irrf.valor>0?[evento('134','IRRF SOBRE 13º','DESCONTO',irrf.valor)]:[])];
 const descontos=somarCentavos([primeira?0:e.adiantamentoPago,inss,irrf.valor]);
 return {versao:'1',tipo_13:e.tipo,ano_13:e.ano,avos_13:e.avos,antecipacao_13:e.adiantamentoPago,remuneracao_13:remuneracao,
  competencia:`${e.ano}-${primeira?'11':'12'}`,empresa:e.empresa,funcionario:e.funcionario,dependentes_irrf:e.dependentes,
  eventos,total_proventos:provento,total_descontos:descontos,liquido:somarCentavos([provento,-descontos]),
  base_inss:primeira?0:integral,base_fgts:baseFgts,deposito_fgts:arredondar(baseFgts*e.parametros.fgts.aliquota),
  base_irrf:irrf.base,aliquota_irrf:irrf.aliquota,inss_desconto:inss,irrf_desconto:irrf.valor,regras:e.parametros.referencias};
}
