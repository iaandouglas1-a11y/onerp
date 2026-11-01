# On ERP — decisões de implementação (v0.1)

## Aprovações incorporadas

- Desktop-first e layout minimalista com ícones lineares, tipografia leve e paleta #0A111C / #7CB93C / #F4F6F8 / #9AA5B4.
- Pastas globais e modulares; identificadores de variáveis, funções e constantes de domínio em português.
- Banco Supabase existente com nomes em português e RLS preservados.
- Societário completo no sentido de telas e rotinas operacionais principais (não significa homologação de produção).
- Fiscal inicial limitado ao controle de faturamento MEI e convencional. Sem emissão de DAS e sem apuração tributária.

## Regras de negócio que exigem validação

1. **MEI:** os limites não são codificados. Um administrador registra ano, valor, percentual de alerta, proporcionalidade e fundamento legal. O acumulado soma receitas e ajustes justificados; entradas e despesas não integram o limite.
2. **Regime tributário:** a tabela `clientes` registra somente o regime atual, portanto relatórios históricos por regime exigem evolução de dados para mudanças de enquadramento.
3. **Documentos:** bucket privado, URL de curta duração, controle por cliente; faltam antivírus e política formal de retenção de dados.
4. **Auditoria:** o cofre tem histórico de revelações; a migração complementar `002` ativa eventos de INSERT/UPDATE/DELETE sem valores sensíveis. Políticas formais de retenção devem ser definidas antes da produção.
5. **Tarefas:** recorrência é cadastrada em modelo e obrigações concretas, mas não há gerador automático de competências nem calendário de feriados nesta versão.
6. **Multiusuário:** cadastro de novos membros/convites não está exposto ainda. Vinculação existente pode ser administrada no Supabase.
7. **LGPD:** formalizar base legal, retenção, acesso mínimo, medidas incidentais, backups e plano de resposta a incidentes.
8. **Cofre:** não possui recuperação da chave criptográfica. Efetuar backup seguro da chave e controlar sua rotação antes de uso real.
9. **Mobile:** foco em consulta; tarefas e cadastros complexos devem ser operados preferencialmente no desktop.

## Critérios de aceitação antes de produção

- `npm test`, `npm run verificar-tipos`, `npm run lint`, `npm run build` concluídos.
- Testar com conta owner, admin, analyst e viewer; isolar dois escritórios e impedir cruzamento de dados e uploads.
- Confirmar HTTPS, cookies, expiração de sessão e MFA para perfis administrativos.
- Conferir IDs, FKs, restrições e RLS da migração instalada (não apenas pela definição SQL).
- Executar testes de anexos (tipo, tamanho e acesso por outro escritório).
- Garantir armazenamento seguro da chave do cofre e impedir vazamento em erros e logs.
- Definir e homologar indicadores MEI para anos de abertura, alterações cadastrais e ajuste de receitas.
