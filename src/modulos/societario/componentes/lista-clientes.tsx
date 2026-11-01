'use client';
import { useMemo,useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import type { Cliente } from '@/tipos/modelos';
import { Etiqueta, ListaVazia } from '@/componentes/globais/elementos';
export function ListaClientes({clientes}:{clientes:Cliente[]}) {
  const [busca,setBusca]=useState('');const [situacao,setSituacao]=useState('TODOS');
  const filtrados=useMemo(()=>clientes.filter(cliente=>(situacao==='TODOS'||cliente.situacao===situacao)&&
    `${cliente.razao_social} ${cliente.nome_fantasia??''} ${cliente.cpf_cnpj}`.toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR'))),[clientes,busca,situacao]);
  return <><div className="filtros"><div style={{position:'relative',flex:'1 1 270px'}}><Search size={17} style={{position:'absolute',left:12,top:12,color:'#98a4b0'}}/><input className="entrada" style={{paddingLeft:37}} placeholder="Buscar por cliente, CPF ou CNPJ" value={busca} onChange={evento=>setBusca(evento.target.value)}/></div><select className="entrada" style={{width:'auto'}} value={situacao} onChange={evento=>setSituacao(evento.target.value)}><option value="TODOS">Todas as situações</option>{['ATIVO','ONBOARDING','RISCO','INATIVO','CANCELADO'].map(valor=><option key={valor} value={valor}>{valor.replaceAll('_',' ')}</option>)}</select></div>
    <div className="tabela-wrapper"><table className="tabela"><thead><tr><th>Cliente</th><th>CPF/CNPJ</th><th>Regime</th><th>Tipo</th><th>Situação</th><th>Ação</th></tr></thead><tbody>{filtrados.map(cliente=><tr key={cliente.id}><td><Link href={`/societario/clientes/${cliente.id}`}>{cliente.nome_fantasia||cliente.razao_social}</Link><div className="muted pequeno">{cliente.razao_social}</div></td><td>{cliente.cpf_cnpj}</td><td>{cliente.regime_tributario?.replaceAll('_',' ')||'—'}</td><td>{cliente.tipo_pessoa}</td><td><Etiqueta valor={cliente.situacao}/></td><td><Link href={`/societario/clientes/${cliente.id}`}>Abrir</Link></td></tr>)}</tbody></table>{filtrados.length===0&&<ListaVazia texto="Nenhum cliente corresponde aos filtros."/>}</div><p className="muted pequeno" style={{marginTop:12}}>{filtrados.length} cliente(s) encontrados.</p></>;
}
