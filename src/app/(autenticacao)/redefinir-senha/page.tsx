'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { criarClienteNavegador } from '@/lib/supabase/navegador';
import '../entrar/login.css';

export default function RedefinirSenha() {
  const [senha, definirSenha] = useState('');
  const [confirmacao, definirConfirmacao] = useState('');
  const [erro, definirErro] = useState('');
  const [sucesso, definirSucesso] = useState(false);
  const [carregando, definirCarregando] = useState(false);

  async function redefinir(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (carregando) return;
    definirErro('');
    if (senha !== confirmacao) { definirErro('As senhas informadas não coincidem.'); return; }
    if (senha.length < 8) { definirErro('A senha deve ter pelo menos 8 caracteres.'); return; }
    definirCarregando(true);
    try {
      const banco = criarClienteNavegador();
      const { data: { user: usuario }, error: erroSessao } = await banco.auth.getUser();
      if (erroSessao || !usuario) {
        definirErro('O link de recuperação expirou ou não é válido. Solicite um novo link na tela de login.');
        return;
      }
      const { error: erroAtualizacao } = await banco.auth.updateUser({ password: senha });
      if (erroAtualizacao) { definirErro('Não foi possível atualizar a senha. Solicite um novo link.'); return; }
      definirSucesso(true);
      definirSenha('');
      definirConfirmacao('');
    } catch {
      definirErro('Não foi possível conectar ao serviço de autenticação.');
    } finally { definirCarregando(false); }
  }

  return <main className="on-login-fundo">
    <section className="on-login-quadro" style={{maxWidth:510,minHeight:570}}>
      <div className="on-login-faixa"><img src="/icons/on-erp.svg" alt="" /><span>On ERP</span></div>
      <div className="on-login-painel" style={{flex:1}}>
        <img src="/marca/on-contabilidade-clara.svg" className="on-login-logo" alt="On Contabilidade" />
        <h2>Redefinir senha</h2>
        <p className="on-login-subtitulo">Crie uma nova senha para acessar sua conta.</p>
        {sucesso ? <p className="on-login-aviso on-login-sucesso" role="status">Senha atualizada com sucesso. Você já pode acessar a plataforma.</p>
        : <form onSubmit={redefinir} className="on-login-formulario">
          <div className="on-login-campo"><label htmlFor="senha-nova">Nova senha</label><div className="on-login-entrada"><input id="senha-nova" type="password" autoComplete="new-password" minLength={8} required value={senha} onChange={e=>definirSenha(e.target.value)} /></div></div>
          <div className="on-login-campo"><label htmlFor="senha-confirmar">Confirmar nova senha</label><div className="on-login-entrada"><input id="senha-confirmar" type="password" autoComplete="new-password" minLength={8} required value={confirmacao} onChange={e=>definirConfirmacao(e.target.value)} /></div></div>
          {erro && <p className="on-login-aviso on-login-erro" role="alert">{erro}</p>}
          <button type="submit" className="on-login-entrar" disabled={carregando}>{carregando?'Aguarde…':'Atualizar senha'}</button>
        </form>}
        <Link href="/entrar" className="on-login-link" style={{textAlign:'center',display:'block'}}>Voltar ao login</Link>
      </div>
    </section>
  </main>;
}
