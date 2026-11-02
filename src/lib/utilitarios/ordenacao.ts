/** Ordenação uniforme dos cadastros. Não altera a ordem cronológica de movimentações. */
const comparador = new Intl.Collator('pt-BR', {numeric: true, sensitivity: 'base', ignorePunctuation: false});

export function compararTextos(a: unknown, b: unknown): number {
  return comparador.compare(String(a ?? '').trim(), String(b ?? '').trim());
}

/** Se ambos têm código: ordena por código crescente (1, 2, 10).
 * Na ausência de código: ordena pelo nome/descrição (A–Z).
 * Registros codificados precedem registros sem código.
 */
export function ordenarCadastros<T>(itens: readonly T[], obterCodigo: (item:T)=>unknown, obterDescricao:(item:T)=>unknown): T[] {
  return [...itens].sort((a,b)=>{
    const codigoA = String(obterCodigo(a) ?? '').trim();
    const codigoB = String(obterCodigo(b) ?? '').trim();
    if(codigoA && codigoB) return compararTextos(codigoA,codigoB) || compararTextos(obterDescricao(a),obterDescricao(b));
    if(codigoA || codigoB) return codigoA ? -1 : 1;
    return compararTextos(obterDescricao(a),obterDescricao(b));
  });
}

export function ordenarPorDescricao<T>(itens: readonly T[], obterDescricao:(item:T)=>unknown):T[] {
  return [...itens].sort((a,b)=>compararTextos(obterDescricao(a),obterDescricao(b)));
}
