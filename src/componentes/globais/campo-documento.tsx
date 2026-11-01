'use client';

import { useEffect, useRef, useState } from 'react';
import { digitos, mascararDocumento } from '@/lib/utilitarios/formatacao';

/** Campo CPF/CNPJ com máscara visual. A gravação continua recebendo apenas dígitos no servidor. */
export function CampoDocumento({
  nome = 'cpf_cnpj',
  rotulo = 'CPF/CNPJ',
  padrao,
  obrigatorio = false,
  tipoPadrao,
}: {
  nome?: string;
  rotulo?: string;
  padrao?: string | null;
  obrigatorio?: boolean;
  tipoPadrao?: 'PJ' | 'PF';
}) {
  const referencia = useRef<HTMLInputElement>(null);
  const [valor, definirValor] = useState(() => {
    const tipo = tipoPadrao ?? (digitos(padrao ?? '').length > 11 ? 'PJ' : 'PF');
    return mascararDocumento(padrao ?? '', tipo);
  });
  useEffect(() => {
    const formulario = referencia.current?.form;
    if (!formulario) return;
    const reiniciar = () => definirValor('');
    formulario.addEventListener('reset', reiniciar);
    return () => formulario.removeEventListener('reset', reiniciar);
  }, []);
  function atualizar(texto: string) {
    const quantidade = digitos(texto).length;
    const tipo = tipoPadrao ?? (quantidade > 11 ? 'PJ' : 'PF');
    definirValor(mascararDocumento(texto, tipo));
  }
  return <div className="campo">
    <label htmlFor={nome}>{rotulo}{obrigatorio ? ' *' : ''}</label>
    <input ref={referencia} id={nome} name={nome} type="text" inputMode="numeric" autoComplete="off"
      required={obrigatorio} maxLength={18} placeholder={tipoPadrao === 'PJ' ? '00.000.000/0000-00' : 'CPF ou CNPJ'}
      value={valor} onChange={evento => atualizar(evento.target.value)}/>
  </div>;
}
