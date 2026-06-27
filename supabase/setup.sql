-- ============================================================================
--  SOMMERFEST 2026 · KOMPLETT-SETUP (eine Datei, alles drin)
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
drop table if exists audit_log      cascade;
drop table if exists volley_matches cascade;
drop table if exists scores         cascade;
drop table if exists stations       cascade;
drop table if exists teams          cascade;

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
  pin           text,                                -- Klartext-PIN: NUR für Admins lesbar (RLS), nie in stations_public
  aktiv         boolean not null default true,
  pflicht       boolean not null default true,
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
  select id, name, beschreibung, icon, gewicht, einheit, aktiv, pflicht, sort from stations;

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
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v stations;
begin
  select * into v from stations where token = p_token and aktiv;
  if not found then return jsonb_build_object('ok', false); end if;
  return jsonb_build_object('ok', true, 'station', jsonb_build_object(
    'id', v.id, 'name', v.name, 'icon', v.icon,
    'beschreibung', v.beschreibung, 'einheit', v.einheit,
    'has_pin', v.pin_hash is not null));
end; $$;

create or replace function station_login(p_token text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v stations;
begin
  select * into v from stations where token = p_token and aktiv;
  if not found then return jsonb_build_object('ok', false, 'error', 'station_not_found'); end if;
  if v.pin_hash is null or p_pin is null or crypt(p_pin, v.pin_hash) <> v.pin_hash then
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
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v stations; v_old numeric;
begin
  select * into v from stations where token = p_token and aktiv;
  if not found then return jsonb_build_object('ok', false, 'error', 'station_not_found'); end if;
  if v.pin_hash is null or p_pin is null or crypt(p_pin, v.pin_hash) <> v.pin_hash then
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
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'error', 'not_authenticated'); end if;
  update stations set
    pin_hash = case when p_pin is null or p_pin = '' then null else crypt(p_pin, gen_salt('bf')) end,
    pin      = case when p_pin is null or p_pin = '' then null else p_pin end
  where id = p_station_id;
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

-- Stationsleitung legt beim ERSTEN Zugriff selbst eine PIN fest (nur wenn noch keine
-- gesetzt ist). Danach gesperrt — nur Admins können per set_station_pin zurücksetzen.
create or replace function station_set_pin(p_token text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v stations;
begin
  select * into v from stations where token = p_token and aktiv;
  if not found then return jsonb_build_object('ok', false, 'error', 'station_not_found'); end if;
  if v.pin_hash is not null then return jsonb_build_object('ok', false, 'error', 'already_set'); end if;
  if p_pin is null or length(btrim(p_pin)) = 0 then return jsonb_build_object('ok', false, 'error', 'empty'); end if;
  update stations set pin_hash = crypt(btrim(p_pin), gen_salt('bf')), pin = btrim(p_pin) where id = v.id;
  return jsonb_build_object('ok', true);
end; $$;
revoke all on function station_set_pin(text, text) from public;
grant execute on function station_set_pin(text, text) to anon, authenticated;

create or replace function db_health()
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare d pg_stat_database;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'error', 'not_authenticated'); end if;
  select * into d from pg_stat_database where datname = current_database();
  return jsonb_build_object(
    'ok', true,
    'db_size_mb', round(pg_database_size(current_database()) / 1048576.0, 1),
    'connections', d.numbackends,
    'cache_hit_ratio', round(100 * d.blks_hit::numeric / nullif(d.blks_hit + d.blks_read, 0), 1),
    'xact_commit', d.xact_commit,
    'xact_rollback', d.xact_rollback,
    'scores', (select count(*) from scores),
    'teams', (select count(*) from teams),
    'stations_active', (select count(*) from stations where aktiv),
    'last_score', (select max(updated_at) from scores)
  );
end; $$;
revoke all on function db_health() from public;
grant execute on function db_health() to authenticated;

