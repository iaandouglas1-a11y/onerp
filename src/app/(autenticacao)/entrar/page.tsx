'use client';

import { useState, type FormEvent } from 'react';
import { criarClienteNavegador } from '@/lib/supabase/navegador';

export default function Entrar() {
  const [erro, definirErro] = useState('');
  const [carregando, definirCarregando] = useState(false);

  async function autenticar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (carregando) return;

    definirCarregando(true);
    definirErro('');

    const dados = new FormData(evento.currentTarget);
    const email = String(dados.get('email') ?? '').trim();
    const senha = String(dados.get('senha') ?? '');
    let temporizador: ReturnType<typeof setTimeout> | undefined;

    try {
      const banco = criarClienteNavegador();
      const resultado = await Promise.race([
        banco.auth.signInWithPassword({ email, password: senha }),
        new Promise<never>((_resolver, rejeitar) => {
          temporizador = setTimeout(() => rejeitar(new Error('TEMPO_LIMITE')), 20000);
        }),
      ]);

      if (resultado.error) {
        console.error('Falha no login:', {
          codigo: resultado.error.code,
          status: resultado.error.status,
          mensagem: resultado.error.message,
        });

        if (resultado.error.code === 'email_not_confirmed') {
          definirErro('O e-mail ainda não foi confirmado no Supabase.');
        } else if (resultado.error.code === 'invalid_credentials') {
          definirErro('E-mail ou senha inválidos.');
        } else {
          definirErro('Não foi possível autenticar. Verifique os dados e tente novamente.');
        }
        return;
      }

      if (!resultado.data.session) {
        definirErro('O Supabase não retornou uma sessão. Verifique a configuração de autenticação.');
        return;
      }

      window.location.replace('/inicio');
    } catch (ocorrencia) {
      console.error('Erro inesperado no login:', ocorrencia);
      if (ocorrencia instanceof Error && ocorrencia.message === 'TEMPO_LIMITE') {
        definirErro('O Supabase não concluiu a autenticação em 20 segundos. Verifique a conexão e tente novamente.');
      } else {
        definirErro('Falha de conexão ou erro inesperado na autenticação.');
      }
    } finally {
      if (temporizador) clearTimeout(temporizador);
      definirCarregando(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20, background: '#0A111C' }}>
      <div className="cartao" style={{ width: '100%', maxWidth: 390, padding: 34 }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <img src="/marca/on-contabilidade-escura.svg" alt="On Contabilidade" style={{ width: 170, height: 140, objectFit: 'contain', maxWidth: '100%' }} />
          <p className="muted pequeno" style={{ margin: 0 }}>Acesso interno</p>
        </div>

        <h2>Entrar na plataforma</h2>
        <p className="muted pequeno">Utilize o usuário criado no Supabase Auth.</p>

        <form onSubmit={autenticar} className="grade" style={{ gap: 16 }}>
          <div className="campo">
            <label htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="campo">
            <label htmlFor="senha">Senha</label>
            <input id="senha" name="senha" type="password" autoComplete="current-password" required minLength={6} />
          </div>
          {erro && <div className="mensagem erro" role="alert">{erro}</div>}
          <button className="botao primario" type="submit" disabled={carregando}>
            {carregando ? 'Autenticando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}
