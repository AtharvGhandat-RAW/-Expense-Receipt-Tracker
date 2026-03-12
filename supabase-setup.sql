-- =========================================================
-- Expense & Receipt Tracker – Supabase SQL Setup
-- =========================================================
-- Run this in your Supabase Dashboard → SQL Editor → New Query
-- It creates the expenses table, the receipts storage bucket,
-- and the required Row Level Security (RLS) policies.
-- =========================================================


-- 1. Create the "expenses" table
-- ─────────────────────────────────────────────────────────
create table if not exists public.expenses (
  id              bigint generated always as identity primary key,
  amount          double precision not null,
  category        text not null,
  notes           text,
  date            timestamptz not null default now(),
  receipt_image_url text,
  created_at      timestamptz not null default now()
);

-- 2. Enable Row Level Security on the table
-- ─────────────────────────────────────────────────────────
alter table public.expenses enable row level security;

-- 3. Allow anonymous reads & inserts (public app, no auth yet)
-- ─────────────────────────────────────────────────────────
-- SELECT policy – anyone can read expenses
create policy "Allow public read"
  on public.expenses
  for select
  using (true);

-- INSERT policy – anyone can insert expenses
create policy "Allow public insert"
  on public.expenses
  for insert
  with check (true);


-- 4. Create the "receipts" storage bucket (public)
-- ─────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

-- 5. Storage policies – allow public uploads and reads
-- ─────────────────────────────────────────────────────────
-- Allow anyone to upload files to the receipts bucket
create policy "Allow public upload"
  on storage.objects
  for insert
  with check (bucket_id = 'receipts');

-- Allow anyone to read/download files from the receipts bucket
create policy "Allow public read receipts"
  on storage.objects
  for select
  using (bucket_id = 'receipts');


-- 6. Enable Realtime on the expenses table
-- ─────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.expenses;