-- ----------------------------------------------------------------------------
--  GLOBALE EINSTELLUNGEN
--  Siegerehrungs-Modus: Wertung öffentlich einfrieren (geheim halten) bis zur
--  Siegerehrung, dann auf Knopfdruck enthüllen. Eine einzige Zeile (id = 1).
-- ----------------------------------------------------------------------------
drop table if exists settings cascade;
create table settings (
  id                int primary key default 1,
  scoreboard_frozen boolean not null default false,
  updated_at        timestamptz default now(),
  constraint settings_singleton check (id = 1)
);
insert into settings (id) values (1);
alter table settings enable row level security;
create policy settings_select_all  on settings for select using (true);
create policy settings_write_admin on settings for all
  using (auth.uid() is not null) with check (auth.uid() is not null);
grant select on settings to anon, authenticated;

-- ----------------------------------------------------------------------------
--  VOLLEYBALL-TURNIER
-- ----------------------------------------------------------------------------
create table volley_matches (
  id         uuid primary key default gen_random_uuid(),
  schiene    int  not null,
  gruppe     text not null,
  team_a     text not null,
  team_b     text not null,
  score_a    int,
  score_b    int,
  status     text not null default 'geplant',
  phase      text not null default 'gruppe',
  platz      int,
  sort       int  default 0,
  created_at timestamptz default now()
);
alter table volley_matches enable row level security;
create policy volley_select_all  on volley_matches for select using (true);
create policy volley_write_admin on volley_matches for all
  using (auth.uid() is not null) with check (auth.uid() is not null);

-- Schienen-Zeiten: werden auf der Website angezeigt und können von Admins
-- UND der Turnierleitung live geändert werden (z.B. bei Verzögerungen).
drop table if exists volley_schienen cascade;
create table volley_schienen (
  schiene    int primary key,
  zeit       text not null,
  updated_at timestamptz default now()
);
insert into volley_schienen (schiene, zeit) values
  (1, '08:40 – 10:25 Uhr'),
  (2, '10:50 – 12:50 Uhr');
alter table volley_schienen enable row level security;
create policy volley_schienen_select_all  on volley_schienen for select using (true);
create policy volley_schienen_write_admin on volley_schienen for all
  using (auth.uid() is not null) with check (auth.uid() is not null);

