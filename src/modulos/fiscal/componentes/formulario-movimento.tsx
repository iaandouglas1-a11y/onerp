import { Campo, Cartao } from '@/componentes/globais/elementos';
import { salvarMovimentoFiscal } from '@/modulos/fiscal/acoes';
import type { Cliente, MovimentoFiscal } from '@/tipos/modelos';
import { mesAtual } from '@/lib/utilitarios/formatacao';
export function FormularioMovimento({clientes,categorias,movimento,clienteSelecionado}:{clientes:Cliente[];categorias:{id:string;nome:string;tipo_movimento:string}[];movimento?:MovimentoFiscal|null;clienteSelecionado?:string}){
  const hoje= new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  return <Cartao titulo={movimento?'Editar lançamento':'Novo lançamento fiscal'} subtitulo="Registre receita, entrada ou despesa do cliente. Só receitas integram o faturamento."><form action={salvarMovimentoFiscal} className="grade-formulario"><input type="hidden" name="id" value={movimento?.id??''}/>
    <div className="largo"><Campo nome="cliente_id" rotulo="Cliente" obrigatorio padrao={movimento?.cliente_id||clienteSelecionado||''} opcoes={clientes.map(item=>({valor:item.id,rotulo:`${item.razao_social} (${item.regime_tributario??'Sem regime'})`}))}/></div>
    <Campo nome="tipo_movimento" rotulo="Tipo de movimento" obrigatorio padrao={movimento?.tipo_movimento||'RECEITA'} opcoes={[{valor:'RECEITA',rotulo:'Receita'},{valor:'ENTRADA',rotulo:'Entrada (não compõe receita)'},{valor:'DESPESA',rotulo:'Despesa (não compõe receita)'}]}/>
    <Campo nome="atividade_receita" rotulo="Atividade da receita (MEI)" padrao={movimento?.atividade_receita} opcoes={[{valor:'COMERCIO',rotulo:'Comércio'},{valor:'INDUSTRIA',rotulo:'Indústria'},{valor:'SERVICOS',rotulo:'Serviços'},{valor:'OUTROS',rotulo:'Outros'}]}/>
    <Campo nome="data_movimento" rotulo="Data do movimento" tipo="date" obrigatorio padrao={movimento?.data_movimento||hoje}/>
    <Campo nome="competencia" rotulo="Competência" tipo="month" obrigatorio padrao={movimento?.competencia?.slice(0,7)||mesAtual()}/>
    <Campo nome="valor" rotulo="Valor (R$)" obrigatorio padrao={movimento?.valor!=null?String(movimento.valor).replace('.',','):''} placeholder="0,00"/>
    <Campo nome="numero_documento" rotulo="Número do documento" padrao={movimento?.numero_documento}/>
    <div className="largo"><Campo nome="descricao" rotulo="Descrição" padrao={movimento?.descricao}/></div>
    <div className="largo"><Campo nome="categoria_id" rotulo="Categoria (opcional; compatível com o tipo escolhido)" padrao={movimento?.categoria_id} opcoes={categorias.map(item=>({valor:item.id,rotulo:`${item.nome} — ${item.tipo_movimento}`}))}/></div>
    <div className="largo linha entre"><span className="muted pequeno">Movimentos MEI precisam de atividade quando classificados como receita.</span><button className="botao primario">{movimento?'Salvar alterações':'Registrar lançamento'}</button></div>
  </form></Cartao>;
}
