# On ERP — v0.4.0 (Societário e Fiscal)

Sistema interno da **On Contabilidade**, com foco em desktop e consultas responsivas. Identidade visual: `#0A111C`, `#7CB93C`, `#F4F6F8`, `#9AA5B4`.

## Funcionalidades neste pacote

Esta versão consolida as melhorias de navegação e formulários da v0.2, a exportação PDF da v0.3 e a correção de compilação do gerador PDF da v0.3.1. Consulte `ATUALIZACAO_V0_2.md`, `ATUALIZACAO_V0_3.md` e `ATUALIZACAO_V0_3_1.md` para o histórico.

- **Acesso** por e-mail/senha com Supabase Auth; criação inicial de escritório e vínculo automático do primeiro administrador pelo gatilho existente do banco.
- **Dashboard** com dados reais dos clientes, tarefas, obrigações e receitas fiscais (não confunde receitas dos clientes com honorários do escritório).
- **Societário**: clientes PJ/PF, edição, endereços, representantes, contatos, serviços contratados, observações, documentos privados, credenciais criptografadas, onboarding, obrigações recorrentes e tarefas com checklist/comentários. Kanban por situação, sem drag-and-drop na primeira versão.
- **Fiscal**: lançamentos de receitas, entradas e despesas, competência, categorias, consultas convencional e MEI, relatórios PDF, ajustes MEI e acompanhamento do limite parametrizado e aprovado.
- **PWA**: manifesto, ícones e tela de indisponibilidade, sem cache offline de dados confidenciais.
- **Não implementados**: cálculos de folha/contábil, emissão de guias, integrações governamentais, envio de cobranças e demais módulos futuros.

## Requisitos

Node.js 20.9+ (recomendado 22), npm, projeto Supabase com os **50 nomes de tabelas e colunas em português** da migração já aplicada.

## 1. Instalar e configurar

```bash
npm install
cp .env.exemplo .env.local
npm run dev
```

Preencha em `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto em **Supabase → Project Settings → API**.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: chave pública/publishable do Supabase; não confundir com service role.
- `SUPABASE_SERVICE_ROLE_KEY`: exclusiva do servidor, necessária apenas ao cofre protegido.
- `COFRE_CHAVE_CRIPTOGRAFIA`: 32 bytes em Base64; gere com `openssl rand -base64 32`. **Guardar em cofre externo; não perder a chave**, pois ela é necessária para descriptografar os registros.

Nunca colocar as duas últimas variáveis sob `NEXT_PUBLIC_`, nem no GitHub. Não use valores reais em `.env.exemplo`.

## 2. Supabase (banco já existente)

**Não executar de novo** o SQL de criação das 50 tabelas, nem a migração de nomes já aplicada. Para habilitar envio de documentos, execute os **dois ajustes incrementais** do diretório `supabase/ajustes` no SQL Editor, nesta ordem:

1. `001_armazenamento_privado.sql` — bucket `on-erp-private` e acesso privado por escritório/cliente.
2. `002_auditoria_operacional.sql` — gatilhos de auditoria de criação, edição e exclusão, sem registrar conteúdo sensível.

Em **Authentication → Users**, crie a conta de usuário do escritório. O aplicativo usa login por e-mail/senha; cadastro público fica desabilitado na interface. Ao entrar pela primeira vez, preencha o formulário de **Configuração inicial** para criar o escritório, com o vínculo `owner` pelo gatilho já existente.

Recomendação: desabilite autocadastro público em Authentication, ative MFA para os administradores e configure políticas de senhas. MFA ainda não é exigido automaticamente pelo aplicativo desta versão.

## 3. Primeiro uso

1. Entre em `/entrar` com usuário cadastrado no Supabase Auth.
2. Cadastre o escritório.
3. Cadastre serviços em **Societário → Serviços**.
4. Cadastre clientes; selecione `MEI` no regime quando necessário.
5. Cadastre contatos, endereços, serviços, tarefas, obrigações e documentos nas abas do cliente.
6. Em **Configurações**, informe e aprove **manualmente** a regra de limite MEI do ano com fundamento legal revisado. Nenhum valor legal é embutido no código.
7. Registre receitas em **Fiscal → Novo lançamento**. Para MEI, classifique comércio/indústria/serviços. As entradas e despesas ficam separadas e não compõem faturamento.

## 4. Testar e versionar

```bash
npm test
npm run verificar-tipos
npm run lint
npm run build
```

Os testes incluem verificações dos cálculos puros do faturamento MEI. **Atenção:** este ZIP foi gerado sem instalação de dependências, pois o ambiente de geração não dispõe de acesso ao registro npm; o build/lint completos devem ser executados após `npm install`. Faça o commit de `package-lock.json`, que o npm gerará, para reprodutibilidade.

## 5. GitHub e Vercel

Crie repositório vazio, coloque todos os arquivos deste ZIP na **raiz do repositório** (onde está `package.json`) e envie para a branch `main`. Na Vercel, importe o repositório, escolha framework **Next.js**, configure as variáveis de ambiente acima em Development/Preview/Production conforme necessário e faça o deploy. Configure no Supabase os endereços da aplicação e de autenticação autorizados.

Nunca exponha service role ou chave de criptografia. Use projetos Supabase distintos para desenvolvimento e produção, sempre que possível.

## Estrutura de pastas

```text
src/
  app/                       # rotas Next.js, layouts, manifesto e estados
  componentes/globais/       # interface reutilizável e navegação
  lib/supabase/              # clientes servidor/navegador, sessão e serviço restrito
  lib/seguranca/             # permissões e criptografia do cofre
  lib/utilitarios/           # datas, moedas e validação
  modulos/societario/        # ações, consultas e componentes de clientes
  modulos/fiscal/            # ações, consultas, cálculos e componentes
  tipos/                     # contratos TypeScript compartilhados
