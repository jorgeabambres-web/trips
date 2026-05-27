-- =====================
-- NOVA TABELA: car_rental
-- =====================
-- Armazena dados de aluguel de carro para viagens

CREATE TABLE IF NOT EXISTS car_rental (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references trips(id) on delete cascade not null,
  locadora text not null,
  plataforma text,
  voucher text,
  codigo_rentcars text,
  codigo_reserva text,
  condutor text,
  retirada_data date not null,
  retirada_hora time,
  retirada_local text,
  devolucao_data date not null,
  devolucao_hora time,
  devolucao_local text,
  valor_total numeric(12, 2),
  moeda text default 'USD',
  valor_pago_online numeric(12, 2),
  valor_no_destino numeric(12, 2),
  caucao_garantia numeric(12, 2),
  telefone_locadora text,
  observacoes text,
  created_at timestamptz default now()
);

ALTER TABLE car_rental ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own car_rental" ON car_rental FOR ALL
  USING (EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = trip_id AND trips.user_id = auth.uid()
  ));
