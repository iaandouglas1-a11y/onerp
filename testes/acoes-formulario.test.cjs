const teste = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const raiz = join(__dirname, '..');
const codigoAcoes = readFileSync(join(raiz,'src/modulos/societario/acoes.ts'),'utf8');
const codigoPagina = readFileSync(join(raiz,'src/app/(painel)/societario/tarefas/page.tsx'),'utf8');

teste('formulário rápido de tarefas usa ação com retorno Promise<void>', () => {
  assert.match(codigoAcoes,/export\s+async\s+function\s+atualizarSituacaoTarefaFormulario\s*\(\s*dados\s*:\s*FormData\s*\)\s*:\s*Promise<void>/);
  assert.match(codigoAcoes,/await\s+atualizarSituacaoTarefa\(dados\)/);
  assert.match(codigoPagina,/<form action=\{atualizarSituacaoTarefaFormulario\}>/);
  assert.doesNotMatch(codigoPagina,/<form action=\{atualizarSituacaoTarefa\}>/);
});

teste('modal de mudança de situação mantém retorno para FormularioContinuo', () => {
  const codigoDetalhe=readFileSync(join(raiz,'src/app/(painel)/societario/tarefas/[id]/page.tsx'),'utf8');
  assert.match(codigoDetalhe,/FormularioContinuo[^>]+acao=\{atualizarSituacaoTarefa\}/);
});
