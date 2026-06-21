-- ============================================================================
--  SPORTFEST · KOMPLETT-SETUP (eine Datei, alles drin)
--  Im Supabase SQL-Editor einfügen und EINMAL auf "Run" klicken.
--
--  ⚠️  Dieses Skript setzt die Tabellen NEU auf und löscht dabei vorhandene
--      Punkte/Daten. Das ist in der Einrichtungsphase genau richtig.
--      NACH dem Start des Events nicht mehr ausführen!
--
--  Sicher beliebig oft wiederholbar (idempotent) – bei jedem Lauf landet die
--  DB im selben sauberen Zustand inkl. Beispiel-Klassen & -Stationen.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---- Sauberer Reset (Reihenfolge wegen Fremdschlüsseln) --------------------
drop view  if exists leaderboard;
drop view  if exists stations_public;
drop table if exists audit_log cascade;
drop table if exists scores    cascade;
drop table if exists stations  cascade;
drop table if exists teams     cascade;

-- ----------------------------------------------------------------------------
--  TABELLEN
-- ----------------------------------------------------------------------------
create table teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  jahrgang    int,
  farbe       text default '#6366f1',
  sort        int  default 0,
  created_at  timestamptz default now()
);

create table stations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  beschreibung  text,
  icon          text default 'medal',
  gewicht       numeric not null default 1,
  einheit       text,
  token         text not null unique default encode(gen_random_bytes(8), 'hex'),
  pin_hash      text,
  aktiv         boolean not null default true,
  sort          int default 0,
  created_at    timestamptz default now()
);

create table scores (
  id              uuid primary key default gen_random_uuid(),
  station_id      uuid not null references stations(id) on delete cascade,
  team_id         uuid not null references teams(id)    on delete cascade,
  punkte          numeric not null default 0,
  notiz           text,
  eingetragen_von text,
  updated_at      timestamptz default now(),
  unique (station_id, team_id)
);

create table audit_log (
  id          uuid primary key default gen_random_uuid(),
  station_id  uuid references stations(id) on delete set null,
  team_id     uuid references teams(id)    on delete set null,
  aktion      text not null,
  alt         numeric,
  neu         numeric,
  akteur      text,
  created_at  timestamptz default now()
);

create index idx_scores_team    on scores(team_id);
create index idx_scores_station on scores(station_id);
create index idx_audit_created  on audit_log(created_at desc);

-- ----------------------------------------------------------------------------
--  SICHTEN
-- ----------------------------------------------------------------------------
create view stations_public as
  select id, name, beschreibung, icon, gewicht, einheit, aktiv, sort from stations;

create view leaderboard as
  select
    t.id as team_id, t.name, t.jahrgang, t.farbe, t.sort,
    coalesce(sum(s.punkte * st.gewicht), 0) as gesamt,
    count(s.id) filter (where st.aktiv)     as stationen_gewertet
  from teams t
  left join scores   s  on s.team_id = t.id
  left join stations st on st.id = s.station_id and st.aktiv
  group by t.id;

-- ----------------------------------------------------------------------------
--  ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
alter table teams     enable row level security;
alter table stations  enable row level security;
alter table scores    enable row level security;
alter table audit_log enable row level security;

create policy teams_select_all  on teams for select using (true);
create policy teams_write_admin on teams for all
  using (auth.uid() is not null) with check (auth.uid() is not null);

create policy stations_admin on stations for all
  using (auth.uid() is not null) with check (auth.uid() is not null);

create policy scores_select_all  on scores for select using (true);
create policy scores_write_admin on scores for all
  using (auth.uid() is not null) with check (auth.uid() is not null);

create policy audit_admin on audit_log for select using (auth.uid() is not null);
create policy audit_insert_admin on audit_log for insert with check (auth.uid() is not null);

grant select on stations_public to anon, authenticated;
grant select on leaderboard     to anon, authenticated;

-- ----------------------------------------------------------------------------
--  FUNKTIONEN
-- ----------------------------------------------------------------------------
create or replace function get_station_public(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v stations;
begin
  select * into v from stations where token = p_token and aktiv;
  if not found then return jsonb_build_object('ok', false); end if;
  return jsonb_build_object('ok', true, 'station', jsonb_build_object(
    'id', v.id, 'name', v.name, 'icon', v.icon,
    'beschreibung', v.beschreibung, 'einheit', v.einheit));
end; $$;

create or replace function station_login(p_token text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v stations;
begin
  select * into v from stations where token = p_token and aktiv;
  if not found then return jsonb_build_object('ok', false, 'error', 'station_not_found'); end if;
  if v.pin_hash is null or crypt(p_pin, v.pin_hash) <> v.pin_hash then
    return jsonb_build_object('ok', false, 'error', 'wrong_pin');
  end if;
  return jsonb_build_object(
    'ok', true,
    'station', jsonb_build_object('id', v.id, 'name', v.name, 'icon', v.icon,
      'beschreibung', v.beschreibung, 'einheit', v.einheit, 'gewicht', v.gewicht),
    'teams', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', t.id, 'name', t.name, 'jahrgang', t.jahrgang, 'farbe', t.farbe,
        'punkte', s.punkte, 'updated_at', s.updated_at) order by t.sort, t.name), '[]'::jsonb)
      from teams t left join scores s on s.team_id = t.id and s.station_id = v.id));
