import {GraficoBarras} from '@/componentes/globais/graficos-operacionais';
import Link from 'next/link';
import { CabecalhoPagina, Cartao, Indicador, Etiqueta, ListaVazia } from '@/componentes/globais/elementos';
import { JanelaModal } from '@/componentes/globais/janela-modal';
import { FormularioEmpregado } from '@/modulos/folha/componentes/formulario-empregado';
import { listarEmpregados } from '@/modulos/folha/consultas';
import { listarClientes } from '@/modulos/societario/consultas';
import { moeda, dataBrasileira,formatarDocumento } from '@/lib/utilitarios/formatacao';
export default async function PaginaEmpregados({searchParams}:{searchParams:Promise<{novo?:string;editar?:string}>}){
 const filtros=await searchParams;
 const [empregados,clientes]=await Promise.all([listarEmpregados(),listarClientes()]);
 const nomes=new Map(clientes.map(c=>[c.id,c.razao_social]));
 const editar=empregados.find(e=>e.id===filtros.editar);
 return <><CabecalhoPagina titulo="Empregados" descricao="Vínculos e dados necessários à folha de pagamento." acao="Novo empregado" rotaAcao="/folha/empregados?novo=1"/>
 <div className="grade colunas-4" style={{marginBottom:16}}>
 <Indicador legenda="Cadastrados" valor={empregados.length}/><Indicador legenda="Ativos" valor={empregados.filter(e=>e.situacao==='ATIVO').length}/>
 <Indicador legenda="Afastados" valor={empregados.filter(e=>e.situacao==='AFASTADO').length}/><Indicador legenda="Desligados" valor={empregados.filter(e=>e.situacao==='DESLIGADO').length}/>
 </div><Cartao titulo="Funcionários por empresa" acoes={<Link href="/folha/contracheques" className="botao">Contracheques</Link>}>
 {empregados.length===0?<ListaVazia texto="Nenhum empregado cadastrado. Use o botão Novo empregado."/>:<div className="tabela-wrapper"><table className="tabela"><thead><tr><th>Código</th><th>Nome / CPF</th><th>Empresa</th><th>Cargo / CBO</th><th>Salário-base</th><th>Admissão</th><th>Situação</th><th>Ações</th></tr></thead>
 <tbody>{empregados.map(e=><tr key={e.id}><td>{e.codigo_funcionario||'—'}</td><td><strong>{e.nome_completo}</strong><div className="muted pequeno">{formatarDocumento(e.cpf,'PF')}</div></td><td>{nomes.get(e.cliente_id)||'—'}</td><td>{e.cargo||'—'}<div className="muted pequeno">{e.cbo||''}</div></td><td>{moeda(e.salario)}</td><td>{dataBrasileira(e.data_admissao)}</td><td><Etiqueta valor={e.situacao}/></td><td><Link className="botao" href={`/folha/empregados?editar=${e.id}`}>Editar</Link></td></tr>)}</tbody></table></div>}
 </Cartao>
 <div className="grade colunas-2" style={{marginTop:16}}><GraficoBarras titulo="Composição dos vínculos" subtitulo="Situação dos empregados cadastrados" itens={[{rotulo:"Ativos",valor:empregados.filter(e=>e.situacao==='ATIVO').length},{rotulo:"Afastados",valor:empregados.filter(e=>e.situacao==='AFASTADO').length,cor:"#d4a353"},{rotulo:"Desligados",valor:empregados.filter(e=>e.situacao==='DESLIGADO').length,cor:"#9aa8b7"}]}/><Cartao titulo="Rotinas da folha"><div className="item-lista"><Link href="/folha/eventos">Conferir eventos</Link></div><div className="item-lista"><Link href="/folha/lancamentos">Consultar lançamentos</Link></div><div className="item-lista"><Link href="/folha/contracheques">Emitir contracheques</Link></div></Cartao></div>
 {filtros.novo==='1'&&<JanelaModal titulo="Novo empregado" descricao="Cadastro sequencial de funcionários" largura="ampla" fecharEm="/folha/empregados"><FormularioEmpregado clientes={clientes}/></JanelaModal>}
 {editar&&<JanelaModal titulo="Editar empregado" descricao={editar.nome_completo} largura="ampla" fecharEm="/folha/empregados"><FormularioEmpregado clientes={clientes} empregado={editar}/></JanelaModal>}
 </>;
}
