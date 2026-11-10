const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const raiz=path.resolve(__dirname,'..');
const ler=arquivo=>fs.readFileSync(path.join(raiz,arquivo),'utf8');

test('MEI apresenta receitas do ANO, não somente da competência atual',()=>{
  const tela=ler('src/app/(painel)/fiscal/faturamento/mei/page.tsx');
  assert.match(tela,/const receitasAno=itens\.filter\(item=>item\.tipo_movimento==='RECEITA'\)/);
  assert.match(tela,/Receitas cadastradas no ano/);
  assert.match(tela,/receitasAno\.map\(item=>/);
  assert.match(tela,/Gerenciar receitas/);
  assert.match(tela,/<AcoesMovimento id=\{item\.id\}/);
});

test('Convencional permite editar operações de qualquer mês no ano',()=>{
  const tela=ler('src/app/(painel)/fiscal/faturamento/convencional/page.tsx');
  assert.match(tela,/const registrosAno=movimentosAno\.filter/);
  assert.match(tela,/registrosAno\.map\(item=>/);
  assert.match(tela,/<AcoesMovimento id=\{item\.id\}/);
});

test('Ações fiscais exibem Editar e Excluir na tabela',()=>{
  const tabela=ler('src/modulos/fiscal/componentes/acoes-movimento.tsx');
  assert.match(tabela,/> Editar<\/Link>/);
  assert.match(tabela,/BotaoConfirmar/);
});

test('Componente comum mantém modal aberto, limpa campos e mostra confirmação',()=>{
  const componente=ler('src/componentes/globais/formulario-continuo.tsx');
  assert.match(componente,/event[o]?\.preventDefault\(\)/);
  assert.match(componente,/formulario\.reset\(\)/);
  assert.match(componente,/roteador\.refresh\(\)/);
  assert.match(componente,/if\(modo==='cadastro'\)limparCampos/);
  assert.match(componente,/definirMensagem\(/);
});

test('Ações de cadastro não redirecionam em caso de sucesso',()=>{
  const fiscal=ler('src/modulos/fiscal/acoes.ts');
  const societario=ler('src/modulos/societario/acoes.ts');
  assert.match(fiscal,/return \{sucesso:true,mensagem:id\?/);
  assert.match(societario,/Cliente cadastrado\. Você pode incluir outro/);
  assert.match(societario,/Registro cadastrado\. Você pode incluir outro/);
});

test('Formulários de inclusão usam a mesma rotina global',()=>{
  const caminhos=[
    'src/modulos/fiscal/componentes/formulario-movimento.tsx',
    'src/modulos/societario/componentes/formulario-cliente.tsx',
    'src/modulos/societario/componentes/secoes-cliente.tsx',
    'src/app/(painel)/societario/tarefas/page.tsx',
    'src/app/(painel)/societario/documentos/page.tsx',
    'src/app/(painel)/fiscal/categorias/page.tsx',
    'src/app/(painel)/configuracoes/page.tsx'
  ];
  for(const caminho of caminhos)assert.match(ler(caminho),/FormularioContinuo/,caminho);
});
