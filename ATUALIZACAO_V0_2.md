# On ERP — atualização incremental 0.2.0

Base utilizada: pacote `on_erp_codigo_v0_1.zip`, somado à correção da tela de login disponibilizada posteriormente e à correção do `purpose` do manifesto PWA. Não é um clone sincronizado do repositório GitHub em produção; antes do commit, compare com modificações feitas diretamente no repositório após a versão 0.1.

## Alterações

1. **Cabeçalho:** removidos os rótulos "On ERP" e "Ambiente seguro" da barra superior. Logo da marca permanece no menu lateral.
2. **Clientes:** edição por modal; botões de inativar/reativar e excluir. Exclusão permanente é restrita a perfis `owner/admin` e bloqueada quando houver informações vinculadas. A inativação mantém todo o histórico.
3. **Formulários:** cadastros e edições abertos por botões em modais. A listagem permanece visível e ocupa toda a largura da área útil. Cadastro inicial obrigatório do escritório é exceção: continua página própria por ocorrer antes da navegação.
4. **Navegação:** módulos se expandem para apresentar suas funções. Os menus de Contábil, Folha e Financeiro também aparecem, com funções futuras desabilitadas e sinalizadas.
5. **Fiscal:** edição e exclusão de movimentações manuais em Faturamento geral, MEI e Convencional. Exclusão restrita a administradores, conforme RLS existente. Movimentações importadas exigem correção na rotina de origem.
6. **Relatórios:** exportação CSV no Faturamento MEI (ano inteiro e detalhamento) e Convencional (competência selecionada, resumo por natureza e detalhamento). CSV UTF-8 com BOM, separador `;`, proteção contra fórmula injetada em célula.

## Instalação no repositório existente

- **ZIP completo:** contém a raiz inteira do projeto. Extrair e substituir os arquivos existentes; preservar arquivos adicionais criados depois no GitHub.
- **ZIP de atualização:** contém somente os arquivos modificados ou novos; extrair por cima da raiz do repositório.
- Confirmar que `src/app/manifest.ts` contém `purpose: 'maskable'` (e não `any maskable`).
- Confirmar que `src/app/(autenticacao)/entrar/page.tsx` corresponde ao login corrigido (com tratamento de erro).
- Fazer commit na branch `main`; a Vercel deve executar um novo build.
- **Nenhuma migração adicional de tabelas é necessária** para esta versão. Entretanto, assegurar que os ajustes anteriores `supabase/ajustes/001_armazenamento_privado.sql` e `002_auditoria_operacional.sql` foram executados. A trilha de auditoria depende do ajuste 002.

## Validação recomendada após deploy

1. Conferir acesso com perfil administrador e perfil somente leitura.
2. Adicionar/editar cliente e testar inativar/reativar. Testar excluir apenas em cliente de teste sem vínculos.
3. Abrir os modais de contatos, representantes, endereços, tarefas, serviços, documentos e configuração de limite.
4. Lançar receita manual MEI e verificar edição/exclusão refletida no total acumulado.
5. Lançar receita, entrada e despesa convencional e confirmar que apenas receita compõe faturamento.
6. Baixar os dois CSVs, abrir no Excel e conferir competência, totais, cabeçalhos e caracteres acentuados.
7. Verificar em `eventos_auditoria` as operações após os testes e confirmar as políticas RLS por perfil.

## Limitações mantidas

- Dados importados não podem ser excluídos por essas ações rápidas.
- Exclusão permanente não apaga vínculos históricos por cascata; prefira inativar clientes operacionais.
- Exportação é relatório gerencial CSV, não documento fiscal oficial ou declaração MEI.
- Nenhuma integração governamental foi ativada.
- Testes de integração Supabase/Vercel e o build completo precisam ocorrer no ambiente de deploy.
