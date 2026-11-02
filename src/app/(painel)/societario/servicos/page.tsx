import Link from 'next/link';
import { CabecalhoPagina, Cartao, Campo, ListaVazia } from '@/componentes/globais/elementos';
import { JanelaModal } from '@/componentes/globais/janela-modal';
import { FormularioContinuo } from '@/componentes/globais/formulario-continuo';
import { exigirEscritorio } from '@/lib/seguranca/contexto';
import { criarServico, editarServico, excluirServico } from '@/modulos/societario/acoes';

type Parametros = { novo?: string; editar?: string; excluir?: string };

export default async function Servicos({searchParams}:{searchParams:Promise<Parametros>}) {
  const {novo,editar,excluir}=await searchParams;
  const {banco,escritorioId}=await exigirEscritorio();
  const {data:servicos,error:erro}=await banco.from('servicos').select('*')
    .eq('escritorio_id',escritorioId).order('nome');
  if(erro)throw new Error(erro.message);
  const lista=servicos??[];
  const servicoEdicao=editar?lista.find(servico=>servico.id===editar):undefined;
  const servicoExclusao=excluir?lista.find(servico=>servico.id===excluir):undefined;
  const rota='/societario/servicos';

  return <>
    <CabecalhoPagina titulo="Catálogo de serviços" descricao="Serviços contratáveis pelos clientes do escritório."
      acao="Novo serviço" rotaAcao={`${rota}?novo=1`}/>
    <Cartao titulo="Serviços disponíveis">
      {!lista.length?<ListaVazia/>:<div className="tabela-wrapper"><table className="tabela">
        <thead><tr><th>Código</th><th>Serviço</th><th>Descrição</th><th>Situação</th><th>Ações</th></tr></thead>
        <tbody>{lista.map(servico=><tr key={servico.id}>
          <td>{servico.codigo}</td><td>{servico.nome}</td><td>{servico.descricao||'—'}</td>
          <td><span className={`etiqueta ${servico.ativo?'verde':'vermelho'}`}>{servico.ativo?'Ativo':'Inativo'}</span></td>
          <td><div className="linha" style={{gap:8,flexWrap:'nowrap'}}>
            <Link className="botao" href={`${rota}?editar=${encodeURIComponent(servico.id)}`}>Editar</Link>
            <Link className="botao" href={`${rota}?excluir=${encodeURIComponent(servico.id)}`}>Excluir</Link>
          </div></td>
        </tr>)}</tbody>
      </table></div>}
    </Cartao>

    {novo==='1'&&<JanelaModal titulo="Cadastrar serviço" fecharEm={rota}>
      <FormularioContinuo acao={criarServico} className="grade">
        <Campo nome="codigo" rotulo="Código" obrigatorio placeholder="Ex.: MEI"/>
        <Campo nome="nome" rotulo="Nome" obrigatorio/>
        <Campo nome="descricao" rotulo="Descrição"/>
        <div className="linha"><button type="submit" className="botao primario">Salvar</button>
          <Link href={rota} className="botao">Fechar</Link></div>
      </FormularioContinuo>
    </JanelaModal>}

    {editar&&servicoEdicao&&<JanelaModal titulo="Editar serviço" fecharEm={rota}>
      <FormularioContinuo acao={editarServico} className="grade" modo="edicao" rotaNovoAposEdicao={`${rota}?novo=1`}>
        <input type="hidden" name="id" value={servicoEdicao.id}/>
        <Campo nome="codigo" rotulo="Código" padrao={servicoEdicao.codigo} obrigatorio/>
        <Campo nome="nome" rotulo="Nome" padrao={servicoEdicao.nome} obrigatorio/>
        <Campo nome="descricao" rotulo="Descrição" padrao={servicoEdicao.descricao}/>
        <label className="linha" style={{gap:8,alignItems:'center'}}>
          <input type="checkbox" name="ativo" defaultChecked={servicoEdicao.ativo}
            style={{width:18,height:18,minHeight:18,flex:'none'}}/> Serviço ativo
        </label>
        <div className="linha"><button type="submit" className="botao primario">Salvar alterações</button>
          <Link href={rota} className="botao">Cancelar</Link></div>
      </FormularioContinuo>
    </JanelaModal>}

    {excluir&&servicoExclusao&&<JanelaModal titulo="Excluir serviço" fecharEm={rota}>
      <p>Deseja excluir definitivamente <strong>{servicoExclusao.nome}</strong>?</p>
      <p className="muted pequeno">Serviços vinculados a clientes ou honorários não podem ser excluídos. Nesse caso, edite o serviço e desmarque “Serviço ativo”.</p>
      <form action={excluirServico} className="linha">
        <input type="hidden" name="id" value={servicoExclusao.id}/>
        <button type="submit" className="botao primario">Confirmar exclusão</button>
        <Link href={rota} className="botao">Cancelar</Link>
      </form>
    </JanelaModal>}
  </>;
}
