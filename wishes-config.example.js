/**
 * Copy this file to wishes-config.js and fill in your Supabase details.
 *
 * Setup (free, ~10 minutes):
 * 1. Create a project at https://supabase.com
 * 2. In SQL Editor, run:
 *
 *    create table wishes (
 *      id uuid primary key default gen_random_uuid(),
 *      name text not null,
 *      message text not null,
 *      created_at timestamptz default now()
 *    );
 *
 *    alter table wishes enable row level security;
 *
 *    create policy "Anyone can read wishes"
 *      on wishes for select using (true);
 *
 *    create policy "Anyone can add wishes"
 *      on wishes for insert with check (true);
 *
 *    -- Gallery (photo uploads)
 *    insert into storage.buckets (id, name, public)
 *    values ('gallery', 'gallery', true)
 *    on conflict (id) do nothing;
 *
 *    create table gallery_photos (
 *      id uuid primary key default gen_random_uuid(),
 *      name text not null,
 *      caption text,
 *      storage_path text not null,
 *      created_at timestamptz default now()
 *    );
 *
 *    alter table gallery_photos enable row level security;
 *
 *    create policy "Anyone can read gallery photos"
 *      on gallery_photos for select using (true);
 *
 *    create policy "Anyone can add gallery photos"
 *      on gallery_photos for insert with check (true);
 *
 *    create policy "Public read gallery files"
 *      on storage.objects for select
 *      using (bucket_id = 'gallery');
 *
 *    create policy "Anyone can upload gallery files"
 *      on storage.objects for insert
 *      with check (bucket_id = 'gallery');
 *
 *    -- RSVP (guest names — private, view in Supabase dashboard)
 *    create table rsvp_responses (
 *      id uuid primary key default gen_random_uuid(),
 *      name text not null,
 *      guest_count integer not null default 1,
 *      attending boolean not null default true,
 *      created_at timestamptz default now()
 *    );
 *
 *    alter table rsvp_responses enable row level security;
 *
 *    create policy "Anyone can RSVP"
 *      on rsvp_responses for insert with check (true);
 *
 *    To export RSVPs: Supabase → Table Editor → rsvp_responses → Export CSV (opens in Excel).
 *
 * 3. Project Settings → API → copy Project URL and anon public key below.
 */
window.WISHES_CONFIG = {
  supabaseUrl: "YOUR_SUPABASE_URL",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY",
};
