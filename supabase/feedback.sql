-- ============================================================================
--  FEEDBACK-MODUL · NACHTRÄGLICH EINSPIELBAR
--  Im Supabase SQL-Editor einfügen und einmal auf "Run" klicken.
--
--  ✅ Rein additiv & idempotent — löscht KEINE vorhandenen Punkte/Daten
--     und kann daher auch nach dem Start des Events noch laufen.
--     Auch sicher, falls eine ältere Version des Feedback-Moduls schon läuft
--     (fehlende Spalten werden ergänzt, alte Funktionen ersetzt).
--  (Für frische Setups ist derselbe Block bereits in setup.sql enthalten.)
-- ============================================================================

create table if not exists feedback (
  id             uuid primary key default gen_random_uuid(),
  rolle          text,
  klasse         text,
  lehrer_rolle   text,
  rating         int  not null check (rating between 1 and 5),
  highlights     text[] not null default '{}',
  kritik         text[] not null default '{}',
  beste_station  text,
  essen          text,
  essen_detail   text[] not null default '{}',
  volleyball     text,
  orga           text,
  orga_detail    text[] not null default '{}',
  laenge         text,
  website        text,
  website_detail text[] not null default '{}',
  wieder         text,
  kommentar      text,
  created_at     timestamptz default now()
);

alter table feedback add column if not exists rolle          text;
alter table feedback add column if not exists klasse         text;
alter table feedback add column if not exists lehrer_rolle   text;
alter table feedback add column if not exists kritik         text[] not null default '{}';
alter table feedback add column if not exists beste_station  text;
alter table feedback add column if not exists essen          text;
alter table feedback add column if not exists essen_detail   text[] not null default '{}';
alter table feedback add column if not exists volleyball     text;
alter table feedback add column if not exists orga           text;
alter table feedback add column if not exists orga_detail    text[] not null default '{}';
alter table feedback add column if not exists laenge         text;
alter table feedback add column if not exists website        text;
alter table feedback add column if not exists website_detail text[] not null default '{}';
alter table feedback add column if not exists wieder         text;

alter table feedback enable row level security;

drop policy if exists feedback_select_admin on feedback;
create policy feedback_select_admin on feedback for select using (auth.uid() is not null);

drop policy if exists feedback_delete_admin on feedback;
create policy feedback_delete_admin on feedback for delete using (auth.uid() is not null);

-- Alte Signaturen aus früheren Versionen des Moduls entfernen (falls vorhanden).
drop function if exists submit_feedback(int, text[], text);
drop function if exists submit_feedback(int, text, text, text[], text[], text, text);
drop function if exists submit_feedback(int, text, text, text, text[], text[], text, text, text, text, text, text, text);

