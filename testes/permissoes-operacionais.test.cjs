const teste = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

function fonte(caminho) { return fs.readFileSync(caminho, 'utf8'); }

const acoes = fonte('src/modulos/fiscal/componentes/acoes-movimento.tsx');
const fiscal = fonte('src/modulos/fiscal/acoes.ts');
const autorizacao = fonte('src/lib/seguranca/contexto.ts');
const sql = fonte('supabase/ajustes/003_permissoes_operacionais_unificadas.sql');

teste('Editar e Excluir são renderizados sem bloqueio por perfil ou origem', () => {
  assert.match(acoes, /<Link[^>]+href=\{rotaEdicao\}/);
  assert.match(acoes, /<BotaoConfirmar/);
  assert.doesNotMatch(acoes, /permitirEdicao|permitirExclusao/);
});

teste('Operações fiscais respeitam identificação do escritório mas aceitam lançamentos importados', () => {
  assert.match(fiscal, /exigirEdicao\(\)/);
  assert.match(fiscal, /\.eq\('escritorio_id',escritorioId\)/);
  assert.doesNotMatch(fiscal, /if\(registro\.origem!=='MANUAL'\)/);
  assert.doesNotMatch(fiscal, /if\(existente\.origem!=='MANUAL'\)/);
  assert.doesNotMatch(fiscal, /\.eq\('origem','MANUAL'\)\.select\('id'\)/);
});

teste('Edição exige usuário autenticado com vínculo ativo ao escritório', () => {
  assert.match(autorizacao, /banco\.auth\.getUser\(\)/);
  assert.match(autorizacao, /\.eq\('ativo',true\)/);
  assert.match(autorizacao, /if \(!contexto\.escritorioId\) redirect/);
});

teste('Migração preserva RLS e exige membro ativo em toda exclusão operacional', () => {
  assert.match(sql, /app\.is_member\(escritorio_id\)/);
  assert.match(sql, /membro\.ativo = true/);
  assert.match(sql, /TO authenticated/);
  assert.doesNotMatch(sql, /DISABLE ROW LEVEL SECURITY|TO anon|GRANT ALL ON ALL TABLES/i);
});
