-- Libera LEITURA anônima para o link painel.html?ver
-- Rodar no Supabase: SQL Editor > New query > colar > Run.
-- Não concede INSERT/UPDATE/DELETE: a escrita continua dependendo das políticas já existentes.

grant select on public.pessoas, public.atividades, public.sorteios, public.config to anon;

drop policy if exists "leitura publica" on public.pessoas;
drop policy if exists "leitura publica" on public.atividades;
drop policy if exists "leitura publica" on public.sorteios;
drop policy if exists "leitura publica" on public.config;

create policy "leitura publica" on public.pessoas    for select to anon using (true);
create policy "leitura publica" on public.atividades for select to anon using (true);
create policy "leitura publica" on public.sorteios   for select to anon using (true);
create policy "leitura publica" on public.config     for select to anon using (true);

-- CONFERÊNCIA (rodar depois): nenhuma linha abaixo deve ter cmd INSERT/UPDATE/DELETE/ALL
-- com roles contendo {anon} ou {public}. Se tiver, o anônimo consegue editar pela API.
select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename in ('pessoas', 'atividades', 'sorteios', 'config')
order by tablename, cmd;
