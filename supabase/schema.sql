-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create Enums
create type public.app_role as enum ('admin', 'editor', 'viewer');
create type public.article_status as enum ('draft', 'published', 'archived');

-- Create Profiles Table
create table public.profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  email text,
  full_name text,
  avatar_url text,
  bio text
);

-- Create Categories Table
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  slug text not null unique,
  description text
);

-- Create Articles Table
create table public.articles (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  slug text not null unique,
  content text not null,
  excerpt text,
  featured_image text,
  status article_status default 'draft',
  published_at timestamp with time zone,
  author_id uuid references public.profiles(id),
  category_id uuid references public.categories(id),
  tags text[],
  view_count integer default 0,
  read_time integer,
  is_featured boolean default false,
  is_breaking boolean default false
);

-- Create User Roles Table
create table public.user_roles (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references public.profiles(id) not null,
  role app_role default 'viewer'
);

-- Create System Settings Table
create table public.system_settings (
  key text primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  value text not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.articles enable row level security;
alter table public.user_roles enable row level security;
alter table public.system_settings enable row level security;

-- Create Policies (Simplified for initial setup - Public Read)
create policy "Public articles are viewable by everyone" on public.articles
  for select using (true);

create policy "Categories are viewable by everyone" on public.categories
  for select using (true);

create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

-- Allow Service Role (Backend Script) full access (implicitly true, but good to know)
-- Allow Authenticated references for inserts if needed
create policy "Enable insert for authenticated users only" on public.articles
  for insert with check (auth.role() = 'authenticated' or auth.role() = 'service_role');

-- Create Storage Bucket for Images
insert into storage.buckets (id, name, public) 
values ('article-images', 'article-images', true)
on conflict (id) do nothing;

-- Allow public access to storage
create policy "Public Access" on storage.objects for select using ( bucket_id = 'article-images' );
create policy "Authenticated Upload" on storage.objects for insert with check ( bucket_id = 'article-images' );
