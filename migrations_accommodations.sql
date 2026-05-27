-- =====================
-- MIGRATION: Adicionar geolocalização em accommodations
-- =====================

-- Adicionar colunas de latitude e longitude
ALTER TABLE accommodations
ADD COLUMN IF NOT EXISTS latitude numeric(10, 8),
ADD COLUMN IF NOT EXISTS longitude numeric(11, 8);

-- =====================
-- NOVA TABELA: accommodation_suggestions
-- =====================
-- Armazena sugestões de almoço e jantar que foram salvas para cada dia

CREATE TABLE IF NOT EXISTS accommodation_suggestions (
  id uuid primary key default uuid_generate_v4(),
  trip_day_id uuid references trip_days(id) on delete cascade not null,
  accommodation_id uuid references accommodations(id) on delete cascade not null,
  tipo text not null, -- 'almoco' ou 'jantar'
  nome_restaurante text not null,
  endereco text,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  telefone text,
  observacoes text,
  created_at timestamptz default now()
);

ALTER TABLE accommodation_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own accommodation_suggestions" ON accommodation_suggestions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM trip_days
    JOIN trips ON trips.id = trip_days.trip_id
    WHERE trip_days.id = trip_day_id AND trips.user_id = auth.uid()
  ));

-- =====================
-- Atualizar RLS em accommodations se necessário
-- =====================
-- A RLS já existe, apenas confirmamos
