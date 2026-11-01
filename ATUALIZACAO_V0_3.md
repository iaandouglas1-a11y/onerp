# On ERP v0.3 — Relatórios de faturamento em PDF

- Substitui exportação CSV por PDF para MEI, convencional e visão consolidada.
- Cabeçalho no padrão On ERP, identificação, indicadores, detalhamento, numeração de páginas e observações.
- MEI: relatório anual com 12 competências, valores por atividade, ajustes e limite configurado.
- Convencional: relatório mensal em A4 paisagem, com receitas, entradas e despesas separados.
- Geração no servidor após autenticação e validação do escritório; arquivo não é gravado em bucket.
- Dependência adicionada: `pdf-lib`.

## Implantação

Substitua os arquivos deste ZIP de atualização no repositório e envie o `package.json` atualizado. A Vercel instalará `pdf-lib` durante o novo build. O projeto original não possui `package-lock.json`.

Não é necessário executar SQL ou alterar o Supabase.

## Verificação necessária

Testar geração MEI e convencional em produção com caracteres acentuados, grande volume de linhas, usuário sem autorização e parâmetros MEI ausentes.