end; $$;

create or replace function submit_score(
  p_token text, p_pin text, p_team_id uuid, p_punkte numeric,
  p_helfer text default null, p_notiz text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v stations; v_old numeric;
begin
  select * into v from stations where token = p_token and aktiv;
  if not found then return jsonb_build_object('ok', false, 'error', 'station_not_found'); end if;
  if v.pin_hash is null or crypt(p_pin, v.pin_hash) <> v.pin_hash then
    return jsonb_build_object('ok', false, 'error', 'wrong_pin');
  end if;
  if not exists (select 1 from teams where id = p_team_id) then
    return jsonb_build_object('ok', false, 'error', 'team_not_found');
  end if;
  select punkte into v_old from scores where station_id = v.id and team_id = p_team_id;
  insert into scores (station_id, team_id, punkte, notiz, eingetragen_von, updated_at)
  values (v.id, p_team_id, p_punkte, p_notiz, p_helfer, now())
  on conflict (station_id, team_id) do update
    set punkte = excluded.punkte, notiz = excluded.notiz,
        eingetragen_von = excluded.eingetragen_von, updated_at = now();
  insert into audit_log (station_id, team_id, aktion, alt, neu, akteur)
  values (v.id, p_team_id, 'score_set', v_old, p_punkte, p_helfer);
  return jsonb_build_object('ok', true, 'alt', v_old, 'neu', p_punkte);
end; $$;

create or replace function set_station_pin(p_station_id uuid, p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'error', 'not_authenticated'); end if;
  update stations set pin_hash = case when p_pin is null or p_pin = '' then null
    else crypt(p_pin, gen_salt('bf')) end where id = p_station_id;
  return jsonb_build_object('ok', found);
end; $$;

revoke all on function submit_score(text, text, uuid, numeric, text, text) from public;
revoke all on function station_login(text, text)                          from public;
revoke all on function get_station_public(text)                           from public;
revoke all on function set_station_pin(uuid, text)                        from public;
grant execute on function submit_score(text, text, uuid, numeric, text, text) to anon, authenticated;
grant execute on function station_login(text, text)                          to anon, authenticated;
grant execute on function get_station_public(text)                           to anon, authenticated;
grant execute on function set_station_pin(uuid, text)                        to authenticated;

-- ----------------------------------------------------------------------------
--  REALTIME (idempotent – kein Fehler beim erneuten Ausführen)
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname='supabase_realtime' and schemaname='public' and tablename='scores')
  then alter publication supabase_realtime add table scores; end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname='supabase_realtime' and schemaname='public' and tablename='teams')
  then alter publication supabase_realtime add table teams; end if;
end $$;

-- ----------------------------------------------------------------------------
--  BEISPIEL-DATEN (Klassen 5s–10s + Demo-Stationen, PIN 1234)
-- ----------------------------------------------------------------------------
insert into teams (name, jahrgang, farbe, sort) values
  ('5s',  5, '#f43f5e',  55),
  ('6s',  6, '#fb923c',  65),
  ('7a',  7, '#f59e0b',  71), ('7b', 7, '#f59e0b', 72), ('7c', 7, '#f59e0b', 73), ('7d', 7, '#f59e0b', 74), ('7s', 7, '#f59e0b', 75),
  ('8a',  8, '#22c55e',  81), ('8b', 8, '#22c55e', 82), ('8c', 8, '#22c55e', 83), ('8d', 8, '#22c55e', 84), ('8s', 8, '#22c55e', 85),
  ('9a',  9, '#06b6d4',  91), ('9b', 9, '#06b6d4', 92), ('9c', 9, '#06b6d4', 93), ('9d', 9, '#06b6d4', 94), ('9s', 9, '#06b6d4', 95),
  ('10a', 10, '#6366f1', 101), ('10b', 10, '#6366f1', 102), ('10c', 10, '#6366f1', 103), ('10d', 10, '#6366f1', 104), ('10s', 10, '#6366f1', 105)
on conflict (name) do nothing;

insert into stations (name, beschreibung, icon, gewicht, einheit, pin_hash, sort) values
  ('Sackhüpfen',  'Staffel über 30m',     'rabbit',     1, 'Punkte',  crypt('1234', gen_salt('bf')), 1),
  ('Tauziehen',   'Klasse gegen Klasse',  'dumbbell',   1, 'Punkte',  crypt('1234', gen_salt('bf')), 2),
  ('Weitsprung',  'Bester Versuch zählt', 'footprints', 1, 'cm',      crypt('1234', gen_salt('bf')), 3),
  ('Dosenwerfen', '3 Würfe pro Person',   'target',     1, 'Treffer', crypt('1234', gen_salt('bf')), 4),
  ('Staffellauf', '4x100m',               'flag',       2, 'Punkte',  crypt('1234', gen_salt('bf')), 5)
on conflict (name) do nothing;

-- Fertig! ✅  Du solltest unten "Success. No rows returned" sehen.
