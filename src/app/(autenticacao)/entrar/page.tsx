'use client';

import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { criarClienteNavegador } from '@/lib/supabase/navegador';
import './login.css';

type ModoFormulario = 'entrar' | 'recuperar';

export default function Entrar() {
  const [modo, definirModo] = useState<ModoFormulario>('entrar');
  const [email, definirEmail] = useState('');
  const [senha, definirSenha] = useState('');
  const [mostrarSenha, definirMostrarSenha] = useState(false);
  const [erro, definirErro] = useState('');
  const [sucesso, definirSucesso] = useState('');
  const [carregando, definirCarregando] = useState(false);

  function trocarModo(novoModo: ModoFormulario) {
    definirModo(novoModo);
    definirErro('');
    definirSucesso('');
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (carregando) return;
    definirCarregando(true);
    definirErro('');
    definirSucesso('');
    let temporizador: ReturnType<typeof setTimeout> | undefined;

    try {
      const banco = criarClienteNavegador();
      const operacao = modo === 'entrar'
        ? banco.auth.signInWithPassword({ email: email.trim(), password: senha })
        : banco.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${window.location.origin}/redefinir-senha`,
          });
      const resultado = await Promise.race([
        operacao,
        new Promise<never>((_resolver, rejeitar) => {
          temporizador = setTimeout(() => rejeitar(new Error('TEMPO_LIMITE')), 20000);
        }),
      ]);

      if (resultado.error) {
        if (resultado.error.code === 'invalid_credentials') {
          definirErro('E-mail ou senha incorretos. Verifique os dados e tente novamente.');
        } else if (resultado.error.code === 'email_not_confirmed') {
          definirErro('Seu e-mail ainda não foi confirmado.');
        } else if (resultado.error.status === 429) {
          definirErro('Muitas tentativas. Aguarde um pouco antes de tentar novamente.');
        } else {
          definirErro('Não foi possível concluir a solicitação. Tente novamente.');
        }
        return;
      }

      if (modo === 'recuperar') {
        definirSucesso('Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.');
        return;
      }
      if (!('data' in resultado) || !resultado.data || !('session' in resultado.data) || !resultado.data.session) {
        definirErro('Não foi possível confirmar a sessão. Tente novamente.');
        return;
      }
      window.location.replace('/inicio');
    } catch (ocorrencia) {
      if (ocorrencia instanceof Error && ocorrencia.message === 'TEMPO_LIMITE') {
        definirErro('A autenticação excedeu o tempo esperado. Verifique sua conexão e tente novamente.');
      } else {
        definirErro('Não foi possível conectar ao serviço. Verifique sua conexão.');
      }
    } finally {
      if (temporizador) clearTimeout(temporizador);
      definirCarregando(false);
    }
  }

  return (
    <main className="on-login-fundo">
      <section className="on-login-quadro" aria-label="Acesso ao On ERP">
        <div className="on-login-faixa" aria-hidden="true">
          <img src="/icons/on-erp.svg" alt="" />
          <span>On ERP</span>
        </div>

        <div className="on-login-conteudo">
          <aside className="on-login-institucional">
            <div className="on-login-foto" aria-hidden="true" />
            <div className="on-login-texto">
              <h1>Controle, simplicidade e <strong>gestão integrada</strong> para o seu escritório.</h1>
              <span className="on-login-linha" aria-hidden="true" />
              <p>Uma plataforma para conectar pessoas, processos e resultados.</p>
            </div>
          </aside>

          <div className="on-login-painel">
            <img
              src="/marca/on-contabilidade-clara.svg"
              className="on-login-logo"
              alt="On Contabilidade"
            />
            <h2>{modo === 'entrar' ? 'Boas-vindas ao On ERP' : 'Recuperar acesso'}</h2>
            <p className="on-login-subtitulo">{modo === 'entrar' ? 'Gestão contábil e financeira' : 'Informe seu e-mail para receber o link de recuperação.'}</p>

            <form onSubmit={enviar} className="on-login-formulario">
              <div className="on-login-campo">
                <label htmlFor="email">E-mail</label>
                <div className="on-login-entrada">
                  <Mail aria-hidden="true" size={17} />
                  <input id="email" type="email" name="email" autoComplete="email" placeholder="Seu e-mail" value={email} onChange={e => definirEmail(e.target.value)} required disabled={carregando} />
                </div>
              </div>

              {modo === 'entrar' && <div className="on-login-campo">
                <label htmlFor="senha">Senha</label>
                <div className="on-login-entrada">
                  <LockKeyhole aria-hidden="true" size={17} />
                  <input id="senha" name="senha" type={mostrarSenha ? 'text' : 'password'} autoComplete="current-password" placeholder="Sua senha" value={senha} onChange={e => definirSenha(e.target.value)} minLength={6} required disabled={carregando} />
                  <button type="button" className="on-login-olho" onClick={() => definirMostrarSenha(!mostrarSenha)} aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={mostrarSenha}>
                    {mostrarSenha ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>}

              {erro && <p role="alert" className="on-login-aviso on-login-erro">{erro}</p>}
              {sucesso && <p role="status" className="on-login-aviso on-login-sucesso"><CheckCircle2 size={16} aria-hidden="true" />{sucesso}</p>}

              <button type="submit" className="on-login-entrar" disabled={carregando}>
                {carregando ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Enviar link'}
                {!carregando && <ArrowRight aria-hidden="true" size={17} />}
              </button>
            </form>

            <button className="on-login-link" type="button" onClick={() => trocarModo(modo === 'entrar' ? 'recuperar' : 'entrar')}>
              {modo === 'entrar' ? 'Esqueci minha senha' : 'Voltar ao login'}
            </button>

            {modo === 'entrar' && <>
              <div className="on-login-separador"><span>OU</span></div>
              <button type="button" className="on-login-id" disabled title="Integração de identidade ainda não configurada">
                Entrar com meu ID
              </button>
              <p className="on-login-indisponivel">Integração de identidade ainda não disponível.</p>
            </>}
            <p className="on-login-rodape">Acesso interno da On Contabilidade</p>
          </div>
        </div>
      </section>
    </main>
  );
}
