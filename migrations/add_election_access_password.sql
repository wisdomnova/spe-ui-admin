-- Optional per-election gate in admin: bcrypt hash only, never plaintext.
alter table public.elections
  add column if not exists access_password_hash text null;

comment on column public.elections.access_password_hash is
  'bcrypt hash for admin UI election lock; null means no password.';