-- Turnierleitung: editiert das Volleyball-Turnier per Token + PIN der Station
-- "Volleyball-Turnier" (wie eine normale Station), ganz ohne Admin-Login.
create or replace function volley_auth(p_token text, p_pin text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare v stations;
begin
  select * into v from stations where token = p_token and aktiv and name = 'Volleyball-Turnier';
  if not found then return false; end if;
  if v.pin_hash is null or p_pin is null or crypt(p_pin, v.pin_hash) <> v.pin_hash then return false; end if;
  return true;
end; $$;

create or replace function volley_login(p_token text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v stations;
begin
  select * into v from stations where token = p_token and aktiv and name = 'Volleyball-Turnier';
  if not found then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  if v.pin_hash is null or p_pin is null or crypt(p_pin, v.pin_hash) <> v.pin_hash then
    return jsonb_build_object('ok', false, 'error', 'wrong_pin');
  end if;
  return jsonb_build_object('ok', true, 'name', v.name);
end; $$;

create or replace function volley_set_match(
  p_token text, p_pin text, p_id uuid, p_score_a int, p_score_b int, p_status text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if not volley_auth(p_token, p_pin) then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  update volley_matches set score_a = p_score_a, score_b = p_score_b, status = p_status where id = p_id;
  return jsonb_build_object('ok', found);
end; $$;

create or replace function volley_set_teams(
  p_token text, p_pin text, p_id uuid, p_team_a text, p_team_b text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if not volley_auth(p_token, p_pin) then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  update volley_matches set team_a = p_team_a, team_b = p_team_b where id = p_id;
  return jsonb_build_object('ok', found);
end; $$;

create or replace function volley_set_zeit(
  p_token text, p_pin text, p_schiene int, p_zeit text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if not volley_auth(p_token, p_pin) then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  update volley_schienen set zeit = p_zeit, updated_at = now() where schiene = p_schiene;
  return jsonb_build_object('ok', found);
end; $$;

revoke all on function volley_auth(text, text)                             from public;
revoke all on function volley_login(text, text)                            from public;
revoke all on function volley_set_match(text, text, uuid, int, int, text)  from public;
revoke all on function volley_set_teams(text, text, uuid, text, text)      from public;
revoke all on function volley_set_zeit(text, text, int, text)              from public;
grant execute on function volley_login(text, text)                           to anon, authenticated;
grant execute on function volley_set_match(text, text, uuid, int, int, text) to anon, authenticated;
grant execute on function volley_set_teams(text, text, uuid, text, text)     to anon, authenticated;
grant execute on function volley_set_zeit(text, text, int, text)             to anon, authenticated;

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
  if not exists (select 1 from pg_publication_tables
                 where pubname='supabase_realtime' and schemaname='public' and tablename='volley_matches')
  then alter publication supabase_realtime add table volley_matches; end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname='supabase_realtime' and schemaname='public' and tablename='volley_schienen')
  then alter publication supabase_realtime add table volley_schienen; end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname='supabase_realtime' and schemaname='public' and tablename='settings')
  then alter publication supabase_realtime add table settings; end if;
end $$;

-- ----------------------------------------------------------------------------
--  DATEN: Klassen 5s–10s (21) + 12 Pflicht-Stationen + Versorgung (optional)
-- ----------------------------------------------------------------------------
insert into teams (name, jahrgang, farbe, sort) values
  ('5s',  5, '#f43f5e',  55),
  ('6s',  6, '#fb923c',  65),
  ('7a',  7, '#f59e0b',  71), ('7b', 7, '#f59e0b', 72), ('7c', 7, '#f59e0b', 73), ('7d', 7, '#f59e0b', 74), ('7s', 7, '#f59e0b', 75),
  ('8a',  8, '#22c55e',  81), ('8b', 8, '#22c55e', 82), ('8c', 8, '#22c55e', 83), ('8s', 8, '#22c55e', 85),
  ('9a',  9, '#06b6d4',  91), ('9b', 9, '#06b6d4', 92), ('9c', 9, '#06b6d4', 93), ('9d', 9, '#06b6d4', 94), ('9s', 9, '#06b6d4', 95),
  ('10a', 10, '#6366f1', 101), ('10b', 10, '#6366f1', 102), ('10c', 10, '#6366f1', 103), ('10d', 10, '#6366f1', 104), ('10s', 10, '#6366f1', 105)
on conflict (name) do nothing;

insert into stations (name, beschreibung, icon, gewicht, einheit, pin_hash, sort) values
  ('Allgemeinwissen-Quiz', 'Quizfragen aus allen Bereichen',     'zap',        1, 'Punkte', null, 1),
  ('Lehrkräfte-Quiz',      'Wie gut kennt ihr eure Lehrkräfte?', 'medal',      1, 'Punkte', null, 2),
  ('Hobbyhorsing',         'Parcours auf dem Steckenpferd',      'wind',       1, 'Punkte', null, 3),
  ('Wasserpong',           'Treffer im Becher zählen',           'waves',      1, 'Punkte', null, 4),
  ('Just Dance',           'Tanz-Challenge nach Punkten',        'flame',      1, 'Punkte', null, 5),
  ('Bobbycar-Racing',      'Rennen auf Zeit',                    'bike',       1, 'Punkte', null, 6),
  ('Stadt, Land, Fluss',   'Begriffe pro Runde',                 'flag',       1, 'Punkte', null, 7),
  ('Pantomime',            'Begriffe vorspielen & erraten',      'sparkles',   1, 'Punkte', null, 8),
  ('Sackhüpfen',           'Staffel im Sack',                    'rabbit',     1, 'Punkte', null, 9),
  ('Laufen',               'Lauf-Wettbewerb',                    'footprints', 1, 'Punkte', null, 10),
  ('Fotos',                'Kreativste Klassen-Fotos',           'target',     1, 'Punkte', null, 11),
  ('Volleyball-Turnier',   'Großes Finale in der Halle',         'goal',       1, 'Punkte', null, 12)
on conflict (name) do nothing;

-- Versorgung: zählt punktetechnisch wie eine Station, ist aber freiwillig (pflicht=false).
insert into stations (name, beschreibung, icon, gewicht, einheit, pflicht, pin_hash, sort) values
  ('Versorgung', 'Essen & Trinken — freiwillige Bonuspunkte', 'utensils', 1, 'Punkte', false, null, 13)
on conflict (name) do nothing;

-- ----------------------------------------------------------------------------
--  VOLLEYBALL-SPIELPLAN (offizieller Plan 2026: Gruppenphase je Schiene + Finals)
--  Steht direkt nach dem Setup bereit — kein "Spielplan erzeugen" mehr nötig.
-- ----------------------------------------------------------------------------
insert into volley_matches (schiene, gruppe, team_a, team_b, status, phase, platz, sort) values
  (1, 'A', '7a', '7c', 'geplant', 'gruppe', null, 0),
  (1, 'A', '7a', '7s', 'geplant', 'gruppe', null, 1),
  (1, 'A', '7a', '8a', 'geplant', 'gruppe', null, 2),
  (1, 'A', '7a', '8c', 'geplant', 'gruppe', null, 3),
  (1, 'A', '7c', '7s', 'geplant', 'gruppe', null, 4),
  (1, 'A', '7c', '8a', 'geplant', 'gruppe', null, 5),
  (1, 'A', '7c', '8c', 'geplant', 'gruppe', null, 6),
  (1, 'A', '7s', '8a', 'geplant', 'gruppe', null, 7),
  (1, 'A', '7s', '8c', 'geplant', 'gruppe', null, 8),
  (1, 'A', '8a', '8c', 'geplant', 'gruppe', null, 9),
  (1, 'B', '7b', '7d', 'geplant', 'gruppe', null, 10),
  (1, 'B', '7b', '8b', 'geplant', 'gruppe', null, 11),
  (1, 'B', '7b', '8s', 'geplant', 'gruppe', null, 12),
  (1, 'B', '7d', '8b', 'geplant', 'gruppe', null, 13),
  (1, 'B', '7d', '8s', 'geplant', 'gruppe', null, 14),
  (1, 'B', '8b', '8s', 'geplant', 'gruppe', null, 15),
  (2, 'A', '9b', '9d', 'geplant', 'gruppe', null, 16),
  (2, 'A', '9b', '10a', 'geplant', 'gruppe', null, 17),
  (2, 'A', '9b', '10c', 'geplant', 'gruppe', null, 18),
  (2, 'A', '9b', '10s', 'geplant', 'gruppe', null, 19),
  (2, 'A', '9d', '10a', 'geplant', 'gruppe', null, 20),
  (2, 'A', '9d', '10c', 'geplant', 'gruppe', null, 21),
  (2, 'A', '9d', '10s', 'geplant', 'gruppe', null, 22),
  (2, 'A', '10a', '10c', 'geplant', 'gruppe', null, 23),
  (2, 'A', '10a', '10s', 'geplant', 'gruppe', null, 24),
  (2, 'A', '10c', '10s', 'geplant', 'gruppe', null, 25),
  (2, 'B', '9a', '9c', 'geplant', 'gruppe', null, 26),
  (2, 'B', '9a', '9s', 'geplant', 'gruppe', null, 27),
  (2, 'B', '9a', '10b', 'geplant', 'gruppe', null, 28),
  (2, 'B', '9a', '10d', 'geplant', 'gruppe', null, 29),
  (2, 'B', '9c', '9s', 'geplant', 'gruppe', null, 30),
  (2, 'B', '9c', '10b', 'geplant', 'gruppe', null, 31),
  (2, 'B', '9c', '10d', 'geplant', 'gruppe', null, 32),
  (2, 'B', '9s', '10b', 'geplant', 'gruppe', null, 33),
  (2, 'B', '9s', '10d', 'geplant', 'gruppe', null, 34),
  (2, 'B', '10b', '10d', 'geplant', 'gruppe', null, 35),
  (1, '', '1. Gruppe A', '1. Gruppe B', 'geplant', 'final', 1, 36),
  (1, '', '2. Gruppe A', '2. Gruppe B', 'geplant', 'final', 3, 37),
  (1, '', '3. Gruppe A', '3. Gruppe B', 'geplant', 'final', 5, 38),
  (2, '', '1. Gruppe A', '1. Gruppe B', 'geplant', 'final', 1, 39),
  (2, '', '2. Gruppe A', '2. Gruppe B', 'geplant', 'final', 3, 40),
  (2, '', '3. Gruppe A', '3. Gruppe B', 'geplant', 'final', 5, 41);

-- Fertig! ✅  Du solltest unten "Success. No rows returned" sehen.
