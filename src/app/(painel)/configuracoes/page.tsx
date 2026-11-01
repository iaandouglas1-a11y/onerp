import { formatarDocumento } from '@/lib/utilitarios/formatacao';
import Link from 'next/link';
import { CabecalhoPagina, Cartao, Campo, ListaVazia } from '@/componentes/globais/elementos';
import { JanelaModal } from '@/componentes/globais/janela-modal';
import { FormularioContinuo } from '@/componentes/globais/formulario-continuo';
import { exigirEscritorio } from '@/lib/seguranca/contexto';
import { configurarLimiteMei } from '@/modulos/fiscal/acoes';
import { moeda } from '@/lib/utilitarios/formatacao';
export default async function Configuracoes({searchParams}:{searchParams:Promise<{limite?:string}>}){
  const filtros=await searchParams;
  const {banco,escritorioId}=await exigirEscritorio();
  const [{data:escritorio},{data:regras},{data:membros}]=await Promise.all([
    banco.from('escritorios').select('nome,razao_social,cpf_cnpj').eq('id',escritorioId).single(),
    banco.from('regras_limites_mei').select('*').eq('escritorio_id',escritorioId).order('ano_calendario',{ascending:false}),
    banco.from('membros_escritorio').select('usuario_id,perfil_acesso,ativo').eq('escritorio_id',escritorioId),
  ]);
  const parametrizacaoHabilitada=true; // Exige vínculo ativo ao escritório.
  return <><CabecalhoPagina titulo="Configurações" descricao="Identificação do escritório e parâmetros fiscalmente relevantes."/>
    <div className="grade colunas-2"><Cartao titulo="Escritório"><div className="metrica-lista"><span>Nome</span><b>{escritorio?.nome||'—'}</b></div><div className="metrica-lista"><span>Razão social</span><b>{escritorio?.razao_social||'—'}</b></div><div className="metrica-lista"><span>CPF/CNPJ</span><b>{formatarDocumento(escritorio?.cpf_cnpj)}</b></div></Cartao>
      <Cartao titulo="Usuários do escritório"><p className="muted pequeno">Controle de papéis definido no Supabase. Convites serão incluídos depois.</p>{(membros??[]).map(membro=><div className="item-lista" key={membro.usuario_id}><div><div className="nome-item">{membro.usuario_id.slice(0,8)}…</div><div className="subitem">{membro.perfil_acesso}</div></div><span className="etiqueta verde">{membro.ativo?'Ativo':'Inativo'}</span></div>)}</Cartao>
      <Cartao titulo="Limites MEI aprovados" acoes={parametrizacaoHabilitada?<Link className="botao primario" href="/configuracoes?limite=1">Parametrizar limite</Link>:null}>{!regras?.length?<ListaVazia/>:regras.map(regra=><div className="item-lista" key={regra.id}><div><div className="nome-item">{regra.ano_calendario} · {moeda(regra.limite_anual)}</div><div className="subitem">Alerta: {(Number(regra.percentual_alerta)*100).toLocaleString('pt-BR')}% · {regra.fundamento_legal||'Sem referência'}</div></div><span className="etiqueta">{regra.aprovado_em?'Aprovada':'Não aprovada'}</span></div>)}</Cartao>
      <Cartao titulo="Módulos desta versão"><p className="muted pequeno">Societário e faturamento Fiscal operacionais. Contábil, Folha e Financeiro permanecem planejados.</p><Link className="botao" href="/inicio">Voltar ao Dashboard</Link></Cartao>
    </div>
    {parametrizacaoHabilitada&&filtros.limite==='1'&&<JanelaModal titulo="Parametrizar limite MEI" descricao="Informe valores e fundamento legal previamente verificados." fecharEm="/configuracoes"><div className="aviso-configuracao">Ao salvar, a regra será identificada como aprovada pelo administrador. Não use valores sem validação legal.</div><FormularioContinuo className="grade" acao={configurarLimiteMei} modo="acao"><Campo nome="ano_calendario" rotulo="Ano-calendário" tipo="number" obrigatorio padrao={new Date().getFullYear()} min="2000" max="2200"/><Campo nome="limite_anual" rotulo="Limite anual (R$)" obrigatorio placeholder="Informe o valor"/><Campo nome="percentual_alerta" rotulo="Alerta a partir de (%)" tipo="number" padrao="80" min="0" max="100" obrigatorio/><label className="linha pequeno"><input type="checkbox" name="proporcional_ano_abertura" defaultChecked/>Proporcional no ano de abertura</label><Campo nome="fundamento_legal" rotulo="Referência legal / fonte" obrigatorio/><button className="botao primario">Salvar e aprovar regra</button></FormularioContinuo></JanelaModal>}
  </>;
}
