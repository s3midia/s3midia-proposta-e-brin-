# s3midia-proposta-e-brin-
Portal S3 

Painel com abas Briefings e Propostas, preparado para Vercel (Node 22) e Firebase Firestore.

## Publicação

Importe este repositório na Vercel, na raiz, com `npm run build` e saída `public`. Configure as variáveis de `.env.example` exclusivamente no servidor. Nunca publique chaves privadas.

Projeto Firebase: `s3midia-proposta-e-brin`. O Firestore deve permanecer com acesso direto negado; o servidor usa uma conta de serviço limitada. Ative Authentication por e-mail/senha, crie e verifique o administrador autorizado em `ADMIN_EMAILS`.

## Estado

Build e oito testes locais passaram. Credenciais da Vercel, autenticação, testes conectados e migração dos registros antigos ainda pendentes. Nenhum dado real de cliente está incluído neste repositório.

As propostas são salvas pelo botão Salvar propostas no Firebase. A IA abre o gerador anteriormente publicado; não existe integração de IA no novo servidor.

## Migração

`scripts/export-legacy.php` exporta o banco antigo por linha de comando, nunca pela web. Valide o JSON com `node scripts/import.mjs /caminho/exportacao.json`; use `--apply` somente com credenciais configuradas e exportação conferida. Registros existentes não são sobrescritos. Catálogo e histórico do gerador antigo precisam de exportação separada.

## Verificação

Execute `npm ci`, `npm test` e `npm run build`. Valide login, envio, reabertura e salvamento no ambiente conectado antes de alterar o domínio existente.