supabase/ajustes/            # SQL incremental do Storage (não recria banco)
testes/                      # testes puros de faturamento
documentacao/                # decisões, riscos e mapeamento técnico
public/icons/               # identidade visual / PWA
```

## Segurança e limitações da primeira versão

- As políticas **RLS já existentes no banco** controlam leitura e gravação por escritório. A aplicação também exige vínculo autenticado e validações de cliente/escritório antes de operações críticas.
- O cofre usa AES-256-GCM no servidor e grava `conteudo_criptografado`. A leitura é permitida só para `owner/admin` e registrada em `historico_acessos_credenciais`. Sem chaves privadas, o cofre fica desabilitado. O serviço restrito ignora RLS por definição, portanto a dupla verificação de perfil e escritório no servidor é obrigatória.
- Acesso ao documento utiliza URL assinada de curta duração. O Storage não concede URL pública.
- O app não inclui varredura antimalware do conteúdo de arquivos. MIME e tamanho são limitados; faça inspeção antivírus ou serviço de varredura antes de usar com documentos de origem não confiável.
- A auditoria de inserções/alterações/exclusões é habilitada pelo ajuste `002`, registrando autor, tabela e operação sem valores de campos. Antes de produção, definir controles de retenção, testes de integridade e trilhas mais detalhadas quando necessárias.
- A existência de tabela `modelos_obrigacoes` não implica criação automática de novas competências; essa automação será implementada depois.
- Regime tributário atual do cliente é utilizado para separar MEI e convencional; a evolução precisa preservar o **histórico de enquadramento** para relatórios retroativos.
- O PDF exportado é um relatório gerencial interno, não substitui documento fiscal ou declaração oficial.
- Os 50 nomes de tabelas do schema anterior foram preservados. Os valores internos de `situacao`/`perfil_acesso` também foram mantidos em inglês onde já existiam restrições CHECK no banco, evitando uma nova migração incompatível.

Consulte `documentacao/decisoes.md` para os próximos pontos de homologação.


## Alterações consolidadas na versão 0.4.0

- Ações **Editar** e **Excluir** aparecem na primeira coluna das listagens de faturamento MEI, convencional e geral. Edição: registros manuais e perfis autorizados; exclusão: registros manuais por administrador/proprietário. Registros importados mostram ações desabilitadas, sem permitir alterar dados de origem externa.
- Campos e listagens exibem CNPJ no formato `00.000.000/0000-00` e CPF em `000.000.000-00`, com persistência dos dígitos sem máscara.
- O PDF de faturamento MEI tem **uma única página A4**, resumo anual, barra de progresso do limite e tabela de 12 meses com **Mês, Total e Progressão do limite (%)**. Percentuais são acumulados. Detalhamentos, ajustes e observações não são exibidos; os ajustes existentes continuam compondo os valores calculados.
- O cabeçalho dos PDFs utiliza o logotipo On Contabilidade, sem "On ERP" ou "controle interno do escritório". A navegação e o login mostram a marca oficial.
- **Banco**: nenhuma migração adicional nesta versão. **Bibliotecas**: mantidas as dependências da v0.3.1.

Leia também `ATUALIZACAO_V0_4_0.md` para instruções de deploy e testes.


## Alterações v0.4.1
Consulte `ATUALIZACAO_V0_4_1.md` e execute a migração SQL `supabase/ajustes/003_permissoes_operacionais_unificadas.sql` antes de testar permissões operacionais ampliadas.
