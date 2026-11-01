const teste = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

const codigo = fs.readFileSync('src/lib/utilitarios/formatacao.ts', 'utf8');
const javascript = ts.transpileModule(codigo, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const modulo = { exports: {} };
new Function('module', 'exports', javascript)(modulo, modulo.exports);
const { formatarDocumento, mascararDocumento, digitos } = modulo.exports;

teste('CNPJ exibido com a máscara 00.000.000/0000-00', () => {
  assert.equal(formatarDocumento('12345678000190'), '12.345.678/0001-90');
  assert.equal(mascararDocumento('12345678000190', 'PJ'), '12.345.678/0001-90');
  assert.equal(digitos('12.345.678/0001-90'), '12345678000190');
});

teste('CPF mantém máscara própria', () => {
  assert.equal(formatarDocumento('12345678901'), '123.456.789-01');
  assert.equal(mascararDocumento('12345678901', 'PF'), '123.456.789-01');
});

teste('documento ausente não causa falha de apresentação', () => {
  assert.equal(formatarDocumento(null), '—');
});
