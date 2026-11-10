// Testes das funções puras, sem acesso ao Supabase e sem dados reais.
const teste = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const codigo = fs.readFileSync('src/modulos/fiscal/calculos.ts', 'utf8');
const compilado = ts.transpileModule(codigo,{ compilerOptions:{ module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020 }}).outputText;
const modulo = { exports:{} };
new Function('module','exports', compilado)(modulo,modulo.exports);
const { limiteEfetivoMei,totalizarReceitas,situacaoLimite }=modulo.exports;
teste('limite proporcional ao ano de abertura sem valor legal fixo',()=>{
  assert.equal(limiteEfetivoMei({ano_calendario:2026,limite_anual:120000,proporcional_ano_abertura:true,percentual_alerta:.8},'2026-07-15'),60000);
});
teste('não inclui entradas e despesas no faturamento',()=>{
  const resultado=totalizarReceitas([
    {tipo_movimento:'RECEITA',valor:1000,atividade_receita:'SERVICOS',competencia:'2026-01-01'},
    {tipo_movimento:'DESPESA',valor:300,competencia:'2026-01-01'},
    {tipo_movimento:'ENTRADA',valor:400,competencia:'2026-01-01'},
  ],[{valor:-20}]);
  assert.equal(resultado.total,980);assert.equal(resultado.servicos,1000);
});
teste('alerta e ultrapassagem são resultados distintos',()=>{
  assert.equal(situacaoLimite(850,1000,.8).situacao,'ATENCAO');
  assert.equal(situacaoLimite(1001,1000,.8).situacao,'ULTRAPASSADO');
  assert.equal(situacaoLimite(1000,1000,.8).situacao,'ATENCAO');
});

teste('evolução mensal MEI usa percentual acumulado, não percentual isolado por mês', () => {
  const meses = modulo.exports.evolucaoMensalMei(2026,[
    {tipo_movimento:'RECEITA',valor:1000,atividade_receita:'SERVICOS',competencia:'2026-01-01'},
    {tipo_movimento:'RECEITA',valor:2000,atividade_receita:'COMERCIO',competencia:'2026-02-01'},
    {tipo_movimento:'DESPESA',valor:900,competencia:'2026-02-01'},
  ],[{competencia:'2026-02-01',valor:-100}],10000);
  assert.equal(meses.length,12);
  assert.equal(meses[0].percentualAcumulado,0.1);
  assert.equal(meses[1].total,1900);
  assert.equal(meses[1].percentualAcumulado,0.29);
  assert.equal(meses[11].percentualAcumulado,0.29);
});

teste('sem limite aprovado, evolução MEI não inventa percentual', () => {
  const meses = modulo.exports.evolucaoMensalMei(2026,[],[],null);
  assert.equal(meses[0].percentualAcumulado,null);
});
