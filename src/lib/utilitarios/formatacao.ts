export function moeda(valor: number | string | null | undefined) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor ?? 0));
}
export function numero(valor: number | string | null | undefined) {
  return new Intl.NumberFormat('pt-BR').format(Number(valor ?? 0));
}
export function dataBrasileira(valor?: string | null) {
  if (!valor) return '—';
  const parte = valor.substring(0,10).split('-');
  return parte.length === 3 ? `${parte[2]}/${parte[1]}/${parte[0]}` : valor;
}
/** Competências são persistidas como AAAA-MM; a interface usa MM/AAAA. */
export function formatarCompetencia(valor: string | null | undefined): string {
  if(!valor)return '';
  const data=valor.match(/^(\d{4})-(0[1-9]|1[0-2])(?:-\d{2})?$/);
  if(data)return `${data[2]}/${data[1]}`;
  return /^(0[1-9]|1[0-2])\/\d{4}$/.test(valor)?valor:'';
}
export function interpretarCompetencia(valor: string | null | undefined): string | null {
  if(!valor)return null;
  const texto=valor.trim();
  const visual=texto.match(/^(0[1-9]|1[0-2])\/(\d{4})$/);
  if(visual)return `${visual[2]}-${visual[1]}`;
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(texto)?texto:null;
}
export function mesAtual() {
  const partes=new Intl.DateTimeFormat('pt-BR',{
    timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit'
  }).formatToParts(new Date());
  const ano=partes.find(parte=>parte.type==='year')?.value;
  const mes=partes.find(parte=>parte.type==='month')?.value;
  return `${ano}-${mes}`;
}
export function mesValido(valor?: string | null) {
  return interpretarCompetencia(valor)??mesAtual();
}
export function primeiroDiaMes(mes: string) { return `${mes}-01`; }
export function ultimoDiaMes(mes: string) { const [ano,mesNumero] = mes.split('-').map(Number); return new Date(Date.UTC(ano,mesNumero,0)).toISOString().slice(0,10); }
export function rotuloMes(mes: string) { return formatarCompetencia(mes); }
export function digitos(texto: string) { return texto.replace(/\D/g,''); }
export function valorMonetarioBr(valor: string) {
  const limpo = valor.trim().replace(/\s|R\$/g,'');
  const normalizado = limpo.includes(',') ? limpo.replace(/\./g,'').replace(',','.') : limpo;
  const numeroConvertido = Number(normalizado);
  if (!normalizado || !Number.isFinite(numeroConvertido)) throw new Error('Informe um valor monetário válido.');
  return Math.round(numeroConvertido * 100) / 100;
}
export function normalizarData(valor: FormDataEntryValue | null) { return String(valor ?? '').trim() || null; }
export function limparTexto(valor: FormDataEntryValue | null, limite=400) { return String(valor ?? '').trim().slice(0,limite); }
export function textoObrigatorio(valor: FormDataEntryValue | null, rotulo: string, limite=250) {
  const texto = limparTexto(valor,limite); if (!texto) throw new Error(`${rotulo} é obrigatório.`); return texto;
}

/** Aplica máscara para apresentação sem alterar o dado salvo (somente dígitos). */
export function formatarDocumento(valor: string | null | undefined, tipo?: 'PF' | 'PJ' | string): string {
  if (!valor) return '—';
  const numeros = digitos(valor);
  if ((tipo === 'PJ' || numeros.length === 14) && numeros.length === 14) {
    return numeros.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  if ((tipo === 'PF' || numeros.length === 11) && numeros.length === 11) {
    return numeros.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
  return valor;
}

/** Máscara progressiva, apropriada para digitação no formulário de cadastro. */
export function mascararDocumento(valor: string, tipo: 'PF' | 'PJ'): string {
  const numeros = digitos(valor).slice(0, tipo === 'PJ' ? 14 : 11);
  if (tipo === 'PJ') {
    return numeros.replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return numeros.replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})(\d)/, '$1-$2');
}
