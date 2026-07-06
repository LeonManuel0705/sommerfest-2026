-- eventplan.sql — Live-Umschaltung für den Festtag (Regen/Normal, Volleyball, Hinweis-Banner, Zeitplan, Stations-Orte)
-- Idempotent und NICHT-destruktiv: löscht keine Daten und kann jederzeit erneut ausgeführt werden.
-- Im Supabase SQL-Editor ausführen. ACHTUNG: setup.sql danach NICHT mehr ausführen — die würde alle Punkte zurücksetzen!

alter table settings add column if not exists regen_modus        boolean not null default true;
alter table settings add column if not exists volleyball_aktiv   boolean not null default false;
alter table settings add column if not exists lehrer_spiel_aktiv boolean not null default true;
alter table settings add column if not exists hinweis_text       text;
alter table settings add column if not exists hinweis_level      text not null default 'info';
alter table settings add column if not exists zeitplan           jsonb;

insert into settings (id) values (1) on conflict (id) do nothing;

alter table stations add column if not exists nr         text;
alter table stations add column if not exists ort_normal text;
alter table stations add column if not exists ort_regen  text;
alter table stations add column if not exists draussen   boolean not null default false;

-- Orte pro Spalte nur befüllen, wenn noch leer (überschreibt keine späteren Admin-Änderungen)
update stations s set
  nr         = coalesce(s.nr, v.nr),
  ort_normal = coalesce(s.ort_normal, v.ort_normal),
  ort_regen  = coalesce(s.ort_regen, v.ort_regen),
  draussen   = case when s.nr is null and s.ort_normal is null then v.draussen else s.draussen end
from (values
  ('Allgemeinwissen-Quiz', '1 & 11',  'Raum 032 (EG) & 110 (1. OG)',       'Raum 032 (EG) & 110 (1. OG)', false),
  ('Lehrkräfte-Quiz',      '2 & 12',  'Raum 108 (1. OG) & 031 (EG)',       'Raum 108 (1. OG) & 031 (EG)', false),
  ('Hobbyhorsing',         '3 & 13',  'Basketballplatz / unter der Eiche', 'Turnhalle',                   true),
  ('Wasserpong',           '4 & 14',  'Raum 135 & 136 (1. OG)',            'Raum 135 & 136 (1. OG)',      false),
  ('Just Dance',           '5 & 15',  'Raum 137 & 138 (1. OG)',            'Raum 137 & 138 (1. OG)',      false),
  ('Bobbycar-Racing',      '6 & 16',  '100-m-Bahn',                        'Foyer',                       true),
  ('Stadt, Land, Fluss',   '7 & 17',  'Raum 107 & 109 (1. OG)',            'Raum 107 & 109 (1. OG)',      false),
  ('Pantomime',            '8 & 18',  'Raum 034 & 035 (EG)',               'Raum 034 & 035 (EG)',         false),
  ('Sackhüpfen',           '9 & 19',  'Zwischen Turnhalle & 030er-Räumen', 'Aula',                        true),
  ('Laufen',               '10 & 20', 'Fußballfeld',                       'Turnhalle',                   true),
  ('Fotos',                '21 & 22', 'Aula',                              'Aula',                        false),
  ('Volleyball-Turnier',   null,      'Turnhalle',                         'Turnhalle',                   false)
) as v(name, nr, ort_normal, ort_regen, draussen)
where s.name = v.name;

-- Volleyball-Station an den Schalter koppeln (steuert Wertungs-Zähler, Feedback-Liste und QR-Zugang)
update stations set aktiv = (select volleyball_aktiv from settings where id = 1)
where name = 'Volleyball-Turnier';

-- Atomarer Not-Schalter: stellt Settings-Flag UND Station in einer Transaktion um
create or replace function set_volleyball_aktiv(p_aktiv boolean)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_rows int;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'error', 'not_authenticated'); end if;
  update settings set volleyball_aktiv = p_aktiv, updated_at = now() where id = 1;
  update stations set aktiv = p_aktiv where name = 'Volleyball-Turnier';
  get diagnostics v_rows = row_count;
  return jsonb_build_object('ok', true, 'station_rows', v_rows);
end; $$;
revoke all on function set_volleyball_aktiv(boolean) from public;
grant execute on function set_volleyball_aktiv(boolean) to authenticated;

create or replace view stations_public as
  select id, name, beschreibung, icon, gewicht, einheit, aktiv, pflicht, sort, nr, ort_normal, ort_regen, draussen
  from stations;

grant select on stations_public to anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'settings')
  then alter publication supabase_realtime add table settings; end if;
end $$;