-- Abgabe läuft NUR über dieses RPC (kein direkter Insert für anon):
-- alle Felder werden serverseitig gegen Whitelists geprüft bzw. gekürzt.
create or replace function submit_feedback(
  p_rating int,
  p_rolle text default null,
  p_klasse text default null,
  p_lehrer_rolle text default null,
  p_highlights text[] default '{}',
  p_kritik text[] default '{}',
  p_beste_station text default null,
  p_essen text default null,
  p_essen_detail text[] default '{}',
  p_volleyball text default null,
  p_orga text default null,
  p_orga_detail text[] default '{}',
  p_laenge text default null,
  p_website text default null,
  p_website_detail text[] default '{}',
  p_wieder text default null,
  p_kommentar text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_kommentar text; v_klasse text; v_station text;
  v_highlights text[]; v_kritik text[]; v_essen_detail text[]; v_orga_detail text[]; v_website_detail text[];
begin
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    return jsonb_build_object('ok', false, 'error', 'bad_rating');
  end if;
  v_klasse := nullif(btrim(coalesce(p_klasse, '')), '');
  if length(v_klasse) > 12 then v_klasse := null; end if;
  v_station := nullif(btrim(coalesce(p_beste_station, '')), '');
  if length(v_station) > 40 then v_station := null; end if;
  v_kommentar := nullif(btrim(coalesce(p_kommentar, '')), '');
  if length(v_kommentar) > 500 then v_kommentar := left(v_kommentar, 500); end if;

  select coalesce(array_agg(distinct btrim(x)), '{}') into v_highlights
    from unnest(coalesce(p_highlights, '{}'::text[])) x where btrim(x) <> '' and length(x) <= 70;
  if coalesce(array_length(v_highlights, 1), 0) > 8 then v_highlights := v_highlights[1:8]; end if;
  select coalesce(array_agg(distinct btrim(x)), '{}') into v_kritik
    from unnest(coalesce(p_kritik, '{}'::text[])) x where btrim(x) <> '' and length(x) <= 70;
  if coalesce(array_length(v_kritik, 1), 0) > 8 then v_kritik := v_kritik[1:8]; end if;
  select coalesce(array_agg(distinct btrim(x)), '{}') into v_essen_detail
    from unnest(coalesce(p_essen_detail, '{}'::text[])) x where btrim(x) <> '' and length(x) <= 70;
  if coalesce(array_length(v_essen_detail, 1), 0) > 8 then v_essen_detail := v_essen_detail[1:8]; end if;
  select coalesce(array_agg(distinct btrim(x)), '{}') into v_orga_detail
    from unnest(coalesce(p_orga_detail, '{}'::text[])) x where btrim(x) <> '' and length(x) <= 70;
  if coalesce(array_length(v_orga_detail, 1), 0) > 8 then v_orga_detail := v_orga_detail[1:8]; end if;
  select coalesce(array_agg(distinct btrim(x)), '{}') into v_website_detail
    from unnest(coalesce(p_website_detail, '{}'::text[])) x where btrim(x) <> '' and length(x) <= 70;
  if coalesce(array_length(v_website_detail, 1), 0) > 8 then v_website_detail := v_website_detail[1:8]; end if;

  insert into feedback (
    rolle, klasse, lehrer_rolle, rating, highlights, kritik, beste_station,
    essen, essen_detail, volleyball, orga, orga_detail, laenge, website, website_detail, wieder, kommentar)
  values (
    case when p_rolle in ('schueler', 'lehrkraft', 'gast') then p_rolle else null end,
    v_klasse,
    case when p_lehrer_rolle in ('station', 'begleitung', 'dabei') then p_lehrer_rolle else null end,
    p_rating,
    v_highlights,
    v_kritik,
    v_station,
    case when p_essen in ('lecker', 'okay', 'nicht-so', 'nicht-da') then p_essen else null end,
    v_essen_detail,
    case when p_volleyball in ('gespielt', 'zugeschaut', 'verpasst') then p_volleyball else null end,
    case when p_orga in ('rund', 'okay', 'chaotisch') then p_orga else null end,
    v_orga_detail,
    case when p_laenge in ('zu-kurz', 'genau-richtig', 'zu-lang') then p_laenge else null end,
    case when p_website in ('top', 'ausbaufaehig', 'nicht-genutzt') then p_website else null end,
    v_website_detail,
    case when p_wieder in ('ja', 'mit-aenderungen', 'nein') then p_wieder else null end,
    v_kommentar);
  return jsonb_build_object('ok', true);
end; $$;

revoke all on function submit_feedback(int, text, text, text, text[], text[], text, text, text[], text, text, text[], text, text, text[], text, text) from public;
grant execute on function submit_feedback(int, text, text, text, text[], text[], text, text, text[], text, text, text[], text, text, text[], text, text) to anon, authenticated;

-- Öffentlicher Stimmen-Zähler (nur die Anzahl, keine Inhalte) — für
-- Social Proof auf der Feedback-Seite und den Live-Zähler auf dem QR-Plakat.
create or replace function feedback_count()
returns int language sql security definer set search_path = public as $$
  select count(*)::int from feedback;
$$;
revoke all on function feedback_count() from public;
grant execute on function feedback_count() to anon, authenticated;

-- Fertig! ✅  Du solltest unten "Success. No rows returned" sehen.
