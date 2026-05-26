-- Habilitar extensão de UUID
create extension if not exists "uuid-ossp";

-- =====================
-- TRIPS
-- =====================
create table trips (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  nome text not null,
  destino text not null,
  data_inicio date not null,
  data_fim date not null,
  orcamento_total numeric(12,2),
  moeda_principal text default 'BRL',
  observacoes text,
  created_at timestamptz default now()
);

alter table trips enable row level security;
create policy "users see own trips" on trips for all using (auth.uid() = user_id);

-- =====================
-- ACCOMMODATIONS
-- =====================
create table accommodations (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references trips(id) on delete cascade not null,
  nome text not null,
  bairro text,
  endereco text,
  checkin date not null,
  checkout date not null,
  valor numeric(12,2),
  moeda text default 'BRL',
  status text default 'confirmada',
  observacoes text
);

alter table accommodations enable row level security;
create policy "users see own accommodations" on accommodations for all
  using (exists (select 1 from trips where trips.id = trip_id and trips.user_id = auth.uid()));

-- =====================
-- TRIP_DAYS
-- =====================
create table trip_days (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references trips(id) on delete cascade not null,
  data date not null,
  cidade text,
  resumo text
);

alter table trip_days enable row level security;
create policy "users see own trip_days" on trip_days for all
  using (exists (select 1 from trips where trips.id = trip_id and trips.user_id = auth.uid()));

-- =====================
-- ACTIVITIES
-- =====================
create table activities (
  id uuid primary key default uuid_generate_v4(),
  trip_day_id uuid references trip_days(id) on delete cascade not null,
  nome text not null,
  horario_inicio time,
  horario_fim time,
  custo_previsto numeric(10,2),
  custo_real numeric(10,2),
  categoria text default 'passeios',
  status text default 'planejada',
  observacoes text
);

alter table activities enable row level security;
create policy "users see own activities" on activities for all
  using (exists (
    select 1 from trip_days
    join trips on trips.id = trip_days.trip_id
    where trip_days.id = trip_day_id and trips.user_id = auth.uid()
  ));

-- =====================
-- EXPENSES
-- =====================
create table expenses (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references trips(id) on delete cascade not null,
  data date not null,
  categoria text not null,
  descricao text,
  valor numeric(12,2) not null,
  moeda text default 'BRL',
  observacao text,
  created_at timestamptz default now()
);

alter table expenses enable row level security;
create policy "users see own expenses" on expenses for all
  using (exists (select 1 from trips where trips.id = trip_id and trips.user_id = auth.uid()));

-- =====================
-- FLIGHTS
-- =====================
create table flights (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references trips(id) on delete cascade not null,
  origem text not null,
  destino text not null,
  aeroporto text,
  horario_voo time,
  tipo_voo text default 'nacional',
  tempo_deslocamento_min integer,
  horario_ideal_saida time,
  observacoes text
);

alter table flights enable row level security;
create policy "users see own flights" on flights for all
  using (exists (select 1 from trips where trips.id = trip_id and trips.user_id = auth.uid()));

-- =====================
-- FUNÇÃO: criar trip_days automaticamente ao inserir uma trip
-- =====================
create or replace function create_trip_days()
returns trigger as $$
declare
  d date;
begin
  d := new.data_inicio;
  while d <= new.data_fim loop
    insert into trip_days (trip_id, data) values (new.id, d);
    d := d + interval '1 day';
  end loop;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_trip_created
  after insert on trips
  for each row execute function create_trip_days();
