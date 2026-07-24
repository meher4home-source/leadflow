-- ═══════════════════════════════════════════════════════════
-- LeadFlow AI — Schema update for the backend (api/) additions.
-- Safe to run even if you already ran supabase_schema.sql — every
-- statement below is idempotent. Run once in Supabase → SQL Editor.
-- ═══════════════════════════════════════════════════════════

-- Needed so the Dodo Payments webhook can match a payment back to a profile
-- by email as a fallback (in addition to the primary metadata.user_id match).
alter table profiles add column if not exists email text;

-- Needed for STOP-keyword compliance (sms webhook stops messaging anyone
-- who has texted STOP, even if they text back later).
alter table leads add column if not exists opted_out boolean not null default false;

-- Needed to tell SMS and WhatsApp messages apart in lead_messages.
alter table lead_messages add column if not exists channel text not null default 'sms';

-- Updated so new signups get their email copied onto their profile row too.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email);
  return new;
end;
$$ language plpgsql security definer;
