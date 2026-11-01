import Link from 'next/link';
import { Cartao, Campo, Etiqueta, ListaVazia } from '@/componentes/globais/elementos';
import { CampoDocumento } from '@/componentes/globais/campo-documento';
import { registrosCliente } from '@/modulos/societario/consultas';
import { salvarRegistroSocietario, atualizarSituacaoTarefa,atualizarSituacaoObrigacao,alternarItem,enviarDocumento,criarCredencial,listarCredenciaisSeguras } from '@/modulos/societario/acoes';
import { BotaoDocumento,BotaoRevelar } from './acoes-arquivos';
import { dataBrasileira, formatarDocumento } from '@/lib/utilitarios/formatacao';
import { obterContexto } from '@/lib/seguranca/contexto';
import { JanelaModal } from '@/componentes/globais/janela-modal';
import { FormularioContinuo } from '@/componentes/globais/formulario-continuo';
import { Plus, Pencil } from 'lucide-react';

type CampoConfigurado={nome:string;rotulo:string;tipo?:string;opcoes?:{valor:string;rotulo:string}[];obrigatorio?:boolean};
const estadosTarefa=['A_FAZER','EM_EXECUCAO','AGUARDANDO_CLIENTE','CONCLUIDA','CANCELADA'];
const estadosObrigacao=['PENDENTE','EM_ANDAMENTO','AGUARDANDO_CLIENTE','CONCLUIDA','CANCELADA'];
const configuracoes:Record<string,{tabela:string;tipo:string;titulo:string;coluna:string;campos:CampoConfigurado[]}>= {
  enderecos:{tabela:'enderecos_clientes',tipo:'endereco',titulo:'Endereços',coluna:'logradouro',campos:[{nome:'identificacao',rotulo:'Identificação'},{nome:'cep',rotulo:'CEP'},{nome:'logradouro',rotulo:'Logradouro',obrigatorio:true},{nome:'numero',rotulo:'Número'},{nome:'complemento',rotulo:'Complemento'},{nome:'bairro',rotulo:'Bairro'},{nome:'cidade',rotulo:'Cidade'},{nome:'uf',rotulo:'UF'}]},
  contatos:{tabela:'contatos_clientes',tipo:'contato',titulo:'Contatos',coluna:'nome',campos:[{nome:'nome',rotulo:'Nome',obrigatorio:true},{nome:'posicao',rotulo:'Cargo/Relação'},{nome:'email',rotulo:'E-mail',tipo:'email'},{nome:'telefone',rotulo:'Telefone'},{nome:'whatsapp',rotulo:'WhatsApp'},{nome:'observacoes',rotulo:'Observações'}]},
  representantes:{tabela:'representantes_clientes',tipo:'representante',titulo:'Representantes',coluna:'nome',campos:[{nome:'nome',rotulo:'Nome',obrigatorio:true},{nome:'cpf_cnpj',rotulo:'CPF/CNPJ'},{nome:'vinculo',rotulo:'Relação'},{nome:'data_inicio',rotulo:'Início',tipo:'date'},{nome:'data_fim',rotulo:'Fim',tipo:'date'},{nome:'observacoes',rotulo:'Observações'}]},
  servicos:{tabela:'servicos_clientes',tipo:'servico_cliente',titulo:'Serviços contratados',coluna:'servico_id',campos:[{nome:'data_inicio',rotulo:'Início do contrato',tipo:'date'},{nome:'data_fim',rotulo:'Fim do contrato',tipo:'date'},{nome:'situacao',rotulo:'Situação',opcoes:[{valor:'ATIVO',rotulo:'Ativo'},{valor:'SUSPENSO',rotulo:'Suspenso'},{valor:'ENCERRADO',rotulo:'Encerrado'}]}]},
  obrigacoes:{tabela:'obrigacoes_clientes',tipo:'obrigacao',titulo:'Obrigações do cliente',coluna:'titulo',campos:[{nome:'titulo',rotulo:'Obrigação',obrigatorio:true},{nome:'data_vencimento',rotulo:'Vencimento',tipo:'date',obrigatorio:true},{nome:'inicio_periodo',rotulo:'Início da competência',tipo:'date'},{nome:'fim_periodo',rotulo:'Fim da competência',tipo:'date'},{nome:'situacao',rotulo:'Situação',opcoes:estadosObrigacao.map(valor=>({valor,rotulo:valor.replaceAll('_',' ')}))}]},
  tarefas:{tabela:'tarefas',tipo:'tarefa',titulo:'Tarefas do cliente',coluna:'titulo',campos:[{nome:'titulo',rotulo:'Título',obrigatorio:true},{nome:'descricao',rotulo:'Descrição'},{nome:'data_vencimento',rotulo:'Vencimento',tipo:'date'},{nome:'prioridade',rotulo:'Prioridade',opcoes:[{valor:'BAIXA',rotulo:'Baixa'},{valor:'NORMAL',rotulo:'Normal'},{valor:'ALTA',rotulo:'Alta'}]},{nome:'situacao',rotulo:'Situação',opcoes:estadosTarefa.map(valor=>({valor,rotulo:valor.replaceAll('_',' ')}))}]},
  implantacao:{tabela:'itens_implantacao_clientes',tipo:'implantacao',titulo:'Checklist de implantação',coluna:'descricao',campos:[{nome:'descricao',rotulo:'Etapa de implantação',obrigatorio:true},{nome:'posicao',rotulo:'Ordem',tipo:'number'}]},
  observacoes:{tabela:'observacoes_clientes',tipo:'observacao',titulo:'Histórico de observações',coluna:'observacao',campos:[{nome:'observacao',rotulo:'Observação',obrigatorio:true}]},
};
const nomeAbas:Record<string,string>={resumo:'Resumo',enderecos:'Endereços',contatos:'Contatos',representantes:'Representantes',servicos:'Serviços',documentos:'Documentos',acessos:'Acessos',obrigacoes:'Obrigações',tarefas:'Tarefas',implantacao:'Implantação',observacoes:'Observações'};
export function AbasCliente({id,aba}:{id:string;aba:string}){return <nav className="abas">{Object.entries(nomeAbas).map(([chave,nome])=><Link key={chave} className={`aba ${aba===chave?'ativa':''}`} href={`/societario/clientes/${id}?aba=${chave}`}>{nome}</Link>)}</nav>}
function textoItem(item:Record<string,unknown>,campo:string,mapaServicos:Record<string,string>){const valor=String(item[campo]??'');return campo==='servico_id'?(mapaServicos[valor]??'Serviço'):(valor||'—')}
export async function SecaoCliente({id,aba,editar}:{id:string;aba:string;editar?:string}){
  const contexto=await obterContexto();
  const edicaoPermitida=true;
  const abrirNovo=`/societario/clientes/${id}?aba=${aba}&editar=novo`;
  const fecharEm=`/societario/clientes/${id}?aba=${aba}`;
  if(aba==='acessos'){
    const habilitado=!!process.env.SUPABASE_SERVICE_ROLE_KEY&&!!process.env.COFRE_CHAVE_CRIPTOGRAFIA;
    if(!habilitado)return <Cartao titulo="Acessos e credenciais"><div className="aviso-configuracao">Configure as variáveis privadas do cofre para habilitar esta função.</div></Cartao>;
    const credenciais=await listarCredenciaisSeguras(id);
    return <><Cartao titulo="Acessos cadastrados" acoes={<Link className="botao primario" href={abrirNovo}><Plus size={14}/>Novo acesso</Link>}>
      {credenciais.length===0?<ListaVazia/>:credenciais.map(item=><div className="item-lista" key={item.id}><div><div className="nome-item">{item.nome_portal}</div><div className="subitem">CPF/usuário: {item.nome_portal.toLowerCase()==='gov.br'?formatarDocumento(item.identificacao_usuario,'PF'):(item.identificacao_usuario||'—')} · Validade: {dataBrasileira(item.data_validade)}</div></div><BotaoRevelar id={item.id} clienteId={id}/></div>)}
    </Cartao>
    {editar==='novo'&&<JanelaModal titulo="Novo acesso" descricao="Dados protegidos do cliente" fecharEm={fecharEm}><FormularioContinuo className="grade" acao={criarCredencial}><input type="hidden" name="cliente_id" value={id}/><Campo nome="nome_portal" rotulo="Portal/Sistema" obrigatorio/><Campo nome="identificacao_usuario" rotulo="Identificação do usuário"/><div className="campo"><label htmlFor="segredo">Segredo / senha *</label><input id="segredo" type="password" name="segredo" required autoComplete="new-password"/></div><Campo nome="data_validade" rotulo="Validade" tipo="date"/><p className="muted pequeno">A senha é criptografada e não é exportada em relatórios.</p><button className="botao primario">Salvar no cofre</button></FormularioContinuo></JanelaModal>}
    </>;
  }
  if(aba==='documentos'){
    const arquivos=await registrosCliente('documentos',id);
    return <><Cartao titulo="Documentos do cliente" acoes={edicaoPermitida?<Link className="botao primario" href={abrirNovo}><Plus size={14}/>Adicionar documento</Link>:null}>
      {arquivos.length===0?<ListaVazia/>:arquivos.map(item=><div className="item-lista" key={String(item.id)}><div><div className="nome-item">{String(item.titulo)}</div><div className="subitem">{String(item.categoria)} · Validade: {dataBrasileira(item.data_validade as string|null)}</div></div><BotaoDocumento id={String(item.id)}/></div>)}
    </Cartao>
    {edicaoPermitida&&editar==='novo'&&<JanelaModal titulo="Adicionar documento" fecharEm={fecharEm}><FormularioContinuo acao={enviarDocumento} className="grade"><input type="hidden" name="cliente_id" value={id}/><Campo rotulo="Nome do documento" nome="titulo" obrigatorio/><Campo rotulo="Categoria" nome="categoria" padrao="CONTRATO"/><Campo rotulo="Validade" nome="data_validade" tipo="date"/><div className="campo"><label htmlFor="arquivo">Arquivo (PDF, imagem ou XML, até 10 MB)</label><input id="arquivo" type="file" name="arquivo" accept=".pdf,.jpg,.jpeg,.png,.xml,.txt" required/></div><button className="botao primario">Enviar documento</button></FormularioContinuo></JanelaModal>}
    </>;
  }
  const configuracao=configuracoes[aba];if(!configuracao)return null;
  const registros=await registrosCliente(configuracao.tabela,id);
  const listaServicos=aba==='servicos'?await contexto.banco.from('servicos').select('id,nome').eq('escritorio_id',contexto.escritorioId!).order('nome'):null;
  const servicos=(listaServicos?.data??[]) as {id:string;nome:string}[];
  const mapaServicos=Object.fromEntries(servicos.map(servico=>[servico.id,servico.nome]));
  const registroAtual=registros.find(item=>item.id===editar);
  const mostrarFormulario=edicaoPermitida&&(editar==='novo'||Boolean(registroAtual));
  return <><Cartao titulo={configuracao.titulo} acoes={edicaoPermitida?<Link className="botao primario" href={abrirNovo}><Plus size={14}/>Novo registro</Link>:null}>
    {registros.length===0?<ListaVazia/>:<div className="tabela-wrapper"><table className="tabela"><thead><tr><th>Descrição</th><th>Informações</th><th>Situação</th><th style={{textAlign:'right'}}>Ações</th></tr></thead><tbody>{registros.map(item=><tr key={String(item.id)}><td><span className="nome-item">{textoItem(item,configuracao.coluna,mapaServicos)}</span></td><td>{item.data_vencimento?`Vencimento: ${dataBrasileira(String(item.data_vencimento))}`:item.criado_em?`Incluído: ${dataBrasileira(String(item.criado_em))}`:'—'}</td><td>{typeof item.situacao==='string'?<Etiqueta valor={item.situacao}/>:aba==='implantacao'?(item.concluido?'Concluída':'Pendente'):'—'}</td><td><div className="acoes-registro">
      {aba==='implantacao'&&edicaoPermitida&&<form action={alternarItem}><input type="hidden" name="id" value={String(item.id)}/><input type="hidden" name="cliente_id" value={id}/><input type="hidden" name="concluido" value={String(!item.concluido)}/><button className="botao" type="submit">{item.concluido?'Reabrir':'Concluir'}</button></form>}
      {aba==='tarefas'&&<Link className="botao" href={`/societario/tarefas/${item.id}`}>Checklist</Link>}
      {edicaoPermitida&&aba!=='observacoes'&&<Link className="botao" href={`/societario/clientes/${id}?aba=${aba}&editar=${item.id}`}><Pencil size={13}/>Editar</Link>}
    </div></td></tr>)}</tbody></table></div>}
  </Cartao>
  {mostrarFormulario&&<JanelaModal titulo={registroAtual?'Editar registro':`Adicionar em ${configuracao.titulo}`} fecharEm={fecharEm} largura="ampla">
    {aba==='servicos'&&servicos.length===0&&<div className="aviso-configuracao">Cadastre primeiro um serviço no <Link href="/societario/servicos">catálogo de serviços</Link>.</div>}
    <FormularioContinuo key={registroAtual?.id?String(registroAtual.id):'novo'} acao={salvarRegistroSocietario} className="grade-formulario" modo={registroAtual?'edicao':'cadastro'} rotaNovoAposEdicao={abrirNovo}><input type="hidden" name="tipo" value={configuracao.tipo}/><input type="hidden" name="cliente_id" value={id}/><input type="hidden" name="registro_id" value={registroAtual?String(registroAtual.id):''}/>
      {aba==='servicos'&&<Campo rotulo="Serviço" nome="servico_id" obrigatorio padrao={registroAtual?.servico_id?String(registroAtual.servico_id):''} opcoes={servicos.map(item=>({valor:item.id,rotulo:item.nome}))}/>}
      {configuracao.campos.map(campo=>campo.nome==='cpf_cnpj'
        ? <CampoDocumento key={campo.nome} nome={campo.nome} rotulo={campo.rotulo} padrao={String(registroAtual?.[campo.nome]??'')}/>
        : <Campo key={campo.nome} nome={campo.nome} rotulo={campo.rotulo} tipo={campo.tipo||'text'} obrigatorio={campo.obrigatorio} padrao={registroAtual?.[campo.nome]===null?'':String(registroAtual?.[campo.nome]??'')} opcoes={campo.opcoes}/>)}
      {(aba==='contatos'||aba==='enderecos')&&<label className="linha pequeno"><input type="checkbox" name="principal" defaultChecked={Boolean(registroAtual?.principal)}/>Principal</label>}
      <div className="largo linha"><button type="submit" className="botao primario">{registroAtual?'Salvar alterações':'Adicionar'}</button><Link href={fecharEm} className="botao">Cancelar</Link></div>
    </FormularioContinuo>
  </JanelaModal>}
  </>;
}
