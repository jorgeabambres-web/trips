# Guia de Execução das Migrações

## Passo 1: Abrir Supabase SQL Editor

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto "Trips"
3. No menu esquerdo, clique em **"SQL Editor"**

## Passo 2: Executar a Migration

1. Clique em **"New Query"**
2. Cole o conteúdo do arquivo `migrations_accommodations.sql`
3. Clique em **"Run"** (atalho: Ctrl+Enter)

## O que será criado/modificado:

✅ Adiciona campos `latitude` e `longitude` na tabela `accommodations`
✅ Cria nova tabela `accommodation_suggestions` para armazenar sugestões de restaurantes salvas
✅ Configura Row Level Security (RLS) para segurança

## Confirmar que funcionou

Na seção "Tables" do Supabase, você deve ver:
- `accommodations` com novos campos
- `accommodation_suggestions` como nova tabela

Depois disso, você pode: `git add . && git commit -m "feat: geolocalização e sugestões de hospedagem" && git push`
